import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { FeedbackStatus } from '@prisma/client';

import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class UpdateFeedbackStatusDto {
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  // ─── Stats ──────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Platform KPI stats' })
  getStats() {
    return this.adminService.getStats();
  }

  // ─── Payouts ────────────────────────────────────────────────────────────────

  @Get('payouts/overview')
  @ApiOperation({ summary: 'Upcoming and failed payout bookings' })
  getPayoutOverview() {
    return this.adminService.getPayoutOverview();
  }

  // ─── Users ──────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all host users with property and Stripe status' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Toggle suspend (isActive) for a host user' })
  toggleSuspend(@Param('id') id: string) {
    return this.adminService.toggleSuspend(id);
  }

  @Post('impersonate/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate session tokens to impersonate a user (admin only)' })
  impersonate(
    @CurrentUser('id') adminId: string,
    @Param('userId') userId: string,
  ) {
    // Prevent impersonating yourself
    if (adminId === userId) {
      return { message: 'Cannot impersonate yourself' };
    }
    return this.authService.createImpersonationTokens(userId);
  }

  // ─── Feedback ───────────────────────────────────────────────────────────────

  @Get('feedback')
  @ApiOperation({ summary: 'Get all feedback submissions (kanban data)' })
  getAllFeedback() {
    return this.adminService.getAllFeedback();
  }

  @Patch('feedback/:id/status')
  @ApiOperation({ summary: 'Update feedback item status' })
  updateFeedbackStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return this.adminService.updateFeedbackStatus(id, dto.status);
  }
}
