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
// Album endpoints validate request and response data at the API boundary.
// Fetch a page of albums visible to the signed-in account.
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

// Fetch only albums owned by the signed-in account.
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

// Fetch albums shared with the signed-in account.
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

// Fetch albums across users for an administrator's all-content view.
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

// Fetch the administrator's own albums from the admin endpoint.
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

// Fetch and validate one album's details.
export async function getAlbum(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  signal?: AbortSignal,
): Promise<AlbumResponse> {
  const response = await callApi(instance, account, `/api/albums/${albumId}`, { signal });

  return parseAlbumResponse(await response.json());
}

// Validate and create an album for the signed-in account.
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

// Validate and save changes to an album's name.
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

// Delete an album through the authenticated API.
export async function deleteAlbum(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
): Promise<void> {
  await callApi(instance, account, `/api/albums/${albumId}`, {
    method: "DELETE",
  });
}

// Fetch and validate member permissions, retaining the server correlation ID on errors.
export async function getAlbumMembers(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  signal?: AbortSignal,
): Promise<AlbumMemberResponse[]> {
  const response = await callApi(instance, account, `/api/albums/${albumId}/members`, { signal });
  const correlationId =
    response.headers.get("x-correlation-id") ?? response.headers.get("request-id") ?? undefined;
  return parseAlbumMembers(await response.json(), correlationId);
}

// Validate and grant a user the requested album permissions.
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

// Validate and update one member's album permissions.
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

// Revoke one member's access to the album.
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
// Fetch a page of album files, optionally filtered by category.
export async function getAlbumFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  page: number,
  pageSize: number,
  category?: string,
  signal?: AbortSignal,
): Promise<PagedResponse<FileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath(`/api/albums/${albumId}/files`, page, pageSize, undefined, category),
    { cache: "no-store", signal },
  );

  return parsePagedResponse(await response.json(), parseFileResponse);
}

// Fetch and validate one file's album-specific metadata.
export async function getAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
  signal?: AbortSignal,
): Promise<FileResponse> {
  const response = await callApi(instance, account, `/api/albums/${albumId}/files/${fileId}`, { signal });

  return parseFileResponse(await response.json());
}

// Upload a new file to an album using multipart form data.
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

// Replace an existing album file's stored content and metadata.
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

// Download an album file and use its server filename when available.
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

// Choose the preview or download route based on the caller's album permissions.
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

// Delete an album file and report whether storage cleanup is complete.
export async function deleteAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
): Promise<{ storageCleanupComplete: boolean }> {
  const response = await callApi(instance, account, `/api/albums/${albumId}/files/${fileId}`, {
    method: "DELETE",
  });
  // Older API responses use 204 to indicate deletion without cleanup metadata.
  if (response.status === 204) return { storageCleanupComplete: true };
  return parseStorageCleanupResponse(await response.json());
}

// Remove the file from this album while retaining it in its owner's library.
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
