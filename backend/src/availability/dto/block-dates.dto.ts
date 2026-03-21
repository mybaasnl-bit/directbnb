import { IsUUID, IsDateString, IsOptional, IsString, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlockDatesDto {
  @ApiProperty()
  @IsUUID()
  roomId: string;

  @ApiProperty({ type: [String], example: ['2024-07-01', '2024-07-02'] })
  @IsArray()
  @IsDateString({}, { each: true })
  dates: string[];

  @ApiPropertyOptional({ example: 'Onderhoud' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

export class UnblockDatesDto {
  @ApiProperty()
  @IsUUID()
  roomId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsDateString({}, { each: true })
  dates: string[];
}
