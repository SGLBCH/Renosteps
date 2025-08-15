import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB, withTimeout } from "./db";
import { Task, Subtask, ListTasksRequest } from "./types";

export interface ListTasksResponse {
  tasks: Task[];
}

// Lists all tasks with their subtasks for the authenticated user, optionally filtered by project.
export const list = api<ListTasksRequest, ListTasksResponse>(
  { expose: true, method: "GET", path: "/tasks", auth: true },
  async (req): Promise<ListTasksResponse> => {
    const auth = getAuthData()!;
    
    try {
      // Use timeout wrapper for database operations
      const tasks = await withTimeout(async () => {
        let taskQuery = `
          SELECT id, title, description, category, priority, status, progress, 
                 start_date, end_date, project_id, created_at, updated_at
          FROM tasks 
          WHERE user_id = $1
        `;
        
        const queryParams: any[] = [auth.userID];
        
        if (req.projectId) {
          taskQuery += ` AND project_id = $2`;
          queryParams.push(req.projectId);
        }
        
        taskQuery += ` ORDER BY created_at DESC`;

        const taskRows = await tasksDB.rawQueryAll<{
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
        }>(taskQuery, ...queryParams);

        if (taskRows.length === 0) {
          return [];
        }

        const taskIds = taskRows.map(row => row.id);
        
        // Get all subtasks for these tasks in one query
        let subtaskQuery = `
          SELECT id, task_id, title, completed, project_id, created_at, updated_at
          FROM subtasks 
          WHERE task_id = ANY($1) AND user_id = $2
        `;
        
        const subtaskParams = [taskIds, auth.userID];
        
        if (req.projectId) {
          subtaskQuery += ` AND project_id = $3`;
          subtaskParams.push(req.projectId);
        }
        
        subtaskQuery += ` ORDER BY created_at ASC`;

        const subtaskRows = await tasksDB.rawQueryAll<{
          id: number;
          task_id: number;
          title: string;
          completed: boolean;
          project_id: string | null;
          created_at: Date;
          updated_at: Date;
        }>(subtaskQuery, ...subtaskParams);

        // Group subtasks by task_id
        const subtasksByTaskId = new Map<number, Subtask[]>();
        for (const subtask of subtaskRows) {
          if (!subtasksByTaskId.has(subtask.task_id)) {
            subtasksByTaskId.set(subtask.task_id, []);
          }
          subtasksByTaskId.get(subtask.task_id)!.push({
            id: subtask.id.toString(),
            taskId: subtask.task_id.toString(),
            title: subtask.title,
            completed: subtask.completed,
            projectId: subtask.project_id || undefined,
            createdAt: subtask.created_at,
            updatedAt: subtask.updated_at,
          });
        }

        // Combine tasks with their subtasks
        return taskRows.map(row => ({
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
