import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { RoomsModule } from './rooms/rooms.module';
import { BookingsModule } from './bookings/bookings.module';
import { GuestsModule } from './guests/guests.module';
import { AvailabilityModule } from './availability/availability.module';
import { FeedbackModule } from './feedback/feedback.module';
import { EmailModule } from './email/email.module';
import { BetaSignupsModule } from './beta-signups/beta-signups.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailLogsModule } from './email-logs/email-logs.module';
import { StripeModule } from './stripe/stripe.module';
import { MollieModule } from './mollie/mollie.module';
import { UploadModule } from './upload/upload.module';
import { PayoutsModule } from './payouts/payouts.module';
import { AdminModule } from './admin/admin.module';
import { IcalModule } from './ical/ical.module';
import { ContactModule } from './contact/contact.module';
import { PropertyExtrasModule } from './property-extras/property-extras.module';

@Module({
  imports: [
    // ─── Config ───────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ─── Rate limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ─── Core ─────────────────────────────────────────────────────────────────
    PrismaModule,
    EmailModule,
    EmailTemplatesModule,

    // ─── Feature modules ──────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    PropertiesModule,
    RoomsModule,
    BookingsModule,
    GuestsModule,
    AvailabilityModule,
    FeedbackModule,
    BetaSignupsModule,
    EmailLogsModule,
    StripeModule,
    MollieModule,
    UploadModule,
    DashboardModule,
    PayoutsModule,
    AdminModule,
    IcalModule,
    ContactModule,
    PropertyExtrasModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
