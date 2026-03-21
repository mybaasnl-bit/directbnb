import { ConflictException, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateBetaSignupDto } from './dto/create-beta-signup.dto';

@Injectable()
export class BetaSignupsService {
  private readonly logger = new Logger(BetaSignupsService.name);
  private readonly INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateBetaSignupDto) {
    const language = dto.language ?? 'nl';

    const existing = await this.prisma.betaSignup.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('This email address is already registered for the beta.');
    }

    const signup = await this.prisma.betaSignup.create({
      data: {
        name: dto.name,
        email: dto.email,
        bnbName: dto.bnbName,
        location: dto.location,
        website: dto.website ?? null,
        language,
      },
    });

    this.logger.log(`New beta signup: ${signup.name} <${signup.email}> — ${signup.bnbName}`);

    this.email
      .sendBetaSignupConfirmation({
        name: signup.name,
        email: signup.email,
        bnbName: signup.bnbName,
        location: signup.location,
        language: language as 'nl' | 'en',
      })
      .catch((err) => this.logger.error('Signup confirmation email failed (non-fatal)', err));

    return { id: signup.id, email: signup.email };
  }

  /**
   * Send an invite email to a beta signup.
   * Creates a one-time INVITE token valid for 7 days.
   * The invite link pre-fills the register form with the signup's email & name.
   */
  async invite(id: string) {
    const signup = await this.prisma.betaSignup.findUnique({ where: { id } });
    if (!signup) throw new NotFoundException('Beta signup not found');

    // Check if this email already has a registered account
    const existingUser = await this.prisma.user.findUnique({ where: { email: signup.email } });
    if (existingUser) {
      throw new BadRequestException('This email already has a registered account');
    }

    // Invalidate existing unused invite tokens for this email
    await this.prisma.passwordResetToken.updateMany({
      where: { email: signup.email, type: 'INVITE', usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        email: signup.email,
        tokenHash,
        type: 'INVITE',
        expiresAt: new Date(Date.now() + this.INVITE_TTL_MS),
      },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const lang = (signup.language as 'nl' | 'en') ?? 'nl';
    const inviteUrl = `${frontendUrl}/${lang}/register?token=${rawToken}&email=${encodeURIComponent(signup.email)}&name=${encodeURIComponent(signup.name)}`;

    await this.email.sendInviteEmail({
      to: signup.email,
      name: signup.name,
      inviteUrl,
      language: lang,
    });

    this.logger.log(`Invite sent to ${signup.email}`);
    return { invited: true, email: signup.email };
  }

  findAll() {
    return this.prisma.betaSignup.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        bnbName: true,
        location: true,
        website: true,
        language: true,
        createdAt: true,
      },
    });
  }

  count() {
    return this.prisma.betaSignup.count();
  }
}
