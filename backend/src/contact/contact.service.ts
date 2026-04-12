import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async submit(dto: CreateContactDto): Promise<void> {
    const supportEmail = this.config.get<string>('SUPPORT_EMAIL', 'info@directbnb.nl');

    const html = `
      <h2>Nieuw contactformulier bericht</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:8px;font-weight:bold;background:#f8fafc">Naam</td><td style="padding:8px">${this.escape(dto.name)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f8fafc">E-mail</td><td style="padding:8px"><a href="mailto:${this.escape(dto.email)}">${this.escape(dto.email)}</a></td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f8fafc">Onderwerp</td><td style="padding:8px">${this.escape(dto.subject)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;vertical-align:top">Bericht</td><td style="padding:8px;white-space:pre-wrap">${this.escape(dto.message)}</td></tr>
      </table>
    `;

    await this.email.sendRaw({
      to: supportEmail,
      subject: `Contact: ${dto.subject}`,
      html,
    });

    this.logger.log(`Contact form submitted by ${dto.email} — subject: "${dto.subject}"`);
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
