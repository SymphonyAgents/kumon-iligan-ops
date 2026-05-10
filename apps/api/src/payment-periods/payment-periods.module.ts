import { Module } from '@nestjs/common';
import { PaymentPeriodsController } from './payment-periods.controller.js';
import { PaymentPeriodsService } from './payment-periods.service.js';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { StudentsModule } from '../students/students.module.js';

@Module({
  imports: [DbModule, AuthModule, UsersModule, StudentsModule],
  controllers: [PaymentPeriodsController],
  providers: [PaymentPeriodsService],
  exports: [PaymentPeriodsService],
})
export class PaymentPeriodsModule {}
