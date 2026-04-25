import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MaxLength, IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { FeedbackStatus } from '@prisma/client';

import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { AuthService } from '../auth/auth.service';
import { DynamicCopyService } from '../dynamic-copy/dynamic-copy.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class UpdateFeedbackStatusDto {
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;
}

class UpsertCopyDto {
  @IsString() @MaxLength(200)
  key: string;

  @IsString()
  value: string;

  @IsString() @IsOptional() @MaxLength(500)
  description?: string;
}

class SyncCopyEntryDto {
  @IsString() @MaxLength(200)
  key: string;

  @IsString()
  value: string;

  @IsString() @IsOptional() @MaxLength(500)
  description?: string;
}

class SyncCopyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(500)
  @Type(() => SyncCopyEntryDto)
  entries: SyncCopyEntryDto[];
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly copyService: DynamicCopyService,
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

  // ─── Dynamic Copy (CMS) ─────────────────────────────────────────────────────

  @Get('dynamic-copy')
  @ApiOperation({ summary: 'List all dynamic copy entries' })
  listCopy() {
    return this.copyService.findAll();
  }

  @Post('dynamic-copy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a copy entry by key' })
  upsertCopy(@Body() dto: UpsertCopyDto) {
    return this.copyService.upsert(dto.key, dto.value, dto.description);
  }

  @Delete('dynamic-copy/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a copy entry by key' })
  deleteCopy(@Param('key') key: string) {
    return this.copyService.delete(key);
  }

  @Post('sync-copy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed missing default copy keys — existing keys are never overwritten' })
  syncCopy(@Body() dto: SyncCopyDto) {
    return this.copyService.syncDefaults(dto.entries);
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
