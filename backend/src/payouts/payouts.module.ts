import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';
import { PayoutTransferService } from './payout-transfer.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [PayoutsController],
  providers: [PayoutsService, PayoutTransferService],
  exports: [PayoutsService, PayoutTransferService],
})
export class PayoutsModule {}
