// src/services/todo.service.ts
import { Todo, PriorityLevel } from "../models/todo.model";
import { TodoRepository } from "../repositories/todo.repository";
import { TagRepository } from "../repositories/tag.repository";
import { NotFoundError, ValidationError } from "../utils/errors";

export class TodoService {
  constructor(
    private todoRepository: TodoRepository,
    private tagRepository: TagRepository
  ) {}

  async findAll(userId: number): Promise<Todo[]> {
    return this.todoRepository.findAll(userId);
  }

  async findById(id: number, userId: number): Promise<Todo> {
    const todo = await this.todoRepository.findById(id, userId);

    if (!todo) {
      throw new NotFoundError("Todo", id);
    }

    return todo;
  }

  async create(
    todoData: Omit<
      Todo,
      "id" | "createdAt" | "completed" | "completedAt" | "tags"
    > & { tags?: string[] },
    userId: number
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
        // Find or create tag for this user
        const tag = await this.tagRepository.findOrCreate(tagName, userId);
        tagIds.push(tag.id);
      }
    }

    return this.todoRepository.create(newTodo, userId, tagIds);
  }

  async update(
    id: number,
    data: Partial<Omit<Todo, "id" | "createdAt" | "tags">> & {
      tagNames?: string[];
    },
    userId: number
  ): Promise<Todo> {
    // Prepare tag IDs if tag names were provided
    let tagIds: number[] | undefined = undefined;

    if (data.tagNames !== undefined) {
      tagIds = [];
      for (const tagName of data.tagNames) {
        const tag = await this.tagRepository.findOrCreate(tagName, userId);
        tagIds.push(tag.id);
      }

      // Remove tagNames from data as it's not a direct todo property
      delete data.tagNames;
    }

    const updatedTodo = await this.todoRepository.update(
      id,
      data,
      userId,
      tagIds
    );

    if (!updatedTodo) {
      throw new NotFoundError("Todo", id);
    }

    return updatedTodo;
  }

  async remove(id: number, userId: number): Promise<Todo> {
    const deletedTodo = await this.todoRepository.delete(id, userId);

    if (!deletedTodo) {
      throw new NotFoundError("Todo", id);
    }

    return deletedTodo;
  }

  /**
   * Toggle the completion status of a todo
   * If it's incomplete, mark as complete with timestamp
   * If it's complete, mark as incomplete and clear timestamp
   */
  async toggleTodoCompletion(id: number, userId: number): Promise<Todo> {
    console.log(`Toggling completion for todo ${id}`);

    // First, get the current todo to check its status
    const currentTodo = await this.findById(id, userId);

    // Log the current status
    console.log(`Current todo status: completed=${currentTodo.completed}`);

    // Prepare the update data based on current status
    const updateData: Partial<Omit<Todo, "id" | "createdAt" | "tags">> = {
      completed: !currentTodo.completed,
      // When marking incomplete, explicitly set completedAt to null (not undefined)
      completedAt: !currentTodo.completed ? new Date() : null,
    };

    console.log(`Updating todo ${id} with data:`, updateData);

    // Update the todo
    const updatedTodo = await this.todoRepository.update(
      id,
      updateData,
      userId
    );

    if (!updatedTodo) {
      throw new NotFoundError("Todo", id);
    }

    console.log("Todo after toggle:", JSON.stringify(updatedTodo));
    return updatedTodo;
  }

  async findByTag(tagName: string, userId: number): Promise<Todo[]> {
    const tag = await this.tagRepository.findByName(tagName, userId);

    if (!tag) {
      return [];
    }

    return this.todoRepository.findByTagId(tag.id, userId);
  }

  async getAllTags(
    userId: number
  ): Promise<{ id: number; name: string; count: number }[]> {
    // Get all tags for this user
    const tags = await this.tagRepository.findAll(userId);

    // Count todos for each tag
    const result = [];
    for (const tag of tags) {
      const todos = await this.todoRepository.findByTagId(tag.id, userId);
      result.push({
        id: tag.id,
        name: tag.name,
        count: todos.length,
      });
    }

    return result;
  }

  async getUsedTags(
    userId: number
  ): Promise<{ id: number; name: string; count: number }[]> {
    const allTags = await this.getAllTags(userId);
    return allTags.filter((tag) => tag.count > 0);
  }

  async getUnusedTags(
    userId: number
  ): Promise<{ id: number; name: string; count: number }[]> {
    const allTags = await this.getAllTags(userId);
    return allTags.filter((tag) => tag.count === 0);
  }

  async createTag(
    name: string,
    userId: number
  ): Promise<{ id: number; name: string; count: number }> {
    try {
      // Check if tag already exists for this user
      const existingTag = await this.tagRepository.findByName(name, userId);
      if (existingTag) {
        throw new ValidationError(`Tag with name "${name}" already exists`);
      }

      // Create the tag
      const newTag = await this.tagRepository.create(name, userId);

      // Return with count 0 since it's a new tag
      return {
        id: newTag.id,
        name: newTag.name,
        count: 0,
      };
    } catch (error) {
      // Properly handle database constraint errors
      if (
        error instanceof Error &&
        (error.message.includes("duplicate key") ||
          error.message.includes("unique constraint"))
      ) {
        throw new ValidationError(`Tag with name "${name}" already exists`);
      }
      // Re-throw other errors
      throw error;
    }
  }

  async deleteTag(
    id: number,
    userId: number
  ): Promise<{ id: number; name: string }> {
    // Check if tag belongs to user
    const tag = await this.tagRepository.findById(id);
    if (!tag || tag.userId !== userId) {
      throw new NotFoundError("Tag", id);
    }

    // Check if tag is in use
    const todos = await this.todoRepository.findByTagId(id, userId);
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

  async deleteTagByName(
    name: string,
    userId: number
  ): Promise<{ id: number; name: string }> {
    // Find the tag
    const tag = await this.tagRepository.findByName(name, userId);
    if (!tag) {
      throw new NotFoundError("Tag", name);
    }

    // Delete using the ID method
    return this.deleteTag(tag.id, userId);
  }
}
