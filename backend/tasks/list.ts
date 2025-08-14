import { api } from "encore.dev/api";
import { tasksDB } from "./db";
import type { ListTasksResponse, Task, Subtask } from "./types";

// Retrieves all tasks with their subtasks, ordered by creation date (latest first).
export const list = api<void, ListTasksResponse>(
  { expose: true, method: "GET", path: "/tasks" },
  async () => {
    const tasks: Task[] = [];
    
    const rows = tasksDB.query<Task>`
      SELECT 
        id, title, description, category, priority, status, progress,
        start_date as "startDate", end_date as "endDate",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM tasks 
      ORDER BY created_at DESC
    `;

    for await (const row of rows) {
      // Get subtasks for this task
      const subtasks: Subtask[] = [];
      const subtaskRows = tasksDB.query<Subtask>`
        SELECT 
          id, task_id as "taskId", title, completed,
          created_at as "createdAt", updated_at as "updatedAt"
        FROM subtasks 
        WHERE task_id = ${row.id}
        ORDER BY created_at ASC
      `;

      for await (const subtaskRow of subtaskRows) {
        subtasks.push(subtaskRow);
      }

      tasks.push({
        ...row,
        subtasks
      });
    }

    return { tasks };
  }
);
