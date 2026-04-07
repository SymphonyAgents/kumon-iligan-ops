import { IsString, IsNumber, IsIn, IsOptional, Min } from 'class-validator';
import { PAYMENT_METHOD } from '../../db/constants.js';

const VALID_METHODS = Object.values(PAYMENT_METHOD);

export class CreatePaymentDto {
  @IsString()
  studentId: string;

  @IsString()
  periodId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsIn(VALID_METHODS)
  paymentMethod: string;

  @IsString()
  referenceNumber: string;

  @IsString()
  receiptImageUrl: string;

  @IsString()
  paymentDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}
