// src/models/todo.model.ts
import { Tag } from '../repositories/tag.repository';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  completedAt?: Date | null;
  priority: PriorityLevel;  // Changed from number to enum
  imageUrls: string[];
  tags?: Tag[];              // Changed from string[] to Tag[]
}