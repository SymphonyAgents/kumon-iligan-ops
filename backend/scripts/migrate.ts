import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');

  const sql = postgres(url, { prepare: false });
  const migrationsDir = join(__dirname, '..', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Running ${files.length} migration(s)...`);
  for (const file of files) {
    console.log(`  -> ${file}`);
    await sql.unsafe(readFileSync(join(migrationsDir, file), 'utf-8'));
  }

  console.log('Done.');
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
