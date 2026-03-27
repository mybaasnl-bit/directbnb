import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertHostTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subjectNl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subjectEn: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  htmlNl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  htmlEn: string;
}
