import { Module } from '@nestjs/common';
import { EmailLogsService } from './email-logs.service';
import { EmailLogsController } from './email-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmailLogsController],
  providers: [EmailLogsService],
})
export class EmailLogsModule {}
