import { IsString } from 'class-validator';

export class FlagPaymentDto {
  @IsString()
  note: string;
}
