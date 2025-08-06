// src/db/migrations/009_add_refresh_tokens.ts
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create refresh token table
  await db.schema
    .createTable('refresh_token')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('token', 'varchar', col => col.notNull().unique())
    .addColumn('user_id', 'integer', col => 
      col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('expires_at', 'timestamp', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull().defaultTo('now()'))
    .addColumn('revoked', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('replaced_by_token', 'varchar')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable('refresh_token')
    .execute();
}