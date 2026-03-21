import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackCategory } from '@prisma/client';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        ownerId,
        category: dto.category as FeedbackCategory | undefined,
        message: dto.message,
        screenshotUrl: dto.screenshotUrl,
      },
    });
  }

  async findAll(ownerId: string) {
    return this.prisma.feedback.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: get all feedback
  async findAllAdmin() {
    return this.prisma.feedback.findMany({
      include: {
        owner: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
