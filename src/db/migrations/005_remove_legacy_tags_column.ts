// src/db/migrations/005_remove_legacy_tags_column.ts
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('todo')
    .dropColumn('tags')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('todo')
    .addColumn('tags', 'jsonb', col => col.defaultTo('[]'))
    .execute();
}