import { api } from "encore.dev/api";
import { tasksDB } from "./db";
import type { ListTasksResponse, Task } from "./types";

// Retrieves all tasks, ordered by creation date (latest first).
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
      tasks.push(row);
    }

    return { tasks };
  }
);
