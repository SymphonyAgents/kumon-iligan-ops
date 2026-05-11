import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { EmailModule } from './email/email.module';
import { SmsModule } from './sms/sms.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { UploadsModule } from './uploads/uploads.module';
import { FamiliesModule } from './families/families.module';
import { FamilyMembersModule } from './family-members/family-members.module';
import { StudentsModule } from './students/students.module';
import { PaymentPeriodsModule } from './payment-periods/payment-periods.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AuthModule,
    AuditModule,
    EmailModule,
    SmsModule,
    UsersModule,
    BranchesModule,
    UploadsModule,
    FamiliesModule,
    FamilyMembersModule,
    StudentsModule,
    PaymentPeriodsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
