import { Request, Response } from 'express';
import { Todo, todos } from '../models/todo.model';

// Get all todos
export const getAllTodos = (req: Request, res: Response): void => {
  res.status(200).json(todos);
};

// Get a single todo by ID
export const getTodoById = (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);
  
  if (!todo) {
    res.status(404).json({ message: `Todo with ID ${id} not found` });
    return;
  }
  
  res.status(200).json(todo);
};

// Create a new todo
export const createTodo = (req: Request, res: Response): void => {
  const { title } = req.body;
  
  if (!title) {
    res.status(400).json({ message: "Title is required" });
    return;
  }
  
  const newId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
  
  const newTodo: Todo = {
    id: newId,
    title,
    completed: false,
    createdAt: new Date()
  };
  
  todos.push(newTodo);
  res.status(201).json(newTodo);
};

// Update a todo
export const updateTodo = (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    res.status(404).json({ message: `Todo with ID ${id} not found` });
    return;
  }
  
  const { title, completed } = req.body;
  
  todos[todoIndex] = {
    ...todos[todoIndex],
    ...(title !== undefined && { title }),
    ...(completed !== undefined && { completed })
  };
  
  res.status(200).json(todos[todoIndex]);
};

// Delete a todo
export const deleteTodo = (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    res.status(404).json({ message: `Todo with ID ${id} not found` });
    return;
  }
  
  const deletedTodo = todos[todoIndex];
  todos.splice(todoIndex, 1);
  
  res.status(200).json(deletedTodo);
};