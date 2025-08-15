import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Bucket } from "encore.dev/storage/objects";
import { inspirationDB } from "./db";

const inspirationFiles = new Bucket("inspiration-files");

interface GetFileUrlRequest {
  fileId: number;
}

interface GetFileUrlResponse {
  downloadUrl: string;
}

// Gets a signed download URL for an inspiration file.
export const getFileUrl = api<GetFileUrlRequest, GetFileUrlResponse>(
  { expose: true, method: "GET", path: "/inspiration/file/:fileId/url", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);

    const fileRow = await inspirationDB.queryRow<{ filename: string }>`
      SELECT f.filename 
      FROM inspiration_files f
      JOIN inspirations i ON f.inspiration_id = i.id
      WHERE f.id = ${req.fileId} AND i.user_id = ${userId}
    `;

    if (!fileRow) {
      throw APIError.notFound("File not found");
    }

    const { url } = await inspirationFiles.signedDownloadUrl(fileRow.filename, {
      ttl: 3600, // 1 hour
    });

    return {
      downloadUrl: url,
    };
  }
);
