import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { callApi } from "@/shared/api/request";
import { buildPagePath } from "@/shared/api/pagination";
import { downloadResponse, uploadMultipartFile } from "@/shared/api/transfers";
import { getFilePreviewUrlByPath } from "@/shared/api/previews";
import { ApiError, type PagedResponse } from "@/shared/types/api";
import type {
  AlbumMemberResponse,
  AlbumResponse,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  AddAlbumMemberRequest,
  UpdateAlbumMemberRequest,
} from "@/features/albums/types/album";
import type { FileResponse } from "@/features/files/types/file";
import { parseAlbumMembers } from "@/features/albums/schemas/albumMember";
import {
  AddAlbumMemberRequestSchema,
  parseAlbumResponse,
  parsePagedAlbums,
  UpdateAlbumMemberRequestSchema,
  validateAlbumNameRequest,
} from "@/features/albums/schemas/album";
import {
  parseFileResponse,
  parsePagedResponse,
  parseStorageCleanupResponse,
} from "@/features/files/schemas/fileResponse";
// Albums API
export async function getAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page: number,
  pageSize: number,
  search?: string,
  signal?: AbortSignal,
): Promise<PagedResponse<AlbumResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/albums", page, pageSize, search),
    { signal },
  );

  return parsePagedAlbums(await response.json());
}

export async function getMyAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page = 1,
  pageSize = 10,
  search?: string,
  signal?: AbortSignal,
): Promise<PagedResponse<AlbumResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/albums/mine", page, pageSize, search),
    { signal },
  );

  return parsePagedAlbums(await response.json());
}

export async function getSharedAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page = 1,
  pageSize = 10,
  search?: string,
  signal?: AbortSignal,
): Promise<PagedResponse<AlbumResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/albums/shared", page, pageSize, search),
    { signal },
  );

  return parsePagedAlbums(await response.json());
}

export async function getAdminAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page: number,
  pageSize: number,
  search?: string,
  signal?: AbortSignal,
): Promise<PagedResponse<AlbumResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/admin/albums", page, pageSize, search),
    { signal },
  );

  return parsePagedAlbums(await response.json());
}

export async function getMyAdminAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page = 1,
  pageSize = 10,
  search?: string,
): Promise<PagedResponse<AlbumResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/admin/albums/mine", page, pageSize, search),
  );

  return parsePagedAlbums(await response.json());
}

export async function getAlbum(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
): Promise<AlbumResponse> {
  const response = await callApi(instance, account, `/api/albums/${albumId}`);

  return parseAlbumResponse(await response.json());
}

export async function createAlbum(
  instance: IPublicClientApplication,
  account: AccountInfo,
  request: CreateAlbumRequest,
): Promise<AlbumResponse> {
  const validatedRequest = validateAlbumNameRequest(request);
  const response = await callApi(instance, account, "/api/albums", {
    method: "POST",
    body: JSON.stringify(validatedRequest),
  });

  return parseAlbumResponse(await response.json());
}

export async function updateAlbum(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  request: UpdateAlbumRequest,
): Promise<AlbumResponse> {
  const validatedRequest = validateAlbumNameRequest(request);
  const response = await callApi(instance, account, `/api/albums/${albumId}`, {
    method: "PUT",
    body: JSON.stringify(validatedRequest),
  });

  return parseAlbumResponse(await response.json());
}

export async function deleteAlbum(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
): Promise<void> {
  await callApi(instance, account, `/api/albums/${albumId}`, {
    method: "DELETE",
  });
}

export async function getAlbumMembers(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
): Promise<AlbumMemberResponse[]> {
  const response = await callApi(instance, account, `/api/albums/${albumId}/members`);
  const correlationId =
    response.headers.get("x-correlation-id") ?? response.headers.get("request-id") ?? undefined;
  return parseAlbumMembers(await response.json(), correlationId);
}

export async function addAlbumMember(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  request: AddAlbumMemberRequest,
): Promise<void> {
  const validation = AddAlbumMemberRequestSchema.safeParse(request);
  if (!validation.success) {
    throw new ApiError("Provide a valid email address and album permissions.", 400);
  }
  await callApi(instance, account, `/api/albums/${albumId}/members`, {
    method: "POST",
    body: JSON.stringify(validation.data),
  });
}

export async function updateAlbumMember(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  userId: number,
  request: UpdateAlbumMemberRequest,
): Promise<void> {
  const validation = UpdateAlbumMemberRequestSchema.safeParse(request);
  if (!validation.success) {
    throw new ApiError("Album permissions are invalid.", 400);
  }
  await callApi(instance, account, `/api/albums/${albumId}/members/${userId}`, {
    method: "PUT",
    body: JSON.stringify(validation.data),
  });
}

export async function removeAlbumMember(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  userId: number,
): Promise<void> {
  await callApi(instance, account, `/api/albums/${albumId}/members/${userId}`, {
    method: "DELETE",
  });
}
// Album Files API
export async function getAlbumFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  page: number,
  pageSize: number,
  category?: string,
): Promise<PagedResponse<FileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath(`/api/albums/${albumId}/files`, page, pageSize, undefined, category),
    { cache: "no-store" },
  );

  return parsePagedResponse(await response.json(), parseFileResponse);
}

export async function getAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
): Promise<FileResponse> {
  const response = await callApi(instance, account, `/api/albums/${albumId}/files/${fileId}`);

  return parseFileResponse(await response.json());
}

export async function uploadAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  file: File,
): Promise<FileResponse> {
  const value: unknown = await uploadMultipartFile(
    instance,
    account,
    `/api/albums/${albumId}/files`,
    "POST",
    file,
  );
  return parseFileResponse(value);
}

export async function replaceAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
  file: File,
): Promise<FileResponse> {
  const value: unknown = await uploadMultipartFile(
    instance,
    account,
    `/api/albums/${albumId}/files/${fileId}`,
    "PUT",
    file,
  );
  return parseFileResponse(value);
}

export async function downloadAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
  fallbackFileName: string,
): Promise<void> {
  await downloadResponse(
    instance,
    account,
    `/api/albums/${albumId}/files/${fileId}/download`,
    fallbackFileName,
  );
}

export async function getFilePreviewUrl(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
  albumId?: number,
  canManage = false,
): Promise<string> {
  // Managers can use the download endpoint; shared-album viewers use preview.
  const path = albumId
    ? canManage
      ? `/api/albums/${albumId}/files/${fileId}/download`
      : `/api/albums/${albumId}/files/${fileId}/preview`
    : `/api/files/${fileId}/download`;

  return getFilePreviewUrlByPath(instance, account, path);
}

export async function deleteAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
): Promise<{ storageCleanupComplete: boolean }> {
  const response = await callApi(instance, account, `/api/albums/${albumId}/files/${fileId}`, {
    method: "DELETE",
  });
  if (response.status === 204) return { storageCleanupComplete: true };
  return parseStorageCleanupResponse(await response.json());
}

export async function removeAlbumFileAssociation(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
): Promise<void> {
  await callApi(instance, account, `/api/albums/${albumId}/files/${fileId}/association`, {
    method: "DELETE",
  });
}
