// src/repositories/kysely-tag.repository.ts
import { Kysely } from 'kysely';
import { Database } from '../db/schema';
import { Tag, TagRepository } from './tag.repository';

export class KyselyTagRepository implements TagRepository {
  constructor(private db: Kysely<Database>) {}

  async findAll(userId: number): Promise<Tag[]> {
    const tags = await this.db
      .selectFrom('tag')
      .selectAll()
      .where('user_id', '=', userId)
      .execute();
    
    return tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      createdAt: tag.created_at,
      userId: tag.user_id
    }));
  }

  async findById(id: number): Promise<Tag | undefined> {
    const tag = await this.db
      .selectFrom('tag')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    
    if (!tag) return undefined;
    
    return {
      id: tag.id,
      name: tag.name,
      createdAt: tag.created_at,
      userId: tag.user_id
    };
  }

  async findByName(name: string, userId: number): Promise<Tag | undefined> {
    const tag = await this.db
      .selectFrom('tag')
      .selectAll()
      .where('name', '=', name)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    
    if (!tag) return undefined;
    
    return {
      id: tag.id,
      name: tag.name,
      createdAt: tag.created_at,
      userId: tag.user_id
    };
  }

  async findOrCreate(name: string, userId: number): Promise<Tag> {
    // First try to find the tag
    const existingTag = await this.findByName(name, userId);
    if (existingTag) return existingTag;
    
    // If not found, create it
    return this.create(name, userId);
  }

  async create(name: string, userId: number): Promise<Tag> {
    const result = await this.db
      .insertInto('tag')
      .values({ 
        name, 
        created_at: new Date(),
        user_id: userId 
      })
      .returning(['id', 'name', 'created_at', 'user_id'])
      .executeTakeFirstOrThrow();
    
    return {
      id: result.id,
      name: result.name,
      createdAt: result.created_at,
      userId: result.user_id
    };
  }

  async delete(id: number): Promise<Tag | undefined> {
    // Get the tag before deleting it
    const tagToDelete = await this.findById(id);
    if (!tagToDelete) return undefined;
    
    // Delete the tag
    await this.db
      .deleteFrom('tag')
      .where('id', '=', id)
      .execute();
    
    return tagToDelete;
  }

  async deleteByName(name: string, userId: number): Promise<Tag | undefined> {
    const tagToDelete = await this.findByName(name, userId);
    if (!tagToDelete) return undefined;

    return this.delete(tagToDelete.id);
  }
}