import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';

async function runMigrations() {
  // Use direct (non-pooled) URL for migrations — PgBouncer transaction mode
  // doesn't support the advisory locks Drizzle uses for safe concurrent migration.
  // Set DATABASE_URL_DIRECT in prod env (Supabase provides a direct connection string).
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL_DIRECT or DATABASE_URL must be set');
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  const migrationsFolder = path.resolve(__dirname, '../../migrations');
  console.log(`Running migrations from: ${migrationsFolder}`);

  await migrate(db, { migrationsFolder });
  console.log('Migrations complete.');

  await client.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
