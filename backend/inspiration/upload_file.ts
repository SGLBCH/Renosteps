import { api, APIError } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";

const inspirationBucket = new Bucket("inspiration-files", {
  public: true,
});

export interface UploadFileRequest {
  filename: string;
  contentType: string;
}

export interface UploadFileResponse {
  uploadUrl: string;
  fileUrl: string;
}

// Generates a signed upload URL for direct file upload to object storage.
export const uploadFile = api<UploadFileRequest, UploadFileResponse>(
  { expose: true, method: "POST", path: "/inspiration/upload" },
  async (req) => {
    try {
      // Validate input
      if (!req.filename || !req.contentType) {
        throw APIError.invalidArgument("Missing required fields: filename and contentType are required");
      }

      if (!req.filename.trim()) {
        throw APIError.invalidArgument("Filename cannot be empty");
      }

      if (!req.contentType.startsWith('image/')) {
        throw APIError.invalidArgument("Only image files are allowed");
      }

      // Sanitize filename
      const sanitizedFilename = req.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Generate unique filename to prevent conflicts
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const extension = sanitizedFilename.split('.').pop() || 'jpg';
      const uniqueFilename = `${timestamp}-${randomSuffix}.${extension}`;

      console.log(`Generating upload URL for: ${uniqueFilename}, type: ${req.contentType}`);

      // Generate signed upload URL
      const { url: uploadUrl } = await inspirationBucket.signedUploadUrl(uniqueFilename, {
        ttl: 3600, // 1 hour
      });

      // Generate the final public URL
      const fileUrl = inspirationBucket.publicUrl(uniqueFilename);

      console.log(`Upload URL generated successfully: ${uniqueFilename} -> ${fileUrl}`);
      
      return { uploadUrl, fileUrl };
    } catch (error) {
      // Log the error for debugging
      console.error('Upload URL generation error:', error);
      
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        throw error;
      }
      
      // Convert other errors to internal server errors
      throw APIError.internal("An unexpected error occurred during upload URL generation", error);
    }
  }
);
