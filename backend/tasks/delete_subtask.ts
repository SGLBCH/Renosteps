import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { DeleteSubtaskParams } from "./types";

// Deletes a subtask.
export const deleteSubtask = api<DeleteSubtaskParams, void>(
  { expose: true, method: "DELETE", path: "/subtasks/:id" },
  async ({ id }) => {
    try {
      // Convert string ID to number for database query
      const subtaskId = parseInt(id, 10);
      if (isNaN(subtaskId)) {
        throw APIError.invalidArgument("Invalid subtask ID format");
      }

      const existingSubtask = await tasksDB.queryRow`
        SELECT id FROM subtasks WHERE id = ${subtaskId}
      `;

      if (!existingSubtask) {
        throw APIError.notFound("Subtask not found");
      }

      await tasksDB.exec`DELETE FROM subtasks WHERE id = ${subtaskId}`;
    } catch (error) {
      console.error('Error deleting subtask:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to delete subtask", error);
    }
  }
);
