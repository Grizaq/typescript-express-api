// src/test/integration/todos.test.ts
import { Kysely } from 'kysely';
import { Database } from '../../db/schema';
import { createTestDb, tearDownTestDb } from '../setup/test-db';
import { createTestApp } from '../setup/test-app';
import { loadFixtures, clearFixtures } from '../fixtures';
import { RequestTestHelper } from '../helpers/request-helper';
import { AuthTestHelper } from '../helpers/auth-helper';
import { Express } from 'express';

describe('Todo API', () => {
  let db: Kysely<Database>;
  let requestHelper: RequestTestHelper;
  let authHelper: AuthTestHelper;
  let app: Express;
  let testUserToken: string;
  let adminUserToken: string;
  
  beforeAll(async () => {
    // Set up the test database
    db = await createTestDb();
    
    // Create the test app
    const testApp = createTestApp(db);
    app = testApp.app;
    
    // Create helpers
    requestHelper = new RequestTestHelper(app);
    authHelper = new AuthTestHelper(
      testApp.repositories.userRepository,
      testApp.services.authService
    );
    
    // Load test data
    await loadFixtures(db);
    
    // Generate tokens for test users
    testUserToken = await authHelper.generateTokenForUser('test@example.com');
    adminUserToken = await authHelper.generateTokenForUser('admin@example.com');
  });
  
  afterAll(async () => {
    // Clean up the database
    await clearFixtures(db);
    await tearDownTestDb(db);
  });
  
  describe('GET /api/todos', () => {
    it('should return todos for the authenticated user', async () => {
      try {
        const response = await requestHelper.get('/api/todos', testUserToken);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        
        // Should only return todos for the test user
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((todo: any) => {
          expect(todo.title).toMatch(/Test Todo/);
        });
      } catch (error) {
        console.error('Get todos test failed:', error);
        throw error;
      }
    });
    
    it('should return 401 when not authenticated', async () => {
      try {
        const response = await requestHelper.get('/api/todos');
        
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
      } catch (error) {
        console.error('Unauthenticated test failed:', error);
        throw error;
      }
    });
  });
  
  describe('POST /api/todos', () => {
    it('should create a new todo for the authenticated user', async () => {
      try {
        const newTodo = {
          title: 'New Test Todo',
          description: 'Created in test',
          priority: 'medium',
          tags: ['work', 'test-tag']
        };
        
        const response = await requestHelper.post('/api/todos', newTodo, testUserToken);
        
        expect(response.status).toBe(201);
        expect(response.body.title).toBe(newTodo.title);
        expect(response.body.description).toBe(newTodo.description);
        
        // Verify the todo was saved to the database
        const savedTodo = await db
          .selectFrom('todo')
          .selectAll()
          .where('title', '=', newTodo.title)
          .executeTakeFirst();
          
        expect(savedTodo).toBeDefined();
        expect(savedTodo?.description).toBe(newTodo.description);
        
        // Check if tags were created
        if (newTodo.tags && newTodo.tags.length > 0) {
          // Get user ID
          const user = await db
            .selectFrom('user')
            .select('id')
            .where('email', '=', 'test@example.com')
            .executeTakeFirst();
            
          // Find tags
          const tags = await db
            .selectFrom('tag')
            .selectAll()
            .where('name', '=', 'test-tag')
            .where('user_id', '=', user!.id)
            .execute();
            
          expect(tags.length).toBeGreaterThan(0);
        }
      } catch (error) {
        console.error('Create todo test failed:', error);
        throw error;
      }
    });
    
    it('should return 400 for invalid data', async () => {
      try {
        const invalidTodo = {
          // Missing title
          description: 'Invalid todo'
        };
        
        const response = await requestHelper.post('/api/todos', invalidTodo, testUserToken);
        
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
      } catch (error) {
        console.error('Invalid todo test failed:', error);
        throw error;
      }
    });
  });
  
  describe('PUT /api/todos/:id/toggle', () => {
    it('should toggle a todo between complete and incomplete', async () => {
      try {
        // Create a new todo for this test
        const newTodo = {
          title: 'Toggle Test Todo',
          description: 'Testing toggle functionality',
          priority: 'medium'
        };
        
        // Create the todo
        const createResponse = await requestHelper.post('/api/todos', newTodo, testUserToken);
        const todo = createResponse.body;
        console.log('Created todo for toggle test:', JSON.stringify(todo));
        
        // Initially the todo should be incomplete
        expect(todo.completed).toBe(false);
        
        // Toggle to complete
        console.log(`Toggling todo ${todo.id} to complete`);
        const toggleResponse1 = await requestHelper.put(`/api/todos/${todo.id}/toggle`, {}, testUserToken);
        console.log('Toggle response 1:', JSON.stringify(toggleResponse1.body));
        
        // Get the updated todo
        const getResponse1 = await requestHelper.get(`/api/todos/${todo.id}`, testUserToken);
        console.log('Todo after first toggle:', JSON.stringify(getResponse1.body));
        
        // Should now be complete
        expect(getResponse1.body.completed).toBe(true);
        expect(getResponse1.body.completedAt).toBeDefined();
        
        // Toggle back to incomplete
        console.log(`Toggling todo ${todo.id} to incomplete`);
        const toggleResponse2 = await requestHelper.put(`/api/todos/${todo.id}/toggle`, {}, testUserToken);
        console.log('Toggle response 2:', JSON.stringify(toggleResponse2.body));
        
        // Get the updated todo again
        const getResponse2 = await requestHelper.get(`/api/todos/${todo.id}`, testUserToken);
        console.log('Todo after second toggle:', JSON.stringify(getResponse2.body));
        
        // Should now be incomplete again
        expect(getResponse2.body.completed).toBe(false);
        // Check that completedAt is either null or undefined
        expect(getResponse2.body.completedAt == null).toBe(true);
      } catch (error) {
        console.error('Toggle todo test failed:', error);
        throw error;
      }
    });

    it('should return 404 for non-existent todo', async () => {
      try {
        const response = await requestHelper.put('/api/todos/9999/toggle', {}, testUserToken);
        
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
      } catch (error) {
        console.error('Non-existent todo test failed:', error);
        throw error;
      }
    });
    
    it('should not allow toggling another user\'s todo', async () => {
      try {
        // Get an admin todo
        const adminTodos = await requestHelper.get('/api/todos', adminUserToken);
        const adminTodoId = adminTodos.body[0].id;
        
        // Try to toggle it as the test user
        const response = await requestHelper.put(`/api/todos/${adminTodoId}/toggle`, {}, testUserToken);
        
        expect(response.status).toBe(404); // Should return 404 as if the todo doesn't exist
      } catch (error) {
        console.error('Toggle other user\'s todo test failed:', error);
        throw error;
      }
    });
  });
  
  describe('GET /api/tags', () => {
    it('should return tags for the authenticated user', async () => {
      try {
        const response = await requestHelper.get('/api/tags', testUserToken);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        
        // Should only return tags for the test user
        response.body.forEach((tag: any) => {
          expect(['work', 'personal', 'test-tag']).toContain(tag.name);
        });
      } catch (error) {
        console.error('Get tags test failed:', error);
        throw error;
      }
    });
  });
});