import { api, APIError } from "encore.dev/api";
import { tasksDB, withTimeout } from "./db";
import { CreateTaskRequest, Task } from "./types";

// Creates a new task.
export const create = api<CreateTaskRequest, Task>(
  { expose: true, method: "POST", path: "/tasks" },
  async (req): Promise<Task> => {
    if (!req.title?.trim()) {
      throw APIError.invalidArgument("title is required");
    }

    try {
      const task = await withTimeout(async () => {
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
          INSERT INTO tasks (title, description, category, priority, status, progress, start_date, end_date)
          VALUES (${req.title.trim()}, ${req.description?.trim() || null}, ${req.category || "other"}, ${req.priority || "medium"}, ${req.status || "not-started"}, ${req.progress || 0}, ${req.startDate || null}, ${req.endDate || null})
          RETURNING id, title, description, category, priority, status, progress, 
                    start_date, end_date, created_at, updated_at
        `;

        if (!row) {
          throw new Error("Failed to create task");
        }

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
          subtasks: [],
        };
      }, 5000); // 5 second timeout for create operations

      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      
      if (error instanceof Error && error.message.includes('timeout')) {
        throw APIError.deadlineExceeded("Task creation timed out");
      }
      
      throw APIError.internal("Failed to create task", error);
    }
  }
);
