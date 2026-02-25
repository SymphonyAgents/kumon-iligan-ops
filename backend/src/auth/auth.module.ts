import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { SupabaseAuthGuard } from './auth.guard';

@Module({
  imports: [SupabaseModule],
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard, SupabaseModule],
})
export class AuthModule {}

// RolesGuard is provided by UsersModule (needs UsersService) — import UsersModule where needed
