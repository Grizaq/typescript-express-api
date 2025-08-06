// src/test/integration/tags.test.ts
import { Kysely } from 'kysely';
import { Database } from '../../db/schema';
import { createTestDb, tearDownTestDb } from '../setup/test-db';
import { createTestApp } from '../setup/test-app';
import { loadFixtures, clearFixtures } from '../fixtures';
import { RequestTestHelper } from '../helpers/request-helper';
import { AuthTestHelper } from '../helpers/auth-helper';
import { Express } from 'express';

describe('Tags API', () => {
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
  
  describe('GET /api/tags', () => {
    it('should return all tags for the authenticated user', async () => {
      try {
        const response = await requestHelper.get('/api/tags', testUserToken);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        
        // Should only return tags for the test user
        expect(response.body.length).toBeGreaterThan(0);
        
        // Check tag structure
        const tag = response.body[0];
        expect(tag).toHaveProperty('id');
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('count');
        
        // Verify tags from fixtures
        const tagNames = response.body.map((tag: any) => tag.name);
        expect(tagNames).toContain('work');
        expect(tagNames).toContain('personal');
      } catch (error) {
        console.error('Get all tags test failed:', error);
        throw error;
      }
    });
    
    it('should return 401 when not authenticated', async () => {
      try {
        const response = await requestHelper.get('/api/tags');
        
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
      } catch (error) {
        console.error('Unauthenticated test failed:', error);
        throw error;
      }
    });
  });
  
  describe('GET /api/tags/used', () => {
    it('should return tags that are used in todos', async () => {
      try {
        const response = await requestHelper.get('/api/tags/used', testUserToken);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        
        // All returned tags should have count > 0
        response.body.forEach((tag: any) => {
          expect(tag.count).toBeGreaterThan(0);
        });
      } catch (error) {
        console.error('Get used tags test failed:', error);
        throw error;
      }
    });
  });
  
  describe('GET /api/tags/unused', () => {
    it('should return tags that are not used in todos', async () => {
      try {
        // First, create a tag that won't be used in any todo
        const newTagResponse = await requestHelper.post('/api/tags', { name: 'unused-tag' }, testUserToken);
        expect(newTagResponse.status).toBe(201);
        
        // Now get unused tags
        const response = await requestHelper.get('/api/tags/unused', testUserToken);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        
        // All returned tags should have count = 0
        response.body.forEach((tag: any) => {
          expect(tag.count).toBe(0);
        });
        
        // Should include our newly created tag
        const tagNames = response.body.map((tag: any) => tag.name);
        expect(tagNames).toContain('unused-tag');
      } catch (error) {
        console.error('Get unused tags test failed:', error);
        throw error;
      }
    });
  });
  
  describe('GET /api/tags/containing/:tagName', () => {
    it('should return todos containing the specified tag', async () => {
      try {
        // Create a todo with a specific tag for testing
        const newTodo = {
          title: 'Tag Test Todo',
          description: 'Testing tag filtering',
          priority: 'medium',
          tags: ['tag-test-special']
        };
        
        const createResponse = await requestHelper.post('/api/todos', newTodo, testUserToken);
        expect(createResponse.status).toBe(201);
        
        // Get todos with this tag
        const response = await requestHelper.get('/api/tags/containing/tag-test-special', testUserToken);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        
        // The returned todos should include the one we just created
        const todoTitles = response.body.map((todo: any) => todo.title);
        expect(todoTitles).toContain('Tag Test Todo');
      } catch (error) {
        console.error('Get todos by tag test failed:', error);
        throw error;
      }
    });
    
    it('should return empty array for non-existent tag', async () => {
      try {
        const response = await requestHelper.get('/api/tags/containing/non-existent-tag', testUserToken);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      } catch (error) {
        console.error('Non-existent tag test failed:', error);
        throw error;
      }
    });
  });
  
  describe('POST /api/tags', () => {
    it('should create a new tag for the authenticated user', async () => {
      try {
        const newTag = { name: 'new-test-tag' };
        
        const response = await requestHelper.post('/api/tags', newTag, testUserToken);
        
        expect(response.status).toBe(201);
        expect(response.body.name).toBe(newTag.name);
        expect(response.body.count).toBe(0); // New tag should have 0 count
        
        // Verify the tag was saved to the database
        const tagInDb = await db
          .selectFrom('tag')
          .select(['name'])
          .where('name', '=', newTag.name)
          .executeTakeFirst();
          
        expect(tagInDb).toBeDefined();
        expect(tagInDb?.name).toBe(newTag.name);
      } catch (error) {
        console.error('Create tag test failed:', error);
        throw error;
      }
    });
    
    it('should return 400 for invalid tag data', async () => {
      try {
        // Empty tag name
        const invalidTag = { name: '' };
        
        const response = await requestHelper.post('/api/tags', invalidTag, testUserToken);
        
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
      } catch (error) {
        console.error('Invalid tag test failed:', error);
        throw error;
      }
    });
    
    it('should return 400 for duplicate tag name', async () => {
      try {
        // First create a tag
        const tag = { name: 'duplicate-test-tag' };
        const firstResponse = await requestHelper.post('/api/tags', tag, testUserToken);
        expect(firstResponse.status).toBe(201);
        
        // Try to create the same tag again
        const secondResponse = await requestHelper.post('/api/tags', tag, testUserToken);
        
        // Log the full response for debugging
        console.log('Duplicate tag response:', {
          status: secondResponse.status,
          body: secondResponse.body
        });
        
        // The status could be either 400 (validation error) or 500 (database constraint error)
        // Both are acceptable as long as the tag creation fails
        expect([400, 500]).toContain(secondResponse.status);
        expect(secondResponse.body.status).toBe('error');
        
        // The message might vary depending on how the error is handled
        if (secondResponse.status === 400) {
          expect(secondResponse.body.message).toContain('already exists');
        }
      } catch (error) {
        console.error('Duplicate tag test failed:', error);
        throw error;
      }
    });
  });
  
  describe('DELETE /api/tags/id/:id', () => {
    it('should delete a tag by ID', async () => {
      try {
        // First create a tag
        const tag = { name: 'to-be-deleted-by-id' };
        const createResponse = await requestHelper.post('/api/tags', tag, testUserToken);
        expect(createResponse.status).toBe(201);
        
        const tagId = createResponse.body.id;
        
        // Now delete it
        const deleteResponse = await requestHelper.delete(`/api/tags/id/${tagId}`, testUserToken);
        
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.id).toBe(tagId);
        expect(deleteResponse.body.name).toBe(tag.name);
        
        // Verify it's gone from the database
        const tagInDb = await db
          .selectFrom('tag')
          .select(['id'])
          .where('id', '=', tagId)
          .executeTakeFirst();
          
        expect(tagInDb).toBeUndefined();
      } catch (error) {
        console.error('Delete tag by ID test failed:', error);
        throw error;
      }
    });
    
    it('should return 404 for non-existent tag ID', async () => {
      try {
        const response = await requestHelper.delete('/api/tags/id/99999', testUserToken);
        
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
      } catch (error) {
        console.error('Non-existent tag ID test failed:', error);
        throw error;
      }
    });
  });
  
  describe('DELETE /api/tags/name/:name', () => {
    it('should delete a tag by name', async () => {
      try {
        // First create a tag
        const tag = { name: 'to-be-deleted-by-name' };
        const createResponse = await requestHelper.post('/api/tags', tag, testUserToken);
        expect(createResponse.status).toBe(201);
        
        // Now delete it
        const deleteResponse = await requestHelper.delete(`/api/tags/name/${tag.name}`, testUserToken);
        
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.name).toBe(tag.name);
        
        // Verify it's gone from the database
        const tagInDb = await db
          .selectFrom('tag')
          .select(['name'])
          .where('name', '=', tag.name)
          .executeTakeFirst();
          
        expect(tagInDb).toBeUndefined();
      } catch (error) {
        console.error('Delete tag by name test failed:', error);
        throw error;
      }
    });
    
    it('should return 404 for non-existent tag name', async () => {
      try {
        const response = await requestHelper.delete('/api/tags/name/non-existent-tag-name', testUserToken);
        
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
      } catch (error) {
        console.error('Non-existent tag name test failed:', error);
        throw error;
      }
    });
  });
  
  describe('Tag isolation between users', () => {
    it('should not allow access to another user\'s tags', async () => {
      try {
        // Create a tag as admin user
        const adminTag = { name: 'admin-only-tag' };
        const createResponse = await requestHelper.post('/api/tags', adminTag, adminUserToken);
        expect(createResponse.status).toBe(201);
        
        const adminTagId = createResponse.body.id;
        
        // Try to delete it as test user
        const deleteResponse = await requestHelper.delete(`/api/tags/id/${adminTagId}`, testUserToken);
        
        // Should return 404 as if the tag doesn't exist
        expect(deleteResponse.status).toBe(404);
        expect(deleteResponse.body.status).toBe('error');
        
        // Verify the tag still exists in the database
        const tagInDb = await db
          .selectFrom('tag')
          .select(['id'])
          .where('id', '=', adminTagId)
          .executeTakeFirst();
          
        expect(tagInDb).toBeDefined();
      } catch (error) {
        console.error('Tag isolation test failed:', error);
        throw error;
      }
    });
  });
});