// src/test/unit/services/todo.service.test.ts
import { TodoService } from '../../../services/todo.service';
import { Todo, PriorityLevel } from '../../../models/todo.model';
import { NotFoundError, ValidationError } from '../../../utils/errors';

// Mock repositories
const mockTodoRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  markComplete: jest.fn(),
  findByTagId: jest.fn(),
  addTag: jest.fn(),
  removeTag: jest.fn(),
  setTags: jest.fn(),
  getTags: jest.fn()
};

const mockTagRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  findOrCreate: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  deleteByName: jest.fn()
};

describe('TodoService', () => {
  let todoService: TodoService;
  const userId = 1;
  
  beforeEach(() => {
    jest.clearAllMocks();
    todoService = new TodoService(
      mockTodoRepository as any,
      mockTagRepository as any
    );
  });
  
  describe('findAll', () => {
    it('should return all todos for a user', async () => {
      const mockTodos = [
        { id: 1, title: 'Todo 1' },
        { id: 2, title: 'Todo 2' }
      ];
      mockTodoRepository.findAll.mockResolvedValue(mockTodos);
      
      const result = await todoService.findAll(userId);
      
      expect(mockTodoRepository.findAll).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockTodos);
      expect(result.length).toBe(2);
    });
  });
  
  describe('findById', () => {
    it('should return a todo when it exists', async () => {
      const mockTodo = { id: 1, title: 'Test Todo' };
      mockTodoRepository.findById.mockResolvedValue(mockTodo);
      
      const result = await todoService.findById(1, userId);
      
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(1, userId);
      expect(result).toEqual(mockTodo);
    });
    
    it('should throw NotFoundError when todo does not exist', async () => {
      mockTodoRepository.findById.mockResolvedValue(undefined);
      
      await expect(todoService.findById(999, userId))
        .rejects
        .toThrow(NotFoundError);
      
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(999, userId);
    });
  });
  
  describe('create', () => {
    it('should create a new todo with defaults', async () => {
      const todoData = {
        title: 'New Todo',
        description: 'Test description',
        priority: 'medium' as PriorityLevel,
        imageUrls: [] // Fix: Add the required imageUrls property
      };
      
      const createdTodo = {
        id: 1,
        ...todoData,
        completed: false,
        createdAt: new Date(),
      };
      
      mockTodoRepository.create.mockResolvedValue(createdTodo);
      
      const result = await todoService.create(todoData, userId);
      
      expect(mockTodoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: todoData.title,
          description: todoData.description,
          priority: todoData.priority,
          completed: false,
          imageUrls: []
        }),
        userId,
        []
      );
      
      expect(result).toEqual(createdTodo);
    });
    
    it('should handle tags when creating a todo', async () => {
      const todoData = {
        title: 'New Todo with Tags',
        description: 'Test description',
        priority: 'medium' as PriorityLevel,
        imageUrls: [], // Fix: Add the required imageUrls property
        tags: ['work', 'important']
      };
      
      // Mock tag creation
      mockTagRepository.findOrCreate
        .mockResolvedValueOnce({ id: 1, name: 'work' })
        .mockResolvedValueOnce({ id: 2, name: 'important' });
      
      const createdTodo = {
        id: 1,
        title: todoData.title,
        description: todoData.description,
        priority: todoData.priority,
        completed: false,
        createdAt: new Date(),
        imageUrls: [],
        tags: [
          { id: 1, name: 'work' },
          { id: 2, name: 'important' }
        ]
      };
      
      mockTodoRepository.create.mockResolvedValue(createdTodo);
      
      const result = await todoService.create(todoData, userId);
      
      expect(mockTagRepository.findOrCreate).toHaveBeenCalledTimes(2);
      expect(mockTagRepository.findOrCreate).toHaveBeenCalledWith('work', userId);
      expect(mockTagRepository.findOrCreate).toHaveBeenCalledWith('important', userId);
      
      expect(mockTodoRepository.create).toHaveBeenCalledWith(
        expect.anything(),
        userId,
        [1, 2] // Tag IDs
      );
      
      expect(result).toEqual(createdTodo);
    });
  });
  
  describe('update', () => {
    it('should update a todo with provided fields', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        priority: 'high' as PriorityLevel
      };
      
      const updatedTodo = {
        id: 1,
        ...updateData,
        completed: false,
        createdAt: new Date(),
        imageUrls: []
      };
      
      mockTodoRepository.update.mockResolvedValue(updatedTodo);
      
      const result = await todoService.update(1, updateData, userId);
      
      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        1,
        updateData,
        userId,
        undefined
      );
      
      expect(result).toEqual(updatedTodo);
    });
    
    it('should update a todo with new tags', async () => {
      const updateData = {
        title: 'Updated Todo',
        tagNames: ['home', 'project']
      };
      
      // Mock tag creation
      mockTagRepository.findOrCreate
        .mockResolvedValueOnce({ id: 3, name: 'home' })
        .mockResolvedValueOnce({ id: 4, name: 'project' });
      
      const updatedTodo = {
        id: 1,
        title: 'Updated Todo',
        description: 'Original description',
        completed: false,
        createdAt: new Date(),
        imageUrls: [],
        tags: [
          { id: 3, name: 'home' },
          { id: 4, name: 'project' }
        ]
      };
      
      mockTodoRepository.update.mockResolvedValue(updatedTodo);
      
      const result = await todoService.update(1, updateData, userId);
      
      expect(mockTagRepository.findOrCreate).toHaveBeenCalledTimes(2);
      expect(mockTagRepository.findOrCreate).toHaveBeenCalledWith('home', userId);
      expect(mockTagRepository.findOrCreate).toHaveBeenCalledWith('project', userId);
      
      // Check that tagNames was removed from data passed to repository
      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        1,
        { title: 'Updated Todo' },
        userId,
        [3, 4]
      );
      
      expect(result).toEqual(updatedTodo);
    });
    
    it('should throw NotFoundError when todo does not exist', async () => {
      mockTodoRepository.update.mockResolvedValue(undefined);
      
      await expect(todoService.update(999, { title: 'New Title' }, userId))
        .rejects
        .toThrow(NotFoundError);
      
      expect(mockTodoRepository.update).toHaveBeenCalledWith(999, { title: 'New Title' }, userId, undefined);
    });
  });
  
  describe('toggleTodoCompletion', () => {
    it('should toggle an incomplete todo to complete', async () => {
      // Mock the current incomplete todo
      const currentTodo = {
        id: 1,
        title: 'Test Todo',
        completed: false,
        completedAt: null
      };
      
      // Mock the updated todo
      const updatedTodo = {
        id: 1,
        title: 'Test Todo',
        completed: true,
        completedAt: new Date()
      };
      
      mockTodoRepository.findById.mockResolvedValue(currentTodo);
      mockTodoRepository.update.mockResolvedValue(updatedTodo);
      
      const result = await todoService.toggleTodoCompletion(1, userId);
      
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(1, userId);
      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          completed: true,
          completedAt: expect.any(Date)
        }),
        userId
      );
      
      expect(result).toEqual(updatedTodo);
      expect(result.completed).toBe(true);
    });
    
    it('should toggle a complete todo to incomplete', async () => {
      // Mock the current complete todo
      const currentTodo = {
        id: 1,
        title: 'Test Todo',
        completed: true,
        completedAt: new Date()
      };
      
      // Mock the updated todo
      const updatedTodo = {
        id: 1,
        title: 'Test Todo',
        completed: false,
        completedAt: null
      };
      
      mockTodoRepository.findById.mockResolvedValue(currentTodo);
      mockTodoRepository.update.mockResolvedValue(updatedTodo);
      
      const result = await todoService.toggleTodoCompletion(1, userId);
      
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(1, userId);
      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          completed: false,
          completedAt: null
        }),
        userId
      );
      
      expect(result).toEqual(updatedTodo);
      expect(result.completed).toBe(false);
    });
    
    it('should throw NotFoundError when todo does not exist', async () => {
      mockTodoRepository.findById.mockResolvedValue(undefined);
      
      await expect(todoService.toggleTodoCompletion(999, userId))
        .rejects
        .toThrow(NotFoundError);
    });
    
    it('should throw NotFoundError when update fails', async () => {
      const currentTodo = {
        id: 1,
        title: 'Test Todo',
        completed: false
      };
      
      mockTodoRepository.findById.mockResolvedValue(currentTodo);
      mockTodoRepository.update.mockResolvedValue(undefined);
      
      await expect(todoService.toggleTodoCompletion(1, userId))
        .rejects
        .toThrow(NotFoundError);
    });
  });
  
  describe('remove', () => {
    it('should delete a todo when it exists', async () => {
      const mockTodo = { id: 1, title: 'Test Todo' };
      mockTodoRepository.delete.mockResolvedValue(mockTodo);
      
      const result = await todoService.remove(1, userId);
      
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(1, userId);
      expect(result).toEqual(mockTodo);
    });
    
    it('should throw NotFoundError when todo does not exist', async () => {
      mockTodoRepository.delete.mockResolvedValue(undefined);
      
      await expect(todoService.remove(999, userId))
        .rejects
        .toThrow(NotFoundError);
      
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(999, userId);
    });
  });
  
  // Additional tests for tag-related functionality
  
  describe('findByTag', () => {
    it('should return todos with the specified tag', async () => {
      const tagName = 'work';
      const tagId = 1;
      const mockTag = { id: tagId, name: tagName };
      const mockTodos = [
        { id: 1, title: 'Work Todo 1' },
        { id: 2, title: 'Work Todo 2' }
      ];
      
      mockTagRepository.findByName.mockResolvedValue(mockTag);
      mockTodoRepository.findByTagId.mockResolvedValue(mockTodos);
      
      const result = await todoService.findByTag(tagName, userId);
      
      expect(mockTagRepository.findByName).toHaveBeenCalledWith(tagName, userId);
      expect(mockTodoRepository.findByTagId).toHaveBeenCalledWith(tagId, userId);
      expect(result).toEqual(mockTodos);
    });
    
    it('should return empty array when tag does not exist', async () => {
      mockTagRepository.findByName.mockResolvedValue(undefined);
      
      const result = await todoService.findByTag('non-existent', userId);
      
      expect(result).toEqual([]);
      expect(mockTodoRepository.findByTagId).not.toHaveBeenCalled();
    });
  });

  // New tests for missing methods
  describe('getAllTags', () => {
    it('should return all tags with todo counts', async () => {
      const mockTags = [
        { id: 1, name: 'work', userId: 1 },
        { id: 2, name: 'home', userId: 1 },
      ];
      
      mockTagRepository.findAll.mockResolvedValue(mockTags);
      
      // Mock todo counts for each tag
      mockTodoRepository.findByTagId
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]) // 2 todos for 'work'
        .mockResolvedValueOnce([{ id: 3 }]); // 1 todo for 'home'
      
      const result = await todoService.getAllTags(userId);
      
      expect(mockTagRepository.findAll).toHaveBeenCalledWith(userId);
      expect(mockTodoRepository.findByTagId).toHaveBeenCalledWith(1, userId);
      expect(mockTodoRepository.findByTagId).toHaveBeenCalledWith(2, userId);
      
      expect(result).toEqual([
        { id: 1, name: 'work', count: 2 },
        { id: 2, name: 'home', count: 1 },
      ]);
    });
    
    it('should return empty array when user has no tags', async () => {
      mockTagRepository.findAll.mockResolvedValue([]);
      
      const result = await todoService.getAllTags(userId);
      
      expect(result).toEqual([]);
      expect(mockTodoRepository.findByTagId).not.toHaveBeenCalled();
    });
  });
  
  describe('getUsedTags', () => {
    it('should return only tags that are used by todos', async () => {
      // Setup getAllTags to return some tags with counts
      const mockTags = [
        { id: 1, name: 'work', count: 2 },
        { id: 2, name: 'home', count: 0 },
        { id: 3, name: 'project', count: 3 },
      ];
      
      // Spy on getAllTags
      jest.spyOn(todoService, 'getAllTags').mockResolvedValue(mockTags);
      
      const result = await todoService.getUsedTags(userId);
      
      expect(todoService.getAllTags).toHaveBeenCalledWith(userId);
      expect(result).toEqual([
        { id: 1, name: 'work', count: 2 },
        { id: 3, name: 'project', count: 3 },
      ]);
    });
  });
  
  describe('getUnusedTags', () => {
    it('should return only tags that are not used by any todos', async () => {
      // Setup getAllTags to return some tags with counts
      const mockTags = [
        { id: 1, name: 'work', count: 2 },
        { id: 2, name: 'home', count: 0 },
        { id: 3, name: 'project', count: 3 },
        { id: 4, name: 'archived', count: 0 },
      ];
      
      // Spy on getAllTags
      jest.spyOn(todoService, 'getAllTags').mockResolvedValue(mockTags);
      
      const result = await todoService.getUnusedTags(userId);
      
      expect(todoService.getAllTags).toHaveBeenCalledWith(userId);
      expect(result).toEqual([
        { id: 2, name: 'home', count: 0 },
        { id: 4, name: 'archived', count: 0 },
      ]);
    });
  });
  
  describe('createTag', () => {
    it('should create a new tag', async () => {
      const tagName = 'new-tag';
      const newTag = { id: 5, name: tagName, userId: 1, createdAt: new Date() };
      
      // Mock that tag doesn't exist yet
      mockTagRepository.findByName.mockResolvedValue(undefined);
      mockTagRepository.create.mockResolvedValue(newTag);
      
      const result = await todoService.createTag(tagName, userId);
      
      expect(mockTagRepository.findByName).toHaveBeenCalledWith(tagName, userId);
      expect(mockTagRepository.create).toHaveBeenCalledWith(tagName, userId);
      expect(result).toEqual({
        id: 5,
        name: tagName,
        count: 0
      });
    });
    
    it('should throw ValidationError when tag already exists', async () => {
      const tagName = 'existing-tag';
      const existingTag = { id: 3, name: tagName, userId: 1 };
      
      mockTagRepository.findByName.mockResolvedValue(existingTag);
      
      await expect(todoService.createTag(tagName, userId))
        .rejects
        .toThrow(ValidationError);
      
      expect(mockTagRepository.create).not.toHaveBeenCalled();
    });
    
    it('should handle database constraint errors', async () => {
      const tagName = 'duplicate-tag';
      
      // Mock that tag lookup returns nothing (simulating race condition)
      mockTagRepository.findByName.mockResolvedValue(undefined);
      
      // But create throws a duplicate key error
      mockTagRepository.create.mockRejectedValue(
        new Error('duplicate key value violates unique constraint')
      );
      
      await expect(todoService.createTag(tagName, userId))
        .rejects
        .toThrow(ValidationError);
    });
  });
  
  describe('deleteTag', () => {
    it('should delete an unused tag', async () => {
      const tagId = 1;
      const mockTag = { id: tagId, name: 'unused-tag', userId: 1 };
      
      mockTagRepository.findById.mockResolvedValue(mockTag);
      mockTodoRepository.findByTagId.mockResolvedValue([]);
      mockTagRepository.delete.mockResolvedValue(mockTag);
      
      const result = await todoService.deleteTag(tagId, userId);
      
      expect(mockTagRepository.findById).toHaveBeenCalledWith(tagId);
      expect(mockTodoRepository.findByTagId).toHaveBeenCalledWith(tagId, userId);
      expect(mockTagRepository.delete).toHaveBeenCalledWith(tagId);
      
      expect(result).toEqual({
        id: tagId,
        name: 'unused-tag'
      });
    });
    
    it('should throw error when trying to delete a tag that is in use', async () => {
      const tagId = 2;
      const mockTag = { id: tagId, name: 'used-tag', userId: 1 };
      
      mockTagRepository.findById.mockResolvedValue(mockTag);
      mockTodoRepository.findByTagId.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      
      await expect(todoService.deleteTag(tagId, userId))
        .rejects
        .toThrow('Cannot delete tag with ID 2 because it is used by 2 todos');
      
      expect(mockTagRepository.delete).not.toHaveBeenCalled();
    });
    
    it('should throw NotFoundError when tag does not exist', async () => {
      mockTagRepository.findById.mockResolvedValue(undefined);
      
      await expect(todoService.deleteTag(999, userId))
        .rejects
        .toThrow(NotFoundError);
      
      expect(mockTodoRepository.findByTagId).not.toHaveBeenCalled();
      expect(mockTagRepository.delete).not.toHaveBeenCalled();
    });
    
    it('should throw NotFoundError when tag belongs to another user', async () => {
      const tagId = 3;
      const mockTag = { id: tagId, name: 'other-user-tag', userId: 999 };
      
      mockTagRepository.findById.mockResolvedValue(mockTag);
      
      await expect(todoService.deleteTag(tagId, userId))
        .rejects
        .toThrow(NotFoundError);
      
      expect(mockTodoRepository.findByTagId).not.toHaveBeenCalled();
      expect(mockTagRepository.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteTagByName', () => {
  let deleteTagSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Set up the spy before each test in this describe block
    deleteTagSpy = jest.spyOn(todoService, 'deleteTag').mockImplementation();
  });
  
  afterEach(() => {
    // Clean up the spy after each test
    deleteTagSpy.mockRestore();
  });

  it('should find tag by name and delete it', async () => {
    const tagName = 'tag-to-delete';
    const tagId = 4;
    const mockTag = { id: tagId, name: tagName, userId: 1 };
    
    mockTagRepository.findByName.mockResolvedValue(mockTag);
    deleteTagSpy.mockResolvedValue({
      id: tagId,
      name: tagName
    });
    
    const result = await todoService.deleteTagByName(tagName, userId);
    
    expect(mockTagRepository.findByName).toHaveBeenCalledWith(tagName, userId);
    expect(deleteTagSpy).toHaveBeenCalledWith(tagId, userId);
    
    expect(result).toEqual({
      id: tagId,
      name: tagName
    });
  });
  
  it('should throw NotFoundError when tag name does not exist', async () => {
    const tagName = 'non-existent';
    
    mockTagRepository.findByName.mockResolvedValue(undefined);
    
    await expect(todoService.deleteTagByName(tagName, userId))
      .rejects
      .toThrow(NotFoundError);
    
    expect(deleteTagSpy).not.toHaveBeenCalled();
  });
});
});