import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { GetTaskParams, Task } from "./types";

// Marks a task as completed and sets progress to 100%.
export const completeTask = api<GetTaskParams, Task>(
  { expose: true, method: "POST", path: "/tasks/:id/complete" },
  async ({ id }) => {
    const now = new Date();

    // Check if task exists
    const existingTask = await tasksDB.queryRow`
      SELECT id FROM tasks WHERE id = ${id}
    `;

    if (!existingTask) {
      throw APIError.notFound("Task not found");
    }

    await tasksDB.exec`
      UPDATE tasks 
      SET status = 'completed', progress = 100, updated_at = ${now}
      WHERE id = ${id}
    `;

    const updatedTask = await tasksDB.queryRow<Task>`
      SELECT 
        id, title, description, category, priority, status, progress,
        start_date as "startDate", end_date as "endDate",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM tasks 
      WHERE id = ${id}
    `;

    if (!updatedTask) {
      throw APIError.internal("Failed to retrieve updated task");
    }

    return updatedTask;
  }
);
