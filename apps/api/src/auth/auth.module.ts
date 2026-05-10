import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [DbModule],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
