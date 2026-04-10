import { Module } from '@nestjs/common';
import { IcalService } from './ical.service';
import { IcalController } from './ical.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IcalController],
  providers: [IcalService],
  exports: [IcalService],
})
export class IcalModule {}
