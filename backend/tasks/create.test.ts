import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { api } from 'encore.dev/api';
import { tasksDB } from './db';
import { create } from './create';
import type { CreateTaskRequest } from './types';

describe('create task API', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await tasksDB.exec`DELETE FROM tasks WHERE title LIKE 'Test Task%'`;
  });

  afterEach(async () => {
    // Clean up test data
    await tasksDB.exec`DELETE FROM tasks WHERE title LIKE 'Test Task%'`;
  });

  it('should create a task with all fields', async () => {
    const request: CreateTaskRequest = {
      title: 'Test Task 1',
      description: 'Test description',
      category: 'kitchen',
      priority: 'high',
      status: 'not-started',
      progress: 0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    const result = await create(request);

    expect(result.id).toBeDefined();
    expect(result.title).toBe(request.title);
    expect(result.description).toBe(request.description);
    expect(result.category).toBe(request.category);
    expect(result.priority).toBe(request.priority);
    expect(result.status).toBe(request.status);
    expect(result.progress).toBe(request.progress);
    expect(result.startDate).toEqual(request.startDate);
    expect(result.endDate).toEqual(request.endDate);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should create a task with minimal fields', async () => {
    const request: CreateTaskRequest = {
      title: 'Test Task 2',
      category: 'bathroom',
      priority: 'medium',
      status: 'in-progress',
      progress: 50,
    };

    const result = await create(request);

    expect(result.id).toBeDefined();
    expect(result.title).toBe(request.title);
    expect(result.description).toBeUndefined();
    expect(result.category).toBe(request.category);
    expect(result.priority).toBe(request.priority);
    expect(result.status).toBe(request.status);
    expect(result.progress).toBe(request.progress);
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
  });

  it('should persist the task in the database', async () => {
    const request: CreateTaskRequest = {
      title: 'Test Task 3',
      category: 'living room',
      priority: 'low',
      status: 'completed',
      progress: 100,
    };

    const result = await create(request);

    // Verify the task exists in the database
    const dbTask = await tasksDB.queryRow`
      SELECT * FROM tasks WHERE id = ${result.id}
    `;

    expect(dbTask).toBeDefined();
    expect(dbTask!.title).toBe(request.title);
    expect(dbTask!.category).toBe(request.category);
  });

  it('should handle empty description', async () => {
    const request: CreateTaskRequest = {
      title: 'Test Task 4',
      description: '',
      category: 'bedroom',
      priority: 'medium',
      status: 'not-started',
      progress: 0,
    };

    const result = await create(request);

    expect(result.description).toBeUndefined();
  });
});
