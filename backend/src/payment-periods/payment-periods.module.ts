import { Module } from '@nestjs/common';
import { PaymentPeriodsController } from './payment-periods.controller';
import { PaymentPeriodsService } from './payment-periods.service';
import { DbModule } from '../db/db.module';
@Module({ imports: [DbModule], controllers: [PaymentPeriodsController], providers: [PaymentPeriodsService], exports: [PaymentPeriodsService] })
export class PaymentPeriodsModule {}
