// // src/db/migrations/011_squash_migrations.ts
// export async function up(db: Kysely<any>): Promise<void> {
//   // This migration contains all schema operations in one place
//   // First drop any existing tables
//   await db.schema.dropTable('todo_tag').ifExists().execute();
//   await db.schema.dropTable('tag').ifExists().execute();
//   await db.schema.dropTable('todo').ifExists().execute();
//   await db.schema.dropTable('refresh_token').ifExists().execute();
//   await db.schema.dropTable('user').ifExists().execute();
  
//   // Then recreate all tables with their final structure
//   await db.schema
//     .createTable('user')
//     .addColumn('id', 'serial', col => col.primaryKey())
//     .addColumn('name', 'varchar', col => col.notNull())
//     .addColumn('email', 'varchar', col => col.notNull().unique())
//     .addColumn('password', 'varchar', col => col.notNull())
//     .addColumn('created_at', 'timestamp', col => col.notNull().defaultTo('now()'))
//     .addColumn('is_verified', 'boolean', col => col.notNull().defaultTo(false))
//     .addColumn('verification_token', 'varchar')
//     .addColumn('verification_expires', 'timestamp')
//     .addColumn('reset_password_token', 'varchar')
//     .addColumn('reset_password_expires', 'timestamp')
//     .execute();
  
//   // Create refresh_token table
//   await db.schema
//     .createTable('refresh_token')
//     .addColumn('id', 'serial', col => col.primaryKey())
//     .addColumn('token', 'varchar', col => col.notNull().unique())
//     .addColumn('user_id', 'integer', col => 
//       col.notNull().references('user.id').onDelete('cascade'))
//     .addColumn('expires_at', 'timestamp', col => col.notNull())
//     .addColumn('created_at', 'timestamp', col => col.notNull().defaultTo('now()'))
//     .addColumn('revoked', 'boolean', col => col.notNull().defaultTo(false))
//     .addColumn('replaced_by_token', 'varchar')
//     .addColumn('device_name', 'varchar')
//     .addColumn('device_type', 'varchar')
//     .addColumn('browser', 'varchar')
//     .addColumn('ip_address', 'varchar')
//     .addColumn('last_used', 'timestamp')
//     .execute();
  
//   // Create todo table
//   await db.schema
//     .createTable('todo')
//     .addColumn('id', 'serial', col => col.primaryKey())
//     .addColumn('title', 'varchar', col => col.notNull())
//     .addColumn('description', 'text')
//     .addColumn('completed', 'boolean', col => col.notNull().defaultTo(false))
//     .addColumn('created_at', 'timestamp', col => col.notNull().defaultTo('now()'))
//     .addColumn('due_date', 'timestamp')
//     .addColumn('completed_at', 'timestamp')
//     .addColumn('priority', sql`priority_level`)
//     .addColumn('image_urls', 'jsonb', col => col.defaultTo('[]'))
//     .addColumn('user_id', 'integer', col => 
//       col.notNull().references('user.id').onDelete('cascade'))
//     .execute();
  
//   // Create tag table with compound unique constraint
//   await db.schema
//     .createTable('tag')
//     .addColumn('id', 'serial', col => col.primaryKey())
//     .addColumn('name', 'varchar', col => col.notNull())
//     .addColumn('created_at', 'timestamp', col => col.notNull().defaultTo('now()'))
//     .addColumn('user_id', 'integer', col => 
//       col.notNull().references('user.id').onDelete('cascade'))
//     .addUniqueConstraint('tag_name_user_unique', ['name', 'user_id'])
//     .execute();
  
//   // Create junction table
//   await db.schema
//     .createTable('todo_tag')
//     .addColumn('todo_id', 'integer', col => 
//       col.notNull().references('todo.id').onDelete('cascade'))
//     .addColumn('tag_id', 'integer', col => 
//       col.notNull().references('tag.id').onDelete('cascade'))
//     .addPrimaryKeyConstraint('todo_tag_primary_key', ['todo_id', 'tag_id'])
//     .execute();
// }

// export async function down(db: Kysely<any>): Promise<void> {
//   // Drop all tables in reverse order
//   await db.schema.dropTable('todo_tag').execute();
//   await db.schema.dropTable('tag').execute();
//   await db.schema.dropTable('todo').execute();
//   await db.schema.dropTable('refresh_token').execute();
//   await db.schema.dropTable('user').execute();
// }