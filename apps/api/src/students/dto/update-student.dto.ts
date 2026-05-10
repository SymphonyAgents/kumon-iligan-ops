import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  enrollmentDate?: string;
}
