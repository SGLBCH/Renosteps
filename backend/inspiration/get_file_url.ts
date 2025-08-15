import { api } from "encore.dev/api";
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
  { expose: true, method: "GET", path: "/inspiration/file/:fileId/url" },
  async (req) => {
    const fileRow = await inspirationDB.queryRow<{ filename: string }>`
      SELECT filename FROM inspiration_files WHERE id = ${req.fileId}
    `;

    if (!fileRow) {
      throw new Error("File not found");
    }

    const { url } = await inspirationFiles.signedDownloadUrl(fileRow.filename, {
      ttl: 3600, // 1 hour
    });

    return {
      downloadUrl: url,
    };
  }
);
