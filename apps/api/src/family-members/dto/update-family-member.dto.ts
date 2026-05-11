import { IsString, IsOptional, IsIn, IsBoolean, MaxLength } from 'class-validator';

const RELATIONS = ['mother', 'father', 'grandmother', 'grandfather', 'aunt', 'uncle', 'guardian', 'other'] as const;

export class UpdateFamilyMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(RELATIONS as unknown as string[])
  relation?: (typeof RELATIONS)[number];

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
