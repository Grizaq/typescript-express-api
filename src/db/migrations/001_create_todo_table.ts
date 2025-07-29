// src/db/migrations/001_create_todo_table.ts
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('todo')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('title', 'varchar', col => col.notNull())
    .addColumn('completed', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamp', col => col.notNull().defaultTo('now()'))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('todo').execute();
}