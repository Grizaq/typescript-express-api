// src/db/migrations/008_update_tag_uniqueness_constraint.ts
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // First, drop the existing unique constraint on the tag name
  await db.schema
    .alterTable('tag')
    .dropConstraint('tag_name_key')
    .execute();

  // Then, add a new unique constraint that includes user_id
  await db.schema
    .alterTable('tag')
    .addUniqueConstraint('tag_name_user_unique', ['name', 'user_id'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the composite unique constraint
  await db.schema
    .alterTable('tag')
    .dropConstraint('tag_name_user_unique')
    .execute();

  // Restore the original constraint on name only
  await db.schema
    .alterTable('tag')
    .addUniqueConstraint('tag_name_key', ['name'])
    .execute();
}