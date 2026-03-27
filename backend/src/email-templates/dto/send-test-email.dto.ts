import { IsEmail, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendTestEmailDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'nl', enum: ['nl', 'en'] })
  @IsIn(['nl', 'en'])
  language: 'nl' | 'en';
}
