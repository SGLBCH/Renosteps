import { api, APIError } from "encore.dev/api";
import { projectsDB } from "./db";

interface DeleteProjectParams {
  id: string;
}

// Deletes a project and all associated data.
export const deleteProject = api<DeleteProjectParams, void>(
  { expose: true, method: "DELETE", path: "/projects/:id" },
  async ({ id }) => {
    // Convert string ID to number for database query
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      throw APIError.invalidArgument("Invalid project ID format");
    }

    // Start a transaction to ensure all deletions happen atomically
    const tx = await projectsDB.begin();
    
    try {
      // Check if project exists
      const existingProject = await tx.queryRow`
        SELECT id FROM projects WHERE id = ${projectId}
      `;

      if (!existingProject) {
        throw APIError.notFound("Project not found");
      }

      // Delete associated data in the correct order (respecting foreign key constraints)
      // Use the string version of the project ID for the related tables since they store project_id as TEXT
      
      // 1. Delete subtasks first (they reference tasks and have project_id)
      await tx.exec`
        DELETE FROM subtasks 
        WHERE project_id = ${id}
      `;

      // 2. Delete tasks (they have project_id as TEXT)
      await tx.exec`
        DELETE FROM tasks WHERE project_id = ${id}
      `;

      // 3. Delete budget expenses (they have project_id as TEXT)
      await tx.exec`
        DELETE FROM budget_expenses WHERE project_id = ${id}
      `;

      // 4. Delete budget settings (they have project_id as TEXT)
      await tx.exec`
        DELETE FROM budget_settings WHERE project_id = ${id}
      `;

      // 5. Finally delete the project itself (using numeric ID)
      await tx.exec`
        DELETE FROM projects WHERE id = ${projectId}
      `;

      // Commit the transaction
      await tx.commit();
    } catch (error) {
      // Rollback the transaction on any error
      await tx.rollback();
      
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error('Error deleting project:', error);
      throw APIError.internal("Failed to delete project", error);
    }
  }
);
