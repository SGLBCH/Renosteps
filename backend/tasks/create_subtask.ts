import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB } from "./db";
import type { CreateSubtaskRequest, Subtask } from "./types";

// Creates a new subtask for a task.
export const createSubtask = api<CreateSubtaskRequest, Subtask>(
  { expose: true, method: "POST", path: "/tasks/:taskId/subtasks", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);
    
    if (!req.title?.trim()) {
      throw APIError.invalidArgument("title is required");
    }

    try {
      // Convert string ID to number for database query
      const taskId = parseInt(req.taskId, 10);
      if (isNaN(taskId)) {
        throw APIError.invalidArgument("Invalid task ID format");
      }

      // Check if parent task exists and belongs to the user
      const parentTask = await tasksDB.queryRow<{
        id: number;
        project_id: string | null;
      }>`
        SELECT id, project_id FROM tasks WHERE id = ${taskId} AND user_id = ${userId}
      `;

      if (!parentTask) {
        throw APIError.notFound("Parent task not found");
      }

      // Use the project_id from the request or inherit from parent task
      const projectId = req.projectId ? String(req.projectId) : (parentTask.project_id || '1');

      const row = await tasksDB.queryRow<{
        id: number;
        task_id: number;
        title: string;
        completed: boolean;
        project_id: string | null;
        created_at: Date;
        updated_at: Date;
      }>`
        INSERT INTO subtasks (task_id, title, completed, project_id, user_id, created_at, updated_at)
        VALUES (${taskId}, ${req.title.trim()}, false, ${projectId}, ${userId}, NOW(), NOW())
        RETURNING id, task_id, title, completed, project_id, created_at, updated_at
      `;

      if (!row) {
        throw APIError.internal("Failed to create subtask");
      }

      return {
        id: row.id.toString(),
        taskId: row.task_id.toString(),
        title: row.title,
        completed: row.completed,
        projectId: row.project_id || undefined,
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
