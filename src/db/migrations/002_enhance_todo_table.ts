// src/db/migrations/002_enhance_todo_table.ts
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add new columns to the todo table
  await db.schema
    .alterTable('todo')
    .addColumn('description', 'text')
    .addColumn('due_date', 'timestamp')
    .addColumn('completed_at', 'timestamp')
    .addColumn('priority', 'integer', col => col.defaultTo(3))
    .addColumn('image_urls', 'jsonb', col => col.defaultTo('[]'))
    .addColumn('tags', 'jsonb', col => col.defaultTo('[]'))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove added columns if migration is reversed
  await db.schema
    .alterTable('todo')
    .dropColumn('description')
    .dropColumn('due_date')
    .dropColumn('completed_at')
    .dropColumn('priority')
    .dropColumn('image_urls')
    .dropColumn('tags')
    .execute();
}