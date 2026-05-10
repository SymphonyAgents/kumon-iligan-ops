import { Module } from '@nestjs/common';
import { FamiliesController } from './families.controller.js';
import { FamiliesService } from './families.service.js';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [DbModule, AuthModule, UsersModule],
  controllers: [FamiliesController],
  providers: [FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
