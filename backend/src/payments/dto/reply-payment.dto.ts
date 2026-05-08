import { IsString, MinLength, MaxLength } from 'class-validator';

export class ReplyPaymentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reply!: string;
}
