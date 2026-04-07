import { IsOptional, IsNumber, Min, IsString } from 'class-validator';

export class UpdatePeriodDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedAmount?: number;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
