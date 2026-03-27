import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmailTemplatesService } from './email-templates.service';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { UpsertHostTemplateDto } from './dto/upsert-host-template.dto';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('email-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly service: EmailTemplatesService) {}

  // ─── System templates (admin only) ───────────────────────────────────────

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all system email templates (admin only)' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get a single system email template by ID (admin only)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a system email template (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/test')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test email for this template (admin only)' })
  sendTest(@Param('id') id: string, @Body() dto: SendTestEmailDto) {
    return this.service.sendTestEmail(id, dto);
  }

  // ─── Host templates (owner) ───────────────────────────────────────────────

  @Get('host/mine')
  @ApiOperation({ summary: 'List all custom email templates for the logged-in host' })
  getMyTemplates(@Req() req: any) {
    return this.service.findHostTemplates(req.user.id);
  }

  @Get('host/mine/:templateName/resolved')
  @ApiOperation({ summary: 'Get resolved template (host override or system default) for the editor' })
  getResolvedTemplate(@Req() req: any, @Param('templateName') templateName: string) {
    return this.service.resolveForHost(req.user.id, templateName);
  }

  @Post('host/mine/:templateName/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test email for a host template (uses host override if available)' })
  sendHostTest(
    @Req() req: any,
    @Param('templateName') templateName: string,
    @Body() dto: SendTestEmailDto,
  ) {
    return this.service.sendHostTestEmail(req.user.id, templateName, dto);
  }

  @Get('host/mine/:templateName')
  @ApiOperation({ summary: 'Get a specific custom template for the logged-in host' })
  getMyTemplate(@Req() req: any, @Param('templateName') templateName: string) {
    return this.service.findHostTemplate(req.user.id, templateName);
  }

  @Put('host/mine/:templateName')
  @ApiOperation({ summary: 'Create or update a custom email template for the logged-in host' })
  upsertMyTemplate(
    @Req() req: any,
    @Param('templateName') templateName: string,
    @Body() dto: UpsertHostTemplateDto,
  ) {
    return this.service.upsertHostTemplate(req.user.id, templateName, dto);
  }

  @Delete('host/mine/:templateName')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset a custom template back to system default' })
  deleteMyTemplate(@Req() req: any, @Param('templateName') templateName: string) {
    return this.service.deleteHostTemplate(req.user.id, templateName);
  }
}
