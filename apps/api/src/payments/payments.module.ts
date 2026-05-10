import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { StudentsModule } from '../students/students.module.js';
import { PaymentPeriodsModule } from '../payment-periods/payment-periods.module.js';

@Module({
  imports: [DbModule, AuthModule, UsersModule, StudentsModule, PaymentPeriodsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
