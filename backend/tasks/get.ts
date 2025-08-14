import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { GetTaskParams, Task } from "./types";

// Retrieves a specific task by ID.
export const get = api<GetTaskParams, Task>(
  { expose: true, method: "GET", path: "/tasks/:id" },
  async ({ id }) => {
    const task = await tasksDB.queryRow<Task>`
      SELECT 
        id, title, description, category, priority, status, progress,
        start_date as "startDate", end_date as "endDate",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM tasks 
      WHERE id = ${id}
    `;

    if (!task) {
      throw APIError.notFound("Task not found");
    }

    return task;
  }
);
