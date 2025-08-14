import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { UpdateSubtaskRequest, Subtask } from "./types";

// Updates an existing subtask.
export const updateSubtask = api<UpdateSubtaskRequest, Subtask>(
  { expose: true, method: "PUT", path: "/subtasks/:id" },
  async (req) => {
    const { id, ...updates } = req;
    const now = new Date();

    // Check if subtask exists
    const existingSubtask = await tasksDB.queryRow`
      SELECT id FROM subtasks WHERE id = ${id}
    `;

    if (!existingSubtask) {
      throw APIError.notFound("Subtask not found");
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push("title = $" + (updateValues.length + 1));
      updateValues.push(updates.title);
    }
    if (updates.completed !== undefined) {
      updateFields.push("completed = $" + (updateValues.length + 1));
      updateValues.push(updates.completed);
    }

    updateFields.push("updated_at = $" + (updateValues.length + 1));
    updateValues.push(now);

    updateValues.push(id); // for WHERE clause

    const query = `
      UPDATE subtasks 
      SET ${updateFields.join(", ")} 
      WHERE id = $${updateValues.length}
    `;

    await tasksDB.rawExec(query, ...updateValues);

    const updatedSubtask = await tasksDB.queryRow<Subtask>`
      SELECT 
        id, task_id as "taskId", title, completed,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM subtasks 
      WHERE id = ${id}
    `;

    if (!updatedSubtask) {
      throw APIError.internal("Failed to retrieve updated subtask");
    }

    return updatedSubtask;
  }
);
