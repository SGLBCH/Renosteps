export interface CreateInspirationRequest {
  projectId: number;
  title: string;
  description?: string;
  category?: string;
  fileUrl?: string;
}

export interface InspirationFile {
  id: number;
  filename: string;
  originalName: string;
  fileSize: number;
  contentType: string;
  createdAt: Date;
}

export interface Inspiration {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  category?: string;
  fileUrl?: string;
  files: InspirationFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListInspirationsRequest {
  projectId: number;
}

export interface ListInspirationsResponse {
  inspirations: Inspiration[];
}

export interface UploadFileRequest {
  inspirationId: number;
  filename: string;
  originalName: string;
  fileSize: number;
  contentType: string;
}

export interface UploadFileResponse {
  uploadUrl: string;
  fileId: number;
}

export interface DeleteInspirationRequest {
  id: number;
}
