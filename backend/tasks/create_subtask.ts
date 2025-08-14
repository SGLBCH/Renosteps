import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import { generateId } from "./utils";
import type { CreateSubtaskRequest, Subtask } from "./types";

// Creates a new subtask for a task.
export const createSubtask = api<CreateSubtaskRequest, Subtask>(
  { expose: true, method: "POST", path: "/tasks/:taskId/subtasks" },
  async (req) => {
    const id = generateId();
    const now = new Date();

    // Check if parent task exists
    const parentTask = await tasksDB.queryRow`
      SELECT id FROM tasks WHERE id = ${req.taskId}
    `;

    if (!parentTask) {
      throw APIError.notFound("Parent task not found");
    }

    await tasksDB.exec`
      INSERT INTO subtasks (
        id, task_id, title, completed, created_at, updated_at
      ) VALUES (
        ${id}, ${req.taskId}, ${req.title}, false, ${now}, ${now}
      )
    `;

    const subtask = await tasksDB.queryRow<Subtask>`
      SELECT 
        id, task_id as "taskId", title, completed,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM subtasks 
      WHERE id = ${id}
    `;

    if (!subtask) {
      throw APIError.internal("Failed to create subtask");
    }

    return subtask;
  }
);
