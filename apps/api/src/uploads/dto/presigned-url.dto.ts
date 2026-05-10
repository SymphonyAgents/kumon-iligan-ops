import { IsOptional, IsString, IsIn, Matches } from 'class-validator';

export class PresignedUrlDto {
  @IsString()
  txnId: string;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsString()
  @IsIn(['before', 'after'])
  type: 'before' | 'after';

  @IsString()
  @Matches(/^\.?(jpg|jpeg|png|webp|heic)$/i, { message: 'Only image files allowed (jpg, jpeg, png, webp, heic)' })
  extension: string;
}
