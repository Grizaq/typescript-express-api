// src/controllers/index.ts
import { Services } from '../services';
import { TodoController } from './todo.controller';
import { AuthController } from './auth.controller';

// Collection of all controllers
export interface Controllers {
  todoController: TodoController;
  authController: AuthController;
}

// Factory function to create all controllers
export function createControllers(services: Services): Controllers {
  return {
    todoController: new TodoController(services.todoService),
    authController: new AuthController(services.authService)
  };
}