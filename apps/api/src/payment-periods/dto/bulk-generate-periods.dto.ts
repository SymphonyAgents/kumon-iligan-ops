import { IsInt, Min, Max, IsNumber, IsOptional, IsString } from 'class-validator';

export class BulkGeneratePeriodsDto {
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth: number;

  @IsInt()
  @Min(2024)
  @Max(2030)
  periodYear: number;

  @IsNumber()
  @Min(0)
  expectedAmount: number;

  @IsString()
  dueDate: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
