import { IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateBookingDto } from './create-booking.dto';

export class CreateCheckoutBookingDto extends CreateBookingDto {
  @ApiProperty({ description: 'Stripe redirect URL on successful payment', example: 'https://example.nl/nl/boeking-succes?session_id={CHECKOUT_SESSION_ID}' })
  @IsString()
  @MaxLength(500)
  successUrl: string;

  @ApiProperty({ description: 'Stripe redirect URL when guest cancels payment', example: 'https://example.nl/nl/bnb/mijn-bb' })
  @IsString()
  @MaxLength(500)
  cancelUrl: string;
}
