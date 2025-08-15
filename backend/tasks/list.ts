import { api } from "encore.dev/api";
import { tasksDB, withTimeout } from "./db";
import { Task, Subtask } from "./types";

export interface ListTasksResponse {
  tasks: Task[];
}

// Lists all tasks with their subtasks.
export const list = api<void, ListTasksResponse>(
  { expose: true, method: "GET", path: "/tasks" },
  async (): Promise<ListTasksResponse> => {
    try {
      // Use timeout wrapper for database operations
      const tasks = await withTimeout(async () => {
        const taskRows = await tasksDB.queryAll<{
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
          SELECT id, title, description, category, priority, status, progress, 
                 start_date, end_date, created_at, updated_at
          FROM tasks 
          ORDER BY created_at DESC
        `;

        if (taskRows.length === 0) {
          return [];
        }

        const taskIds = taskRows.map(row => row.id);
        
        // Get all subtasks for these tasks in one query
        const subtaskRows = await tasksDB.queryAll<{
          id: string;
          task_id: string;
          title: string;
          completed: boolean;
          created_at: Date;
          updated_at: Date;
        }>`
          SELECT id, task_id, title, completed, created_at, updated_at
          FROM subtasks 
          WHERE task_id = ANY(${taskIds})
          ORDER BY created_at ASC
        `;

        // Group subtasks by task_id
        const subtasksByTaskId = new Map<string, Subtask[]>();
        for (const subtask of subtaskRows) {
          if (!subtasksByTaskId.has(subtask.task_id)) {
            subtasksByTaskId.set(subtask.task_id, []);
          }
          subtasksByTaskId.get(subtask.task_id)!.push({
            id: subtask.id,
            taskId: subtask.task_id,
            title: subtask.title,
            completed: subtask.completed,
            createdAt: subtask.created_at,
            updatedAt: subtask.updated_at,
          });
        }

        // Combine tasks with their subtasks
        return taskRows.map(row => ({
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
          subtasks: subtasksByTaskId.get(row.id) || [],
        }));
      }, 8000); // 8 second timeout

      return { tasks };
    } catch (error) {
      console.error('Error listing tasks:', error);
      
      // Return empty array instead of throwing to prevent UI from breaking
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn('Database timeout occurred, returning empty task list');
        return { tasks: [] };
      }
      
      // For other errors, still return empty array but log the error
      console.error('Database error in list tasks:', error);
      return { tasks: [] };
    }
  }
);
