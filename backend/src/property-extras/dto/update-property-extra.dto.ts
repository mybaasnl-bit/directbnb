import { PartialType } from '@nestjs/swagger';
import { CreatePropertyExtraDto } from './create-property-extra.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePropertyExtraDto extends PartialType(CreatePropertyExtraDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
