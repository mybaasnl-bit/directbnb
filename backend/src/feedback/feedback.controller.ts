import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('feedback')
@Controller('feedback')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit beta feedback' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get own feedback submissions' })
  findAll(@CurrentUser('id') ownerId: string) {
    return this.feedbackService.findAll(ownerId);
  }

  @Get('admin/all')
  @Roles('ADMIN' as any)
  @ApiOperation({ summary: 'Admin: get all feedback' })
  findAllAdmin() {
    return this.feedbackService.findAllAdmin();
  }
}
