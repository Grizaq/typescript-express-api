// src/routes/todo.routes.ts
import { Router } from "express";
import { TodoController } from "../controllers/todo.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  validateTagCreate,
  validateTagId,
  validateTagName,
  validateTodoCreate,
  validateTodoUpdate,
} from "../middleware/validation.middleware";

export function createTodoRouter(todoController: TodoController): Router {
  const router = Router();

  // All routes are now protected with authentication
  router.use(authenticate)

  // Routes for tags
  router.get("/tags", todoController.getAllTags);
  router.get("/tags/containing/:tagName", todoController.findByTag);
  router.get("/tags/used", todoController.getUsedTags);
  router.get("/tags/unused", todoController.getUnusedTags);
  router.post("/tags", validateTagCreate, todoController.createTag);
  router.delete("/tags/id/:id", validateTagId, todoController.deleteTagById);
  router.delete("/tags/name/:name", validateTagName, todoController.deleteTagByName);

  // Routes for todos
  router.get("/todos", todoController.getAllTodos);
  router.get("/todos/:id", todoController.getTodoById);
  router.post("/todos", validateTodoCreate, todoController.createTodo);
  router.put("/todos/:id", validateTodoUpdate, todoController.updateTodo);
  router.delete("/todos/:id", todoController.deleteTodo);
  router.put("/todos/:id/toggle", todoController.toggleTodoCompletion);

  return router;
}