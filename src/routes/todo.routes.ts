import { Router } from 'express';
import { 
  getAllTodos, 
  getTodoById, 
  createTodo, 
  updateTodo, 
  deleteTodo 
} from '../controllers/todo.controller';

const router = Router();

// Routes
router.get('/', getAllTodos);
router.get('/:id', getTodoById);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);

// Export as named export instead of default export
export const todoRoutes = router;