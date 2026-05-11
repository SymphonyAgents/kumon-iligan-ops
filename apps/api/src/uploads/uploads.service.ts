import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { DrizzleService } from '../db/drizzle.service';
import { PresignedUrlDto } from './dto/presigned-url.dto';

@Injectable()
export class UploadsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly db: DrizzleService,
    private readonly config: ConfigService,
  ) {}

  async getReceiptBranchId(_paymentId: string): Promise<string | null> {
    // TODO: implement when payments module is ready
    return null;
  }

  async createPresignedUrl(dto: PresignedUrlDto) {
    const bucket = this.config.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');
    const ext = dto.extension.toLowerCase().replace(/^\./, '');

    const path = `receipts/${dto.txnId}/${dto.type}/${Date.now()}.${ext}`;

    const { data, error } = await this.supabase.db.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to generate upload URL');
    }

    // Construct the public URL explicitly — getPublicUrl() can produce malformed
    // URLs depending on the storage-js version. This format is guaranteed correct.
    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL').replace(/\/$/, '');
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

    return {
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl,
    };
  }

  async createReceiptPresignedUrl(fileName: string, fileType: string) {
    const bucket = this.config.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');
    const safeName = (fileName || 'receipt')
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '_')
      .slice(0, 80);
    const inferredExt = safeName.includes('.') ? safeName.split('.').pop() : 'png';
    const extFromType = fileType?.split('/')?.[1];
    const ext = (extFromType || inferredExt || 'png').toLowerCase();
    const stamp = Date.now();
    const path = `kumon-receipts/${stamp}-${safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`}`;

    const { data, error } = await this.supabase.db.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to generate upload URL');
    }

    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL').replace(/\/$/, '');
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

    return { uploadUrl: data.signedUrl, fileUrl: publicUrl };
  }

  async createExpensePresignedUrl(extension: string) {
    const bucket = this.config.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');
    const ext = extension.toLowerCase().replace(/^\./, '');
    const path = `expense-receipts/${Date.now()}.${ext}`;

    const { data, error } = await this.supabase.db.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to generate upload URL');
    }

    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL').replace(/\/$/, '');
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

    return { signedUrl: data.signedUrl, token: data.token, path, publicUrl };
  }
}
