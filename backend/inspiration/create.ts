import { api } from "encore.dev/api";
import { inspirationDB } from "./db";
import type { CreateInspirationRequest, Inspiration } from "./types";

// Creates a new inspiration.
export const create = api<CreateInspirationRequest, Inspiration>(
  { expose: true, method: "POST", path: "/inspiration" },
  async (req) => {
    const row = await inspirationDB.queryRow<{
      id: number;
      project_id: number;
      title: string;
      description: string | null;
      category: string | null;
      file_url: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO inspirations (project_id, title, description, category, file_url)
      VALUES (${req.projectId}, ${req.title}, ${req.description || null}, ${req.category || null}, ${req.fileUrl || null})
      RETURNING *
    `;

    if (!row) {
      throw new Error("Failed to create inspiration");
    }

    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      description: row.description || undefined,
      category: row.category || undefined,
      fileUrl: row.file_url || undefined,
      files: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
