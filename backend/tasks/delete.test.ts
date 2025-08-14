import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { APIError } from 'encore.dev/api';
import { tasksDB } from './db';
import { create } from './create';
import { deleteTask } from './delete';
import { createSubtask } from './create_subtask';

describe('delete task API', () => {
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

  it('should delete an existing task', async () => {
    const task = await create({
      title: 'Test Task to Delete',
      category: 'kitchen',
      priority: 'medium',
      status: 'not-started',
      progress: 0,
    });

    await deleteTask({ id: task.id });

    // Verify task is deleted
    const dbTask = await tasksDB.queryRow`
      SELECT * FROM tasks WHERE id = ${task.id}
    `;

    expect(dbTask).toBeNull();
  });

  it('should delete task and its subtasks (cascade)', async () => {
    const task = await create({
      title: 'Test Task with Subtasks to Delete',
      category: 'bathroom',
      priority: 'high',
      status: 'not-started',
      progress: 0,
    });

    await createSubtask({
      taskId: task.id,
      title: 'Subtask 1',
    });

    await createSubtask({
      taskId: task.id,
      title: 'Subtask 2',
    });

    await deleteTask({ id: task.id });

    // Verify task is deleted
    const dbTask = await tasksDB.queryRow`
      SELECT * FROM tasks WHERE id = ${task.id}
    `;
    expect(dbTask).toBeNull();

    // Verify subtasks are also deleted (cascade)
    const subtasks = await tasksDB.queryAll`
      SELECT * FROM subtasks WHERE task_id = ${task.id}
    `;
    expect(subtasks).toHaveLength(0);
  });

  it('should throw error for non-existent task', async () => {
    await expect(deleteTask({ id: 'non-existent-id' })).rejects.toThrow(APIError);
  });

  it('should not affect other tasks', async () => {
    const task1 = await create({
      title: 'Test Task 1',
      category: 'kitchen',
      priority: 'medium',
      status: 'not-started',
      progress: 0,
    });

    const task2 = await create({
      title: 'Test Task 2',
      category: 'bathroom',
      priority: 'high',
      status: 'in-progress',
      progress: 50,
    });

    await deleteTask({ id: task1.id });

    // Verify task1 is deleted
    const dbTask1 = await tasksDB.queryRow`
      SELECT * FROM tasks WHERE id = ${task1.id}
    `;
    expect(dbTask1).toBeNull();

    // Verify task2 still exists
    const dbTask2 = await tasksDB.queryRow`
      SELECT * FROM tasks WHERE id = ${task2.id}
    `;
    expect(dbTask2).toBeDefined();
    expect(dbTask2!.title).toBe('Test Task 2');
  });
});
