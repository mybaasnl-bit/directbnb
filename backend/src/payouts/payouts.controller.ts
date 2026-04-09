import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  RawBody,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { PayoutsService } from './payouts.service';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('payouts')
@Controller('payouts')
@UseGuards(JwtAuthGuard)
export class PayoutsController {
  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly config: ConfigService,
  ) {}

  @Post('onboarding')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Connect onboarding link for the current host' })
  async createOnboardingLink(
    @CurrentUser('id') ownerId: string,
    @Body() body: { returnUrl?: string; refreshUrl?: string },
  ) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const returnUrl = body.returnUrl ?? `${frontendUrl}/nl/betalingen?onboarding=success`;
    const refreshUrl = body.refreshUrl ?? `${frontendUrl}/nl/betalingen?onboarding=refresh`;
    try {
      return await this.payoutsService.createOnboardingLink(ownerId, returnUrl, refreshUrl);
    } catch (err: any) {
      // Re-throw NestJS HTTP exceptions (BadRequestException etc.) as-is —
      // the service already logged details and composed a user-facing message.
      if (err?.status) throw err;
      // Raw Stripe SDK errors that escaped the service (type is lowercase snake_case
      // like 'invalid_request_error', 'api_error', etc.)
      if (err?.raw || err?.type) {
        throw new BadRequestException(
          `Stripe fout (${err?.type ?? 'unknown'}): ${err?.message ?? 'Koppeling mislukt.'}`,
        );
      }
      throw new InternalServerErrorException(
        err?.message ?? 'Koppeling mislukt. Probeer het opnieuw.',
      );
    }
  }

  @Get('account-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current host\'s Stripe Connect account status' })
  getAccountStatus(@CurrentUser('id') ownerId: string) {
    return this.payoutsService.getAccountStatus(ownerId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List payouts for the current host' })
  getPayouts(
    @CurrentUser('id') ownerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.payoutsService.getPayouts(ownerId, page, limit);
  }

  @Get('summary')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payout summary totals for the current host' })
  getPayoutSummary(@CurrentUser('id') ownerId: string) {
    return this.payoutsService.getPayoutSummary(ownerId);
  }

  @Public()
  @Post('webhook/connect')
  @ApiOperation({ summary: 'Stripe Connect webhook (account.updated, payout.paid/failed)' })
  handleConnectWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.payoutsService.handleConnectWebhook(
      (req as any).rawBody ?? Buffer.from(''),
      signature,
    );
  }
}
