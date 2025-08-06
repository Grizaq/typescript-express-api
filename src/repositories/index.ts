// src/repositories/index.ts
import { Kysely } from 'kysely';
import { Database } from '../db/schema';
import { TodoRepository } from './todo.repository';
import { KyselyTodoRepository } from './kysely-todo.repository';
import { TagRepository } from './tag.repository';
import { KyselyTagRepository } from './kysely-tag.repository';
import { UserRepository } from './user.repository';
import { KyselyUserRepository } from './kysely-user.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { KyselyRefreshTokenRepository } from './kysely-refresh-token.repository';

export interface Repositories {
  todoRepository: TodoRepository;
  tagRepository: TagRepository;
  userRepository: UserRepository;
  refreshTokenRepository: RefreshTokenRepository;
}

export function createRepositories(db: Kysely<Database>): Repositories {
  return {
    todoRepository: new KyselyTodoRepository(db),
    tagRepository: new KyselyTagRepository(db),
    userRepository: new KyselyUserRepository(db),
    refreshTokenRepository: new KyselyRefreshTokenRepository(db)
  };
}