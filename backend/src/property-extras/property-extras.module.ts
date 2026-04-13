import { Module } from '@nestjs/common';
import { PropertyExtrasController } from './property-extras.controller';
import { PropertyExtrasService } from './property-extras.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PropertyExtrasController],
  providers: [PropertyExtrasService],
  exports: [PropertyExtrasService],
})
export class PropertyExtrasModule {}
