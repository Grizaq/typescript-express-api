// src/test/integration/test-db.test.ts
import { Kysely } from 'kysely';
import { Database } from '../../db/schema';
import { createTestDb, tearDownTestDb } from '../setup/test-db';

describe('Database Connection Tests', () => {
  let db: Kysely<Database>;

  beforeAll(async () => {
    // Set up the test database
    db = await createTestDb();
  });

  afterAll(async () => {
    // Clean up the database
    await tearDownTestDb(db);
  });

  it('should connect to the database successfully', async () => {
    // Simple query to test connection
    const result = await db.selectFrom('user')
      .select(db.fn.count<number>('id').as('count'))
      .executeTakeFirstOrThrow();
    
    // Type the result
    const count = (result as any).count;
    
    // In PostgreSQL, count() returns string, so we'll check it's convertible to a number
    expect(Number(count)).not.toBeNaN();
  });

  it('should be able to insert and query data', async () => {
    // Insert a test user
    const testUser = {
      name: 'DB Test User',
      email: 'dbtest@example.com',
      password: 'testpassword',
      is_verified: true,
      created_at: new Date()
    };

    const insertResult = await db.insertInto('user')
      .values(testUser)
      .returning(['id', 'email'])
      .executeTakeFirstOrThrow();

    // Query the inserted user
    const user = await db.selectFrom('user')
      .selectAll()
      .where('id', '=', insertResult.id)
      .executeTakeFirstOrThrow();

    expect(user.email).toBe(testUser.email);
    expect(user.name).toBe(testUser.name);

    // Clean up
    await db.deleteFrom('user')
      .where('id', '=', insertResult.id)
      .execute();
  });
});