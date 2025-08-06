// src/services/index.ts

import { Repositories } from '../repositories';
import { TodoService } from './todo.service';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';

export interface Services {
  todoService: TodoService;
  authService: AuthService;
  emailService: EmailService;
}

export function createServices(repositories: Repositories, customEmailService?: EmailService): Services {
  // Create email service - use custom one if provided, otherwise create a new one
  const emailService = customEmailService || new EmailService();
  
  return {
    todoService: new TodoService(
      repositories.todoRepository,
      repositories.tagRepository
    ),
    authService: new AuthService(
      repositories.userRepository,
      emailService,
      repositories.refreshTokenRepository
    ),
    emailService
  };
}