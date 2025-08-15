import { api, APIError } from "encore.dev/api";
import { inspirationDB } from "./db";
import type { CreateInspirationRequest, Inspiration } from "./types";

// Creates a new inspiration.
export const create = api<CreateInspirationRequest, Inspiration>(
  { expose: true, method: "POST", path: "/inspiration" },
  async (req) => {
    try {
      // Validate input
      if (!req.title || !req.title.trim()) {
        throw APIError.invalidArgument("Title is required and cannot be empty");
      }

      if (!req.projectId || req.projectId <= 0) {
        throw APIError.invalidArgument("Valid project ID is required");
      }

      if (req.title.trim().length > 255) {
        throw APIError.invalidArgument("Title must be less than 255 characters");
      }

      if (req.description && req.description.length > 1000) {
        throw APIError.invalidArgument("Description must be less than 1000 characters");
      }

      if (req.fileUrl && req.fileUrl.length > 500) {
        throw APIError.invalidArgument("File URL is too long");
      }

      console.log('Creating inspiration:', {
        projectId: req.projectId,
        title: req.title.trim(),
        description: req.description?.trim() || null,
        category: req.category?.trim() || null,
        fileUrl: req.fileUrl?.trim() || null
      });

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
        VALUES (${req.projectId}, ${req.title.trim()}, ${req.description?.trim() || null}, ${req.category?.trim() || null}, ${req.fileUrl?.trim() || null})
        RETURNING *
      `;

      if (!row) {
        throw APIError.internal("Failed to create inspiration - no data returned from database");
      }

      console.log('Inspiration created successfully:', row);

      const result: Inspiration = {
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

      return result;
    } catch (error) {
      console.error('Error creating inspiration:', error);
      
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle database constraint errors
      if (error instanceof Error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          throw APIError.alreadyExists("An inspiration with this title already exists in this project");
        }
        
        if (error.message.includes('foreign key') || error.message.includes('project_id')) {
          throw APIError.invalidArgument("Invalid project ID - project does not exist");
        }
        
        if (error.message.includes('timeout')) {
          throw APIError.deadlineExceeded("Database operation timed out");
        }
      }
      
      // Convert other errors to internal server errors
      throw APIError.internal("An unexpected error occurred while creating inspiration", error);
    }
  }
);
