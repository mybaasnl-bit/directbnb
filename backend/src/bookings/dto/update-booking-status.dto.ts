import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: ['confirmed', 'rejected', 'cancelled', 'completed'] })
  @IsIn(['confirmed', 'rejected', 'cancelled', 'completed'])
  status: 'confirmed' | 'rejected' | 'cancelled' | 'completed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ownerNotes?: string;
}
