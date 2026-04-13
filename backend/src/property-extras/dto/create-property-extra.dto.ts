import { IsString, IsOptional, IsNumber, IsIn, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePropertyExtraDto {
  @ApiProperty({ example: 'Fietstocht door de polder' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Begeleide fietstocht van 2 uur' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 25 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ enum: ['GUEST', 'STAY'], example: 'GUEST' })
  @IsOptional()
  @IsIn(['GUEST', 'STAY'])
  pricePer?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
