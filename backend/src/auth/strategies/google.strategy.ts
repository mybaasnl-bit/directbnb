import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface OAuthProfile {
  provider: 'google' | 'microsoft';
  providerAccountId: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: `${config.get<string>('OAUTH_CALLBACK_BASE', 'http://localhost:3001/api/v1')}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value ?? '';
    const firstName = profile.name?.givenName ?? profile.displayName?.split(' ')[0] ?? '';
    const lastName = profile.name?.familyName ?? profile.displayName?.split(' ').slice(1).join(' ') ?? '';

    const oauthProfile: OAuthProfile = {
      provider: 'google',
      providerAccountId: profile.id,
      email,
      firstName,
      lastName,
    };

    done(null, oauthProfile);
  }
}
