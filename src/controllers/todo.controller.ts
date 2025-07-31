// src/controllers/todo.controller.ts
import { Request, Response, NextFunction } from "express";
import { TodoService } from "../services/todo.service";

export class TodoController {
  constructor(private todoService: TodoService) {}

  // Get all todos
  getAllTodos = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const allTodos = await this.todoService.findAll();
      res.status(200).json(allTodos);
    } catch (error) {
      next(error);
    }
  };

  // Get a single todo by ID
  getTodoById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const todo = await this.todoService.findById(id);
      res.status(200).json(todo);
    } catch (error) {
      next(error);
    }
  };

  // Create a new todo
  createTodo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { title, description, dueDate, priority, imageUrls, tags } =
        req.body;

      const newTodo = await this.todoService.create({
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        imageUrls: imageUrls || [], // Provide default empty array
        tags: tags || [], // Provide default empty array for tags
      });

      res.status(201).json(newTodo);
    } catch (error) {
      next(error);
    }
  };

  // Update a todo
  updateTodo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const {
        title,
        description,
        completed,
        dueDate,
        priority,
        imageUrls,
        tags,
      } = req.body;

      const data: any = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (completed !== undefined) data.completed = completed;
      if (dueDate !== undefined) data.dueDate = new Date(dueDate);
      if (priority !== undefined) data.priority = priority;
      if (imageUrls !== undefined) data.imageUrls = imageUrls;
      if (tags !== undefined) data.tagNames = tags;

      const updatedTodo = await this.todoService.update(id, data);
      res.status(200).json(updatedTodo);
    } catch (error) {
      next(error);
    }
  };

  // Delete a todo
  deleteTodo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const deletedTodo = await this.todoService.remove(id);
      res.status(200).json(deletedTodo);
    } catch (error) {
      next(error);
    }
  };

  // Set a task as complete
  setTodoToComplete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const completedTodo = await this.todoService.completeTodo(id);
      res.status(200).json(completedTodo);
    } catch (error) {
      next(error);
    }
  };

  // find todos by tag
  findByTag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tagName = req.params.tagName;
      const todos = await this.todoService.findByTag(tagName);
      res.status(200).json(todos);
    } catch (error) {
      next(error);
    }
  };

  // get all tags
  getAllTags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tags = await this.todoService.getAllTags();
      res.status(200).json(tags);
    } catch (error) {
      next(error);
    }
  };

  // get tags which aren't used in any tasks
  getUsedTags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tags = await this.todoService.getUsedTags();
      res.status(200).json(tags);
    } catch (error) {
      next(error);
    }
  };

  getUnusedTags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tags = await this.todoService.getUnusedTags();
      res.status(200).json(tags);
    } catch (error) {
      next(error);
    }
  };

  createTag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name } = req.body;
      const newTag = await this.todoService.createTag(name.trim());
      res.status(201).json(newTag);
    } catch (error) {
      next(error);
    }
  };

  deleteTagById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const deletedTag = await this.todoService.deleteTag(id);
      res.status(200).json(deletedTag);
    } catch (error) {
      next(error);
    }
  };

  deleteTagByName = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const name = req.params.name;
      const deletedTag = await this.todoService.deleteTagByName(name);
      res.status(200).json(deletedTag);
    } catch (error) {
      next(error);
    }
  };
}
