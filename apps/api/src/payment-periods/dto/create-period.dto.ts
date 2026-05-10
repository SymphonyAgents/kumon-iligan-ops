import { IsString, IsInt, Min, Max, IsNumber } from 'class-validator';

export class CreatePeriodDto {
  @IsString()
  studentId: string;

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
}
