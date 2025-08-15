import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { projectsDB } from "./db";
import { tasksDB } from "../tasks/db";
import { budgetDB } from "../budget/db";

interface DeleteProjectParams {
  id: string;
}

// Deletes a project and all associated data.
export const deleteProject = api<DeleteProjectParams, void>(
  { expose: true, method: "DELETE", path: "/projects/:id", auth: true },
  async ({ id }) => {
    const auth = getAuthData()!;
    
    // Convert string ID to number for database query
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      throw APIError.invalidArgument("Invalid project ID format");
    }

    try {
      // Check if project exists and belongs to the user
      const existingProject = await projectsDB.queryRow`
        SELECT id FROM projects WHERE id = ${projectId} AND user_id = ${auth.userID}
      `;

      if (!existingProject) {
        throw APIError.notFound("Project not found");
      }

      // Delete associated data from different databases
      // Use the string version of the project ID for the related tables since they store project_id as TEXT
      
      // 1. Delete subtasks first (they reference tasks and have project_id) - from tasks database
      await tasksDB.exec`
        DELETE FROM subtasks 
        WHERE project_id = ${id}
      `;

      // 2. Delete tasks - from tasks database
      await tasksDB.exec`
        DELETE FROM tasks WHERE project_id = ${id}
      `;

      // 3. Delete budget expenses - from budget database
      await budgetDB.exec`
        DELETE FROM budget_expenses WHERE project_id = ${id}
      `;

      // 4. Delete budget settings - from budget database
      await budgetDB.exec`
        DELETE FROM budget_settings WHERE project_id = ${id}
      `;

      // 5. Finally delete the project itself (using numeric ID) - from projects database
      await projectsDB.exec`
        DELETE FROM projects WHERE id = ${projectId} AND user_id = ${auth.userID}
      `;

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error('Error deleting project:', error);
      throw APIError.internal("Failed to delete project", error);
    }
  }
);
