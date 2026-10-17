export interface AlbumResponse {
  id: number;
  albumName: string;
  ownerId: number;
  ownerName: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateAlbumRequest {
  albumName: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

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

export interface CurrentUser {
  userId: number;
  name: string;
  email: string;
  role: 'User' | 'Admin';
  authenticationType: string;
}
