import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailLogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { status?: string; templateName?: string }) {
    return this.prisma.emailLog.findMany({
      where: {
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.templateName && { templateName: filters.templateName }),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  findByHost(hostId: string, filters?: { status?: string; templateName?: string }) {
    return this.prisma.emailLog.findMany({
      where: {
        hostId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.templateName && { templateName: filters.templateName }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  stats() {
    return this.prisma.emailLog.groupBy({
      by: ['status'],
      _count: { status: true },
    });
  }

  async statsByHost(hostId: string) {
    const rows = await this.prisma.emailLog.groupBy({
      by: ['status'],
      where: { hostId },
      _count: { status: true },
    });

    // Normalise into a flat object { SENT: n, FAILED: n, total: n }
    const map: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      map[row.status] = row._count.status;
      total += row._count.status;
    }
    return { ...map, total };
  }
}
