// src/services/index.ts
import { Repositories } from '../repositories';
import { TodoService } from './todo.service';

export interface Services {
  todoService: TodoService;
}

export function createServices(repositories: Repositories): Services {
  return {
    todoService: new TodoService(
      repositories.todoRepository,
      repositories.tagRepository
    )
  };
}