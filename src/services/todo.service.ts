// src/services/todo.service.ts
import { Todo, PriorityLevel } from "../models/todo.model";
import { TodoRepository } from "../repositories/todo.repository";
import { TagRepository } from "../repositories/tag.repository";
import { NotFoundError } from "../utils/errors";

export class TodoService {
  constructor(
    private todoRepository: TodoRepository,
    private tagRepository: TagRepository
  ) {}

  async findAll(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }

  async findById(id: number): Promise<Todo> {
    const todo = await this.todoRepository.findById(id);

    if (!todo) {
      throw new NotFoundError("Todo", id);
    }

    return todo;
  }

  async create(
    todoData: Omit<
      Todo,
      "id" | "createdAt" | "completed" | "completedAt" | "tags"
    > & { tags?: string[] }
  ): Promise<Todo> {
    // Set default values
    const newTodo = {
      ...todoData,
      completed: false,
      imageUrls: todoData.imageUrls || [],
      priority: todoData.priority || "medium",
    };

    // Handle tags - make sure they're optional
    const tagIds: number[] = [];
    if (todoData.tags && todoData.tags.length > 0) {
      for (const tagName of todoData.tags) {
        const tag = await this.tagRepository.findOrCreate(tagName);
        tagIds.push(tag.id);
      }
    }

    return this.todoRepository.create(newTodo, tagIds);
  }

  async update(
    id: number,
    data: Partial<Omit<Todo, "id" | "createdAt" | "tags">> & {
      tagNames?: string[];
    }
  ): Promise<Todo> {
    // Prepare tag IDs if tag names were provided
    let tagIds: number[] | undefined = undefined;

    if (data.tagNames !== undefined) {
      tagIds = [];
      for (const tagName of data.tagNames) {
        const tag = await this.tagRepository.findOrCreate(tagName);
        tagIds.push(tag.id);
      }

      // Remove tagNames from data as it's not a direct todo property
      delete data.tagNames;
    }

    const updatedTodo = await this.todoRepository.update(id, data, tagIds);

    if (!updatedTodo) {
      throw new NotFoundError("Todo", id);
    }

    return updatedTodo;
  }

  async remove(id: number): Promise<Todo> {
    const deletedTodo = await this.todoRepository.delete(id);

    if (!deletedTodo) {
      throw new NotFoundError("Todo", id);
    }

    return deletedTodo;
  }

  async completeTodo(id: number): Promise<Todo> {
    const completedTodo = await this.todoRepository.markComplete(id);

    if (!completedTodo) {
      throw new NotFoundError("Todo", id);
    }

    return completedTodo;
  }

  async findByTag(tagName: string): Promise<Todo[]> {
    const tag = await this.tagRepository.findByName(tagName);

    if (!tag) {
      return [];
    }

    return this.todoRepository.findByTagId(tag.id);
  }

  async getAllTags(): Promise<{ id: number; name: string; count: number }[]> {
    // Get all tags
    const tags = await this.tagRepository.findAll();

    // Count todos for each tag
    const result = [];
    for (const tag of tags) {
      const todos = await this.todoRepository.findByTagId(tag.id);
      result.push({
        id: tag.id,
        name: tag.name,
        count: todos.length,
      });
    }

    return result;
  }

  async getUsedTags(): Promise<{ id: number; name: string; count: number }[]> {
    const allTags = await this.getAllTags();
    return allTags.filter((tag) => tag.count > 0);
  }

  async getUnusedTags(): Promise<
    { id: number; name: string; count: number }[]
  > {
    const allTags = await this.getAllTags();
    return allTags.filter((tag) => tag.count === 0);
  }

  async createTag(
    name: string
  ): Promise<{ id: number; name: string; count: number }> {
    // Check if tag already exists
    const existingTag = await this.tagRepository.findByName(name);
    if (existingTag) {
      throw new Error(`Tag with name "${name}" already exists`);
    }

    // Create the tag
    const newTag = await this.tagRepository.create(name);

    // Return with count 0 since it's a new tag
    return {
      id: newTag.id,
      name: newTag.name,
      count: 0,
    };
  }

  async deleteTag(id: number): Promise<{ id: number; name: string }> {
    // Check if tag is in use
    const todos = await this.todoRepository.findByTagId(id);
    if (todos.length > 0) {
      throw new Error(
        `Cannot delete tag with ID ${id} because it is used by ${todos.length} todos`
      );
    }

    // Delete the tag
    const deletedTag = await this.tagRepository.delete(id);
    if (!deletedTag) {
      throw new NotFoundError("Tag", id);
    }

    return {
      id: deletedTag.id,
      name: deletedTag.name,
    };
  }

  async deleteTagByName(name: string): Promise<{ id: number; name: string }> {
    // Find the tag
    const tag = await this.tagRepository.findByName(name);
    if (!tag) {
      throw new NotFoundError("Tag", name);
    }

    // Delete using the ID method
    return this.deleteTag(tag.id);
  }
}
