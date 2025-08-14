import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { APIError } from 'encore.dev/api';
import { tasksDB } from './db';
import { create } from './create';
import { createSubtask } from './create_subtask';

describe('create subtask API', () => {
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

  it('should create a subtask for an existing task', async () => {
    const task = await create({
      title: 'Test Task for Subtask',
      category: 'kitchen',
      priority: 'medium',
      status: 'not-started',
      progress: 0,
    });

    const result = await createSubtask({
      taskId: task.id,
      title: 'Test Subtask',
    });

    expect(result.id).toBeDefined();
    expect(result.taskId).toBe(task.id);
    expect(result.title).toBe('Test Subtask');
    expect(result.completed).toBe(false);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent parent task', async () => {
    await expect(createSubtask({
      taskId: 'non-existent-id',
      title: 'Test Subtask',
    })).rejects.toThrow(APIError);
  });

  it('should persist the subtask in the database', async () => {
    const task = await create({
      title: 'Test Task for DB Subtask',
      category: 'bathroom',
      priority: 'high',
      status: 'in-progress',
      progress: 25,
    });

    const result = await createSubtask({
      taskId: task.id,
      title: 'Test DB Subtask',
    });

    // Verify the subtask exists in the database
    const dbSubtask = await tasksDB.queryRow`
      SELECT * FROM subtasks WHERE id = ${result.id}
    `;

    expect(dbSubtask).toBeDefined();
    expect(dbSubtask!.task_id).toBe(task.id);
    expect(dbSubtask!.title).toBe('Test DB Subtask');
    expect(dbSubtask!.completed).toBe(false);
  });

  it('should create multiple subtasks for the same task', async () => {
    const task = await create({
      title: 'Test Task Multiple Subtasks',
      category: 'living room',
      priority: 'low',
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

    expect(subtask1.taskId).toBe(task.id);
    expect(subtask2.taskId).toBe(task.id);
    expect(subtask1.id).not.toBe(subtask2.id);

    // Verify both subtasks exist in database
    const dbSubtasks = await tasksDB.queryAll`
      SELECT * FROM subtasks WHERE task_id = ${task.id} ORDER BY created_at
    `;

    expect(dbSubtasks).toHaveLength(2);
    expect(dbSubtasks[0].title).toBe('Subtask 1');
    expect(dbSubtasks[1].title).toBe('Subtask 2');
  });
});
