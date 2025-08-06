// src/repositories/tag.repository.ts
export interface Tag {
  id: number;
  name: string;
  createdAt: Date;
  userId: number;
}

export interface TagRepository {
  findAll(userId: number): Promise<Tag[]>;
  findById(id: number): Promise<Tag | undefined>;
  findByName(name: string, userId: number): Promise<Tag | undefined>;
  findOrCreate(name: string, userId: number): Promise<Tag>;
  create(name: string, userId: number): Promise<Tag>;
  delete(id: number): Promise<Tag | undefined>;
  deleteByName(name: string, userId: number): Promise<Tag | undefined>;
}