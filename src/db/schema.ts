// src/db/schema.ts
import { Generated } from 'kysely';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export interface Database {
  todo: {
    id: Generated<number>;
    title: string;
    description: string | null;
    completed: boolean;
    created_at: Date;
    due_date: Date | null;
    completed_at: Date | null;
    priority: PriorityLevel;  // Changed from number to enum
    image_urls: string[];     // Still stored as JSON in PostgreSQL
    tags?: string[];          // Optional during migration period
  };
  
  tag: {
    id: Generated<number>;
    name: string;
    created_at: Date;
  };
  
  todo_tag: {
    todo_id: number;
    tag_id: number;
  };
}