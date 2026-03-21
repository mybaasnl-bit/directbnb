import { IsEmail, IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateBetaSignupDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  bnbName: string;

  @IsString()
  @MinLength(2)
  location: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsIn(['nl', 'en'])
  language?: 'nl' | 'en';
}
