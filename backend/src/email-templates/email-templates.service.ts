import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

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
    await this.findOne(id); // ensure exists
    return this.prisma.emailTemplate.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Replace {{variable}} placeholders in a string with actual values.
   * Unknown placeholders are left as-is.
   */
  renderTemplate(html: string, variables: Record<string, string>): string {
    return html.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => variables[key] ?? `{{${key}}}`);
  }

  /**
   * Load a template by name, render with variables, return subject + html for given language.
   */
  async render(
    name: string,
    language: 'nl' | 'en',
    variables: Record<string, string>,
  ): Promise<{ subject: string; html: string }> {
    const template = await this.findByName(name);
    const subject = this.renderTemplate(
      language === 'nl' ? template.subjectNl : template.subjectEn,
      variables,
    );
    const html = this.renderTemplate(
      language === 'nl' ? template.htmlNl : template.htmlEn,
      variables,
    );
    return { subject, html };
  }
}
