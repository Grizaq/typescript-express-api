// src/controllers/todo.controller.ts
import { Request, Response, NextFunction } from "express";
import { TodoService } from "../services/todo.service";
import { AuthenticationError } from "../utils/errors";

export class TodoController {
  constructor(private todoService: TodoService) {}

  // Helper to get the user ID from the request
  private getUserId(req: Request): number {
    if (!req.user || !req.user.userId) {
      throw new AuthenticationError("User not authenticated");
    }
    return req.user.userId;
  }

  // Get all todos
  getAllTodos = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const allTodos = await this.todoService.findAll(userId);
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
      const userId = this.getUserId(req);
      const id = parseInt(req.params.id);
      const todo = await this.todoService.findById(id, userId);
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
      const userId = this.getUserId(req);
      const { title, description, dueDate, priority, imageUrls, tags } =
        req.body;

      const newTodo = await this.todoService.create(
        {
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          priority,
          imageUrls: imageUrls || [], // Provide default empty array
          tags: tags || [], // Provide default empty array for tags
        },
        userId
      );

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
      const userId = this.getUserId(req);
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

      const updatedTodo = await this.todoService.update(id, data, userId);
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
      const userId = this.getUserId(req);
      const id = parseInt(req.params.id);
      const deletedTodo = await this.todoService.remove(id, userId);
      res.status(200).json(deletedTodo);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggle a task's completion status (complete <-> incomplete)
   */
  toggleTodoCompletion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const id = parseInt(req.params.id);
      console.log(`Controller: Toggling completion for todo ${id}`);
      const updatedTodo = await this.todoService.toggleTodoCompletion(
        id,
        userId
      );
      res.status(200).json(updatedTodo);
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
      const userId = this.getUserId(req);
      const tagName = req.params.tagName;
      const todos = await this.todoService.findByTag(tagName, userId);
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
      const userId = this.getUserId(req);
      const tags = await this.todoService.getAllTags(userId);
      res.status(200).json(tags);
    } catch (error) {
      next(error);
    }
  };

  // get tags which are used in tasks
  getUsedTags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const tags = await this.todoService.getUsedTags(userId);
      res.status(200).json(tags);
    } catch (error) {
      next(error);
    }
  };

  // get tags which aren't used in any tasks
  getUnusedTags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const tags = await this.todoService.getUnusedTags(userId);
      res.status(200).json(tags);
    } catch (error) {
      next(error);
    }
  };

  // create a new tag
  createTag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { name } = req.body;
      const newTag = await this.todoService.createTag(name.trim(), userId);
      res.status(201).json(newTag);
    } catch (error) {
      next(error);
    }
  };

  // delete a tag by ID
  deleteTagById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const id = parseInt(req.params.id);
      const deletedTag = await this.todoService.deleteTag(id, userId);
      res.status(200).json(deletedTag);
    } catch (error) {
      next(error);
    }
  };

  // delete a tag by name
  deleteTagByName = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const name = req.params.name;
      const deletedTag = await this.todoService.deleteTagByName(name, userId);
      res.status(200).json(deletedTag);
    } catch (error) {
      next(error);
    }
  };
}
