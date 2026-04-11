import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn, IsBoolean, Equals } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'jan@example.nl' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jan' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'de Vries' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'VeiligWachtwoord123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiPropertyOptional({ example: '+31612345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'nl', enum: ['nl', 'en'] })
  @IsOptional()
  @IsIn(['nl', 'en'])
  preferredLanguage?: string;

  @ApiProperty({ example: true, description: 'User must accept terms of service' })
  @IsBoolean()
  @Equals(true, { message: 'You must accept the terms of service' })
  termsAccepted: boolean;

  @ApiProperty({ example: true, description: 'User must accept privacy policy' })
  @IsBoolean()
  @Equals(true, { message: 'You must accept the privacy policy' })
  privacyAccepted: boolean;
}
