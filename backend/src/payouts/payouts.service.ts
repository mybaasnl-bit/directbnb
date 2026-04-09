import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutsService {
  private readonly stripe: Stripe | null = null;
  private readonly logger = new Logger(PayoutsService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    this.enabled = !!key;

    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });
      this.logger.log('Stripe Connect initialized for payouts');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set — Stripe Connect disabled');
    }
  }

  // ─── Onboarding ─────────────────────────────────────────────────────────────

  /**
   * Create (or re-use) a Stripe Express connected account and return a hosted
   * onboarding link that the host can use to submit their bank details.
   */
  async createOnboardingLink(ownerId: string, returnUrl: string, refreshUrl: string) {
    if (!this.stripe || !this.enabled) {
      throw new BadRequestException('Stripe is not configured on this server.');
    }

    // Find or create the HostPaymentAccount record
    let account = await this.prisma.hostPaymentAccount.findUnique({
      where: { ownerId },
    });

    let stripeAccountId: string;

    if (!account || !account.providerAccountId) {
      // Create a new Express account
      const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
      if (!owner) throw new NotFoundException('User not found');

      const stripeAccount = await this.stripe.accounts.create({
        type: 'express',
        country: 'NL',
        email: owner.email,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: { ownerId },
      });

      stripeAccountId = stripeAccount.id;

      account = await this.prisma.hostPaymentAccount.upsert({
        where: { ownerId },
        create: {
          ownerId,
          providerAccountId: stripeAccountId,
          status: 'ONBOARDING',
        },
        update: {
          providerAccountId: stripeAccountId,
          status: 'ONBOARDING',
        },
      });

      this.logger.log(`Created Stripe Express account ${stripeAccountId} for owner ${ownerId}`);
    } else {
      stripeAccountId = account.providerAccountId;
    }

    // Create the account link
    const link = await this.stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return { url: link.url, expiresAt: new Date(link.expires_at * 1000) };
  }

  // ─── Account status ──────────────────────────────────────────────────────────

  async getAccountStatus(ownerId: string) {
    const account = await this.prisma.hostPaymentAccount.findUnique({
      where: { ownerId },
    });

    if (!account) {
      return { status: 'NONE', detailsSubmitted: false, chargesEnabled: false, payoutsEnabled: false };
    }

    // Refresh from Stripe if we have an account ID
    if (this.stripe && account.providerAccountId) {
      try {
        const stripeAccount = await this.stripe.accounts.retrieve(account.providerAccountId);

        const newStatus =
          stripeAccount.payouts_enabled ? 'VERIFIED' :
          stripeAccount.details_submitted ? 'ONBOARDING' :
          account.status;

        await this.prisma.hostPaymentAccount.update({
          where: { ownerId },
          data: {
            detailsSubmitted: stripeAccount.details_submitted ?? false,
            chargesEnabled: stripeAccount.charges_enabled ?? false,
            payoutsEnabled: stripeAccount.payouts_enabled ?? false,
            status: newStatus,
          },
        });

        return {
          status: newStatus,
          detailsSubmitted: stripeAccount.details_submitted,
          chargesEnabled: stripeAccount.charges_enabled,
          payoutsEnabled: stripeAccount.payouts_enabled,
          providerAccountId: account.providerAccountId,
        };
      } catch (err: any) {
        this.logger.error(`Failed to refresh Stripe account: ${err.message}`);
      }
    }

    return {
      status: account.status,
      detailsSubmitted: account.detailsSubmitted,
      chargesEnabled: account.chargesEnabled,
      payoutsEnabled: account.payoutsEnabled,
      providerAccountId: account.providerAccountId,
    };
  }

  // ─── Payout list ─────────────────────────────────────────────────────────────

  async getPayouts(ownerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where: { ownerId } }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getPayoutSummary(ownerId: string) {
    const [totalPaid, pendingCount, inTransitCount] = await Promise.all([
      this.prisma.payout.aggregate({
        where: { ownerId, status: 'PAID' },
        _sum: { netAmount: true },
      }),
      this.prisma.payout.count({ where: { ownerId, status: 'PENDING' } }),
      this.prisma.payout.count({ where: { ownerId, status: 'IN_TRANSIT' } }),
    ]);

    return {
      totalPaidOut: Number(totalPaid._sum.netAmount ?? 0),
      pendingCount,
      inTransitCount,
    };
  }

  // ─── Stripe Connect webhook ───────────────────────────────────────────────────

  async handleConnectWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.config.get<string>('STRIPE_CONNECT_WEBHOOK_SECRET');
    if (!this.stripe || !webhookSecret) {
      throw new BadRequestException('Stripe Connect webhook not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'account.updated': {
        const stripeAccount = event.data.object as Stripe.Account;
        const ownerId = stripeAccount.metadata?.ownerId;
        if (!ownerId) break;

        const newStatus =
          stripeAccount.payouts_enabled ? 'VERIFIED' :
          stripeAccount.details_submitted ? 'ONBOARDING' :
          'PENDING';

        await this.prisma.hostPaymentAccount.updateMany({
          where: { providerAccountId: stripeAccount.id },
          data: {
            detailsSubmitted: stripeAccount.details_submitted ?? false,
            chargesEnabled: stripeAccount.charges_enabled ?? false,
            payoutsEnabled: stripeAccount.payouts_enabled ?? false,
            status: newStatus as any,
          },
        });

        this.logger.log(`Account ${stripeAccount.id} updated — status: ${newStatus}`);
        break;
      }

      case 'payout.paid': {
        const stripePayout = event.data.object as Stripe.Payout;
        await this.prisma.payout.updateMany({
          where: { providerPayoutId: stripePayout.id },
          data: {
            status: 'PAID',
            arrivalDate: new Date(stripePayout.arrival_date * 1000),
          },
        });
        this.logger.log(`Payout ${stripePayout.id} marked PAID`);
        break;
      }

      case 'payout.failed': {
        const stripePayout = event.data.object as Stripe.Payout;
        await this.prisma.payout.updateMany({
          where: { providerPayoutId: stripePayout.id },
          data: {
            status: 'FAILED',
            failureMessage: stripePayout.failure_message ?? 'Unknown failure',
          },
        });
        this.logger.log(`Payout ${stripePayout.id} marked FAILED`);
        break;
      }
    }
  }
}
