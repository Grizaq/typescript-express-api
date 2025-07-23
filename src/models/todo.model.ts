export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export let todos: Todo[] = [
  {
    id: 1,
    title: "Learn TypeScript",
    completed: true,
    createdAt: new Date()
  },
  {
    id: 2,
    title: "Build REST API",
    completed: false,
    createdAt: new Date()
  }
];