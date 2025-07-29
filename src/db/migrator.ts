// src/db/migrator.ts
import { promises as fs } from 'fs';
import path from 'path';
import { Kysely, Migrator, FileMigrationProvider } from 'kysely';

export async function migrateToLatest(db: Kysely<any>) {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  if (results?.length) {
    console.log('Migrations completed:');
    results.forEach((it) => {
      console.log(`${it.migrationName}: ${it.status}`);
    });
  } else {
    console.log('No migrations run, database schema is up to date.');
  }
}