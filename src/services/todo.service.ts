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

export const create = (title: string): Todo => {
  const newId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
  
  const newTodo: Todo = {
    id: newId,
    title,
    completed: false,
    createdAt: new Date()
  };
  
  todos.push(newTodo);
  return newTodo;
};

export const update = (id: number, data: Partial<Omit<Todo, 'id' | 'createdAt'>>): Todo => {
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    throw new NotFoundError('Todo', id);
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