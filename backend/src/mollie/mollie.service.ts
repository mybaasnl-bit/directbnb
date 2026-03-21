import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import createMollieClient, { MollieClient, PaymentMethod } from '@mollie/api-client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

export type MolliePaymentMethod = 'ideal' | 'wero' | 'banktransfer' | 'creditcard';

@Injectable()
export class MollieService {
  private readonly mollie: MollieClient | null = null;
  private readonly logger = new Logger(MollieService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    const key = config.get<string>('MOLLIE_API_KEY');
    this.enabled = !!key;

    if (key) {
      this.mollie = createMollieClient({ apiKey: key });
      this.logger.log('Mollie initialized');
    } else {
      this.logger.warn('MOLLIE_API_KEY not set — Mollie payments disabled');
    }
  }

  /**
   * Create a Mollie Payment for a booking deposit.
   * The guest is redirected to Mollie's hosted checkout page.
   */
  async createDepositPayment(
    bookingId: string,
    method: MolliePaymentMethod = 'ideal',
    depositPercent = 30,
  ): Promise<{ checkoutUrl: string; paymentId: string; depositAmount: number }> {
    if (!this.mollie || !this.enabled) {
      throw new BadRequestException('Mollie is not configured on this server.');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { property: true } }, guest: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.depositPaid) throw new BadRequestException('Deposit already paid for this booking');

    const total = Number(booking.totalPrice);
    const depositAmount = Math.round((total * depositPercent) / 100 * 100) / 100;

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const webhookUrl = this.config.get<string>('MOLLIE_WEBHOOK_URL', '');
    const redirectBase = `${frontendUrl}/nl/boek/betaling?bookingId=${bookingId}`;

