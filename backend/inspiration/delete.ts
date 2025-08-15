import { api } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";
import { inspirationDB } from "./db";
import type { DeleteInspirationRequest } from "./types";

const inspirationFiles = new Bucket("inspiration-files");

// Deletes an inspiration and all its files.
export const deleteInspiration = api<DeleteInspirationRequest, void>(
  { expose: true, method: "DELETE", path: "/inspiration/:id" },
  async (req) => {
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
      DELETE FROM inspirations WHERE id = ${req.id}
    `;
  }
);
