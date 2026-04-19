import { Module } from '@nestjs/common';
import { DynamicCopyController } from './dynamic-copy.controller';
import { DynamicCopyService } from './dynamic-copy.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DynamicCopyController],
  providers: [DynamicCopyService],
  exports: [DynamicCopyService],   // exported so AdminModule can inject it
})
export class DynamicCopyModule {}
