import { ApiError } from "@/shared/types/api";
import type { AdminFileResponse, FileResponse } from "@/features/files/types/file";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidFileResponse(): never {
  throw new ApiError(
    "WinCapture received invalid file information. Refresh and try again.",
    502,
    undefined,
    undefined,
    "INVALID_FILE_RESPONSE",
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

export function parseFileResponse(value: unknown): FileResponse {
  if (!isRecord(value)) invalidFileResponse();
  if (
    !isPositiveSafeInteger(value.id) ||
    !isNonEmptyString(value.originalFileName) ||
    !isNonEmptyString(value.contentType) ||
    typeof value.fileSize !== "number" ||
    !Number.isSafeInteger(value.fileSize) ||
    value.fileSize < 0 ||
    !isValidDate(value.uploadedAt) ||
    typeof value.url !== "string" ||
    typeof value.downloadUrl !== "string" ||
    typeof value.isFavorite !== "boolean" ||
    typeof value.canManage !== "boolean" ||
    typeof value.canDownload !== "boolean"
  ) {
    invalidFileResponse();
  }
  return {
    id: value.id,
    originalFileName: value.originalFileName,
    contentType: value.contentType,
    fileSize: value.fileSize,
    uploadedAt: value.uploadedAt,
    url: value.url,
    downloadUrl: value.downloadUrl,
    isFavorite: value.isFavorite,
    canManage: value.canManage,
    canDownload: value.canDownload,
  };
}

export function parseAdminFileResponse(value: unknown): AdminFileResponse {
  if (!isRecord(value)) invalidFileResponse();
  if (
    !isPositiveSafeInteger(value.id) ||
    !isNonEmptyString(value.originalFileName) ||
    !isNonEmptyString(value.contentType) ||
    typeof value.fileSize !== "number" ||
    !Number.isSafeInteger(value.fileSize) ||
    value.fileSize < 0 ||
    !isValidDate(value.uploadedAt) ||
    !isPositiveSafeInteger(value.uploadedBy) ||
    !isNonEmptyString(value.uploaderName) ||
    (value.albumId !== null && !isPositiveSafeInteger(value.albumId)) ||
    (value.albumName !== null && typeof value.albumName !== "string")
  ) {
    invalidFileResponse();
  }
  return {
    id: value.id,
    originalFileName: value.originalFileName,
    contentType: value.contentType,
    fileSize: value.fileSize,
    uploadedAt: value.uploadedAt,
    uploadedBy: value.uploadedBy,
    uploaderName: value.uploaderName,
    albumId: value.albumId,
    albumName: value.albumName,
  };
}

export function parsePagedResponse<T>(value: unknown, parseItem: (item: unknown) => T) {
  if (!isRecord(value) || !Array.isArray(value.items)) invalidFileResponse();
  const { totalItems, page, pageSize, pageCount } = value;
  if (
    !isNonNegativeSafeInteger(totalItems) ||
    !isPositiveSafeInteger(page) ||
    !isPositiveSafeInteger(pageSize) ||
    !isNonNegativeSafeInteger(pageCount)
  )
    invalidFileResponse();
  return { items: value.items.map(parseItem), totalItems, page, pageSize, pageCount };
}

export function parseStorageCleanupResponse(value: unknown): { storageCleanupComplete: boolean } {
  if (!isRecord(value) || typeof value.storageCleanupComplete !== "boolean") {
    invalidFileResponse();
  }
  return { storageCleanupComplete: value.storageCleanupComplete };
}
