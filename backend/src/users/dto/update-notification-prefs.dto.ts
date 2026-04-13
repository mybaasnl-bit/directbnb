import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationPrefsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNewBooking?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailBookingCancelled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailBookingReminder?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailPaymentReceived?: boolean;
}
