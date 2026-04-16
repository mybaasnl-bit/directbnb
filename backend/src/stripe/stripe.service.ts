import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

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
    private readonly emailService: EmailService,
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
   * Create a Stripe Checkout Session for a guest booking.
   * The booking record must already exist in the DB (status PENDING).
   * On success, saves the session ID to stripePaymentIntentId (temporary;
   * replaced by the real PaymentIntent ID when checkout.session.completed fires).
   */
  async createCheckoutSession(
    bookingId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ checkoutUrl: string }> {
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

    const totalEuros = Number(booking.totalPrice);
    const totalCents = Math.round(totalEuros * 100);

    const feePercent =
      Number(booking.owner.paymentAccount?.platformFeePercent ?? 0) ||
      this.config.get<number>('PLATFORM_FEE_PERCENT', DEFAULT_PLATFORM_FEE_PERCENT);

    const platformFeeCents = Math.round(totalCents * feePercent / 100);
    const platformFeeEuros = parseFloat((platformFeeCents / 100).toFixed(2));
    const payoutEuros      = parseFloat((totalEuros - platformFeeEuros).toFixed(2));

    const nights = Math.round(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86_400_000,
    );

    // providerAccountId is the Stripe Connect account ID for STRIPE provider accounts
    const ownerStripeAccountId =
      booking.owner.paymentAccount?.provider === 'STRIPE'
        ? (booking.owner.paymentAccount?.providerAccountId ?? null)
        : null;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card', 'ideal'],
      customer_email: booking.guest.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: totalCents,
            product_data: {
              name: `${booking.room.property.name} — ${booking.room.name}`,
              description: `${nights} nacht${nights !== 1 ? 'en' : ''} · inchecken ${new Date(booking.checkIn).toLocaleDateString('nl-NL')}`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        description: `DirectBnB — ${booking.room.property.name} (${bookingId.slice(0, 8)})`,
        receipt_email: booking.guest.email,
        metadata: { bookingId, propertyName: booking.room.property.name, guestEmail: booking.guest.email },
        // Route funds to the host's connected account (if onboarded)
        ...(ownerStripeAccountId
          ? {
              application_fee_amount: platformFeeCents,
              transfer_data: { destination: ownerStripeAccountId },
            }
          : {}),
      },
      metadata: { bookingId },
      // Stripe replaces {CHECKOUT_SESSION_ID} in success_url automatically
      success_url: successUrl.includes('{CHECKOUT_SESSION_ID}')
        ? successUrl
        : `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    };

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    // Persist fee/payout amounts and the session ID so we can reconcile on webhook
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentIntentId: session.id,   // replaced by real PI id in webhook
        depositAmount: totalEuros,
        platformFeeAmount: platformFeeEuros,
        payoutAmount: payoutEuros,
        paymentProvider: 'STRIPE',
        paymentType: 'FULL',
      },
    });

    this.logger.log(
      `Checkout Session ${session.id} created for booking ${bookingId} — ` +
      `€${totalEuros.toFixed(2)}, platform fee €${platformFeeEuros.toFixed(2)} (${feePercent}%), ` +
      `host payout €${payoutEuros.toFixed(2)}` +
      (ownerStripeAccountId ? ` → Connect: ${ownerStripeAccountId}` : ' (platform account, no Connect)'),
    );

    return { checkoutUrl: session.url! };
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

    // ── Hosted Checkout Session completed ────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) return;

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

      const booking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          depositPaid: true,
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          paidAt: new Date(),
          ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
        },
        include: {
          guest: true,
          room: { include: { property: { include: { owner: true } } } },
        },
      });

      // Send confirmation emails (non-blocking)
      this.emailService
        .sendBookingConfirmed(booking, booking.room.property.owner)
        .catch(err => this.logger.error('Confirmation email failed (non-fatal)', err));

      this.logger.log(
        `Checkout session completed for booking ${bookingId} — ` +
        `session: ${session.id}, PI: ${paymentIntentId ?? 'pending'}`,
      );
    }

    // ── Direct PaymentIntent (Stripe Elements flow) ───────────────────────────
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const bookingId = intent.metadata?.bookingId;
      if (!bookingId) return;

      // Skip if already handled by checkout.session.completed above
      const existing = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (existing?.paymentStatus === 'PAID') return;

      // Retrieve the Charge ID — required as source_transaction for transfers.
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
