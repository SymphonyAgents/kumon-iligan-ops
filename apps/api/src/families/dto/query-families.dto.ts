import { IsString, IsOptional } from 'class-validator';

export class QueryFamiliesDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
