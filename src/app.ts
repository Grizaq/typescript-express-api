// src/app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import { db } from './db';
import { createRepositories } from './repositories';
import { createServices } from './services';
import { createControllers } from './controllers';
import { createTodoRouter } from './routes/todo.routes';
import { createAuthRouter } from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { authenticate } from './middleware/auth.middleware';
import { config } from './config';

// Initialize express app
const app = express();
const PORT = config.port;

// Create the dependency tree
const repositories = createRepositories(db);
const services = createServices(repositories);
const controllers = createControllers(services);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser()); // Add cookie parser
app.use(requestLogger);

// Welcome route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Todo API!',
    endpoints: {
      auth: '/api/auth',
      todos: '/api/todos',
      tags: '/api/tags'
    }
  });
});

// Mount the routers - public auth routes first
app.use('/api/auth', createAuthRouter(controllers.authController));

// Create a single router for both todo and tag routes
const todoRouter = createTodoRouter(controllers.todoController);

// Apply authentication to protected routes
app.use('/api', authenticate, todoRouter);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('\nAuthentication routes:');
  console.log('- POST http://localhost:3000/api/auth/register');
  console.log('- POST http://localhost:3000/api/auth/verify-email');
  console.log('- POST http://localhost:3000/api/auth/login');
  console.log('- POST http://localhost:3000/api/auth/refresh-token');
  console.log('- POST http://localhost:3000/api/auth/logout');
  console.log('- GET http://localhost:3000/api/auth/me (protected)');
  
  console.log('\nTodo routes (all require authentication):');
  console.log('- GET http://localhost:3000/api/todos');
  console.log('- GET http://localhost:3000/api/todos/:id');
  console.log('- POST http://localhost:3000/api/todos');
  console.log('- PUT http://localhost:3000/api/todos/:id');
  console.log('- DELETE http://localhost:3000/api/todos/:id');
  console.log('- PUT http://localhost:3000/api/todos/:id/complete');
  
  console.log('\nTag routes (all require authentication):');
  console.log('- GET http://localhost:3000/api/tags');
  console.log('- GET http://localhost:3000/api/tags/used');
  console.log('- GET http://localhost:3000/api/tags/unused');
  console.log('- GET http://localhost:3000/api/tags/containing/:tagName');
  console.log('- POST http://localhost:3000/api/tags');
  console.log('- DELETE http://localhost:3000/api/tags/id/:id');
  console.log('- DELETE http://localhost:3000/api/tags/name/:name');
});

export default app;