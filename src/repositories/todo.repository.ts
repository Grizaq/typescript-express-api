// src/repositories/todo.repository.ts
import { Todo } from '../models/todo.model';
import { Tag } from './tag.repository';

export interface TodoRepository {
  // Todo methods
  findAll(): Promise<Todo[]>;
  findById(id: number): Promise<Todo | undefined>;
  create(todo: Omit<Todo, 'id' | 'createdAt' | 'tags'>, tagIds?: number[]): Promise<Todo>;
  update(id: number, todo: Partial<Omit<Todo, 'id' | 'createdAt' | 'tags'>>, tagIds?: number[]): Promise<Todo | undefined>;
  delete(id: number): Promise<Todo | undefined>;
  markComplete(id: number): Promise<Todo | undefined>;
  
  // New tag-related methods
  findByTagId(tagId: number): Promise<Todo[]>;
  addTag(todoId: number, tagId: number): Promise<void>;
  removeTag(todoId: number, tagId: number): Promise<void>;
  setTags(todoId: number, tagIds: number[]): Promise<void>;
  getTags(todoId: number): Promise<Tag[]>;
}