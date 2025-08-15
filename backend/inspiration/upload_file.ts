import { api, APIError } from "encore.dev/api";
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
    try {
      // Validate input
      if (!req.filename || !req.contentType || !req.data) {
        throw APIError.invalidArgument("Missing required fields: filename, contentType, and data are required");
      }

      if (!req.filename.trim()) {
        throw APIError.invalidArgument("Filename cannot be empty");
      }

      if (!req.contentType.startsWith('image/')) {
        throw APIError.invalidArgument("Only image files are allowed");
      }

      if (!Array.isArray(req.data) || req.data.length === 0) {
        throw APIError.invalidArgument("File data is required and must be a non-empty array");
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.data.length > maxSize) {
        throw APIError.invalidArgument(`File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`);
      }

      // Sanitize filename
      const sanitizedFilename = req.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Generate unique filename to prevent conflicts
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const extension = sanitizedFilename.split('.').pop() || 'jpg';
      const uniqueFilename = `${timestamp}-${randomSuffix}.${extension}`;

      // Convert number array back to Buffer
      let buffer: Buffer;
      try {
        buffer = Buffer.from(req.data);
      } catch (error) {
        console.error('Error converting data to buffer:', error);
        throw APIError.invalidArgument("Invalid file data format");
      }

      // Validate buffer size matches data length
      if (buffer.length !== req.data.length) {
        throw APIError.invalidArgument("File data corruption detected");
      }

      console.log(`Uploading file: ${uniqueFilename}, size: ${buffer.length} bytes, type: ${req.contentType}`);

      // Upload to bucket
      try {
        await inspirationBucket.upload(uniqueFilename, buffer, {
          contentType: req.contentType,
        });
      } catch (error) {
        console.error('Error uploading to bucket:', error);
        throw APIError.internal("Failed to upload file to storage", error);
      }

      // Get public URL
      let url: string;
      try {
        url = inspirationBucket.publicUrl(uniqueFilename);
      } catch (error) {
        console.error('Error getting public URL:', error);
        throw APIError.internal("Failed to generate file URL", error);
      }

      if (!url) {
        throw APIError.internal("Failed to generate public URL for uploaded file");
      }

      console.log(`File uploaded successfully: ${uniqueFilename} -> ${url}`);
      
      return { url };
    } catch (error) {
      // Log the error for debugging
      console.error('Upload file error:', error);
      
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        throw error;
      }
      
      // Convert other errors to internal server errors
      throw APIError.internal("An unexpected error occurred during file upload", error);
    }
  }
);
