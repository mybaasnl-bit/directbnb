import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MollieService } from './mollie.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminPaymentsController {
  constructor(private readonly mollie: MollieService) {}

  /**
   * GET /api/v1/admin/payments
   * Admin — list all payments with booking / guest details.
   */
  @Get()
  @ApiOperation({ summary: 'Admin: list all payments' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status?: string) {
    return this.mollie.getAllPayments(status);
  }
}
