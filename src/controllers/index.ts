// src/controllers/index.ts
import { Services } from '../services';
import { TodoController } from './todo.controller';

// Collection of all controllers
export interface Controllers {
  todoController: TodoController;
  // Add other controllers here as your app grows
}

// Factory function to create all controllers
export function createControllers(services: Services): Controllers {
  return {
    todoController: new TodoController(services.todoService)
  };
}