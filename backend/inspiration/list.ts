import { api } from "encore.dev/api";
import { inspirationDB } from "./db";
import type { ListInspirationsRequest, ListInspirationsResponse, Inspiration, InspirationFile } from "./types";

// Lists all inspirations for a project.
export const list = api<ListInspirationsRequest, ListInspirationsResponse>(
  { expose: true, method: "GET", path: "/inspiration/project/:projectId" },
  async (req) => {
    const inspirationRows = await inspirationDB.queryAll<{
      id: number;
      project_id: number;
      title: string;
      description: string | null;
      category: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT * FROM inspirations 
      WHERE project_id = ${req.projectId}
      ORDER BY created_at DESC
    `;

    const inspirations: Inspiration[] = [];

    for (const row of inspirationRows) {
      const fileRows = await inspirationDB.queryAll<{
        id: number;
        filename: string;
        original_name: string;
        file_size: number;
        content_type: string;
        created_at: Date;
      }>`
        SELECT * FROM inspiration_files 
        WHERE inspiration_id = ${row.id}
        ORDER BY created_at ASC
      `;

      const files: InspirationFile[] = fileRows.map(file => ({
        id: file.id,
        filename: file.filename,
        originalName: file.original_name,
        fileSize: file.file_size,
        contentType: file.content_type,
        createdAt: file.created_at,
      }));

      inspirations.push({
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        description: row.description || undefined,
        category: row.category || undefined,
        files,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return { inspirations };
  }
);
