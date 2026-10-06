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

export interface UpdateAlbumRequest {
  albumName: string;
}

export interface AlbumMemberResponse {
  userId: number;
  name: string;
  email: string;
  canView: boolean;
  canDownload: boolean;
  grantedAt: string;
}

export interface AddAlbumMemberRequest {
  email: string;
  canView: boolean;
  canDownload: boolean;
}

export interface UpdateAlbumMemberRequest {
  canView: boolean;
  canDownload: boolean;
}


