import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BetaSignupsService } from './beta-signups.service';
import { BetaSignupsController } from './beta-signups.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [BetaSignupsController],
  providers: [BetaSignupsService],
})
export class BetaSignupsModule {}
