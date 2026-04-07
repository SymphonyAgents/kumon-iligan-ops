import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { EmailModule } from './email/email.module';
import { SmsModule } from './sms/sms.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { PromosModule } from './promos/promos.module';
import { ExpensesModule } from './expenses/expenses.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CustomersModule } from './customers/customers.module';
import { BranchesModule } from './branches/branches.module';
import { UploadsModule } from './uploads/uploads.module';
import { DepositsModule } from './deposits/deposits.module';
import { ReportsModule } from './reports/reports.module';
import { CardBanksModule } from './card-banks/card-banks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AuthModule,
    AuditModule,
    EmailModule,
    SmsModule,
    UsersModule,
    ServicesModule,
    PromosModule,
    ExpensesModule,
    TransactionsModule,
    CustomersModule,
    BranchesModule,
    UploadsModule,
    DepositsModule,
    ReportsModule,
    CardBanksModule,
  ],
})
export class AppModule {}
