import { Module } from '@nestjs/common';
import { FamilyMembersController } from './family-members.controller.js';
import { FamilyMembersService } from './family-members.service.js';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [DbModule, AuthModule, AuditModule, UsersModule],
  controllers: [FamilyMembersController],
  providers: [FamilyMembersService],
})
export class FamilyMembersModule {}
