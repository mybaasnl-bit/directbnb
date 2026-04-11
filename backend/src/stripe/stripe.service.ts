import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

/** Default platform commission percentage when host has no custom rate set */
const DEFAULT_PLATFORM_FEE_PERCENT = 5;

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    this.enabled = !!key;

    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });
      this.logger.log('Stripe initialized');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set — payments disabled');
    }
  }

  /**
   * Create a Stripe PaymentIntent charged to the Platform account.
   * No `destination` or `transfer_data` — this is the "Separate Charges and Transfers" model.
   * Fee and payout amounts are calculated and saved to the Booking immediately.
   *
   * @param bookingId  The booking to charge.
   * @param depositPercent  Percentage of totalPrice to charge now (100 = full amount).
   */
  async createDepositIntent(bookingId: string, depositPercent = 100): Promise<{
    clientSecret: string;
    depositAmount: number;
    currency: string;
  }> {
    if (!this.stripe || !this.enabled) {
      throw new BadRequestException('Stripe is not configured on this server.');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: { include: { property: true } },
        guest: true,
        owner: { include: { paymentAccount: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.depositPaid) throw new BadRequestException('Payment already captured for this booking');

    // ── Fee calculation ────────────────────────────────────────────────────────
    const totalEuros = Number(booking.totalPrice);
    const chargeCents = Math.round(totalEuros * (depositPercent / 100) * 100);

    const feePercent =
      Number(booking.owner.paymentAccount?.platformFeePercent ?? 0) ||
      this.config.get<number>('PLATFORM_FEE_PERCENT', DEFAULT_PLATFORM_FEE_PERCENT);

    // Fee is calculated on the *total booking value*, not just the charge amount,
    // so it's consistent regardless of whether a deposit or full payment is taken.
    const platformFeeEuros = parseFloat((totalEuros * feePercent / 100).toFixed(2));
    const payoutEuros      = parseFloat((totalEuros - platformFeeEuros).toFixed(2));

    // ── Create PaymentIntent on Platform account (no destination) ─────────────
    const intent = await this.stripe.paymentIntents.create({
      amount: chargeCents,
      currency: 'eur',
      // NOTE: No `transfer_data` or `on_behalf_of` here.
      // Funds land on the platform account; transfers are executed separately by the payout job.

      // Stripe automatically emails a payment receipt to the guest.
      receipt_email: booking.guest.email,

      metadata: {
        bookingId,
        propertyName: booking.room.property.name,
        guestEmail: booking.guest.email,
      },
      description: `DirectBnB — ${booking.room.property.name} (booking ${bookingId.slice(0, 8)})`,
    });

    // ── Persist to DB ──────────────────────────────────────────────────────────
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentIntentId: intent.id,
        depositAmount: chargeCents / 100,
        platformFeeAmount: platformFeeEuros,
        payoutAmount: payoutEuros,
        paymentProvider: 'STRIPE',
        paymentType: depositPercent < 100 ? 'DEPOSIT' : 'FULL',
      },
    });

    this.logger.log(
      `PaymentIntent ${intent.id} created for booking ${bookingId} — ` +
      `charge €${(chargeCents / 100).toFixed(2)}, ` +
      `platform fee €${platformFeeEuros.toFixed(2)} (${feePercent}%), ` +
      `host payout €${payoutEuros.toFixed(2)}`,
    );

    return {
      clientSecret: intent.client_secret!,
      depositAmount: chargeCents / 100,
      currency: 'eur',
    };
  }

  /**
   * Stripe webhook handler.
   * On payment_intent.succeeded: marks deposit as paid and captures the Charge ID
   * needed later as `source_transaction` in the transfer.
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!this.stripe || !webhookSecret) {
      throw new BadRequestException('Stripe webhook not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const bookingId = intent.metadata?.bookingId;
      if (!bookingId) return;

      // Retrieve the Charge ID — required as source_transaction for transfers.
      // latest_charge is the string ID of the charge.
      const chargeId = typeof intent.latest_charge === 'string'
        ? intent.latest_charge
        : (intent.latest_charge as Stripe.Charge | null)?.id ?? null;

      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          depositPaid: true,
          paymentStatus: 'PAID',
          paidAt: new Date(),
          ...(chargeId ? { stripeChargeId: chargeId } : {}),
        },
      });

      this.logger.log(
        `Payment succeeded for booking ${bookingId} — ` +
        `PI: ${intent.id}, charge: ${chargeId ?? 'not yet expanded'}`,
      );
    }
  }

  /**
   * Refund a payment. Attempts a full refund via the PaymentIntent.
   * Returns the refund object on success.
   */
  async refundPayment(paymentIntentId: string): Promise<Stripe.Refund> {
    if (!this.stripe || !this.enabled) {
      throw new BadRequestException('Stripe is not configured on this server.');
    }

    this.logger.log(`Issuing refund for PaymentIntent ${paymentIntentId}`);

    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    this.logger.log(`Refund ${refund.id} created — status: ${refund.status}`);
    return refund;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
