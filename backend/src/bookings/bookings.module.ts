import { Module } from '@nestjs/common';
import { BookingsController, PublicBookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [StripeModule],
  controllers: [BookingsController, PublicBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
