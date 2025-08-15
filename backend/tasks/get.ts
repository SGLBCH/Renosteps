import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { GetTaskParams, Task, Subtask } from "./types";

// Retrieves a specific task by ID with its subtasks.
export const get = api<GetTaskParams, Task>(
  { expose: true, method: "GET", path: "/tasks/:id" },
  async ({ id }) => {
    try {
      // Convert string ID to number for database query
      const taskId = parseInt(id, 10);
      if (isNaN(taskId)) {
        throw APIError.invalidArgument("Invalid task ID format");
      }

      const task = await tasksDB.queryRow<{
        id: number;
        title: string;
        description: string | null;
        category: string;
        priority: string;
        status: string;
        progress: number;
        start_date: Date | null;
        end_date: Date | null;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT 
          id, title, description, category, priority, status, progress,
          start_date, end_date, created_at, updated_at
        FROM tasks 
        WHERE id = ${taskId}
      `;

      if (!task) {
        throw APIError.notFound("Task not found");
      }

      // Get subtasks for this task
      const subtasks: Subtask[] = [];
      const subtaskRows = tasksDB.query<{
        id: number;
        task_id: number;
        title: string;
        completed: boolean;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT 
          id, task_id, title, completed, created_at, updated_at
        FROM subtasks 
        WHERE task_id = ${taskId}
        ORDER BY created_at ASC
      `;

      for await (const subtaskRow of subtaskRows) {
        subtasks.push({
          id: subtaskRow.id.toString(),
          taskId: subtaskRow.task_id.toString(),
          title: subtaskRow.title,
          completed: subtaskRow.completed,
          createdAt: subtaskRow.created_at,
          updatedAt: subtaskRow.updated_at,
        });
      }

      return {
        id: task.id.toString(),
        title: task.title,
        description: task.description || undefined,
        category: task.category,
        priority: task.priority as "high" | "medium" | "low",
        status: task.status as "completed" | "in-progress" | "not-started",
        progress: task.progress,
        startDate: task.start_date || undefined,
        endDate: task.end_date || undefined,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        subtasks
      };
    } catch (error) {
      console.error('Error getting task:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal("Failed to get task", error);
    }
  }
);
