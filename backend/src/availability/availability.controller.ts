import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { AvailabilityService } from './availability.service';
import { BlockDatesDto, UnblockDatesDto } from './dto/block-dates.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('availability')
@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('calendar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get calendar data for a room (month view)' })
  getCalendar(
    @CurrentUser('id') ownerId: string,
    @Query('roomId') roomId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.availabilityService.getCalendar(roomId, ownerId, year, month);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get unavailable dates for a room (public, for booking page)' })
  getAvailability(
    @Query('roomId') roomId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.availabilityService.getAvailability(roomId, startDate, endDate);
  }

  @Post('block')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block one or more dates for a room' })
  blockDates(@CurrentUser('id') ownerId: string, @Body() dto: BlockDatesDto) {
    return this.availabilityService.blockDates(ownerId, dto);
  }

  @Delete('unblock')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock dates for a room' })
  unblockDates(@CurrentUser('id') ownerId: string, @Body() dto: UnblockDatesDto) {
    return this.availabilityService.unblockDates(ownerId, dto);
  }
}
