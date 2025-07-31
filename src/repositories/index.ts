// src/repositories/index.ts
import { Kysely } from 'kysely';
import { Database } from '../db/schema';
import { TodoRepository } from './todo.repository';
import { KyselyTodoRepository } from './kysely-todo.repository';
import { TagRepository } from './tag.repository';
import { KyselyTagRepository } from './kysely-tag.repository';

export interface Repositories {
  todoRepository: TodoRepository;
  tagRepository: TagRepository;
}

export function createRepositories(db: Kysely<Database>): Repositories {
  return {
    todoRepository: new KyselyTodoRepository(db),
    tagRepository: new KyselyTagRepository(db)
  };
}