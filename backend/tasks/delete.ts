import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { DeleteTaskParams } from "./types";

// Deletes a task.
export const deleteTask = api<DeleteTaskParams, void>(
  { expose: true, method: "DELETE", path: "/tasks/:id" },
  async ({ id }) => {
    const existingTask = await tasksDB.queryRow`
      SELECT id FROM tasks WHERE id = ${id}
    `;

    if (!existingTask) {
      throw APIError.notFound("Task not found");
    }

    await tasksDB.exec`DELETE FROM tasks WHERE id = ${id}`;
  }
);
