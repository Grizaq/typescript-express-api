// src/scripts/migrate-tags.ts
import { db } from '../db';
import { createRepositories } from '../repositories';
import { createServices } from '../services';

async function migrateTags() {
  console.log('Starting tag migration...');
  
  // Get all todos with their tags
  const todos = await db
    .selectFrom('todo')
    .select(['id', 'tags'])
    .execute();
  
  console.log(`Found ${todos.length} todos to process`);
  
  // Create repositories and services
  const repositories = createRepositories(db);
  
  // Process each todo
  for (const todo of todos) {
    const tags = todo.tags as string[];
    if (tags && tags.length > 0) {
      console.log(`Processing todo ${todo.id} with ${tags.length} tags`);
      
      // Create tags and associations
      const tagIds: number[] = [];
      for (const tagName of tags) {
        // Find or create the tag
        const tag = await repositories.tagRepository.findOrCreate(tagName);
        tagIds.push(tag.id);
      }
      
      // Set the tags for this todo
      await repositories.todoRepository.setTags(todo.id, tagIds);
    }
  }
  
  console.log('Tag migration completed successfully');
  process.exit(0);
}

migrateTags().catch(error => {
  console.error('Error during tag migration:', error);
  process.exit(1);
});