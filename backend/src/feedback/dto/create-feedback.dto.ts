import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiPropertyOptional({ enum: ['BUG', 'FEATURE', 'UX', 'GENERAL'] })
  @IsOptional()
  @IsIn(['BUG', 'FEATURE', 'UX', 'GENERAL'])
  category?: 'BUG' | 'FEATURE' | 'UX' | 'GENERAL';

  @ApiProperty({ example: 'The calendar doesn\'t load on mobile' })
  @IsString()
  @MinLength(5)
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  screenshotUrl?: string;
}
