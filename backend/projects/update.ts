import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { projectsDB } from "./db";
import type { UpdateProjectRequest, Project } from "./types";

interface UpdateProjectParams {
  id: string;
}

// Updates an existing project.
export const update = api<UpdateProjectParams & UpdateProjectRequest, Project>(
  { expose: true, method: "PUT", path: "/projects/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const { id, ...updates } = req;

    if (updates.name !== undefined && !updates.name.trim()) {
      throw APIError.invalidArgument("Project name cannot be empty");
    }

    if (updates.startDate && updates.endDate && updates.endDate <= updates.startDate) {
      throw APIError.invalidArgument("End date must be after start date");
    }

    // Convert string ID to number for database query
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      throw APIError.invalidArgument("Invalid project ID format");
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(updates.name.trim());
    }

    if (updates.startDate !== undefined) {
      updateFields.push(`start_date = $${paramIndex++}`);
      updateValues.push(updates.startDate);
    }

    if (updates.endDate !== undefined) {
      updateFields.push(`end_date = $${paramIndex++}`);
      updateValues.push(updates.endDate);
    }

    if (updateFields.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(auth.userID); // Add user_id for WHERE clause
    updateValues.push(projectId); // Use the converted number ID

    const query = `
      UPDATE projects 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex++} AND id = $${paramIndex}
      RETURNING id, name, start_date, end_date, created_at, updated_at
    `;

    const row = await projectsDB.rawQueryRow<{
      id: number;
      name: string;
      start_date: Date;
      end_date: Date;
      created_at: Date;
      updated_at: Date;
    }>(query, ...updateValues);

    if (!row) {
      throw APIError.notFound("Project not found");
    }

    return {
      id: row.id.toString(),
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
