import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly stripe: Stripe | null = null;
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });
      this.logger.log('SubscriptionService: Stripe initialized');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set — subscription billing disabled');
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured on this server.');
    }
    return this.stripe;
  }

  /**
   * Get or create a Stripe Customer for a user.
   * Updates `stripeCustomerId` in the DB if a new customer is created.
   */
  private async getOrCreateStripeCustomer(userId: string): Promise<string> {
    const stripe = this.requireStripe();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        stripeCustomerId: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.stripeCustomerId) return user.stripeCustomerId;

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: user.id },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);
    return customer.id;
  }

  /** Resolve a plan slug to the configured Stripe Price ID. */
  private resolvePriceId(plan: 'basic' | 'professional'): string {
    const envKey =
      plan === 'basic'
        ? 'STRIPE_PRICE_ID_BASIC'
        : 'STRIPE_PRICE_ID_PROFESSIONAL';

    const priceId = this.config.get<string>(envKey);
    if (!priceId) {
      throw new BadRequestException(
        `${envKey} is not configured. Please set it in your environment.`,
      );
    }
    return priceId;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Create a Stripe Billing Checkout Session.
   * Includes a 14-day trial period. Returns the hosted Checkout URL.
   */
  async createCheckoutSession(
    userId: string,
    plan: 'basic' | 'professional',
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<{ checkoutUrl: string }> {
    const stripe = this.requireStripe();
    const priceId = this.resolvePriceId(plan);
    const customerId = await this.getOrCreateStripeCustomer(userId);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resolvedSuccess = successUrl ?? `${frontendUrl}/dashboard?subscription=success`;
    const resolvedCancel  = cancelUrl  ?? `${frontendUrl}/pricing?subscription=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: resolvedSuccess,
      cancel_url:  resolvedCancel,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
        trial_period_days: 14,
      },
      allow_promotion_codes: true,
    });

    this.logger.log(
      `Checkout Session ${session.id} created for user ${userId} — plan: ${plan}, price: ${priceId}`,
    );

    return { checkoutUrl: session.url! };
  }

  /**
   * Create a Stripe Customer Portal Session.
   * Allows the user to manage billing, change card, upgrade/downgrade, or cancel.
   */
  async createPortalSession(
    userId: string,
    returnUrl?: string,
  ): Promise<{ portalUrl: string }> {
    const stripe = this.requireStripe();
    const customerId = await this.getOrCreateStripeCustomer(userId);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resolvedReturn = returnUrl ?? `${frontendUrl}/settings`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: resolvedReturn,
    });

    this.logger.log(`Customer Portal session created for user ${userId}`);
    return { portalUrl: session.url };
  }

  /** Return the current subscription status for a user. */
  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        stripePriceId: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      status: user.subscriptionStatus,
      priceId: user.stripePriceId,
      subscriptionId: user.stripeSubscriptionId,
      hasCustomer: !!user.stripeCustomerId,
    };
  }

  // ── Webhook handler ──────────────────────────────────────────────────────────

  /**
   * Handle Stripe Billing webhook events.
   * Verifies the signature with STRIPE_BILLING_WEBHOOK_SECRET, then dispatches.
   *
   * Register these events in the Stripe Dashboard (Billing webhook endpoint):
   *   - checkout.session.completed
   *   - customer.subscription.created
   *   - customer.subscription.updated
   *   - customer.subscription.deleted
   *   - invoice.paid
   */
  async handleBillingWebhook(payload: Buffer, signature: string): Promise<void> {
    const stripe = this.requireStripe();
    const webhookSecret = this.config.get<string>('STRIPE_BILLING_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException(
        'STRIPE_BILLING_WEBHOOK_SECRET is not configured.',
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new BadRequestException(
        `Billing webhook signature verification failed: ${err.message}`,
      );
    }

    this.logger.log(`Billing webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Only handle subscription checkouts (not one-time payments)
        if (session.mode === 'subscription') {
          await this.handleCheckoutCompleted(session);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.syncSubscription(sub);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaid(invoice);
        break;
      }

      default:
        this.logger.debug(`Unhandled billing event: ${event.type}`);
    }
  }

  // ── Private webhook sub-handlers ─────────────────────────────────────────────

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : (session.customer as Stripe.Customer | null)?.id;

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as Stripe.Subscription | null)?.id;

    if (!customerId || !subscriptionId) {
      this.logger.warn(
        `handleCheckoutCompleted: missing customerId or subscriptionId on session ${session.id}`,
      );
      return;
    }

    // Retrieve full subscription to get status and priceId
    const sub = await this.stripe!.subscriptions.retrieve(subscriptionId);
    await this.syncSubscription(sub, customerId);

    this.logger.log(
      `Checkout completed — customer: ${customerId}, subscription: ${subscriptionId}`,
    );
  }

  /**
   * Write subscription data to the user row that owns the given Stripe customer ID.
   */
  private async syncSubscription(
    sub: Stripe.Subscription,
    fallbackCustomerId?: string,
  ): Promise<void> {
    const customerId =
      typeof sub.customer === 'string'
        ? sub.customer
        : fallbackCustomerId;

    if (!customerId) {
      this.logger.warn(
        `syncSubscription: could not determine customerId for subscription ${sub.id}`,
      );
      return;
    }

    const priceId = sub.items.data[0]?.price?.id ?? null;
    const subscriptionStatus = this.mapStripeStatus(sub.status);

    const result = await this.prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        stripeSubscriptionId: sub.id,
        subscriptionStatus,
        ...(priceId ? { stripePriceId: priceId } : {}),
      },
    });

    if (result.count === 0) {
      this.logger.warn(
        `syncSubscription: no user found for Stripe customer ${customerId}`,
      );
    } else {
      this.logger.log(
        `Synced subscription ${sub.id} for customer ${customerId} — ` +
          `status: ${subscriptionStatus}, price: ${priceId ?? '—'}`,
      );
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : (invoice.customer as Stripe.Customer | null)?.id;

    if (!customerId) return;

    // Ensure status is active whenever an invoice is successfully paid
    await this.prisma.user.updateMany({
      where: {
        stripeCustomerId: customerId,
        subscriptionStatus: { not: SubscriptionStatus.active },
      },
      data: { subscriptionStatus: SubscriptionStatus.active },
    });

    this.logger.log(
      `Invoice paid for customer ${customerId} — subscription status set to active`,
    );
  }

  // ── Mapping helper ───────────────────────────────────────────────────────────

  private mapStripeStatus(status: string): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      active:             SubscriptionStatus.active,
      trialing:           SubscriptionStatus.trialing,
      past_due:           SubscriptionStatus.past_due,
      canceled:           SubscriptionStatus.canceled,
      cancelled:          SubscriptionStatus.canceled,
      incomplete:         SubscriptionStatus.incomplete,
      incomplete_expired: SubscriptionStatus.canceled,
      unpaid:             SubscriptionStatus.past_due,
      paused:             SubscriptionStatus.past_due,
    };
    return map[status] ?? SubscriptionStatus.incomplete;
  }
}
