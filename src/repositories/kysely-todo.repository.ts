// src/repositories/kysely-todo.repository.ts
import { Kysely } from "kysely";
import { Database } from "../db/schema";
import { Todo, PriorityLevel } from "../models/todo.model";
import { TodoRepository } from "./todo.repository";
import { Tag } from "./tag.repository";

export class KyselyTodoRepository implements TodoRepository {
  constructor(private db: Kysely<Database>) {}

  async findAll(): Promise<Todo[]> {
    // Query the database for all todos
    const todos = await this.db.selectFrom("todo").selectAll().execute();

    // Map database records to our Todo model
    const result: Todo[] = [];

    for (const todo of todos) {
      const tags = await this.getTags(todo.id);

      result.push({
        id: todo.id,
        title: todo.title,
        description: todo.description || undefined,
        completed: todo.completed,
        createdAt: todo.created_at,
        dueDate: todo.due_date || undefined,
        completedAt: todo.completed_at || undefined,
        priority: todo.priority as PriorityLevel,
        imageUrls: todo.image_urls as string[],
        tags: tags,
      });
    }

    return result;
  }

  async findById(id: number): Promise<Todo | undefined> {
    // Query the database for a specific todo
    const todo = await this.db
      .selectFrom("todo")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    // If no todo is found, return undefined
    if (!todo) return undefined;

    // Get the tags for this todo
    const tags = await this.getTags(id);

    // Map database record to our Todo model
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description || undefined,
      completed: todo.completed,
      createdAt: todo.created_at,
      dueDate: todo.due_date || undefined,
      completedAt: todo.completed_at || undefined,
      priority: todo.priority as PriorityLevel,
      imageUrls: todo.image_urls as string[],
      tags: tags,
    };
  }

  async create(
    todoData: Omit<Todo, "id" | "createdAt" | "tags">,
    tagIds: number[] = []
  ): Promise<Todo> {
    // Begin a transaction
    return await this.db.transaction().execute(async (trx) => {
      // Define the insert values
      const insertValues = {
        title: todoData.title,
        description: todoData.description || null,
        completed: todoData.completed,
        due_date: todoData.dueDate || null,
        completed_at: todoData.completedAt || null,
        priority: todoData.priority,
        image_urls: JSON.stringify(todoData.imageUrls || []),
      };

      // Insert the todo
      const result = await trx
        .insertInto("todo")
        .values(insertValues as any)
        .returning([
          "id",
          "title",
          "description",
          "completed",
          "created_at",
          "due_date",
          "completed_at",
          "priority",
          "image_urls",
        ])
        .executeTakeFirstOrThrow();

      // Add tags only if provided
      if (tagIds.length > 0) {
        await this.setTags(result.id, tagIds, trx);
      }

      // Get the tags (will be empty array if none were provided)
      const tags = await this.getTags(result.id, trx);

      // Return the complete todo with tags
      return {
        id: result.id,
        title: result.title,
        description: result.description || undefined,
        completed: result.completed,
        createdAt: result.created_at,
        dueDate: result.due_date || undefined,
        completedAt: result.completed_at || undefined,
        priority: result.priority as PriorityLevel,
        imageUrls: result.image_urls as string[],
        tags: tags,
      };
    });
  }

  async update(
    id: number,
    todoData: Partial<Omit<Todo, "id" | "createdAt" | "tags">>,
    tagIds?: number[]
  ): Promise<Todo | undefined> {
    // Begin a transaction
    return await this.db.transaction().execute(async (trx) => {
      // Prepare the update data
      const updateData: any = {};

      if (todoData.title !== undefined) updateData.title = todoData.title;
      if (todoData.description !== undefined)
        updateData.description = todoData.description || null;
      if (todoData.completed !== undefined)
        updateData.completed = todoData.completed;
      if (todoData.dueDate !== undefined)
        updateData.due_date = todoData.dueDate || null;
      if (todoData.completedAt !== undefined)
        updateData.completed_at = todoData.completedAt || null;
      if (todoData.priority !== undefined)
        updateData.priority = todoData.priority;
      if (todoData.imageUrls !== undefined)
        updateData.image_urls = JSON.stringify(todoData.imageUrls);

      // Special handling for completed status
      if (todoData.completed === true) {
        // Check if the todo is currently not completed
        const currentTodo = await this.findById(id);
        if (currentTodo && !currentTodo.completed) {
          updateData.completed_at = new Date();
        }
      } else if (todoData.completed === false) {
        updateData.completed_at = null;
      }

      // If nothing to update in the todo itself, and no tag changes
      if (Object.keys(updateData).length === 0 && tagIds === undefined) {
        return this.findById(id);
      }

      // Update the todo if there are changes
      if (Object.keys(updateData).length > 0) {
        const result = await trx
          .updateTable("todo")
          .set(updateData)
          .where("id", "=", id)
          .returning(["id"])
          .executeTakeFirst();

        // If no todo is found to update, return undefined
        if (!result) return undefined;
      }

      // Update tags if provided
      if (tagIds !== undefined) {
        await this.setTags(id, tagIds, trx);
      }

      // Get the updated todo
      return this.findById(id);
    });
  }

  async delete(id: number): Promise<Todo | undefined> {
    // Begin a transaction
    return await this.db.transaction().execute(async (trx) => {
      // Get the todo before deleting it
      const todoToDelete = await this.findById(id);
      if (!todoToDelete) return undefined;

      // Delete all tag associations first
      await trx.deleteFrom("todo_tag").where("todo_id", "=", id).execute();

      // Delete the todo
      await trx.deleteFrom("todo").where("id", "=", id).execute();

      return todoToDelete;
    });
  }

  async markComplete(id: number): Promise<Todo | undefined> {
    // Special method to mark a todo as complete
    return this.update(id, {
      completed: true,
      completedAt: new Date(),
    });
  }

  async findByTagId(tagId: number): Promise<Todo[]> {
    // Find all todos that have a specific tag
    const todoIds = await this.db
      .selectFrom("todo_tag")
      .select("todo_id")
      .where("tag_id", "=", tagId)
      .execute();

    // Get the complete todos
    const todos: Todo[] = [];
    for (const { todo_id } of todoIds) {
      const todo = await this.findById(todo_id);
      if (todo) todos.push(todo);
    }

    return todos;
  }

  async addTag(todoId: number, tagId: number, trx = this.db): Promise<void> {
    // Check if the association already exists
    const existing = await trx
      .selectFrom("todo_tag")
      .selectAll()
      .where("todo_id", "=", todoId)
      .where("tag_id", "=", tagId)
      .executeTakeFirst();

    // If not, create it
    if (!existing) {
      await trx
        .insertInto("todo_tag")
        .values({ todo_id: todoId, tag_id: tagId })
        .execute();
    }
  }

  async removeTag(todoId: number, tagId: number, trx = this.db): Promise<void> {
    // Remove the association
    await trx
      .deleteFrom("todo_tag")
      .where("todo_id", "=", todoId)
      .where("tag_id", "=", tagId)
      .execute();
  }

  async setTags(
    todoId: number,
    tagIds: number[],
    trx = this.db
  ): Promise<void> {
    // Remove all existing tag associations
    await trx.deleteFrom("todo_tag").where("todo_id", "=", todoId).execute();

    // Add new associations
    if (tagIds.length > 0) {
      const values = tagIds.map((tagId) => ({
        todo_id: todoId,
        tag_id: tagId,
      }));

      await trx.insertInto("todo_tag").values(values).execute();
    }
  }

  async getTags(todoId: number, trx = this.db): Promise<Tag[]> {
    // Get all tags for a todo
    const result = await trx
      .selectFrom("tag")
      .innerJoin("todo_tag", "todo_tag.tag_id", "tag.id")
      .selectAll("tag")
      .where("todo_tag.todo_id", "=", todoId)
      .execute();

    // Map to Tag model
    return result.map((tag) => ({
      id: tag.id,
      name: tag.name,
      createdAt: tag.created_at,
    }));
  }
}
