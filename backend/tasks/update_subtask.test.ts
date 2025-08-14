import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { APIError } from 'encore.dev/api';
import { tasksDB } from './db';
import { create } from './create';
import { createSubtask } from './create_subtask';
import { updateSubtask } from './update_subtask';

describe('update subtask API', () => {
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

  it('should update subtask title', async () => {
    const task = await create({
      title: 'Test Task for Subtask Update',
      category: 'kitchen',
      priority: 'medium',
      status: 'not-started',
      progress: 0,
    });

    const subtask = await createSubtask({
      taskId: task.id,
      title: 'Original Subtask Title',
    });

    const result = await updateSubtask({
      id: subtask.id,
      title: 'Updated Subtask Title',
    });

    expect(result.title).toBe('Updated Subtask Title');
    expect(result.completed).toBe(false); // Should remain unchanged
    expect(result.taskId).toBe(task.id); // Should remain unchanged
    expect(result.updatedAt.getTime()).toBeGreaterThan(subtask.updatedAt.getTime());
  });

  it('should update subtask completion status', async () => {
    const task = await create({
      title: 'Test Task for Completion',
      category: 'bathroom',
      priority: 'high',
      status: 'in-progress',
      progress: 50,
    });

    const subtask = await createSubtask({
      taskId: task.id,
      title: 'Test Subtask',
    });

    const result = await updateSubtask({
      id: subtask.id,
      completed: true,
    });

    expect(result.completed).toBe(true);
    expect(result.title).toBe('Test Subtask'); // Should remain unchanged
  });

  it('should update both title and completion status', async () => {
    const task = await create({
      title: 'Test Task for Both Updates',
      category: 'living room',
      priority: 'low',
      status: 'not-started',
      progress: 0,
    });

    const subtask = await createSubtask({
      taskId: task.id,
      title: 'Original Title',
    });

    const result = await updateSubtask({
      id: subtask.id,
      title: 'New Title',
      completed: true,
    });

    expect(result.title).toBe('New Title');
    expect(result.completed).toBe(true);
  });

  it('should throw error for non-existent subtask', async () => {
    await expect(updateSubtask({
      id: 'non-existent-id',
      title: 'Updated Title',
    })).rejects.toThrow(APIError);
  });

  it('should persist changes in database', async () => {
    const task = await create({
      title: 'Test Task for Persistence',
      category: 'bedroom',
      priority: 'medium',
      status: 'in-progress',
      progress: 25,
    });

    const subtask = await createSubtask({
      taskId: task.id,
      title: 'Original Subtask',
    });

    await updateSubtask({
      id: subtask.id,
      title: 'Updated Subtask',
      completed: true,
    });

    // Verify changes are persisted
    const dbSubtask = await tasksDB.queryRow`
      SELECT * FROM subtasks WHERE id = ${subtask.id}
    `;

    expect(dbSubtask!.title).toBe('Updated Subtask');
    expect(dbSubtask!.completed).toBe(true);
  });

  it('should toggle completion status', async () => {
    const task = await create({
      title: 'Test Task for Toggle',
      category: 'exterior',
      priority: 'high',
      status: 'in-progress',
      progress: 75,
    });

    const subtask = await createSubtask({
      taskId: task.id,
      title: 'Toggle Subtask',
    });

    // Complete the subtask
    await updateSubtask({
      id: subtask.id,
      completed: true,
    });

    // Uncomplete the subtask
    const result = await updateSubtask({
      id: subtask.id,
      completed: false,
    });

    expect(result.completed).toBe(false);
  });
});
