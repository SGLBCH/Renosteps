import { api } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";
import { inspirationDB } from "./db";
import type { UploadFileRequest, UploadFileResponse } from "./types";

const inspirationFiles = new Bucket("inspiration-files");

// Generates a signed upload URL for an inspiration file.
export const uploadFile = api<UploadFileRequest, UploadFileResponse>(
  { expose: true, method: "POST", path: "/inspiration/:inspirationId/upload" },
  async (req) => {
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${req.inspirationId}/${timestamp}-${req.originalName}`;

    // Store file metadata in database
    const fileRow = await inspirationDB.queryRow<{ id: number }>`
      INSERT INTO inspiration_files (inspiration_id, filename, original_name, file_size, content_type)
      VALUES (${req.inspirationId}, ${filename}, ${req.originalName}, ${req.fileSize}, ${req.contentType})
      RETURNING id
    `;

    if (!fileRow) {
      throw new Error("Failed to create file record");
    }

    // Generate signed upload URL
    const { url } = await inspirationFiles.signedUploadUrl(filename, {
      ttl: 3600, // 1 hour
    });

    return {
      uploadUrl: url,
      fileId: fileRow.id,
    };
  }
);
