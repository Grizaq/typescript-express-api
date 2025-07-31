// src/db/migrations/003_create_tag_tables.ts
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create the tag table
  await db.schema
    .createTable('tag')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar', col => col.notNull().unique())
    .addColumn('created_at', 'timestamp', col => col.notNull().defaultTo('now()'))
    .execute();

  // Create the junction table
  await db.schema
    .createTable('todo_tag')
    .addColumn('todo_id', 'integer', col => 
      col.notNull().references('todo.id').onDelete('cascade'))
    .addColumn('tag_id', 'integer', col => 
      col.notNull().references('tag.id').onDelete('cascade'))
    .addPrimaryKeyConstraint('todo_tag_primary_key', ['todo_id', 'tag_id'])
    .execute();

  // Migration of existing tags will be handled by application code
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order
  await db.schema.dropTable('todo_tag').execute();
  await db.schema.dropTable('tag').execute();
}