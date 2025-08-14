import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tasksDB } from './db';
import { list } from './list';
import { create } from './create';
import { createSubtask } from './create_subtask';
import type { CreateTaskRequest } from './types';

describe('list tasks API', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await tasksDB.exec`DELETE FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE title LIKE 'Test Task%')`;
    await tasksDB.exec`DELETE FROM tasks WHERE title LIKE 'Test Task%'`;
  });

  afterEach(async () => {
    // Clean up test data
    await tasksDB.exec`DELETE FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE title LIKE 'Test Task%')`;
    await tasksDB.exec`DELETE FROM tasks WHERE title LIKE 'Test Task%'`;
  });

  it('should return empty list when no tasks exist', async () => {
    const result = await list();
    expect(result.tasks).toEqual([]);
  });

  it('should return all tasks ordered by creation date (latest first)', async () => {
    // Create tasks with slight delay to ensure different timestamps
    const task1 = await create({
      title: 'Test Task 1',
      category: 'kitchen',
      priority: 'high',
      status: 'not-started',
      progress: 0,
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const task2 = await create({
      title: 'Test Task 2',
      category: 'bathroom',
      priority: 'medium',
      status: 'in-progress',
      progress: 50,
    });

    const result = await list();

    expect(result.tasks).toHaveLength(2);
    // Should be ordered by creation date (latest first)
    expect(result.tasks[0].title).toBe('Test Task 2');
    expect(result.tasks[1].title).toBe('Test Task 1');
  });

  it('should include subtasks for each task', async () => {
    const task = await create({
      title: 'Test Task with Subtasks',
      category: 'kitchen',
      priority: 'high',
      status: 'not-started',
      progress: 0,
    });

    const subtask1 = await createSubtask({
      taskId: task.id,
      title: 'Subtask 1',
    });

    const subtask2 = await createSubtask({
      taskId: task.id,
      title: 'Subtask 2',
    });

    const result = await list();

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].subtasks).toHaveLength(2);
    expect(result.tasks[0].subtasks![0].title).toBe('Subtask 1');
    expect(result.tasks[0].subtasks![1].title).toBe('Subtask 2');
  });

  it('should return tasks with empty subtasks array when no subtasks exist', async () => {
    await create({
      title: 'Test Task without Subtasks',
      category: 'kitchen',
      priority: 'high',
      status: 'not-started',
      progress: 0,
    });

    const result = await list();

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].subtasks).toEqual([]);
  });

  it('should return all task fields correctly', async () => {
    const taskData: CreateTaskRequest = {
      title: 'Test Task Complete',
      description: 'Test description',
      category: 'living room',
      priority: 'low',
      status: 'completed',
      progress: 100,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    await create(taskData);

    const result = await list();

    expect(result.tasks).toHaveLength(1);
    const task = result.tasks[0];
    expect(task.title).toBe(taskData.title);
    expect(task.description).toBe(taskData.description);
    expect(task.category).toBe(taskData.category);
    expect(task.priority).toBe(taskData.priority);
    expect(task.status).toBe(taskData.status);
    expect(task.progress).toBe(taskData.progress);
    expect(task.startDate).toEqual(taskData.startDate);
    expect(task.endDate).toEqual(taskData.endDate);
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });
});
