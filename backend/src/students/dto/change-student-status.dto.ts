import { IsString, IsOptional, IsIn } from 'class-validator';
import { STUDENT_STATUS } from '../../db/constants.js';

const statusValues = Object.values(STUDENT_STATUS);

export class ChangeStudentStatusDto {
  @IsString()
  @IsIn(statusValues)
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
