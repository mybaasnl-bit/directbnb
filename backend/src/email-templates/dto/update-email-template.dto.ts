import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateEmailTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  subjectNl?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  subjectEn?: string;

  @IsOptional()
  @IsString()
  htmlNl?: string;

  @IsOptional()
  @IsString()
  htmlEn?: string;
}
