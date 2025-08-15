import { api, APIError } from "encore.dev/api";
import { tasksDB, withTimeout } from "./db";

export interface CompleteTaskRequest {
  id: string;
}

export interface CompleteTaskResponse {
  success: boolean;
}

// Marks a task as completed with 100% progress.
export const completeTask = api<CompleteTaskRequest, CompleteTaskResponse>(
  { expose: true, method: "POST", path: "/tasks/:id/complete" },
  async (req): Promise<CompleteTaskResponse> => {
    if (!req.id?.trim()) {
      throw APIError.invalidArgument("id is required");
    }

    try {
      await withTimeout(async () => {
        // First check if task exists
        const existingTask = await tasksDB.queryRow`
          SELECT id FROM tasks WHERE id = ${req.id}
        `;

        if (!existingTask) {
          throw APIError.notFound("task not found");
        }

        // Update task to completed status with 100% progress
        await tasksDB.exec`
          UPDATE tasks 
          SET status = 'completed', progress = 100, updated_at = NOW()
          WHERE id = ${req.id}
        `;
      }, 5000); // 5 second timeout

      return { success: true };
    } catch (error) {
      console.error('Error completing task:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      if (error instanceof Error && error.message.includes('timeout')) {
        throw APIError.deadlineExceeded("Task completion timed out");
      }
      
      throw APIError.internal("Failed to complete task", error);
    }
  }
);
