// src/services/todo.service.ts
import { Todo, todos } from '../models/todo.model';
import { NotFoundError } from '../utils/errors';

export const findAll = (): Todo[] => {
  return todos;
};

export const findById = (id: number): Todo => {
  const todo = todos.find(t => t.id === id);
  
  if (!todo) {
    throw new NotFoundError('Todo', id);
  }
  
  return todo;
};

export interface CreateTodoInput {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: number;
  imageUrls?: string[];
  tags?: string[];
}

export const create = (input: CreateTodoInput): Todo => {
  const newId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
  
  const newTodo: Todo = {
    id: newId,
    title: input.title,
    description: input.description,
    completed: false,
    createdAt: new Date(),
    dueDate: input.dueDate,
    priority: input.priority || 3, // Default priority
    imageUrls: input.imageUrls || [],
    tags: input.tags || []
  };
  
  todos.push(newTodo);
  return newTodo;
};

export const update = (id: number, data: Partial<Omit<Todo, 'id' | 'createdAt'>>): Todo => {
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    throw new NotFoundError('Todo', id);
  }
  
  // Special handling for completedAt
  if (data.completed && !todos[todoIndex].completed) {
    data.completedAt = new Date();
  } else if (data.completed === false) {
    data.completedAt = undefined;
  }
  
  todos[todoIndex] = {
    ...todos[todoIndex],
    ...data
  };
  
  return todos[todoIndex];
};

export const remove = (id: number): Todo => {
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    throw new NotFoundError('Todo', id);
  }
  
  const deletedTodo = todos[todoIndex];
  todos.splice(todoIndex, 1);
  
  return deletedTodo;
};

export const completeTodo = (id: number): Todo => {
  const todoIndex = todos.findIndex(t => t.id === id);

  if (todoIndex === -1) {
    throw new NotFoundError('Todo', id);
  }

  todos[todoIndex].completed = true;
  todos[todoIndex].completedAt = new Date();
  
  return todos[todoIndex];
};