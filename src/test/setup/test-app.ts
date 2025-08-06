// src/test/setup/test-app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import { Kysely } from 'kysely';
import { TestDatabase } from './test-schema';
import { createRepositories } from '../../repositories';
import { createServices } from '../../services';
import { createControllers } from '../../controllers';
import { createTodoRouter } from '../../routes/todo.routes';
import { createAuthRouter } from '../../routes/auth.routes';
import { errorHandler } from '../../middleware/error.middleware';
import { requestLogger } from '../../middleware/logger.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { MockEmailService } from './mock-email-service';
import { EmailService } from '../../services/email.service';

// Create a test Express app with the given database
export function createTestApp(db: Kysely<TestDatabase>) {
  const app = express();

  // Create the repositories
  const repositories = createRepositories(db as any);
  
  // Create a mock email service
  const mockEmailService = new MockEmailService();
  console.log('Created mock email service for tests');
  
  // Create services, passing the mock email service
  // The mock now implements the EmailService interface so typing should work
  const services = createServices(repositories, mockEmailService);
  
  // Verify the email service was properly injected
  console.log('Is mock email service being used?', 
    services.emailService.constructor.name === 'MockEmailService');
  
  const controllers = createControllers(services);

  // Add error logging middleware for tests
  app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
      // Log 500 errors for debugging
      if (res.statusCode === 500) {
        console.error('Test server 500 error:', body);
      }
      return originalSend.call(this, body);
    };
    next();
  });

  // Middleware
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger);

  // Routes
  app.get('/', (req, res) => {
    res.json({ message: 'Test API is running' });
  });

  // Mount auth routes
  app.use('/api/auth', createAuthRouter(controllers.authController));

  // Mount todo routes with authentication
  const todoRouter = createTodoRouter(controllers.todoController);
  app.use('/api', authenticate, todoRouter);

  // Error handling middleware
  app.use(errorHandler);

  return {
    app,
    repositories,
    services,
    controllers,
    mockEmailService
  };
}