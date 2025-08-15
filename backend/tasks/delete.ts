import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB } from "./db";
import type { DeleteTaskParams } from "./types";

// Deletes a task.
export const deleteTask = api<DeleteTaskParams, void>(
  { expose: true, method: "DELETE", path: "/tasks/:id", auth: true },
  async ({ id }) => {
    const auth = getAuthData()!;
    
    try {
      // Convert string ID to number for database query
      const taskId = parseInt(id, 10);
      if (isNaN(taskId)) {
        throw APIError.invalidArgument("Invalid task ID format");
      }

      const existingTask = await tasksDB.queryRow`
        SELECT id FROM tasks WHERE id = ${taskId} AND user_id = ${auth.userID}
      `;

      if (!existingTask) {
        throw APIError.notFound("Task not found");
      }

      await tasksDB.exec`DELETE FROM tasks WHERE id = ${taskId} AND user_id = ${auth.userID}`;
    } catch (error) {
      console.error('Error deleting task:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to delete task", error);
    }
  }
);
