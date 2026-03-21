import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BetaSignupsService } from './beta-signups.service';
import { CreateBetaSignupDto } from './dto/create-beta-signup.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('beta-signups')
export class BetaSignupsController {
  constructor(private readonly service: BetaSignupsService) {}

  /**
   * POST /api/v1/beta-signups
   * Public — called from the landing page signup form.
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBetaSignupDto) {
    return this.service.create(dto);
  }

  /**
   * GET /api/v1/beta-signups
   * Admin only — list all signups.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * GET /api/v1/beta-signups/count
   * Admin only — quick count for dashboard.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('count')
  count() {
    return this.service.count();
  }

  /**
   * POST /api/v1/beta-signups/:id/invite
   * Admin only — sends an invite email with a one-time registration link.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/invite')
  @HttpCode(HttpStatus.OK)
  invite(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.invite(id);
  }
}
