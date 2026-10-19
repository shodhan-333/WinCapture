import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { callApi } from "@/shared/api/request";
import { buildPagePath } from "@/shared/api/pagination";
import { downloadResponse, uploadMultipartFile } from "@/shared/api/transfers";
import type { PagedResponse } from "@/shared/types/api";
import type { AdminFileResponse, FileResponse } from "@/features/files/types/file";
import {
  parseAdminFileResponse,
  parseFileResponse,
  parsePagedResponse,
  parseStorageCleanupResponse,
} from "@/features/files/schemas/fileResponse";
// Personal Files
export async function getFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page: number,
  pageSize: number,
  search?: string,
  category?: string,
  signal?: AbortSignal,
): Promise<PagedResponse<FileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/files", page, pageSize, search, category),
    { signal },
  );

  return parsePagedResponse(await response.json(), parseFileResponse);
}

export async function getFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
): Promise<FileResponse> {
  const response = await callApi(instance, account, `/api/files/${fileId}`);

  return parseFileResponse(await response.json());
}

export async function getFavorites(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page: number,
  pageSize: number,
  search?: string,
  category?: string,
  signal?: AbortSignal,
): Promise<PagedResponse<FileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/files/favorites", page, pageSize, search, category),
    { signal },
  );

  return parsePagedResponse(await response.json(), parseFileResponse);
}

export async function addFavorite(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
): Promise<void> {
  await callApi(instance, account, `/api/files/${fileId}/favorite`, {
    method: "PUT",
  });
}

export async function removeFavorite(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
): Promise<void> {
  await callApi(instance, account, `/api/files/${fileId}/favorite`, {
    method: "DELETE",
  });
}

export async function uploadFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  file: File,
): Promise<FileResponse> {
  const value: unknown = await uploadMultipartFile(instance, account, "/api/files", "POST", file);
  return parseFileResponse(value);
}

export async function replaceFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
  file: File,
): Promise<FileResponse> {
  const value: unknown = await uploadMultipartFile(
    instance,
    account,
    `/api/files/${fileId}`,
    "PUT",
    file,
  );
  return parseFileResponse(value);
}

export async function downloadFileByPath(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  fallbackFileName: string,
): Promise<void> {
  await downloadResponse(instance, account, path, fallbackFileName);
}

export async function deleteFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
): Promise<{ storageCleanupComplete: boolean }> {
  const response = await callApi(instance, account, `/api/files/${fileId}`, {
    method: "DELETE",
  });
  if (response.status === 204) return { storageCleanupComplete: true };
  return parseStorageCleanupResponse(await response.json());
}

// Admin API
export async function getAdminFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page: number,
  pageSize: number,
  search?: string,
  category?: string,
  signal?: AbortSignal,
): Promise<PagedResponse<AdminFileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/admin/files", page, pageSize, search, category),
    { signal },
  );

  return parsePagedResponse(await response.json(), parseAdminFileResponse);
}

export async function getMyAdminFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page = 1,
  pageSize = 10,
  search?: string,
): Promise<PagedResponse<AdminFileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/admin/files/mine", page, pageSize, search),
  );

  return parsePagedResponse(await response.json(), parseAdminFileResponse);
}
