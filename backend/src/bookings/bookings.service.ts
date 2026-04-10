import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { StripeService } from '../stripe/stripe.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly stripeService: StripeService,
  ) {}

  // ─── Public: guest submits booking request ──────────────────────────────────

  async createPublic(dto: CreateBookingDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId, isActive: true },
      include: { property: { include: { owner: true } } },
    });

    if (!room || !room.property.isPublished) {
      throw new NotFoundException('Room not available');
    }

    // Validate dates
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    if (checkIn < new Date()) {
      throw new BadRequestException('Check-in date must be in the future');
    }

    // Check availability
    await this.assertRoomAvailable(dto.roomId, checkIn, checkOut);

    // Upsert guest
    const guest = await this.upsertGuest(room.property.ownerId, dto);

    // Calculate price
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = Number(room.pricePerNight) * nights;

    const booking = await this.prisma.booking.create({
      data: {
        roomId: dto.roomId,
        guestId: guest.id,
        ownerId: room.property.ownerId,
        checkIn,
        checkOut,
        numGuests: dto.numGuests,
        totalPrice,
        guestMessage: dto.guestMessage,
        status: 'PENDING',
        source: 'direct',
      },
      include: {
        room: { include: { property: true } },
        guest: true,
      },
    });

    // Send emails
    await this.emailService.sendBookingRequest(booking, room.property.owner);

    return booking;
  }

  // ─── Owner: manually create a confirmed booking ──────────────────────────────

  async createManual(ownerId: string, dto: CreateBookingDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
      include: { property: { include: { owner: true } } },
    });

    if (!room || room.property.ownerId !== ownerId) {
      throw new NotFoundException('Room not found or does not belong to you');
    }

    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    await this.assertRoomAvailable(dto.roomId, checkIn, checkOut);

    const guest = await this.upsertGuest(ownerId, dto);

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = Number(room.pricePerNight) * nights;

    const booking = await this.prisma.booking.create({
      data: {
        roomId: dto.roomId,
        guestId: guest.id,
        ownerId,
        checkIn,
        checkOut,
        numGuests: dto.numGuests,
        totalPrice,
        guestMessage: dto.guestMessage,
        status: 'CONFIRMED',
        source: 'manual',
      },
      include: {
        room: { include: { property: true } },
        guest: true,
      },
    });

    return booking;
  }

  // ─── Owner: get all bookings ─────────────────────────────────────────────────

  async findAllByOwner(ownerId: string, status?: BookingStatus, search?: string) {
    return this.prisma.booking.findMany({
      where: {
        ownerId,
        ...(status && { status }),
        ...(search && {
          OR: [
            { guest: { firstName: { contains: search, mode: 'insensitive' } } },
            { guest: { lastName: { contains: search, mode: 'insensitive' } } },
            { guest: { email: { contains: search, mode: 'insensitive' } } },
            { room: { property: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        }),
      },
      include: {
        guest: true,
        room: { include: { property: { select: { name: true, id: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, ownerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        room: { include: { property: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.ownerId !== ownerId) throw new ForbiddenException();

    return booking;
  }

  // ─── Owner: update booking status ───────────────────────────────────────────

  async updateStatus(id: string, ownerId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.findOne(id, ownerId);

    const newStatus = dto.status.toUpperCase() as BookingStatus;

    // Validate state machine
    const validTransitions: Record<string, BookingStatus[]> = {
      PENDING: ['CONFIRMED', 'REJECTED'],
      CONFIRMED: ['CANCELLED', 'COMPLETED', 'PAYMENT_PENDING'],
      PAYMENT_PENDING: ['PAID', 'CANCELLED'],
      PAID: ['COMPLETED'],
      CANCELLED: [],
      REJECTED: [],
      COMPLETED: [],
    };

    if (!validTransitions[booking.status].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${newStatus}`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: newStatus,
        ownerNotes: dto.ownerNotes,
      },
      include: {
        guest: true,
        room: { include: { property: { include: { owner: true } } } },
      },
    });

    // Send notifications
    if (newStatus === 'CONFIRMED') {
      await this.emailService.sendBookingConfirmed(updated, updated.room.property.owner);
    } else if (newStatus === 'CANCELLED' || newStatus === 'REJECTED') {
      await this.emailService.sendBookingCancelled(updated, updated.room.property.owner);
    }

    return updated;
  }

  // ─── Owner: cancel a booking (with optional Stripe refund) ──────────────────

  async cancelBooking(id: string, ownerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        room: { include: { property: { include: { owner: true } } } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.ownerId !== ownerId) throw new ForbiddenException();

    const cancellableStatuses: BookingStatus[] = ['PENDING', 'CONFIRMED', 'PAYMENT_PENDING', 'PAID'];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel a booking with status ${booking.status}`);
    }

    // Issue Stripe refund when the booking was paid via Stripe
    let refunded = false;
    if (
      booking.stripePaymentIntentId &&
      booking.paymentStatus === 'PAID' &&
      this.stripeService.isEnabled()
    ) {
      try {
        await this.stripeService.refundPayment(booking.stripePaymentIntentId);
        refunded = true;
      } catch (err: any) {
        this.logger.error(`Stripe refund failed for booking ${id}: ${err.message}`, err.stack);
        // Don't block cancellation if refund fails — admin can handle manually
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        paymentStatus: refunded ? 'REFUNDED' : booking.paymentStatus ?? undefined,
      },
      include: {
        guest: true,
        room: { include: { property: { include: { owner: true } } } },
      },
    });

    // Notify guest
    await this.emailService
      .sendBookingCancelled(updated, updated.room.property.owner)
      .catch(err => this.logger.error('Cancel email failed (non-fatal)', err));

    return { ...updated, refunded };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async assertRoomAvailable(roomId: string, checkIn: Date, checkOut: Date) {
    // Check no overlapping bookings
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        roomId,
        status: { in: ['PENDING', 'CONFIRMED', 'PAYMENT_PENDING', 'PAID'] },
        AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
      },
    });

    if (conflictingBooking) {
      throw new BadRequestException('Room is not available for the selected dates');
    }

    // Check no manually blocked dates
    const dates: Date[] = [];
    const current = new Date(checkIn);
    while (current < checkOut) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const blocked = await this.prisma.availability.findFirst({
      where: {
        roomId,
        blockedDate: { in: dates },
      },
    });

    if (blocked) {
      throw new BadRequestException('One or more selected dates are blocked');
    }
  }

  private async upsertGuest(ownerId: string, dto: CreateBookingDto) {
    const existing = await this.prisma.guest.findFirst({
      where: { ownerId, email: dto.guestEmail.toLowerCase().trim() },
    });

    if (existing) return existing;

    return this.prisma.guest.create({
      data: {
        ownerId,
        firstName: dto.guestFirstName,
        lastName: dto.guestLastName,
        email: dto.guestEmail.toLowerCase().trim(),
        phone: dto.guestPhone,
      },
    });
  }
}
