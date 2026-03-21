import {
  Controller, Post, Get, Param, ParseUUIDPipe, Query, UseGuards,
  Body, BadRequestException, Logger, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MollieService, MolliePaymentMethod } from './mollie.service';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

const ALLOWED_METHODS: MolliePaymentMethod[] = ['ideal', 'wero', 'banktransfer', 'creditcard'];

@ApiTags('mollie')
@Controller('mollie')
@UseGuards(JwtAuthGuard)
export class MollieController {
  private readonly logger = new Logger(MollieController.name);

  constructor(private readonly mollie: MollieService) {}

  /**
   * GET /api/v1/mollie/status
   * Public — lets the frontend know if Mollie is configured.
   */
  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Check if Mollie is configured' })
  status() {
    return { enabled: this.mollie.isEnabled() };
  }

  /**
   * POST /api/v1/mollie/send-link/:bookingId?method=ideal
   * Authenticated (owner) — creates a full payment and emails the link to the guest.
   */
  @Post('send-link/:bookingId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a full payment and email the link to the guest (owner)' })
  @ApiParam({ name: 'bookingId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'method', enum: ALLOWED_METHODS, required: false })
  sendPaymentLink(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Query('method') method: MolliePaymentMethod = 'ideal',
  ) {
    if (!ALLOWED_METHODS.includes(method)) {
      throw new BadRequestException(`Unsupported payment method: ${method}. Use one of: ${ALLOWED_METHODS.join(', ')}`);
    }
    return this.mollie.createFullPayment(bookingId, method);
  }

  /**
   * POST /api/v1/mollie/payment/:bookingId?method=ideal
   * Authenticated — B&B owner initiates a Mollie payment for a booking deposit.
   */
  @Post('payment/:bookingId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Mollie deposit payment for a booking (owner)' })
  @ApiParam({ name: 'bookingId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'method', enum: ALLOWED_METHODS, required: false })
  createPayment(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Query('method') method: MolliePaymentMethod = 'ideal',
  ) {
    if (!ALLOWED_METHODS.includes(method)) {
      throw new BadRequestException(`Unsupported payment method: ${method}. Use one of: ${ALLOWED_METHODS.join(', ')}`);
    }
    return this.mollie.createDepositPayment(bookingId, method);
  }

  /**
   * POST /api/v1/mollie/public/pay
   * Public — called by the guest portal after booking creation (deposit).
   */
  @Public()
  @Post('public/pay')
  @ApiOperation({ summary: 'Guest-initiated Mollie payment for booking deposit' })
  createPublicPayment(
    @Body('bookingId') bookingId: string,
    @Body('method') method: MolliePaymentMethod = 'ideal',
  ) {
    if (!bookingId) throw new BadRequestException('bookingId is required');
    if (!ALLOWED_METHODS.includes(method)) {
      throw new BadRequestException(`Unsupported payment method: ${method}`);
    }
    return this.mollie.createDepositPayment(bookingId, method);
  }

  /**
   * GET /api/v1/mollie/booking/:bookingId
   * Public — returns booking info for the standalone payment page.
   */
  @Public()
  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get booking details for the payment page' })
  @ApiParam({ name: 'bookingId', type: 'string', format: 'uuid' })
  getBookingForPayment(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.mollie.getBookingForPaymentPage(bookingId);
  }

  /**
   * POST /api/v1/mollie/public/full-pay
   * Public — guest initiates full payment from the standalone /betaling page.
   */
  @Public()
  @Post('public/full-pay')
  @ApiOperation({ summary: 'Guest-initiated full payment from /betaling page' })
  createPublicFullPayment(
    @Body('bookingId') bookingId: string,
    @Body('method') method: MolliePaymentMethod = 'ideal',
  ) {
    if (!bookingId) throw new BadRequestException('bookingId is required');
    if (!ALLOWED_METHODS.includes(method)) {
      throw new BadRequestException(`Unsupported payment method: ${method}`);
    }
    return this.mollie.createFullPayment(bookingId, method);
  }

  /**
   * GET /api/v1/mollie/payment/:paymentId/status
   * Public — frontend polls this after guest returns from Mollie checkout.
   */
  @Public()
  @Get('payment/:paymentId/status')
  @ApiOperation({ summary: 'Get payment status by Mollie payment ID' })
  @ApiParam({ name: 'paymentId', type: 'string', description: 'Mollie payment ID (e.g. tr_xxx)' })
  getStatus(@Param('paymentId') paymentId: string) {
    return this.mollie.getPaymentStatus(paymentId);
  }

  /**
   * GET /api/v1/mollie/payment/by-booking/:bookingId/status
   * Public — polls payment status using the booking ID.
   */
  @Public()
  @Get('payment/by-booking/:bookingId/status')
  @ApiOperation({ summary: 'Get payment status by booking ID' })
  @ApiParam({ name: 'bookingId', type: 'string', format: 'uuid' })
  getStatusByBooking(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.mollie.getPaymentStatusByBooking(bookingId);
  }

  /**
   * POST /api/v1/mollie/webhook
   * Mollie calls this when a payment status changes.
   */
  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Mollie webhook receiver' })
  async webhook(@Body('id') paymentId: string) {
    if (!paymentId) {
      throw new BadRequestException('Missing payment id in webhook body');
    }
    this.logger.log(`Mollie webhook received for payment: ${paymentId}`);
    await this.mollie.handleWebhook(paymentId);
    return { received: true };
  }
}
