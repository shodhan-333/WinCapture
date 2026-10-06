export interface FileResponse {
  id: number;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  url: string;
  downloadUrl: string;
  isFavorite: boolean;
  canManage: boolean;
}