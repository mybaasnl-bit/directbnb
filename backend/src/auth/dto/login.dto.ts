import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'jan@example.nl' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'VeiligWachtwoord123!' })
  @IsString()
  @MinLength(1)
  password: string;
}
