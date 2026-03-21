import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-microsoft';
import { OAuthProfile } from './google.strategy';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('MICROSOFT_CLIENT_ID', ''),
      clientSecret: config.get<string>('MICROSOFT_CLIENT_SECRET', ''),
      callbackURL: `${config.get<string>('OAUTH_CALLBACK_BASE', 'http://localhost:3001/api/v1')}/auth/microsoft/callback`,
      scope: ['user.read'],
      tenant: 'common',
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ): void {
    const email =
      profile.emails?.[0]?.value ??
      profile._json?.mail ??
      profile._json?.userPrincipalName ??
      '';

    const firstName =
      profile.name?.givenName ??
      profile._json?.givenName ??
      profile.displayName?.split(' ')[0] ??
      '';

    const lastName =
      profile.name?.familyName ??
      profile._json?.surname ??
      profile.displayName?.split(' ').slice(1).join(' ') ??
      '';

    const oauthProfile: OAuthProfile = {
      provider: 'microsoft',
      providerAccountId: profile.id,
      email,
      firstName,
      lastName,
    };

    done(null, oauthProfile);
  }
}
