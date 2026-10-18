import { ApiError } from "@/shared/types/api";
import type { AlbumResponse } from "@/features/albums/types/album";
import type { PagedResponse } from "@/shared/types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidAlbumResponse(): never {
  throw new ApiError(
    "WinCapture received invalid album information. Refresh and try again.",
    502,
    undefined,
    undefined,
    "INVALID_ALBUM_RESPONSE",
  );
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

export function parseAlbumResponse(value: unknown): AlbumResponse {
  if (
    !isRecord(value) ||
    !isPositiveSafeInteger(value.id) ||
    typeof value.albumName !== "string" ||
    !value.albumName.trim() ||
    !isPositiveSafeInteger(value.ownerId) ||
    typeof value.ownerName !== "string" ||
    !value.ownerName.trim() ||
    !isValidDate(value.createdAt) ||
    (value.updatedAt !== null && !isValidDate(value.updatedAt))
  ) {
    invalidAlbumResponse();
  }
  return {
    id: value.id,
    albumName: value.albumName,
    ownerId: value.ownerId,
    ownerName: value.ownerName,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function parsePagedAlbums(value: unknown): PagedResponse<AlbumResponse> {
  if (!isRecord(value) || !Array.isArray(value.items)) invalidAlbumResponse();
  const { totalItems, page, pageSize, pageCount } = value;
  if (
    typeof totalItems !== "number" ||
    !Number.isSafeInteger(totalItems) ||
    totalItems < 0 ||
    typeof page !== "number" ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    typeof pageSize !== "number" ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    typeof pageCount !== "number" ||
    !Number.isSafeInteger(pageCount) ||
    pageCount < 0
  )
    invalidAlbumResponse();
  return {
    items: value.items.map(parseAlbumResponse),
    totalItems,
    page,
    pageSize,
    pageCount,
  };
}
