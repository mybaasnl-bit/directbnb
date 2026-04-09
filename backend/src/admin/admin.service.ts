import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedbackStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Platform KPI stats ──────────────────────────────────────────────────────

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeBnbs,
      activeRooms,
      totalBookings,
      commissionAgg,
      pendingPayouts,
      failedPayouts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'OWNER' } }),
      this.prisma.property.count({ where: { isPublished: true } }),
      this.prisma.room.count({ where: { isActive: true } }),
      this.prisma.booking.count(),
      // Platform commission earned this month (from bookings with payoutStatus TRANSFERRED)
      this.prisma.booking.aggregate({
        _sum: { platformFeeAmount: true },
        where: {
          payoutStatus: 'TRANSFERRED',
          updatedAt: { gte: startOfMonth },
        },
      }),
      this.prisma.booking.count({
        where: {
          payoutStatus: 'PENDING',
          paymentStatus: 'PAID',
        },
      }),
      this.prisma.booking.count({ where: { payoutStatus: 'FAILED' } }),
    ]);

    return {
      totalUsers,
      activeBnbs,
      activeRooms,
      totalBookings,
      commissionThisMonth: Number(commissionAgg._sum.platformFeeAmount ?? 0),
      pendingPayouts,
      failedPayouts,
    };
  }

  // ─── Payout overview ─────────────────────────────────────────────────────────

  async getPayoutOverview() {
    const [upcoming, failed] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          payoutStatus: 'PENDING',
          paymentStatus: 'PAID',
        },
        include: {
          owner: { select: { firstName: true, lastName: true, email: true } },
          room: { select: { name: true, property: { select: { name: true } } } },
          guest: { select: { firstName: true, lastName: true } },
        },
        orderBy: { checkIn: 'asc' },
        take: 50,
      }),
      this.prisma.booking.findMany({
        where: { payoutStatus: 'FAILED' },
        include: {
          owner: { select: { firstName: true, lastName: true, email: true } },
          room: { select: { name: true, property: { select: { name: true } } } },
          guest: { select: { firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
    ]);

    return { upcoming, failed };
  }

  // ─── User management ─────────────────────────────────────────────────────────

  async getUsers() {
    return this.prisma.user.findMany({
      where: { role: 'OWNER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        createdAt: true,
        properties: {
          select: {
            id: true,
            name: true,
            isPublished: true,
            rooms: { select: { id: true } },
          },
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
        paymentAccount: {
          select: { status: true, detailsSubmitted: true, payoutsEnabled: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleSuspend(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true, firstName: true, lastName: true },
    });

    // If suspending, also unpublish their properties
    if (!updated.isActive) {
      await this.prisma.property.updateMany({
        where: { ownerId: userId },
        data: { isPublished: false },
      });
    }

    return updated;
  }

  // ─── Feedback management ─────────────────────────────────────────────────────

  async getAllFeedback() {
    return this.prisma.feedback.findMany({
      include: {
        owner: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFeedbackStatus(feedbackId: string, status: FeedbackStatus) {
    const item = await this.prisma.feedback.findUnique({ where: { id: feedbackId } });
    if (!item) throw new NotFoundException('Feedback item not found');

    return this.prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
      include: {
        owner: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }
}
