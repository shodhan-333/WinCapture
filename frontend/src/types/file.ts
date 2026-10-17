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

export interface AdminFileResponse {
  id: number;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: number;
  uploaderName: string;
  albumId: number | null;
  albumName: string | null;
}
