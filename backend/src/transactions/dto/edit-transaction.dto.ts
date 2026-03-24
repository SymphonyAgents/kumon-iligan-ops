import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EditItemDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  shoeDescription?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  serviceId?: number;
}

export class EditPaymentDto {
  @IsInt()
  id: number;

  @IsIn(['cash', 'gcash', 'card'])
  method: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  cardBank?: string;
}

export class EditTransactionDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditItemDto)
  items?: EditItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditPaymentDto)
  payments?: EditPaymentDto[];
}
