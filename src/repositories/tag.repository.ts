// src/repositories/tag.repository.ts
export interface Tag {
  id: number;
  name: string;
  createdAt: Date;
}

export interface TagRepository {
  findAll(): Promise<Tag[]>;
  findById(id: number): Promise<Tag | undefined>;
  findByName(name: string): Promise<Tag | undefined>;
  findOrCreate(name: string): Promise<Tag>;
  create(name: string): Promise<Tag>;
  delete(id: number): Promise<Tag | undefined>;
  deleteByName(name: string): Promise<Tag | undefined>;
}