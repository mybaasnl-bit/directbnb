import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('subscription')
@Controller('subscription')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * GET /api/v1/subscription/status
   * Returns the current subscription status for the authenticated user.
   */
  @Get('status')
  getStatus(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getStatus(userId);
  }

  /**
   * POST /api/v1/subscription/checkout
   * Create a Stripe Billing Checkout Session for the authenticated user.
   * Body: { plan: 'basic' | 'professional', successUrl?: string, cancelUrl?: string }
   * Returns: { checkoutUrl: string }
   */
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  createCheckout(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.subscriptionService.createCheckoutSession(userId, dto.plan);
  }

  /**
   * POST /api/v1/subscription/portal
   * Create a Stripe Customer Portal Session for the authenticated user.
   * Returns: { portalUrl: string }
   */
  @Post('portal')
  @HttpCode(HttpStatus.OK)
  createPortal(@CurrentUser('id') userId: string) {
    return this.subscriptionService.createPortalSession(userId);
  }

  /**
   * POST /api/v1/subscription/webhook
   * Stripe calls this endpoint for billing lifecycle events.
   *
   * Configure in Stripe Dashboard → Developers → Webhooks.
   * Required events:
   *   - checkout.session.completed
   *   - customer.subscription.created
   *   - customer.subscription.updated
   *   - customer.subscription.deleted
   *   - invoice.paid
   *
   * Set STRIPE_BILLING_WEBHOOK_SECRET in your environment.
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<any>,
    @Headers('stripe-signature') sig: string,
  ) {
    if (!req.rawBody) throw new BadRequestException('No raw body on request');
    await this.subscriptionService.handleBillingWebhook(req.rawBody, sig);
    return { received: true };
  }
}
