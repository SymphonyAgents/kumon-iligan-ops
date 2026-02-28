import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');

  const sql = postgres(url, { prepare: false });

  // Create migrations tracking table if it doesn't exist
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const applied = await sql<{ name: string }[]>`SELECT name FROM _migrations`;
  const appliedSet = new Set(applied.map((r) => r.name));

  const migrationsDir = join(__dirname, '..', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pending = files.filter((f) => !appliedSet.has(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    await sql.end();
    return;
  }

  console.log(`Running ${pending.length} migration(s)...`);
  for (const file of pending) {
    console.log(`  -> ${file}`);
    await sql.unsafe(readFileSync(join(migrationsDir, file), 'utf-8'));
    await sql`INSERT INTO _migrations (name) VALUES (${file})`;
  }

  console.log('Done.');
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
