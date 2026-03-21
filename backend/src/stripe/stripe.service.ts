import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

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
   * Create a Stripe PaymentIntent for a booking deposit.
   * depositPercent defaults to 30% of the total price.
   */
  async createDepositIntent(bookingId: string, depositPercent = 30): Promise<{
    clientSecret: string;
    depositAmount: number;
    currency: string;
  }> {
    if (!this.stripe || !this.enabled) {
      throw new BadRequestException('Stripe is not configured on this server.');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { property: true } }, guest: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.depositPaid) throw new BadRequestException('Deposit already paid for this booking');

    // Calculate deposit amount in cents
    const totalCents = Math.round(Number(booking.totalPrice) * 100);
    const depositCents = Math.round(totalCents * (depositPercent / 100));

    const intent = await this.stripe.paymentIntents.create({
      amount: depositCents,
      currency: 'eur',
      metadata: {
        bookingId,
        propertyName: booking.room.property.name,
        guestEmail: booking.guest.email,
      },
      description: `DirectBnB — ${booking.room.property.name} deposit (booking ${bookingId.slice(0, 8)})`,
    });

    // Save the intent ID to the booking
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentIntentId: intent.id,
        depositAmount: depositCents / 100,
      },
    });

    this.logger.log(`Created PaymentIntent ${intent.id} for booking ${bookingId} — €${(depositCents / 100).toFixed(2)}`);

    return {
      clientSecret: intent.client_secret!,
      depositAmount: depositCents / 100,
      currency: 'eur',
    };
  }

  /**
   * Stripe webhook handler — marks deposit as paid when payment succeeds.
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

      if (bookingId) {
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: { depositPaid: true },
        });
        this.logger.log(`Deposit paid for booking ${bookingId} via PaymentIntent ${intent.id}`);
      }
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
