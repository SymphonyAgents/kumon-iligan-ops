import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

@Injectable()
export class DrizzleService implements OnModuleInit {
  private _db: PostgresJsDatabase<typeof schema>;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('DATABASE_URL');
    // prepare: false is REQUIRED for PgBouncer (transaction pooler)
    const client = postgres(url, { prepare: false });
    this._db = drizzle(client, { schema });
  }

  get db() {
    return this._db;
  }
}
