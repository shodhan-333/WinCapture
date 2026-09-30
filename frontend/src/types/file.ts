export interface FileResponse {
  id: number;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  url: string;
  downloadUrl: string;
}

export const ALLOWED_FILE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".pdf"] as const;
export type AllowedFileExtension = (typeof ALLOWED_FILE_EXTENSIONS)[number];

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

export const MAXIMUM_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}
