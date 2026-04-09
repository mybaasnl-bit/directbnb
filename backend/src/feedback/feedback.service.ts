import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackCategory } from '@prisma/client';

const FEEDBACK_EMAIL = 'jesse@directbnb.nl';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async create(ownerId: string, dto: CreateFeedbackDto) {
    // 1. Persist to DB
    const feedback = await this.prisma.feedback.create({
      data: {
        ownerId,
        category: dto.category as FeedbackCategory | undefined,
        message: dto.message,
        screenshotUrl: dto.screenshotUrl,
      },
      include: { owner: { select: { firstName: true, lastName: true, email: true } } },
    });

    // 2. Send notification email to jesse@directbnb.nl (fire-and-forget)
    const categoryLabel = dto.category ?? 'GENERAL';
    const submitterName = `${feedback.owner.firstName} ${feedback.owner.lastName}`;
    const submitterEmail = feedback.owner.email;

    this.email.sendRaw({
      to: FEEDBACK_EMAIL,
      subject: `[Feedback] ${categoryLabel} — ${submitterName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#FF5000;margin-bottom:4px;">Nieuw feedback bericht</h2>
          <p style="color:#64748b;margin-bottom:24px;font-size:14px;">
            Ingediend via DirectBnB dashboard
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:8px 0;color:#64748b;width:140px;">Categorie</td>
              <td style="padding:8px 0;font-weight:600;color:#0f172a;">${categoryLabel}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;">Van</td>
              <td style="padding:8px 0;font-weight:600;color:#0f172a;">${submitterName} &lt;${submitterEmail}&gt;</td>
            </tr>
          </table>
          <div style="margin-top:20px;padding:16px;background:#f8fafc;border-left:4px solid #FF5000;border-radius:4px;">
            <p style="margin:0;font-size:15px;color:#1e293b;white-space:pre-wrap;">${dto.message}</p>
          </div>
          <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
            Feedback ID: ${feedback.id}
          </p>
        </div>
      `,
    }).catch((err) => this.logger.error('Failed to send feedback email', err));

    return feedback;
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
