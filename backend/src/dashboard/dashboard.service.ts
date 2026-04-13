import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(ownerId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = endOfMonthDate.getDate();

    const [
      totalProperties,
      totalRooms,
      totalGuests,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      upcomingBookings,
      revenueThisMonth,
      avgRating,
      bookedThisMonth,
    ] = await Promise.all([
      this.prisma.property.count({ where: { ownerId } }),
      this.prisma.room.count({
        where: { property: { ownerId }, isActive: true },
      }),
      this.prisma.guest.count({ where: { ownerId } }),
      this.prisma.booking.count({ where: { ownerId } }),
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
          status: { in: ['CONFIRMED', 'PAID', 'COMPLETED'] },
          checkIn: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalPrice: true },
      }),
      this.prisma.review.aggregate({
        where: { property: { ownerId } },
        _avg: { rating: true },
      }),
      // Bookings overlapping the current month for occupancy calculation
      this.prisma.booking.findMany({
        where: {
          ownerId,
          status: { in: ['CONFIRMED', 'PAID', 'COMPLETED'] },
          checkIn: { lt: endOfMonthDate },
          checkOut: { gt: startOfMonth },
        },
        select: { checkIn: true, checkOut: true },
      }),
    ]);

    // Occupancy rate: booked nights / (active rooms × days in month)
    let bookedNights = 0;
    for (const b of bookedThisMonth) {
      const start = new Date(b.checkIn) < startOfMonth ? startOfMonth : new Date(b.checkIn);
      const end = new Date(b.checkOut) > endOfMonthDate ? endOfMonthDate : new Date(b.checkOut);
      bookedNights += Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
    }
    const totalAvailableNights = (totalRooms as number) * daysInMonth;
    const occupancyRate = totalAvailableNights > 0
      ? Math.round((bookedNights / totalAvailableNights) * 100)
      : 0;

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
        totalBookings,
        pendingBookings,
        confirmedBookings,
        revenueThisMonth: Number(revenueThisMonth._sum.totalPrice ?? 0),
        avgRating: avgRating._avg.rating ? Number(avgRating._avg.rating.toFixed(1)) : null,
        occupancyRate,
      },
      upcomingBookings,
      recentBookings,
    };
  }
}
