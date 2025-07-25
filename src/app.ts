import express from 'express';
// Import as named import instead of default import
import { todoRoutes } from './routes/todo.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { config } from './config';

// Initialize express app
const app = express();
const PORT = config.port;

// Middleware to parse JSON bodies
app.use(express.json());

// Welcome route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Todo API!',
    endpoints: {
      todos: '/api/todos'
    }
  });
});

// Use todo routes
app.use('/api/todos', todoRoutes);

// Error handling middleware
app.use(errorHandler);

// Logger middleware
app.use(requestLogger);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET http://localhost:3000/');
  console.log('- GET http://localhost:3000/api/todos');
  console.log('- GET http://localhost:3000/api/todos/:id');
  console.log('- POST http://localhost:3000/api/todos');
  console.log('- PUT http://localhost:3000/api/todos/:id');
  console.log('- DELETE http://localhost:3000/api/todos/:id');
});