import { Request, Response, NextFunction } from 'express';
import * as todoService from '../services/todo.service';

// Get all todos
export const getAllTodos = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const allTodos = todoService.findAll();
    res.status(200).json(allTodos);
  } catch (error) {
    next(error);
  }
};

// Get a single todo by ID
export const getTodoById = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = parseInt(req.params.id);
    const todo = todoService.findById(id);
    res.status(200).json(todo);
  } catch (error) {
    next(error);
  }
};

// Create a new todo
export const createTodo = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { title } = req.body;
    const newTodo = todoService.create(title);
    res.status(201).json(newTodo);
  } catch (error) {
    next(error);
  }
};

// Update a todo
export const updateTodo = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = parseInt(req.params.id);
    const { title, completed } = req.body;
    const updatedTodo = todoService.update(id, { title, completed });
    res.status(200).json(updatedTodo);
  } catch (error) {
    next(error);
  }
};

// Delete a todo
export const deleteTodo = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = parseInt(req.params.id);
    const deletedTodo = todoService.remove(id);
    res.status(200).json(deletedTodo);
  } catch (error) {
    next(error);
  }
};