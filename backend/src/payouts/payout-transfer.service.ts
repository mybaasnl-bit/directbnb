import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

// Decorator arguments must be static — resolve at module load time.
const PAYOUT_CRON = process.env['PAYOUT_CRON_SCHEDULE'] || '0 2 * * *'; // default: 02:00 UTC daily

/**
 * PayoutTransferService
 *
 * Runs a daily job that transfers funds from the Platform's Stripe balance to
 * each B&B owner's connected Stripe Express account, using the
 * "Separate Charges and Transfers" model.
 *
 * Transfer timing: on or after the guest's check-in date (Airbnb-style — the
 * host gets paid when the stay begins, not when the booking is made).
 */
@Injectable()
export class PayoutTransferService {
  private readonly stripe: Stripe | null = null;
  private readonly logger = new Logger(PayoutTransferService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });
    }
  }

  // ─── Scheduled entry point ────────────────────────────────────────────────

  /**
   * Runs every day at 02:00 UTC.
   * Override by setting PAYOUT_CRON_SCHEDULE env var, e.g. "0 6 * * *".
   */
  @Cron(PAYOUT_CRON)
  async runDailyTransfers(): Promise<void> {
    this.logger.log('Payout transfer job starting…');
    const result = await this.executeTransfers();
    this.logger.log(
      `Payout transfer job complete — ` +
      `${result.transferred} transferred, ${result.skipped} skipped, ${result.failed} failed`,
    );
  }

  // ─── Core logic (also callable manually / from a controller) ─────────────

  /**
   * Finds all bookings that are due for a host payout and executes the
   * Stripe transfer for each one.
   */
  async executeTransfers(): Promise<{ transferred: number; skipped: number; failed: number }> {
    if (!this.stripe) {
      this.logger.warn('Stripe not configured — skipping payout transfer job');
      return { transferred: 0, skipped: 0, failed: 0 };
    }

    // Midnight UTC today — we include check-ins on today's date as well as past ones
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);

    // Find all bookings that:
    //  • Have been fully paid (paymentStatus = PAID)
    //  • Have a captured Stripe charge ID (so source_transaction is available)
    //  • Check-in date is today or in the past
    //  • Payout hasn't been executed yet
    //  • Booking is confirmed or completed (not cancelled)
    const bookings = await this.prisma.booking.findMany({
      where: {
        paymentStatus: 'PAID',
        stripeChargeId: { not: null },
        checkIn: { lte: todayMidnight },
        payoutStatus: 'PENDING',
        status: { in: ['CONFIRMED', 'COMPLETED', 'PAID'] },
      },
      include: {
        owner: {
          include: {
            paymentAccount: true,
          },
        },
        room: {
          include: { property: true },
        },
      },
    });

    this.logger.log(`Found ${bookings.length} booking(s) eligible for payout`);

    let transferred = 0;
    let skipped = 0;
    let failed = 0;

    for (const booking of bookings) {
      const hostAccount = booking.owner.paymentAccount;

      // ── Guard: host must have a verified Stripe Express account ─────────────
      if (!hostAccount?.providerAccountId) {
        this.logger.warn(
          `Booking ${booking.id}: owner ${booking.ownerId} has no connected Stripe account — skipping`,
        );
        skipped++;
        continue;
      }

      if (!hostAccount.payoutsEnabled) {
        this.logger.warn(
          `Booking ${booking.id}: Stripe account ${hostAccount.providerAccountId} ` +
          `has payoutsEnabled=false — skipping`,
        );
        skipped++;
        continue;
      }

      // ── Guard: payout amount must be positive ─────────────────────────────
      const payoutEuros = Number(booking.payoutAmount ?? 0);
      if (payoutEuros <= 0) {
        this.logger.warn(
          `Booking ${booking.id}: payoutAmount is ${payoutEuros} — skipping`,
        );
        skipped++;
        continue;
      }

      const payoutCents = Math.round(payoutEuros * 100);

      try {
        // ── Execute Stripe transfer ────────────────────────────────────────
        const transfer = await this.stripe.transfers.create({
          amount: payoutCents,
          currency: 'eur',
          destination: hostAccount.providerAccountId,
          // source_transaction ties this transfer to the original charge so Stripe
          // can verify the platform has sufficient funds from that specific payment.
          source_transaction: booking.stripeChargeId!,
          description:
            `DirectBnB — ${booking.room.property.name} ` +
            `(booking ${booking.id.slice(0, 8)}, check-in ${booking.checkIn.toISOString().slice(0, 10)})`,
          metadata: {
            bookingId: booking.id,
            ownerId: booking.ownerId,
            propertyName: booking.room.property.name,
          },
        });

        // ── Update booking ────────────────────────────────────────────────
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            payoutStatus: 'TRANSFERRED',
            stripeTransferId: transfer.id,
          },
        });

        // ── Create Payout record (visible in the host's dashboard) ────────
        if (hostAccount.id) {
          await this.prisma.payout.create({
            data: {
              hostAccountId: hostAccount.id,
              ownerId: booking.ownerId,
              bookingId: booking.id,
              amount: Number(booking.totalPrice),
              platformFee: Number(booking.platformFeeAmount ?? 0),
              netAmount: payoutEuros,
              currency: 'eur',
              status: 'IN_TRANSIT',
              providerPayoutId: transfer.id,
              description:
                `Payout for booking ${booking.id.slice(0, 8)} — ` +
                `${booking.room.property.name}`,
            },
          });
        }

        this.logger.log(
          `✓ Transferred €${payoutEuros.toFixed(2)} to ${hostAccount.providerAccountId} ` +
          `for booking ${booking.id} (transfer: ${transfer.id})`,
        );
        transferred++;
      } catch (err: any) {
        // ── Log error; leave payoutStatus as PENDING so the job retries tomorrow ──
        // Exception: mark as FAILED for permanent errors (invalid account, etc.)
        const isPermanentError =
          err?.raw?.code === 'account_invalid' ||
          err?.raw?.code === 'no_account' ||
          err?.raw?.decline_code === 'invalid_account';

        this.logger.error(
          `✗ Transfer failed for booking ${booking.id}: [${err?.raw?.code ?? 'unknown'}] ${err.message}`,
        );

        if (isPermanentError) {
          await this.prisma.booking.update({
            where: { id: booking.id },
            data: { payoutStatus: 'FAILED' },
          });
        }
        // For transient errors (insufficient_funds, etc.) we leave payoutStatus
        // as PENDING so tomorrow's run retries automatically.

        failed++;
      }
    }

    return { transferred, skipped, failed };
  }
}
