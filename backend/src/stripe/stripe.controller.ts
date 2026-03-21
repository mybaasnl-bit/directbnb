import {
  Controller, Post, Param, ParseUUIDPipe, UseGuards,
  RawBodyRequest, Req, Headers, BadRequestException, Get,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';

@Controller('stripe')
@UseGuards(JwtAuthGuard)
export class StripeController {
  constructor(private readonly stripe: StripeService) {}

  /**
   * GET /api/v1/stripe/status
   * Returns whether Stripe is configured.
   */
  @Public()
  @Get('status')
  status() {
    return { enabled: this.stripe.isEnabled() };
  }

  /**
   * POST /api/v1/stripe/deposit/:bookingId
   * Authenticated owner creates a deposit PaymentIntent for a booking.
   */
  @Post('deposit/:bookingId')
  createDeposit(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.stripe.createDepositIntent(bookingId);
  }

  /**
   * POST /api/v1/stripe/webhook
   * Stripe calls this when a payment succeeds. No auth — uses signature verification.
   */
  @Public()
  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<any>,
    @Headers('stripe-signature') sig: string,
  ) {
    if (!req.rawBody) throw new BadRequestException('No raw body');
    await this.stripe.handleWebhook(req.rawBody, sig);
    return { received: true };
  }
}
