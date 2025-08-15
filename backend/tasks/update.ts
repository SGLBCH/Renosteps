import { api, APIError } from "encore.dev/api";
import { tasksDB, withTimeout } from "./db";
import { UpdateTaskRequest, Task } from "./types";

// Updates an existing task.
export const update = api<UpdateTaskRequest, Task>(
  { expose: true, method: "PUT", path: "/tasks/:id" },
  async (req): Promise<Task> => {
    if (!req.id?.trim()) {
      throw APIError.invalidArgument("id is required");
    }

    if (!req.title?.trim()) {
      throw APIError.invalidArgument("title is required");
    }

    try {
      const task = await withTimeout(async () => {
        // First check if task exists
        const existingTask = await tasksDB.queryRow`
          SELECT id FROM tasks WHERE id = ${req.id}
        `;

        if (!existingTask) {
          throw APIError.notFound("task not found");
        }

        // Update the task
        const row = await tasksDB.queryRow<{
          id: string;
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
          UPDATE tasks 
          SET title = ${req.title.trim()}, description = ${req.description?.trim() || null}, category = ${req.category}, priority = ${req.priority}, 
              status = ${req.status}, progress = ${req.progress}, start_date = ${req.startDate || null}, end_date = ${req.endDate || null}, 
              updated_at = NOW()
          WHERE id = ${req.id}
          RETURNING id, title, description, category, priority, status, progress, 
                    start_date, end_date, created_at, updated_at
        `;

        if (!row) {
          throw new Error("Failed to update task");
        }

        // Get subtasks
        const subtasks = await tasksDB.queryAll<{
          id: string;
          task_id: string;
          title: string;
          completed: boolean;
          created_at: Date;
          updated_at: Date;
        }>`
          SELECT id, task_id, title, completed, created_at, updated_at
          FROM subtasks 
          WHERE task_id = ${req.id}
          ORDER BY created_at ASC
        `;

        return {
          id: row.id,
          title: row.title,
          description: row.description || undefined,
          category: row.category,
          priority: row.priority as "high" | "medium" | "low",
          status: row.status as "completed" | "in-progress" | "not-started",
          progress: row.progress,
          startDate: row.start_date || undefined,
          endDate: row.end_date || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          subtasks: subtasks.map(subtask => ({
            id: subtask.id,
            taskId: subtask.task_id,
            title: subtask.title,
            completed: subtask.completed,
            createdAt: subtask.created_at,
            updatedAt: subtask.updated_at,
          })),
        };
      }, 5000); // 5 second timeout

      return task;
    } catch (error) {
      console.error('Error updating task:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      if (error instanceof Error && error.message.includes('timeout')) {
        throw APIError.deadlineExceeded("Task update timed out");
      }
      
      throw APIError.internal("Failed to update task", error);
    }
  }
);
