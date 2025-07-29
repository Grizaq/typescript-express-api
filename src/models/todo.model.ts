// src/models/todo.model.ts
export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  priority: number;
  imageUrls: string[];
  tags: string[];
}

// Sample in-memory data (this will be replaced with database data later)
export let todos: Todo[] = [
  {
    id: 0,
    title: "Learn TypeScript",
    description: "Complete the TypeScript tutorial on W3Schools",
    completed: true,
    createdAt: new Date(),
    completedAt: new Date(),
    priority: 4,
    imageUrls: [],
    tags: ["learning", "programming"]
  },
  {
    id: 1,
    title: "Build REST API",
    description: "Create a REST API with Express and TypeScript",
    completed: false,
    createdAt: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    priority: 5,
    imageUrls: [],
    tags: ["project", "backend"]
  }
];