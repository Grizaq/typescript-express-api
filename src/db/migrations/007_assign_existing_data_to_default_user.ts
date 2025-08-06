// src/db/migrations/007_assign_existing_data_to_default_user.ts
import { Kysely, sql } from 'kysely';
const bcrypt = require('bcrypt');

export async function up(db: Kysely<any>): Promise<void> {
  // Create a default user for existing data
  const hashedPassword = await bcrypt.hash('change_me_immediately', 10);
  
  const defaultUser = await db
    .insertInto('user')
    .values({
      name: 'Default User',
      email: 'default@example.com',
      password: hashedPassword,
      created_at: new Date(),
      is_verified: true
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  // Assign existing todos to this user
  await db.updateTable('todo')
    .set({
      user_id: defaultUser.id
    })
    .where('user_id', 'is', null)
    .execute();

  // Assign existing tags to this user
  await db.updateTable('tag')
    .set({
      user_id: defaultUser.id
    })
    .where('user_id', 'is', null)
    .execute();

  // Make user_id non-nullable now that all data has an owner
  await db.schema
    .alterTable('todo')
    .alterColumn('user_id', col => col.setNotNull())
    .execute();

  await db.schema
    .alterTable('tag')
    .alterColumn('user_id', col => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Make user_id nullable again
  await db.schema
    .alterTable('todo')
    .alterColumn('user_id', col => col.dropNotNull())
    .execute();

  await db.schema
    .alterTable('tag')
    .alterColumn('user_id', col => col.dropNotNull())
    .execute();

  // Find the default user
  const defaultUser = await db
    .selectFrom('user')
    .select('id')
    .where('email', '=', 'default@example.com')
    .executeTakeFirst();

  if (defaultUser) {
    // Set user_id to null for all items owned by default user
    await db.updateTable('todo')
      .set({
        user_id: null
      })
      .where('user_id', '=', defaultUser.id)
      .execute();

    await db.updateTable('tag')
      .set({
        user_id: null
      })
      .where('user_id', '=', defaultUser.id)
      .execute();

    // Delete the default user
    await db.deleteFrom('user')
      .where('id', '=', defaultUser.id)
      .execute();
  }
}