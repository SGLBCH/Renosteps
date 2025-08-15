import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { CreateSubtaskRequest, Subtask } from "./types";

// Creates a new subtask for a task.
export const createSubtask = api<CreateSubtaskRequest, Subtask>(
  { expose: true, method: "POST", path: "/tasks/:taskId/subtasks" },
  async (req) => {
    if (!req.title?.trim()) {
      throw APIError.invalidArgument("title is required");
    }

    try {
      // Convert string ID to number for database query
      const taskId = parseInt(req.taskId, 10);
      if (isNaN(taskId)) {
        throw APIError.invalidArgument("Invalid task ID format");
      }

      // Check if parent task exists
      const parentTask = await tasksDB.queryRow`
        SELECT id FROM tasks WHERE id = ${taskId}
      `;

      if (!parentTask) {
        throw APIError.notFound("Parent task not found");
      }

      const row = await tasksDB.queryRow<{
        id: number;
        task_id: number;
        title: string;
        completed: boolean;
        created_at: Date;
        updated_at: Date;
      }>`
        INSERT INTO subtasks (task_id, title, completed, created_at, updated_at)
        VALUES (${taskId}, ${req.title.trim()}, false, NOW(), NOW())
        RETURNING id, task_id, title, completed, created_at, updated_at
      `;

      if (!row) {
        throw APIError.internal("Failed to create subtask");
      }

      return {
        id: row.id.toString(),
        taskId: row.task_id.toString(),
        title: row.title,
        completed: row.completed,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error creating subtask:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to create subtask", error);
    }
  }
);
