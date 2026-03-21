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

  stats() {
    return this.prisma.emailLog.groupBy({
      by: ['status'],
      _count: { status: true },
    });
  }
}
