import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../db/drizzle.service';
import { payments } from '../db/schema';
@Injectable()
export class PaymentsService {
  constructor(private readonly drizzle: DrizzleService) {}
  async findAll() { return this.drizzle.db.select().from(payments); }
}
