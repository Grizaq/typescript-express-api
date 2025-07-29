// src/db/migrate.ts
import { db } from '../db/index';
import { migrateToLatest } from './migrator';

async function main() {
  try {
    await migrateToLatest(db);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();