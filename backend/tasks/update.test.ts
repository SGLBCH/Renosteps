import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { APIError } from 'encore.dev/api';
import { tasksDB } from './db';
import { create } from './create';
import { update } from './update';
import type { CreateTaskRequest, UpdateTaskRequest } from './types';

describe('update task API', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await tasksDB.exec`DELETE FROM tasks WHERE title LIKE 'Test Task%'`;
  });

  afterEach(async () => {
    // Clean up test data
    await tasksDB.exec`DELETE FROM tasks WHERE title LIKE 'Test Task%'`;
  });

  it('should update task fields', async () => {
    const task = await create({
      title: 'Test Task Original',
      category: 'kitchen',
      priority: 'low',
      status: 'not-started',
      progress: 0,
    });

    const updateRequest: UpdateTaskRequest = {
      id: task.id,
      title: 'Test Task Updated',
      priority: 'high',
      status: 'in-progress',
      progress: 75,
    };

    const result = await update(updateRequest);

    expect(result.title).toBe('Test Task Updated');
    expect(result.priority).toBe('high');
    expect(result.status).toBe('in-progress');
    expect(result.progress).toBe(75);
    // Unchanged fields should remain the same
    expect(result.category).toBe('kitchen');
    expect(result.updatedAt.getTime()).toBeGreaterThan(task.updatedAt.getTime());
  });

  it('should update only specified fields', async () => {
    const task = await create({
      title: 'Test Task Partial',
      description: 'Original description',
      category: 'bathroom',
      priority: 'medium',
      status: 'not-started',
      progress: 0,
    });

    const updateRequest: UpdateTaskRequest = {
      id: task.id,
      progress: 50,
    };

    const result = await update(updateRequest);

    expect(result.progress).toBe(50);
    // All other fields should remain unchanged
    expect(result.title).toBe('Test Task Partial');
    expect(result.description).toBe('Original description');
    expect(result.category).toBe('bathroom');
    expect(result.priority).toBe('medium');
    expect(result.status).toBe('not-started');
  });

  it('should update dates', async () => {
    const task = await create({
      title: 'Test Task Dates',
      category: 'living room',
      priority: 'medium',
      status: 'not-started',
      progress: 0,
    });

    const newStartDate = new Date('2024-02-01');
    const newEndDate = new Date('2024-02-28');

    const updateRequest: UpdateTaskRequest = {
      id: task.id,
      startDate: newStartDate,
      endDate: newEndDate,
    };

    const result = await update(updateRequest);

    expect(result.startDate).toEqual(newStartDate);
    expect(result.endDate).toEqual(newEndDate);
  });

  it('should clear description when set to empty string', async () => {
    const task = await create({
      title: 'Test Task Clear Description',
      description: 'Original description',
      category: 'bedroom',
      priority: 'medium',
      status: 'not-started',
      progress: 0,
    });

    const updateRequest: UpdateTaskRequest = {
      id: task.id,
      description: '',
    };

    const result = await update(updateRequest);

    expect(result.description).toBeUndefined();
  });

  it('should throw error for non-existent task', async () => {
    const updateRequest: UpdateTaskRequest = {
      id: 'non-existent-id',
      title: 'Updated Title',
    };

    await expect(update(updateRequest)).rejects.toThrow(APIError);
  });

  it('should persist changes in database', async () => {
    const task = await create({
      title: 'Test Task Persistence',
      category: 'exterior',
      priority: 'low',
      status: 'not-started',
      progress: 0,
    });

    await update({
      id: task.id,
      title: 'Updated Title',
      progress: 100,
      status: 'completed',
    });

    // Verify changes are persisted
    const dbTask = await tasksDB.queryRow`
      SELECT * FROM tasks WHERE id = ${task.id}
    `;

    expect(dbTask!.title).toBe('Updated Title');
    expect(dbTask!.progress).toBe(100);
    expect(dbTask!.status).toBe('completed');
  });
});
