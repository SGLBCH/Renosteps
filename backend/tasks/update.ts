import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB, withTimeout } from "./db";
import { UpdateTaskRequest, Task } from "./types";

// Updates an existing task.
export const update = api<UpdateTaskRequest, Task>(
  { expose: true, method: "PUT", path: "/tasks/:id", auth: true },
  async (req): Promise<Task> => {
    const auth = getAuthData()!;
    
    if (!req.id?.trim()) {
      throw APIError.invalidArgument("id is required");
    }

    if (req.title !== undefined && !req.title?.trim()) {
      throw APIError.invalidArgument("title cannot be empty");
    }

    try {
      // Convert string ID to number for database query
      const taskId = parseInt(req.id, 10);
      if (isNaN(taskId)) {
        throw APIError.invalidArgument("Invalid task ID format");
      }

      const task = await withTimeout(async () => {
        // First check if task exists and belongs to the user
        const existingTask = await tasksDB.queryRow`
          SELECT id FROM tasks WHERE id = ${taskId} AND user_id = ${auth.userID}
        `;

        if (!existingTask) {
          throw APIError.notFound("task not found");
        }

        // Build dynamic update query
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        if (req.title !== undefined) {
          updateFields.push(`title = $${paramIndex++}`);
          updateValues.push(req.title.trim());
        }

        if (req.description !== undefined) {
          updateFields.push(`description = $${paramIndex++}`);
          updateValues.push(req.description?.trim() || null);
        }

        if (req.category !== undefined) {
          updateFields.push(`category = $${paramIndex++}`);
          updateValues.push(req.category);
        }

        if (req.priority !== undefined) {
          updateFields.push(`priority = $${paramIndex++}`);
          updateValues.push(req.priority);
        }

        if (req.status !== undefined) {
          updateFields.push(`status = $${paramIndex++}`);
          updateValues.push(req.status);
        }

        if (req.progress !== undefined) {
          updateFields.push(`progress = $${paramIndex++}`);
          updateValues.push(req.progress);
        }

        if (req.startDate !== undefined) {
          updateFields.push(`start_date = $${paramIndex++}`);
          updateValues.push(req.startDate || null);
        }

        if (req.endDate !== undefined) {
          updateFields.push(`end_date = $${paramIndex++}`);
          updateValues.push(req.endDate || null);
        }

        if (req.projectId !== undefined) {
          updateFields.push(`project_id = $${paramIndex++}`);
          updateValues.push(String(req.projectId));
        }

        if (updateFields.length === 0) {
          throw APIError.invalidArgument("No fields to update");
        }

        updateFields.push(`updated_at = NOW()`);
        updateValues.push(auth.userID); // Add user_id for WHERE clause
        updateValues.push(taskId); // Use the converted number ID

        const query = `
          UPDATE tasks 
          SET ${updateFields.join(', ')}
          WHERE user_id = $${paramIndex++} AND id = $${paramIndex}
          RETURNING id, title, description, category, priority, status, progress, 
                    start_date, end_date, project_id, created_at, updated_at
        `;

        const row = await tasksDB.rawQueryRow<{
          id: number;
          title: string;
          description: string | null;
          category: string;
          priority: string;
          status: string;
          progress: number;
          start_date: Date | null;
          end_date: Date | null;
          project_id: string | null;
          created_at: Date;
          updated_at: Date;
        }>(query, ...updateValues);

        if (!row) {
          throw new Error("Failed to update task");
        }

        // Get subtasks
        const subtasks = await tasksDB.queryAll<{
          id: number;
          task_id: number;
          title: string;
          completed: boolean;
          project_id: string | null;
          created_at: Date;
          updated_at: Date;
        }>`
          SELECT id, task_id, title, completed, project_id, created_at, updated_at
          FROM subtasks 
          WHERE task_id = ${taskId} AND user_id = ${auth.userID}
          ORDER BY created_at ASC
        `;

        return {
          id: row.id.toString(),
          title: row.title,
          description: row.description || undefined,
          category: row.category,
          priority: row.priority as "high" | "medium" | "low",
          status: row.status as "completed" | "in-progress" | "not-started",
          progress: row.progress,
          startDate: row.start_date || undefined,
          endDate: row.end_date || undefined,
          projectId: row.project_id || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          subtasks: subtasks.map(subtask => ({
            id: subtask.id.toString(),
            taskId: subtask.task_id.toString(),
            title: subtask.title,
            completed: subtask.completed,
            projectId: subtask.project_id || undefined,
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
