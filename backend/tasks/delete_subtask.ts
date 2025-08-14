import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { DeleteSubtaskParams } from "./types";

// Deletes a subtask.
export const deleteSubtask = api<DeleteSubtaskParams, void>(
  { expose: true, method: "DELETE", path: "/subtasks/:id" },
  async ({ id }) => {
    const existingSubtask = await tasksDB.queryRow`
      SELECT id FROM subtasks WHERE id = ${id}
    `;

    if (!existingSubtask) {
      throw APIError.notFound("Subtask not found");
    }

    await tasksDB.exec`DELETE FROM subtasks WHERE id = ${id}`;
  }
);
