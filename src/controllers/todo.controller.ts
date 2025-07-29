// src/controllers/todo.controller.ts
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
    const { title, description, dueDate, priority, imageUrls, tags } = req.body;
    const newTodo = todoService.create({
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      imageUrls,
      tags
    });
    res.status(201).json(newTodo);
  } catch (error) {
    next(error);
  }
};

// Update a todo
export const updateTodo = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, completed, dueDate, priority, imageUrls, tags } = req.body;
    
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (completed !== undefined) data.completed = completed;
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (priority !== undefined) data.priority = priority;
    if (imageUrls !== undefined) data.imageUrls = imageUrls;
    if (tags !== undefined) data.tags = tags;
    
    const updatedTodo = todoService.update(id, data);
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

// Set a task as complete
export const setTodoToComplete = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = parseInt(req.params.id);
    const completedTodo = todoService.completeTodo(id);
    res.status(200).json(completedTodo);
  } catch (error) {
    next(error);
  }
};
