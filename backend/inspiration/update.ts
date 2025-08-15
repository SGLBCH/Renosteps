import { api, APIError } from "encore.dev/api";
import { inspirationDB } from "./db";
import type { Inspiration } from "./types";

export interface UpdateInspirationRequest {
  id: number;
  title?: string;
  description?: string;
  fileUrl?: string;
}

export interface UpdateInspirationResponse {
  success: boolean;
}

// Updates an existing inspiration.
export const update = api<UpdateInspirationRequest, UpdateInspirationResponse>(
  { expose: true, method: "PUT", path: "/inspiration/:id" },
  async (req) => {
    const { id, title, description, fileUrl } = req;

    try {
      // Validate input
      if (title !== undefined && (!title || !title.trim())) {
        throw APIError.invalidArgument("Title cannot be empty");
      }

      if (title !== undefined && title.trim().length > 255) {
        throw APIError.invalidArgument("Title must be less than 255 characters");
      }

      if (description !== undefined && description.length > 1000) {
        throw APIError.invalidArgument("Description must be less than 1000 characters");
      }

      if (fileUrl !== undefined && fileUrl.length > 500) {
        throw APIError.invalidArgument("File URL is too long");
      }

      // Check if inspiration exists
      const existing = await inspirationDB.queryRow`
        SELECT id FROM inspirations WHERE id = ${id}
      `;

      if (!existing) {
        throw APIError.notFound("inspiration not found");
      }

      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title.trim());
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description?.trim() || null);
      }

      if (fileUrl !== undefined) {
        updates.push(`file_url = $${paramIndex++}`);
        values.push(fileUrl?.trim() || null);
      }

      if (updates.length === 0) {
        throw APIError.invalidArgument("no fields to update");
      }

      // Add updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      // Add id for WHERE clause
      values.push(id);

      const query = `
        UPDATE inspirations 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await inspirationDB.rawExec(query, ...values);

      console.log('Inspiration updated successfully:', id);

      return { success: true };
    } catch (error) {
      console.error('Error updating inspiration:', error);
      
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle database constraint errors
      if (error instanceof Error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          throw APIError.alreadyExists("An inspiration with this title already exists in this project");
        }
        
        if (error.message.includes('timeout')) {
          throw APIError.deadlineExceeded("Database operation timed out");
        }
      }
      
      // Convert other errors to internal server errors
      throw APIError.internal("An unexpected error occurred while updating inspiration", error);
    }
  }
);
