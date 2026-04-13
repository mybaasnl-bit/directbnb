import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        preferredLanguage: true,
        isBetaUser: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        preferredLanguage: true,
        updatedAt: true,
      },
    });
  }

  async getNotificationPrefs(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { notificationPreferences: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const prefs = (user.notificationPreferences as Record<string, boolean>) ?? {};
    return {
      emailNewBooking:        prefs.emailNewBooking        ?? true,
      emailBookingCancelled:  prefs.emailBookingCancelled  ?? true,
      emailBookingReminder:   prefs.emailBookingReminder   ?? false,
      emailPaymentReceived:   prefs.emailPaymentReceived   ?? true,
    };
  }

  async updateNotificationPrefs(id: string, dto: UpdateNotificationPrefsDto) {
    const current = await this.getNotificationPrefs(id);
    const merged = { ...current, ...dto };
    await this.prisma.user.update({
      where: { id },
      data: { notificationPreferences: merged },
    });
    return merged;
  }
}
