import { IsString, IsOptional } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  familyId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsString()
  enrollmentDate: string;
}
