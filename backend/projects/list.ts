import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { projectsDB } from "./db";
import type { ProjectsResponse } from "./types";

// Retrieves all projects for the authenticated user, ordered by creation date (latest first).
export const list = api<void, ProjectsResponse>(
  { expose: true, method: "GET", path: "/projects", auth: true },
  async () => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);
    
    const rows = await projectsDB.queryAll<{
      id: string;
      name: string;
      start_date: Date;
      end_date: Date;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, name, start_date, end_date, created_at, updated_at
      FROM projects
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    const projects = rows.map(row => ({
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { projects };
  }
);
