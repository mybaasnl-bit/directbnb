import { IsString, IsOptional, MaxLength, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Canal House Amsterdam' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionNl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 'Prinsengracht 123' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressStreet?: string;

  @ApiPropertyOptional({ example: 'Amsterdam' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressCity?: string;

  @ApiPropertyOptional({ example: '1015 DX' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  addressZip?: string;

  @ApiPropertyOptional({ example: 'NL' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  addressCountry?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPublished?: boolean;

  // Amenities
  @ApiPropertyOptional({ example: ['wifi', 'parking', 'breakfast'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  // Policies
  @ApiPropertyOptional({ example: '15:00' })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '11:00' })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  smokingAllowed?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  petsAllowed?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  childrenAllowed?: boolean;
}
