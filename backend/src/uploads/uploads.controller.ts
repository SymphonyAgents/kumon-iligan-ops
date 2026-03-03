import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { UploadsService } from './uploads.service';
import { PresignedUrlDto } from './dto/presigned-url.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post('presigned-url')
  createPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.uploadsService.createPresignedUrl(dto);
  }
}
