import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  IsEmail,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({ description: 'Room ID to book' })
  @IsUUID()
  roomId: string;

  @ApiProperty({ example: '2024-06-01' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2024-06-05' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  numGuests: number;

  @ApiPropertyOptional({ example: 'We look forward to our stay!' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  guestMessage?: string;

  // Guest details (auto-create guest profile if not existing)
  @ApiProperty({ example: 'Maria' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  guestFirstName: string;

  @ApiProperty({ example: 'Jansen' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  guestLastName: string;

  @ApiProperty({ example: 'maria@example.nl' })
  @IsEmail()
  guestEmail: string;

  @ApiPropertyOptional({ example: '+31612345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  guestPhone?: string;
}
