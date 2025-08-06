// src/db/migrations/010_add_device_tracking.ts
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add device info to refresh token table
  await db.schema
    .alterTable('refresh_token')
    .addColumn('device_name', 'varchar')
    .addColumn('device_type', 'varchar')
    .addColumn('browser', 'varchar')
    .addColumn('ip_address', 'varchar')
    .addColumn('last_used', 'timestamp')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('refresh_token')
    .dropColumn('device_name')
    .dropColumn('device_type')
    .dropColumn('browser')
    .dropColumn('ip_address')
    .dropColumn('last_used')
    .execute();
}