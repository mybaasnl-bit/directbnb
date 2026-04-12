import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Public } from '../auth/guards/jwt-auth.guard';

@Controller('contact')
export class ContactController {
  constructor(private readonly service: ContactService) {}

  /**
   * POST /api/v1/contact
   * Public — submit a contact form message.
   * Rate-limited to 5 requests per minute to prevent abuse.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async submit(@Body() dto: CreateContactDto): Promise<void> {
    await this.service.submit(dto);
  }
}
