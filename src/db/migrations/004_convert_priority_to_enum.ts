// src/db/migrations/004_convert_priority_to_enum.ts
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create priority enum type
  await db.schema
    .createType('priority_level')
    .asEnum(['low', 'medium', 'high', 'urgent', 'critical'])
    .execute();

  // Add a temporary column with the new type
  await db.schema
    .alterTable('todo')
    .addColumn('priority_enum', sql`priority_level`)
    .execute();

  // Use updateTable instead of raw SQL
  await db.updateTable('todo')
    .set({
      priority_enum: sql`(CASE 
        WHEN priority = 1 THEN 'low'::priority_level
        WHEN priority = 2 THEN 'medium'::priority_level
        WHEN priority = 3 THEN 'medium'::priority_level
        WHEN priority = 4 THEN 'high'::priority_level
        WHEN priority = 5 THEN 'urgent'::priority_level
        ELSE 'medium'::priority_level
      END)`
    })
    .execute();

  // Drop the old column and rename the new one
  await db.schema
    .alterTable('todo')
    .dropColumn('priority')
    .execute();

  await db.schema
    .alterTable('todo')
    .renameColumn('priority_enum', 'priority')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Add a temporary integer column
  await db.schema
    .alterTable('todo')
    .addColumn('priority_int', 'integer', col => col.defaultTo(3))
    .execute();

  // Convert enum values back to integers - use updateTable
  await db.updateTable('todo')
    .set({
      priority_int: sql`(CASE 
        WHEN priority = 'low' THEN 1
        WHEN priority = 'medium' THEN 3
        WHEN priority = 'high' THEN 4
        WHEN priority = 'urgent' THEN 5
        WHEN priority = 'critical' THEN 5
        ELSE 3
      END)`
    })
    .execute();

  // Drop the enum column and rename the integer column
  await db.schema
    .alterTable('todo')
    .dropColumn('priority')
    .execute();

  await db.schema
    .alterTable('todo')
    .renameColumn('priority_int', 'priority')
    .execute();

  // Drop the enum type
  await db.schema
    .dropType('priority_level')
    .execute();
}