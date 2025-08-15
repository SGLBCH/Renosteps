import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { projectsDB } from "./db";
import type { CreateProjectRequest, Project } from "./types";

// Creates a new project.
export const create = api<CreateProjectRequest, Project>(
  { expose: true, method: "POST", path: "/projects", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);
    
    if (!req.name.trim()) {
      throw APIError.invalidArgument("Project name is required");
    }

    if (req.endDate <= req.startDate) {
      throw APIError.invalidArgument("End date must be after start date");
    }

    const row = await projectsDB.queryRow<{
      id: string;
      name: string;
      start_date: Date;
      end_date: Date;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO projects (name, start_date, end_date, user_id)
      VALUES (${req.name.trim()}, ${req.startDate}, ${req.endDate}, ${userId})
      RETURNING id, name, start_date, end_date, created_at, updated_at
    `;

    if (!row) {
      throw APIError.internal("Failed to create project");
    }

    return {
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
