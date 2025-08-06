// src/repositories/todo.repository.ts
import { Todo } from '../models/todo.model';
import { Tag } from './tag.repository';

export interface TodoRepository {
  // Todo methods with user context
  findAll(userId: number): Promise<Todo[]>;
  findById(id: number, userId: number): Promise<Todo | undefined>;
  create(todo: Omit<Todo, 'id' | 'createdAt' | 'tags'>, userId: number, tagIds?: number[]): Promise<Todo>;
  update(id: number, todo: Partial<Omit<Todo, 'id' | 'createdAt' | 'tags'>>, userId: number, tagIds?: number[]): Promise<Todo | undefined>;
  delete(id: number, userId: number): Promise<Todo | undefined>;
  markComplete(id: number, userId: number): Promise<Todo | undefined>;
  
  // Tag-related methods
  findByTagId(tagId: number, userId: number): Promise<Todo[]>;
  addTag(todoId: number, tagId: number): Promise<void>;
  removeTag(todoId: number, tagId: number): Promise<void>;
  setTags(todoId: number, tagIds: number[]): Promise<void>;
  getTags(todoId: number): Promise<Tag[]>;
}