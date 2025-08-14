import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { APIError } from 'encore.dev/api';
import { tasksDB } from './db';
import { create } from './create';
import { completeTask } from './complete_task';

describe('complete task API', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await tasksDB.exec`DELETE FROM tasks WHERE title LIKE 'Test Task%'`;
  });

  afterEach(async () => {
    // Clean up test data
    await tasksDB.exec`DELETE FROM tasks WHERE title LIKE 'Test Task%'`;
  });

  it('should mark task as completed with 100% progress', async () => {
    const task = await create({
      title: 'Test Task to Complete',
      category: 'kitchen',
      priority: 'medium',
      status: 'in-progress',
      progress: 75,
    });

    const result = await completeTask({ id: task.id });

    expect(result.status).toBe('completed');
    expect(result.progress).toBe(100);
    expect(result.updatedAt.getTime()).toBeGreaterThan(task.updatedAt.getTime());
    // Other fields should remain unchanged
    expect(result.title).toBe(task.title);
    expect(result.category).toBe(task.category);
    expect(result.priority).toBe(task.priority);
  });

  it('should complete a not-started task', async () => {
    const task = await create({
      title: 'Test Task Not Started',
      category: 'bathroom',
      priority: 'high',
      status: 'not-started',
      progress: 0,
    });

    const result = await completeTask({ id: task.id });

    expect(result.status).toBe('completed');
    expect(result.progress).toBe(100);
  });

  it('should complete an already completed task', async () => {
    const task = await create({
      title: 'Test Task Already Completed',
      category: 'living room',
      priority: 'low',
      status: 'completed',
      progress: 100,
    });

    const result = await completeTask({ id: task.id });

    expect(result.status).toBe('completed');
    expect(result.progress).toBe(100);
  });

  it('should throw error for non-existent task', async () => {
    await expect(completeTask({ id: 'non-existent-id' })).rejects.toThrow(APIError);
  });

  it('should persist changes in database', async () => {
    const task = await create({
      title: 'Test Task Persistence',
      category: 'bedroom',
      priority: 'medium',
      status: 'in-progress',
      progress: 50,
    });

    await completeTask({ id: task.id });

    // Verify changes are persisted
    const dbTask = await tasksDB.queryRow`
      SELECT * FROM tasks WHERE id = ${task.id}
    `;

    expect(dbTask!.status).toBe('completed');
    expect(dbTask!.progress).toBe(100);
  });
});
