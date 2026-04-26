import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ResendWebhookController } from './resend-webhook.controller';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [EmailTemplatesModule, PrismaModule],
  controllers: [ResendWebhookController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
