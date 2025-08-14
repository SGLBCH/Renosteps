import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import { generateId } from "./utils";
import type { CreateTaskRequest, Task } from "./types";

// Creates a new task.
export const create = api<CreateTaskRequest, Task>(
  { expose: true, method: "POST", path: "/tasks" },
  async (req) => {
    const id = generateId();
    const now = new Date();

    await tasksDB.exec`
      INSERT INTO tasks (
        id, title, description, category, priority, status, progress, 
        start_date, end_date, created_at, updated_at
      ) VALUES (
        ${id}, ${req.title}, ${req.description || null}, ${req.category}, 
        ${req.priority}, ${req.status}, ${req.progress}, 
        ${req.startDate || null}, ${req.endDate || null}, ${now}, ${now}
      )
    `;

    const task = await tasksDB.queryRow<Task>`
      SELECT 
        id, title, description, category, priority, status, progress,
        start_date as "startDate", end_date as "endDate",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM tasks 
      WHERE id = ${id}
    `;

    if (!task) {
      throw APIError.internal("Failed to create task");
    }

    return task;
  }
);
