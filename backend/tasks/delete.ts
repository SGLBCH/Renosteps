import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { DeleteTaskParams } from "./types";

// Deletes a task.
export const deleteTask = api<DeleteTaskParams, void>(
  { expose: true, method: "DELETE", path: "/tasks/:id" },
  async ({ id }) => {
    try {
      // Convert string ID to number for database query
      const taskId = parseInt(id, 10);
      if (isNaN(taskId)) {
        throw APIError.invalidArgument("Invalid task ID format");
      }

      const existingTask = await tasksDB.queryRow`
        SELECT id FROM tasks WHERE id = ${taskId}
      `;

      if (!existingTask) {
        throw APIError.notFound("Task not found");
      }

      await tasksDB.exec`DELETE FROM tasks WHERE id = ${taskId}`;
    } catch (error) {
      console.error('Error deleting task:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to delete task", error);
    }
  }
);
