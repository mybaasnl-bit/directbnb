import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { UpsertHostTemplateDto } from './dto/upsert-host-template.dto';
import { SendTestEmailDto } from './dto/send-test-email.dto';

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const apiKey = config.get<string>('RESEND_API_KEY') || 'placeholder';
    this.resend = new Resend(apiKey);
    this.from = config.get('EMAIL_FROM', 'DirectBnB <onboarding@resend.dev>');
  }

  // ─── System templates (admin) ─────────────────────────────────────────────

  findAll() {
    return this.prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        subjectNl: true,
        subjectEn: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException(`Email template ${id} not found`);
    return template;
  }

  async findByName(name: string) {
    const template = await this.prisma.emailTemplate.findUnique({ where: { name } });
    if (!template) throw new NotFoundException(`Email template '${name}' not found`);
    return template;
  }

  async update(id: string, dto: UpdateEmailTemplateDto) {
    await this.findOne(id);
    return this.prisma.emailTemplate.update({ where: { id }, data: dto });
  }

  // ─── Host templates (owner) ───────────────────────────────────────────────

  findHostTemplates(hostId: string) {
    return this.prisma.hostEmailTemplate.findMany({
      where: { hostId },
      orderBy: { templateName: 'asc' },
    });
  }

  async findHostTemplate(hostId: string, templateName: string) {
    return this.prisma.hostEmailTemplate.findUnique({
      where: { hostId_templateName: { hostId, templateName } },
    });
  }

  async upsertHostTemplate(hostId: string, templateName: string, dto: UpsertHostTemplateDto) {
    // Verify the base template exists
    await this.findByName(templateName);

    return this.prisma.hostEmailTemplate.upsert({
      where: { hostId_templateName: { hostId, templateName } },
      create: { hostId, templateName, ...dto },
      update: dto,
    });
  }

  async deleteHostTemplate(hostId: string, templateName: string) {
    const existing = await this.findHostTemplate(hostId, templateName);
    if (!existing) throw new NotFoundException('Host template not found');
    return this.prisma.hostEmailTemplate.delete({
      where: { hostId_templateName: { hostId, templateName } },
    });
  }

  // ─── Template resolution (host → system fallback) ────────────────────────

  /**
   * Resolve a template: use host-specific if available, fall back to system default.
   * Then render variables.
   */
  async resolve(
    templateName: string,
    language: 'nl' | 'en',
    variables: Record<string, string>,
    hostId?: string,
  ): Promise<{ subject: string; html: string }> {
    let subjectTemplate: string;
    let htmlTemplate: string;

    // Try host-specific template first
    if (hostId) {
      const hostTpl = await this.findHostTemplate(hostId, templateName);
      if (hostTpl) {
        subjectTemplate = language === 'nl' ? hostTpl.subjectNl : hostTpl.subjectEn;
        htmlTemplate = language === 'nl' ? hostTpl.htmlNl : hostTpl.htmlEn;
        return {
          subject: this.renderVariables(subjectTemplate, variables),
          html: this.renderVariables(htmlTemplate, variables),
        };
      }
    }

    // Fall back to system template
    const systemTpl = await this.findByName(templateName);
    subjectTemplate = language === 'nl' ? systemTpl.subjectNl : systemTpl.subjectEn;
    htmlTemplate = language === 'nl' ? systemTpl.htmlNl : systemTpl.htmlEn;

    return {
      subject: this.renderVariables(subjectTemplate, variables),
      html: this.renderVariables(htmlTemplate, variables),
    };
  }

  /**
   * Legacy: render a system template by name (used by email.service.ts sendTemplatedEmail).
   */
  async render(
    name: string,
    language: 'nl' | 'en',
    variables: Record<string, string>,
  ): Promise<{ subject: string; html: string }> {
    return this.resolve(name, language, variables);
  }

  /**
   * Replace {{variable}} placeholders in a string with actual values.
   */
  renderVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => variables[key] ?? `{{${key}}}`);
  }

  /** @deprecated Use renderVariables */
  renderTemplate(html: string, variables: Record<string, string>): string {
    return this.renderVariables(html, variables);
  }

  // ─── Host template resolution (for editor) ───────────────────────────────

  /**
   * Returns raw template fields for the host editor.
   * Uses host override if available, otherwise returns system default.
   * Includes isCustomized flag so the UI can show "Reset to default".
   */
  async resolveForHost(hostId: string, templateName: string): Promise<{
    subjectNl: string;
    subjectEn: string;
    htmlNl: string;
    htmlEn: string;
    isCustomized: boolean;
  }> {
    const hostTpl = await this.findHostTemplate(hostId, templateName);
    if (hostTpl) {
      return {
        subjectNl: hostTpl.subjectNl,
        subjectEn: hostTpl.subjectEn,
        htmlNl: hostTpl.htmlNl,
        htmlEn: hostTpl.htmlEn,
        isCustomized: true,
      };
    }

    const systemTpl = await this.findByName(templateName);
    return {
      subjectNl: systemTpl.subjectNl,
      subjectEn: systemTpl.subjectEn,
      htmlNl: systemTpl.htmlNl,
      htmlEn: systemTpl.htmlEn,
      isCustomized: false,
    };
  }

  /**
   * Send a test email for a host's template (uses their override if set).
   */
  async sendHostTestEmail(hostId: string, templateName: string, dto: SendTestEmailDto) {
    const { language, to } = dto;

    const sampleVars: Record<string, string> = {
      name: 'Jan Janssen',
      guest_name: 'Jan Janssen',
      owner_name: 'Eigenaar',
      bnb_name: 'Mijn B&B',
      property_name: 'Mijn B&B',
      room_name: 'Kamer 1',
      guest_email: 'gast@example.com',
      owner_email: 'eigenaar@example.com',
      check_in: '15 april 2025',
      check_out: '18 april 2025',
      total_price: '225,00',
      num_guests: '2',
      signup_date: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }),
    };

    const { subject, html } = await this.resolve(templateName, language, sampleVars, hostId);

    if (!this.config.get<string>('RESEND_API_KEY')) {
      this.logger.warn('Host test email skipped — RESEND_API_KEY not set');
      return { sent: false, reason: 'RESEND_API_KEY not set' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject: `[TEST] ${subject}`,
        html,
      });

      if (error) throw new Error(error.message);
      this.logger.log(`Host test email sent to ${to} (messageId: ${data?.id})`);
      return { sent: true, messageId: data?.id };
    } catch (err: any) {
      this.logger.error(`Host test email failed: ${err.message}`);
      throw err;
    }
  }

  // ─── Test email ───────────────────────────────────────────────────────────

  async sendTestEmail(id: string, dto: SendTestEmailDto) {
    const template = await this.findOne(id);
    const { language, to } = dto;

    const sampleVars: Record<string, string> = {
      name: 'Jan Janssen',
      guest_name: 'Jan Janssen',
      owner_name: 'Eigenaar',
      bnb_name: 'Mijn B&B',
      property_name: 'Mijn B&B',
      room_name: 'Kamer 1',
      guest_email: 'gast@example.com',
      owner_email: 'eigenaar@example.com',
      check_in: '15 april 2025',
      check_out: '18 april 2025',
      total_price: '225,00',
      num_guests: '2',
      signup_date: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }),
    };

    const subject = this.renderVariables(
      language === 'nl' ? template.subjectNl : template.subjectEn,
      sampleVars,
    );
    const html = this.renderVariables(
      language === 'nl' ? template.htmlNl : template.htmlEn,
      sampleVars,
    );

    if (!this.config.get<string>('RESEND_API_KEY')) {
      this.logger.warn('Test email skipped — RESEND_API_KEY not set');
      return { sent: false, reason: 'RESEND_API_KEY not set' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject: `[TEST] ${subject}`,
        html,
      });

      if (error) throw new Error(error.message);
      this.logger.log(`Test email sent to ${to} (messageId: ${data?.id})`);
      return { sent: true, messageId: data?.id };
    } catch (err: any) {
      this.logger.error(`Test email failed: ${err.message}`);
      throw err;
    }
  }
}
