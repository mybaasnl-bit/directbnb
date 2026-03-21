import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EmailLogsService } from './email-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('email-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class EmailLogsController {
  constructor(private readonly service: EmailLogsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('templateName') templateName?: string,
  ) {
    return this.service.findAll({ status, templateName });
  }

  @Get('stats')
  stats() {
    return this.service.stats();
  }
}
