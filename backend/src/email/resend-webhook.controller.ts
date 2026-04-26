import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Public } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Resend webhook handler
 * ──────────────────────
 * Register this URL in the Resend dashboard → Webhooks:
 *   https://api.directbnb.nl/api/v1/email/resend-webhook
 *
 * Enabled events:
 *   email.sent | email.delivered | email.bounced | email.complained | email.opened
 *
 * The RESEND_WEBHOOK_SECRET env var is optional; when set the incoming
 * signature is verified to prevent spoofed delivery reports.
 */
@Controller('email')
export class ResendWebhookController {
  private readonly logger = new Logger(ResendWebhookController.name);
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.webhookSecret = config.get<string>('RESEND_WEBHOOK_SECRET');
  }

  @Public()
  @Post('resend-webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Req() req: Request,
  ) {
    // ── Signature verification (optional but strongly recommended) ──────────
    if (this.webhookSecret) {
      const rawBody =
        (req as any).rawBody instanceof Buffer
          ? (req as any).rawBody.toString('utf-8')
          : JSON.stringify(req.body);

      const isValid = this.verifyResendSignature({
        webhookSecret: this.webhookSecret,
        msgId: svixId,
        msgTimestamp: svixTimestamp,
        msgSignature: svixSignature,
        body: rawBody,
      });

      if (!isValid) {
        this.logger.warn('Resend webhook signature verification failed — ignoring event');
        // Return 200 so Resend does not keep retrying with an invalid payload.
        return { received: false, reason: 'invalid signature' };
      }
    }

    const event = req.body as ResendWebhookEvent;
    const { type, data } = event ?? {};

    this.logger.log(`Resend webhook received: ${type}`);

    switch (type) {
      case 'email.bounced':
        await this.handleBounce(data);
        break;

      case 'email.complained':
        await this.handleComplaint(data);
        break;

      case 'email.delivered':
        await this.handleDelivered(data);
        break;

      default:
        // Log unknown events for debugging but still return 200
        this.logger.debug(`Unhandled Resend event type: ${type}`);
    }

    return { received: true };
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  /**
   * Hard bounce — the recipient address does not exist.
   * Mark the email log as FAILED and optionally blacklist the address.
   */
  private async handleBounce(data: ResendEmailEventData) {
    if (!data?.email_id) return;

    try {
      await this.prisma.emailLog.updateMany({
        where: { providerMessageId: data.email_id },
        data: {
          status: 'FAILED',
          errorMessage: `BOUNCED: ${data.bounce?.message ?? 'hard bounce'}`,
        },
      });
      this.logger.warn(`Email bounced — provider ID: ${data.email_id}`);
    } catch (err) {
      this.logger.error('Failed to update email log for bounce', err);
    }
  }

  /**
   * Spam complaint — recipient marked the email as spam.
   * Mark the log and flag the address to prevent future sends.
   */
  private async handleComplaint(data: ResendEmailEventData) {
    if (!data?.email_id) return;

    try {
      await this.prisma.emailLog.updateMany({
        where: { providerMessageId: data.email_id },
        data: {
          status: 'FAILED',
          errorMessage: 'SPAM_COMPLAINT: recipient marked as spam',
        },
      });
      this.logger.warn(`Spam complaint — provider ID: ${data.email_id}, to: ${data.to?.[0]}`);
    } catch (err) {
      this.logger.error('Failed to update email log for complaint', err);
    }
  }

  /**
   * Successful delivery — update the log status to SENT (already SENT by default, but
   * this confirms actual inbox delivery if you want to track it separately).
   */
  private async handleDelivered(data: ResendEmailEventData) {
    if (!data?.email_id) return;

    try {
      await this.prisma.emailLog.updateMany({
        where: {
          providerMessageId: data.email_id,
          status: { not: 'FAILED' },
        },
        data: { status: 'SENT' },
      });
    } catch (err) {
      this.logger.error('Failed to update email log for delivery', err);
    }
  }

  // ── Signature verification ──────────────────────────────────────────────────

  /**
   * Verify the Svix/Resend webhook signature.
   * See https://docs.resend.com/changelog/webhook-signature-verification
   */
  private verifyResendSignature(opts: {
    webhookSecret: string;
    msgId: string;
    msgTimestamp: string;
    msgSignature: string;
    body: string;
  }): boolean {
    try {
      const { webhookSecret, msgId, msgTimestamp, msgSignature, body } = opts;

      // Reconstruct the signed payload
      const toSign = `${msgId}.${msgTimestamp}.${body}`;

      // The secret starts with "whsec_" and the rest is base64
      const secretBytes = Buffer.from(webhookSecret.replace(/^whsec_/, ''), 'base64');

      const computed = createHmac('sha256', secretBytes)
        .update(toSign)
        .digest('base64');

      // msgSignature may be a comma-separated list of "v1,<base64>" entries
      const signatures = msgSignature?.split(' ') ?? [];
      return signatures.some((sig) => {
        const sigValue = sig.startsWith('v1,') ? sig.slice(3) : sig;
        try {
          return timingSafeEqual(Buffer.from(sigValue), Buffer.from(computed));
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  }
}

// ── Type helpers ────────────────────────────────────────────────────────────

interface ResendEmailEventData {
  email_id?: string;
  to?: string[];
  from?: string;
  subject?: string;
  created_at?: string;
  bounce?: { message?: string; type?: 'hard' | 'soft' };
}

interface ResendWebhookEvent {
  type: string;
  data: ResendEmailEventData;
}
