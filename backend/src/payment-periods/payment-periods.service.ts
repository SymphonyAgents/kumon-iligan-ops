import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../db/drizzle.service';
import { paymentPeriods } from '../db/schema';
@Injectable()
export class PaymentPeriodsService {
  constructor(private readonly drizzle: DrizzleService) {}
  async findAll() { return this.drizzle.db.select().from(paymentPeriods); }
}
