import { IsIn } from 'class-validator';

export class CreateCheckoutDto {
  @IsIn(['basic', 'professional'])
  plan: 'basic' | 'professional';
}
