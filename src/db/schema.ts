// src/db/schema.ts
import { Generated } from 'kysely';

export interface Database {
  todo: {
    id: Generated<number>;
    title: string;
    description: string | null;
    completed: boolean;
    created_at: Date;
    due_date: Date | null;
    completed_at: Date | null;
    priority: number;
    image_urls: string[]; // Stored as JSON in PostgreSQL
    tags: string[]; // Stored as JSON in PostgreSQL
  }
}