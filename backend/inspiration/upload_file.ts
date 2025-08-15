import { api } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";

const inspirationBucket = new Bucket("inspiration-files", {
  public: true,
});

export interface UploadFileRequest {
  filename: string;
  contentType: string;
  data: number[];
}

export interface UploadFileResponse {
  url: string;
}

// Uploads a file to object storage and returns the public URL.
export const uploadFile = api<UploadFileRequest, UploadFileResponse>(
  { expose: true, method: "POST", path: "/inspiration/upload" },
  async (req) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = req.filename.split('.').pop() || '';
    const uniqueFilename = `${timestamp}-${randomSuffix}.${extension}`;

    // Convert number array back to Buffer
    const buffer = Buffer.from(req.data);

    // Upload to bucket
    await inspirationBucket.upload(uniqueFilename, buffer, {
      contentType: req.contentType,
    });

    // Return public URL
    const url = inspirationBucket.publicUrl(uniqueFilename);
    
    return { url };
  }
);
