import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import ical from 'ical-generator';
// ical.js ships its own types and is compatible with Node.js 18+
// (node-ical 0.26+ requires Node.js 20 due to the regex /v flag)
import ICAL from 'ical.js';
import * as https from 'https';
import * as http from 'http';

/** Cron expression for the iCal sync job — every 6 hours */
const ICAL_SYNC_CRON = '0 */6 * * *';

@Injectable()
export class IcalService {
  private readonly logger = new Logger(IcalService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Export: generate .ics for a room ─────────────────────────────────────

  async exportByToken(token: string): Promise<string> {
    const room = await this.prisma.room.findFirst({
      where: { icalExportToken: token },
      include: {
        property: { select: { name: true } },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PAID', 'COMPLETED'] },
            checkOut: { gte: new Date() },
          },
          include: { guest: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!room) throw new NotFoundException('Calendar feed not found');

    const calendar = ical({
      name: `${room.property.name} — ${room.name}`,
      prodId: { company: 'DirectBnB', product: 'DirectBnB Calendar' },
    });

    for (const booking of room.bookings) {
      calendar.createEvent({
        id: booking.id,
        start: booking.checkIn,
        end: booking.checkOut,
        summary: `${booking.guest.firstName} ${booking.guest.lastName}`,
        description: `Booking ID: ${booking.id}`,
      });
    }

    return calendar.toString();
  }

  // ─── Export token management ──────────────────────────────────────────────

  async getOrCreateExportToken(roomId: string, ownerId: string): Promise<string> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { property: { select: { ownerId: true } } },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.property.ownerId !== ownerId) throw new ForbiddenException();

    if (room.icalExportToken) return room.icalExportToken;

    const token = crypto.randomBytes(24).toString('hex');
    await this.prisma.room.update({
      where: { id: roomId },
      data: { icalExportToken: token },
    });

    return token;
  }

  // ─── Import URL management ────────────────────────────────────────────────

  async addImportUrl(roomId: string, ownerId: string, url: string): Promise<string[]> {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new BadRequestException('Import URL must start with http:// or https://');
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { property: { select: { ownerId: true } } },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.property.ownerId !== ownerId) throw new ForbiddenException();

    if (room.icalImportUrls.includes(url)) return room.icalImportUrls;
    if (room.icalImportUrls.length >= 5) {
      throw new BadRequestException('Maximum of 5 import URLs allowed per room');
    }

    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: { icalImportUrls: { push: url } },
    });

    return updated.icalImportUrls;
  }

  async removeImportUrl(roomId: string, ownerId: string, url: string): Promise<string[]> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { property: { select: { ownerId: true } } },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.property.ownerId !== ownerId) throw new ForbiddenException();

    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: { icalImportUrls: room.icalImportUrls.filter((u: string) => u !== url) },
    });

    return updated.icalImportUrls;
  }

  async getImportUrls(roomId: string, ownerId: string): Promise<{ importUrls: string[]; exportToken: string | null }> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { property: { select: { ownerId: true } } },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.property.ownerId !== ownerId) throw new ForbiddenException();

    return {
      importUrls: room.icalImportUrls,
      exportToken: room.icalExportToken,
    };
  }

  // ─── Sync: import external iCal feeds ─────────────────────────────────────

  async syncRoom(roomId: string): Promise<{ blocked: number; errors: string[] }> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.icalImportUrls.length === 0) return { blocked: 0, errors: [] };

    let totalBlocked = 0;
    const errors: string[] = [];

    for (const url of room.icalImportUrls) {
      try {
        const icsText = await this.fetchUrl(url);
        const jcalData = ICAL.parse(icsText);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');
        let count = 0;

        for (const vevent of vevents) {
          const event = new ICAL.Event(vevent);
          if (!event.startDate || !event.endDate) continue;

          const start = event.startDate.toJSDate();
          const end = event.endDate.toJSDate();

          const current = new Date(start);
          while (current < end) {
            const dateStr = current.toISOString().split('T')[0];
            const blockedDate = new Date(dateStr + 'T00:00:00.000Z');

            await this.prisma.availability.upsert({
              where: { roomId_blockedDate: { roomId, blockedDate } },
              create: { roomId, blockedDate, reason: `ical:${url.substring(0, 80)}` },
              update: {},
            });

            current.setDate(current.getDate() + 1);
            count++;
          }
        }

        totalBlocked += count;
        this.logger.debug(`Synced ${count} dates from ${url} for room ${roomId}`);
      } catch (err: any) {
        const msg = `Failed to sync ${url}: ${err.message}`;
        this.logger.warn(msg);
        errors.push(msg);
      }
    }

    return { blocked: totalBlocked, errors };
  }

  @Cron(ICAL_SYNC_CRON)
  async syncAllRooms() {
    this.logger.log('Starting iCal sync for all rooms...');

    const rooms = await this.prisma.room.findMany({
      where: { icalImportUrls: { isEmpty: false } },
      select: { id: true },
    });

    for (const room of rooms) {
      const result = await this.syncRoom(room.id);
      if (result.errors.length > 0) {
        this.logger.warn(`iCal sync errors for room ${room.id}: ${result.errors.join(', ')}`);
      }
    }

    this.logger.log(`iCal sync complete — ${rooms.length} room(s) processed`);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https://') ? https : http;
      client.get(url, { headers: { 'User-Agent': 'DirectBnB-iCal-Sync/1.0' } }, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      }).on('error', reject);
    });
  }
}
