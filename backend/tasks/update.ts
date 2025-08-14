import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { UpdateTaskRequest, Task } from "./types";

// Updates an existing task.
export const update = api<UpdateTaskRequest, Task>(
  { expose: true, method: "PUT", path: "/tasks/:id" },
  async (req) => {
    const { id, ...updates } = req;
    const now = new Date();

    // Check if task exists
    const existingTask = await tasksDB.queryRow`
      SELECT id FROM tasks WHERE id = ${id}
    `;

    if (!existingTask) {
      throw APIError.notFound("Task not found");
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push("title = $" + (updateValues.length + 1));
      updateValues.push(updates.title);
    }
    if (updates.description !== undefined) {
      updateFields.push("description = $" + (updateValues.length + 1));
      updateValues.push(updates.description || null);
    }
    if (updates.category !== undefined) {
      updateFields.push("category = $" + (updateValues.length + 1));
      updateValues.push(updates.category);
    }
    if (updates.priority !== undefined) {
      updateFields.push("priority = $" + (updateValues.length + 1));
      updateValues.push(updates.priority);
    }
    if (updates.status !== undefined) {
      updateFields.push("status = $" + (updateValues.length + 1));
      updateValues.push(updates.status);
    }
    if (updates.progress !== undefined) {
      updateFields.push("progress = $" + (updateValues.length + 1));
      updateValues.push(updates.progress);
    }
    if (updates.startDate !== undefined) {
      updateFields.push("start_date = $" + (updateValues.length + 1));
      updateValues.push(updates.startDate || null);
    }
    if (updates.endDate !== undefined) {
      updateFields.push("end_date = $" + (updateValues.length + 1));
      updateValues.push(updates.endDate || null);
    }

    updateFields.push("updated_at = $" + (updateValues.length + 1));
    updateValues.push(now);

    updateValues.push(id); // for WHERE clause

    const query = `
      UPDATE tasks 
      SET ${updateFields.join(", ")} 
      WHERE id = $${updateValues.length}
    `;

    await tasksDB.rawExec(query, ...updateValues);

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
