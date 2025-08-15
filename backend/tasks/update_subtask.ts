import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB } from "./db";
import type { UpdateSubtaskRequest, Subtask } from "./types";

// Updates an existing subtask.
export const updateSubtask = api<UpdateSubtaskRequest, Subtask>(
  { expose: true, method: "PUT", path: "/subtasks/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);
    const { id, ...updates } = req;

    try {
      // Convert string ID to number for database query
      const subtaskId = parseInt(id, 10);
      if (isNaN(subtaskId)) {
        throw APIError.invalidArgument("Invalid subtask ID format");
      }

      // Check if subtask exists and belongs to the user
      const existingSubtask = await tasksDB.queryRow`
        SELECT id FROM subtasks WHERE id = ${subtaskId} AND user_id = ${userId}
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
      if (updates.projectId !== undefined) {
        updateFields.push("project_id = $" + (updateValues.length + 1));
        updateValues.push(String(updates.projectId));
      }

      updateFields.push("updated_at = NOW()");
      updateValues.push(userId); // Add user_id for WHERE clause
      updateValues.push(subtaskId); // Use the converted number ID

      const query = `
        UPDATE subtasks 
        SET ${updateFields.join(", ")} 
        WHERE user_id = $${updateValues.length - 1} AND id = $${updateValues.length}
      `;

      await tasksDB.rawExec(query, ...updateValues);

      const updatedSubtask = await tasksDB.queryRow<{
        id: number;
        task_id: number;
        title: string;
        completed: boolean;
        project_id: string | null;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT 
          id, task_id, title, completed, project_id, created_at, updated_at
        FROM subtasks 
        WHERE id = ${subtaskId} AND user_id = ${userId}
      `;

      if (!updatedSubtask) {
        throw APIError.internal("Failed to retrieve updated subtask");
      }

      return {
        id: updatedSubtask.id.toString(),
        taskId: updatedSubtask.task_id.toString(),
        title: updatedSubtask.title,
        completed: updatedSubtask.completed,
        projectId: updatedSubtask.project_id || undefined,
        createdAt: updatedSubtask.created_at,
        updatedAt: updatedSubtask.updated_at,
      };
    } catch (error) {
      console.error('Error updating subtask:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to update subtask", error);
    }
  }
);
