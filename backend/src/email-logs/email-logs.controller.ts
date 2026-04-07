import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
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

  // ── Host-scoped endpoints (no ADMIN role required) ────────────────────────

  /** GET /email-logs/my — recent logs for the logged-in host */
  @Get('my')
  @Roles('ADMIN', 'OWNER')
  findMine(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('templateName') templateName?: string,
  ) {
    return this.service.findByHost(req.user.id, { status, templateName });
  }

  /** GET /email-logs/my/stats — aggregated counts for the logged-in host */
  @Get('my/stats')
  @Roles('ADMIN', 'OWNER')
  myStats(@Req() req: any) {
    return this.service.statsByHost(req.user.id);
  }
}
