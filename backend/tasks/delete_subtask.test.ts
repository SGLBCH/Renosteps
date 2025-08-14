import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { APIError } from 'encore.dev/api';
import { tasksDB } from './db';
import { create } from './create';
import { createSubtask } from './create_subtask';
import { deleteSubtask } from './delete_subtask';

describe('delete subtask API', () => {
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

  it('should delete an existing subtask', async () => {
    const task = await create({
      title: 'Test Task for Subtask Deletion',
      category: 'kitchen',
      priority: 'medium',
      status: 'not-started',
      progress: 0,
    });

    const subtask = await createSubtask({
      taskId: task.id,
      title: 'Subtask to Delete',
    });

    await deleteSubtask({ id: subtask.id });

    // Verify subtask is deleted
    const dbSubtask = await tasksDB.queryRow`
      SELECT * FROM subtasks WHERE id = ${subtask.id}
    `;

    expect(dbSubtask).toBeNull();
  });

  it('should throw error for non-existent subtask', async () => {
    await expect(deleteSubtask({ id: 'non-existent-id' })).rejects.toThrow(APIError);
  });

  it('should not affect parent task when deleting subtask', async () => {
    const task = await create({
      title: 'Test Task Parent',
      category: 'bathroom',
      priority: 'high',
      status: 'in-progress',
      progress: 50,
    });

    const subtask = await createSubtask({
      taskId: task.id,
      title: 'Subtask to Delete',
    });

    await deleteSubtask({ id: subtask.id });

    // Verify parent task still exists
    const dbTask = await tasksDB.queryRow`
      SELECT * FROM tasks WHERE id = ${task.id}
    `;

    expect(dbTask).toBeDefined();
    expect(dbTask!.title).toBe('Test Task Parent');
  });

  it('should not affect other subtasks', async () => {
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

    await deleteSubtask({ id: subtask1.id });

    // Verify subtask1 is deleted
    const dbSubtask1 = await tasksDB.queryRow`
      SELECT * FROM subtasks WHERE id = ${subtask1.id}
    `;
    expect(dbSubtask1).toBeNull();

    // Verify subtask2 still exists
    const dbSubtask2 = await tasksDB.queryRow`
      SELECT * FROM subtasks WHERE id = ${subtask2.id}
    `;
    expect(dbSubtask2).toBeDefined();
    expect(dbSubtask2!.title).toBe('Subtask 2');
  });

  it('should delete only the specified subtask from multiple subtasks', async () => {
    const task = await create({
      title: 'Test Task Selective Deletion',
      category: 'bedroom',
      priority: 'medium',
      status: 'in-progress',
      progress: 25,
    });

    const subtask1 = await createSubtask({
      taskId: task.id,
      title: 'Keep This Subtask',
    });

    const subtask2 = await createSubtask({
      taskId: task.id,
      title: 'Delete This Subtask',
    });

    const subtask3 = await createSubtask({
      taskId: task.id,
      title: 'Keep This Too',
    });

    await deleteSubtask({ id: subtask2.id });

    // Verify correct subtask is deleted
    const remainingSubtasks = await tasksDB.queryAll`
      SELECT * FROM subtasks WHERE task_id = ${task.id} ORDER BY created_at
    `;

    expect(remainingSubtasks).toHaveLength(2);
    expect(remainingSubtasks[0].title).toBe('Keep This Subtask');
    expect(remainingSubtasks[1].title).toBe('Keep This Too');
  });
});
