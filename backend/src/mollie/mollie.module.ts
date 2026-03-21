import { Module } from '@nestjs/common';
import { MollieService } from './mollie.service';
import { MollieController } from './mollie.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MollieController, AdminPaymentsController],
  providers: [MollieService],
  exports: [MollieService],
})
export class MollieModule {}
