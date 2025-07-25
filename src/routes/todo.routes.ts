import { Router } from 'express';
import { 
  getAllTodos, 
  getTodoById, 
  createTodo, 
  updateTodo, 
  deleteTodo 
} from '../controllers/todo.controller';
import { validateTodoCreate, validateTodoUpdate } from '../middleware/validation.middleware';

const router = Router();

// Routes with validation
router.get('/', getAllTodos);
router.get('/:id', getTodoById);
router.post('/', validateTodoCreate, createTodo);
router.put('/:id', validateTodoUpdate, updateTodo);
router.delete('/:id', deleteTodo);

export const todoRoutes = router;