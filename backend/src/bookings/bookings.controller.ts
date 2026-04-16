import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateCheckoutBookingDto } from './dto/create-checkout-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// ─── Owner endpoints (authenticated) ─────────────────────────────────────────

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all bookings for the current owner' })
  findAll(
    @CurrentUser('id') ownerId: string,
    @Query('status') status?: BookingStatus,
    @Query('search') search?: string,
  ) {
    return this.bookingsService.findAllByOwner(ownerId, status, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single booking by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.bookingsService.findOne(id, ownerId);
  }

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Owner manually creates a confirmed booking' })
  createManual(
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createManual(ownerId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Confirm, reject or cancel a booking' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, ownerId, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking (with Stripe refund if applicable)' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.bookingsService.cancelBooking(id, ownerId);
  }
}

// ─── Public endpoint: guest submits booking request ───────────────────────────

@ApiTags('public')
@Controller('public/bookings')
@UseGuards(JwtAuthGuard)
export class PublicBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new booking request (public, no auth required)' })
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.createPublic(dto);
  }

  /**
   * POST /api/v1/public/bookings/checkout
   * Guest submits booking details + receives a Stripe Checkout URL.
   * The booking is created as PAYMENT_PENDING; it transitions to CONFIRMED
   * only after Stripe fires the checkout.session.completed webhook.
   */
  @Public()
  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create booking and Stripe Checkout Session (public)' })
  createWithCheckout(@Body() dto: CreateCheckoutBookingDto) {
    return this.bookingsService.createWithStripeCheckout(dto);
  }
}
