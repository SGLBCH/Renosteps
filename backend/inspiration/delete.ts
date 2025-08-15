import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Bucket } from "encore.dev/storage/objects";
import { inspirationDB } from "./db";
import type { DeleteInspirationRequest } from "./types";

const inspirationFiles = new Bucket("inspiration-files");

// Deletes an inspiration and all its files.
export const deleteInspiration = api<DeleteInspirationRequest, void>(
  { expose: true, method: "DELETE", path: "/inspiration/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);

    // Check if inspiration belongs to user
    const inspiration = await inspirationDB.queryRow`
      SELECT id FROM inspirations WHERE id = ${req.id} AND user_id = ${userId}
    `;
    if (!inspiration) {
      throw APIError.notFound("inspiration not found");
    }

    // Get all files for this inspiration
    const fileRows = await inspirationDB.queryAll<{ filename: string }>`
      SELECT filename FROM inspiration_files WHERE inspiration_id = ${req.id}
    `;

    // Delete files from storage
    for (const file of fileRows) {
      try {
        await inspirationFiles.remove(file.filename);
      } catch (err) {
        // Continue even if file deletion fails
        console.error(`Failed to delete file ${file.filename}:`, err);
      }
    }

    // Delete inspiration (files will be deleted via CASCADE)
    await inspirationDB.exec`
      DELETE FROM inspirations WHERE id = ${req.id} AND user_id = ${userId}
    `;
  }
);
