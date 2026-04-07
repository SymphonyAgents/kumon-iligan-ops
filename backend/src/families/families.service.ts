import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../db/drizzle.service';
import { families } from '../db/schema';
@Injectable()
export class FamiliesService {
  constructor(private readonly drizzle: DrizzleService) {}
  async findAll() { return this.drizzle.db.select().from(families).orderBy(families.guardianName); }
}
