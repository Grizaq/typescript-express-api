// src/db/migrations/006_create_user_table.ts
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create user table
  await db.schema
    .createTable('user')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar', col => col.notNull())
    .addColumn('email', 'varchar', col => col.notNull().unique())
    .addColumn('password', 'varchar', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull().defaultTo('now()'))
    .addColumn('is_verified', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('verification_token', 'varchar')
    .addColumn('verification_expires', 'timestamp')
    .addColumn('reset_password_token', 'varchar')
    .addColumn('reset_password_expires', 'timestamp')
    .execute();

  // Add user_id to todo table
  await db.schema
    .alterTable('todo')
    .addColumn('user_id', 'integer', col => 
      col.references('user.id').onDelete('cascade'))
    .execute();

  // Add user_id to tag table
  await db.schema
    .alterTable('tag')
    .addColumn('user_id', 'integer', col => 
      col.references('user.id').onDelete('cascade'))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove user_id from todo table
  await db.schema
    .alterTable('todo')
    .dropColumn('user_id')
    .execute();

  // Remove user_id from tag table
  await db.schema
    .alterTable('tag')
    .dropColumn('user_id')
    .execute();

  // Drop user table
  await db.schema
    .dropTable('user')
    .execute();
}