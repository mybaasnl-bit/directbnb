import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthProfile } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;
  private readonly RESET_TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const now = new Date();
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone,
        preferredLanguage: dto.preferredLanguage ?? 'nl',
        isBetaUser: true,
        termsAcceptedAt: dto.termsAccepted ? now : null,
        privacyAcceptedAt: dto.privacyAccepted ? now : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        preferredLanguage: true,
        isBetaUser: true,
        createdAt: true,
      },
    });

    this.logger.log(`New user registered: ${user.email}`);

    // Send welcome email — non-blocking
    this.email
      .sendWelcomeEmail({
        firstName: user.firstName,
        email: user.email,
        language: (user.preferredLanguage as 'nl' | 'en') ?? 'nl',
      })
      .catch(err => this.logger.error('Welcome email failed (non-fatal)', err));

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Social-only account — no password set
    if (!user.passwordHash) {
      throw new UnauthorizedException('This account uses social login. Please sign in with Google or Microsoft.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    return tokens;
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        preferredLanguage: true,
        isBetaUser: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: { properties: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException();
    return user;
  }

  /**
   * Request a password reset email.
   * Always returns success to prevent email enumeration.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      // Silent — don't reveal whether email exists
      return;
    }

    // Invalidate any existing reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, type: 'RESET', usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        type: 'RESET',
        expiresAt: new Date(Date.now() + this.RESET_TOKEN_TTL_MS),
      },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const lang = (user.preferredLanguage as 'nl' | 'en') ?? 'nl';
    const resetUrl = `${frontendUrl}/${lang}/reset-password?token=${rawToken}`;

    this.email
      .sendPasswordResetEmail({ to: user.email, firstName: user.firstName, resetUrl, language: lang })
      .catch(err => this.logger.error('Password reset email failed (non-fatal)', err));
  }

  /**
   * Reset password using a valid reset token.
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.type !== 'RESET') {
      throw new BadRequestException('Invalid or expired reset link');
    }
    if (record.usedAt) {
      throw new BadRequestException('This reset link has already been used');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('This reset link has expired — please request a new one');
    }
    if (!record.user) {
      throw new BadRequestException('Invalid reset link');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens to force re-login
      this.prisma.refreshToken.updateMany({
        where: { userId: record.user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    this.logger.log(`Password reset completed for user ${record.user.email}`);
  }

  // ─── OAuth ──────────────────────────────────────────────────────────────────

  /**
   * Called after a successful OAuth callback.
   * Finds or creates a User, links the OAuthAccount, and returns JWT tokens.
   */
  async validateOrCreateOAuthUser(profile: OAuthProfile) {
    const { provider, providerAccountId, email, firstName, lastName } = profile;

    // 1. Check if this exact OAuth account already exists
    const existingOAuth = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });

    if (existingOAuth) {
      if (!existingOAuth.user.isActive) {
        throw new UnauthorizedException('This account has been disabled.');
      }
      const tokens = await this.generateTokens(
        existingOAuth.user.id,
        existingOAuth.user.email,
        existingOAuth.user.role,
      );
      return { user: existingOAuth.user, ...tokens };
    }

    // 2. Email already in users table → link this provider to existing account
    let user = email
      ? await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
      : null;

    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException('This account has been disabled.');
      }

      await this.prisma.oAuthAccount.create({
        data: { userId: user.id, provider, providerAccountId, email },
      });

      this.logger.log(`Linked ${provider} account to existing user ${user.email}`);
    } else {
      // 3. Brand new user — create account (no password)
      user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash: null,
          firstName: firstName.trim() || 'User',
          lastName: lastName.trim() || '',
          preferredLanguage: 'nl',
          isBetaUser: true,
          emailVerified: true, // email verified by the provider
          oauthAccounts: {
            create: { provider, providerAccountId, email },
          },
        },
      });

      this.logger.log(`New user created via ${provider}: ${user.email}`);

      this.email
        .sendWelcomeEmail({
          firstName: user.firstName,
          email: user.email,
          language: 'nl',
        })
        .catch(err => this.logger.error('OAuth welcome email failed (non-fatal)', err));
    }

    const { passwordHash: _, ...safeUser } = user;
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: safeUser, ...tokens };
  }

  // ─── Admin helpers ──────────────────────────────────────────────────────────

  /**
   * Generate tokens on behalf of another user — used exclusively by the
   * admin impersonation flow. Never call this from a public endpoint.
   */
  async createImpersonationTokens(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true, isActive: true, firstName: true, lastName: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Target user not found or inactive');
    }
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
