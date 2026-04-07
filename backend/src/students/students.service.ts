import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../db/drizzle.service';
import { students } from '../db/schema';
@Injectable()
export class StudentsService {
  constructor(private readonly drizzle: DrizzleService) {}
  async findAll() { return this.drizzle.db.select().from(students); }
}
