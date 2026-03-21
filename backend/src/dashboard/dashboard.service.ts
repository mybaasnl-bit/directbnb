import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(ownerId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalProperties,
      totalRooms,
      totalGuests,
      pendingBookings,
      confirmedBookings,
      upcomingBookings,
      revenueThisMonth,
    ] = await Promise.all([
      this.prisma.property.count({ where: { ownerId } }),
      this.prisma.room.count({
        where: { property: { ownerId }, isActive: true },
      }),
      this.prisma.guest.count({ where: { ownerId } }),
      this.prisma.booking.count({ where: { ownerId, status: 'PENDING' } }),
      this.prisma.booking.count({ where: { ownerId, status: 'CONFIRMED' } }),
      this.prisma.booking.findMany({
        where: {
          ownerId,
          status: 'CONFIRMED',
          checkIn: { gte: now },
        },
        include: {
          guest: { select: { firstName: true, lastName: true, email: true } },
          room: { include: { property: { select: { name: true } } } },
        },
        orderBy: { checkIn: 'asc' },
        take: 5,
      }),
      this.prisma.booking.aggregate({
        where: {
          ownerId,
          status: 'CONFIRMED',
          checkIn: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalPrice: true },
      }),
    ]);

    // Recent bookings (all statuses)
    const recentBookings = await this.prisma.booking.findMany({
      where: { ownerId },
      include: {
        guest: { select: { firstName: true, lastName: true, email: true } },
        room: { include: { property: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return {
      stats: {
        totalProperties,
        totalRooms,
        totalGuests,
        pendingBookings,
        confirmedBookings,
        revenueThisMonth: Number(revenueThisMonth._sum.totalPrice ?? 0),
      },
      upcomingBookings,
      recentBookings,
    };
  }
}
