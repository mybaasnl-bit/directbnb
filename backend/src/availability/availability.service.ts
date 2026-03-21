import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockDatesDto, UnblockDatesDto } from './dto/block-dates.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendar(roomId: string, ownerId: string, year: number, month: number) {
    await this.assertRoomOwnership(roomId, ownerId);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [blockedDates, bookings] = await Promise.all([
      this.prisma.availability.findMany({
        where: {
          roomId,
          blockedDate: { gte: startDate, lte: endDate },
        },
        orderBy: { blockedDate: 'asc' },
      }),
      this.prisma.booking.findMany({
        where: {
          roomId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          AND: [{ checkIn: { lte: endDate } }, { checkOut: { gte: startDate } }],
        },
        include: { guest: { select: { firstName: true, lastName: true } } },
        orderBy: { checkIn: 'asc' },
      }),
    ]);

    return { blockedDates, bookings };
  }

  async getAvailability(roomId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [blockedDates, bookings] = await Promise.all([
      this.prisma.availability.findMany({
        where: {
          roomId,
          blockedDate: { gte: start, lte: end },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          roomId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          AND: [{ checkIn: { lt: end } }, { checkOut: { gt: start } }],
        },
      }),
    ]);

    const blockedSet = new Set([
      ...blockedDates.map((d) => d.blockedDate.toISOString().split('T')[0]),
    ]);

    bookings.forEach((b) => {
      const cur = new Date(b.checkIn);
      while (cur < b.checkOut) {
        blockedSet.add(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    });

    return { unavailableDates: Array.from(blockedSet) };
  }

  async blockDates(ownerId: string, dto: BlockDatesDto) {
    await this.assertRoomOwnership(dto.roomId, ownerId);

    const records = dto.dates.map((date) => ({
      roomId: dto.roomId,
      blockedDate: new Date(date),
      reason: dto.reason,
    }));

    await this.prisma.availability.createMany({
      data: records,
      skipDuplicates: true,
    });

    return { message: `${records.length} date(s) blocked` };
  }

  async unblockDates(ownerId: string, dto: UnblockDatesDto) {
    await this.assertRoomOwnership(dto.roomId, ownerId);

    const dates = dto.dates.map((d) => new Date(d));

    await this.prisma.availability.deleteMany({
      where: {
        roomId: dto.roomId,
        blockedDate: { in: dates },
      },
    });

    return { message: `${dates.length} date(s) unblocked` };
  }

  private async assertRoomOwnership(roomId: string, ownerId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { property: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.property.ownerId !== ownerId) throw new ForbiddenException();
    return room;
  }
}