    const payment = await this.mollie.payments.create({
      amount: { value: depositAmount.toFixed(2), currency: 'EUR' },
      method: method as PaymentMethod,
      description: `DirectBnB — ${booking.room.property.name} aanbetaling (boeking ${bookingId.slice(0, 8)})`,
      redirectUrl: redirectBase,
      webhookUrl: webhookUrl || undefined,
      metadata: { bookingId, type: 'DEPOSIT', propertyName: booking.room.property.name, guestEmail: booking.guest.email },
    });

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { molliePaymentId: payment.id, paymentProvider: 'MOLLIE', depositAmount },
    });

    const checkoutUrl = payment._links.checkout?.href;
    if (!checkoutUrl) {
      throw new BadRequestException('Mollie did not return a checkout URL for this payment method');
    }

    this.logger.log(`Created Mollie deposit payment ${payment.id} (${method}) for booking ${bookingId} — €${depositAmount.toFixed(2)}`);
    return { checkoutUrl, paymentId: payment.id, depositAmount };
  }

  /**
   * Create a full (100%) payment for a confirmed booking.
   * Owner triggers this to send a payment link to the guest.
   * Sets booking status to PAYMENT_PENDING.
   */
  async createFullPayment(
    bookingId: string,
    method: MolliePaymentMethod = 'ideal',
  ): Promise<{ checkoutUrl: string; paymentId: string; amount: number }> {
    if (!this.mollie || !this.enabled) {
      throw new BadRequestException('Mollie is not configured on this server.');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { property: true } }, guest: true, owner: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (!['CONFIRMED', 'PAYMENT_PENDING'].includes(booking.status)) {
      throw new BadRequestException('Booking must be CONFIRMED to send a payment link');
    }

    const amount = Number(booking.totalPrice);
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const webhookUrl = this.config.get<string>('MOLLIE_WEBHOOK_URL', '');
    const redirectUrl = `${frontendUrl}/nl/betaling/${bookingId}?status=return`;

    const payment = await this.mollie.payments.create({
      amount: { value: amount.toFixed(2), currency: 'EUR' },
      method: method as PaymentMethod,
      description: `DirectBnB — ${booking.room.property.name} volledige betaling (boeking ${bookingId.slice(0, 8)})`,
      redirectUrl,
      webhookUrl: webhookUrl || undefined,
      metadata: { bookingId, type: 'FULL', propertyName: booking.room.property.name, guestEmail: booking.guest.email },
    });

    const checkoutUrl = payment._links.checkout?.href;
    if (!checkoutUrl) {
      throw new BadRequestException('Mollie did not return a checkout URL for this payment method');
    }

    // Create Payment record + update booking to PAYMENT_PENDING
    await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          bookingId,
          amount,
          currency: 'EUR',
          status: 'PENDING',
          type: 'FULL',
          provider: 'MOLLIE',
          providerPaymentId: payment.id,
          method,
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_PENDING',
          molliePaymentId: payment.id,
          paymentProvider: 'MOLLIE',
          paymentType: 'FULL',
          paymentStatus: 'PENDING',
        },
      }),
    ]);

    // Email the guest the payment link
    await this.emailService.sendPaymentLinkToGuest({
      guestEmail: booking.guest.email,
      guestFirstName: booking.guest.firstName,
      propertyName: booking.room.property.name,
      roomName: booking.room.name,
      checkIn: new Date(booking.checkIn),
      checkOut: new Date(booking.checkOut),
      amount,
      paymentUrl: checkoutUrl,
      language: (booking.owner as any).preferredLanguage ?? 'nl',
    });

    this.logger.log(`Created full payment ${payment.id} (${method}) for booking ${bookingId} — €${amount.toFixed(2)}`);
    return { checkoutUrl, paymentId: payment.id, amount };
  }

  /**
   * Handle a Mollie webhook POST.
   * Creates a Payment record and updates booking status to PAID when paid.
   */
  async handleWebhook(paymentId: string): Promise<void> {
    if (!this.mollie) {
      throw new BadRequestException('Mollie is not configured');
    }

    const payment = await this.mollie.payments.get(paymentId);
    this.logger.log(`Mollie webhook received: payment ${paymentId} status = ${payment.status}`);

    const metadata = payment.metadata as any;
    const bookingId = metadata?.bookingId;
    const paymentType = metadata?.type as 'FULL' | 'DEPOSIT' | undefined;

    if (!bookingId) return;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { guest: true, room: { include: { property: true } }, owner: true },
    });
    if (!booking) return;

    if (payment.status === 'paid') {
      const now = new Date();

      if (paymentType === 'FULL') {
        // Update the Payment record and booking status
        await this.prisma.$transaction([
          this.prisma.payment.updateMany({
            where: { bookingId, providerPaymentId: paymentId },
            data: { status: 'PAID', paidAt: now, method: (payment as any).method ?? null },
          }),
          this.prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: 'PAID',
              paymentStatus: 'PAID',
              paidAt: now,
              depositPaid: true,
            },
          }),
        ]);

        this.logger.log(`Full payment received for booking ${bookingId}`);

        const lang: 'nl' | 'en' = (booking.owner as any).preferredLanguage ?? 'nl';
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);

        await Promise.all([
          this.emailService.sendPaymentConfirmationToGuest({
            guestEmail: booking.guest.email,
            guestFirstName: booking.guest.firstName,
            propertyName: booking.room.property.name,
            roomName: booking.room.name,
            checkIn,
            checkOut,
            amount: Number(booking.totalPrice),
            language: lang,
          }),
          this.emailService.sendPaymentReceivedToHost({
            ownerEmail: (booking.owner as any).email,
            ownerFirstName: (booking.owner as any).firstName,
            guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
            propertyName: booking.room.property.name,
            roomName: booking.room.name,
            checkIn,
            checkOut,
            amount: Number(booking.totalPrice),
            language: lang,
          }),
        ]);
      } else {
        // Deposit payment (legacy)
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: { depositPaid: true },
        });
        this.logger.log(`Deposit marked paid for booking ${bookingId} via Mollie payment ${paymentId}`);
      }
    } else if (['failed', 'canceled', 'expired'].includes(payment.status)) {
      if (paymentType === 'FULL') {
        await this.prisma.payment.updateMany({
          where: { bookingId, providerPaymentId: paymentId },
          data: { status: 'FAILED', failedAt: new Date() },
        });
        this.logger.log(`Payment ${paymentId} failed/cancelled for booking ${bookingId}`);
      }
    }
  }

  /**
   * Get the current status of a payment by its Mollie payment ID.
   */
  async getPaymentStatus(paymentId: string): Promise<{ status: string; depositPaid: boolean }> {
    if (!this.mollie) {
      throw new BadRequestException('Mollie is not configured');
    }

    const payment = await this.mollie.payments.get(paymentId);
    const booking = await this.prisma.booking.findFirst({
      where: { molliePaymentId: paymentId },
      select: { depositPaid: true },
    });

    return { status: payment.status, depositPaid: booking?.depositPaid ?? false };
  }

  /**
   * Get payment status by booking ID.
   */
  async getPaymentStatusByBooking(bookingId: string): Promise<{ status: string; depositPaid: boolean }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { molliePaymentId: true, depositPaid: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.depositPaid) return { status: 'paid', depositPaid: true };
    if (!booking.molliePaymentId || !this.mollie) return { status: 'pending', depositPaid: false };

    return this.getPaymentStatus(booking.molliePaymentId);
  }

  /**
   * Get booking details for the public payment page.
   */
  async getBookingForPaymentPage(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: { include: { property: { include: { photos: { orderBy: { sortOrder: 'asc' }, take: 1 } } } } },
        guest: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    return {
      id: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      numGuests: booking.numGuests,
      totalPrice: Number(booking.totalPrice),
      propertyName: booking.room.property.name,
      roomName: booking.room.name,
      coverPhoto: booking.room.property.photos[0]?.url ?? null,
      guestFirstName: booking.guest.firstName,
    };
  }

  /**
   * Admin: get all payments with booking/guest info.
   */
  async getAllPayments(status?: string) {
    return this.prisma.payment.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        booking: {
          include: {
            guest: { select: { firstName: true, lastName: true, email: true } },
            room: { select: { name: true, property: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
