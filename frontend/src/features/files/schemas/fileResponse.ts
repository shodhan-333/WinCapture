import { z } from "zod";
import { ApiError, type PagedResponse } from "@/shared/types/api";
import type { AdminFileResponse, FileResponse } from "@/features/files/types/file";

const positiveId = z.number().int().safe().positive();
const validDate = z.string().min(1).refine((value) => Number.isFinite(Date.parse(value)));

export const FileResponseSchema = z.object({
  id: positiveId,
  originalFileName: z.string().refine((value) => value.trim().length > 0),
  contentType: z.string().refine((value) => value.trim().length > 0),
  fileSize: z.number().int().safe().nonnegative(),
  uploadedAt: validDate,
  url: z.string(),
  downloadUrl: z.string(),
  isFavorite: z.boolean(),
  canManage: z.boolean(),
  canDownload: z.boolean(),
});

export const AdminFileResponseSchema = z.object({
  id: positiveId,
  originalFileName: z.string().refine((value) => value.trim().length > 0),
  contentType: z.string().refine((value) => value.trim().length > 0),
  fileSize: z.number().int().safe().nonnegative(),
  uploadedAt: validDate,
  uploadedBy: positiveId,
  uploaderName: z.string().refine((value) => value.trim().length > 0),
  albumId: positiveId.nullable(),
  albumName: z.string().nullable(),
});

export const StorageCleanupResponseSchema = z.object({ storageCleanupComplete: z.boolean() });
export const PaginationMetadataSchema = z.object({
  totalItems: z.number().int().safe().nonnegative(),
  page: z.number().int().safe().positive(),
  pageSize: z.number().int().safe().positive(),
  pageCount: z.number().int().safe().nonnegative(),
});

function invalidFileResponse(): never {
  throw new ApiError(
    "WinCapture received invalid file information. Refresh and try again.",
    502,
    undefined,
    undefined,
    "INVALID_FILE_RESPONSE",
  );
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) invalidFileResponse();
  return result.data;
}

export function parseFileResponse(value: unknown): FileResponse {
  return parse(FileResponseSchema, value);
}

export function parseAdminFileResponse(value: unknown): AdminFileResponse {
  return parse(AdminFileResponseSchema, value);
}

export function parsePagedResponse<T>(value: unknown, parseItem: (item: unknown) => T): PagedResponse<T> {
  const result = z.object({
    items: z.array(z.unknown()),
    ...PaginationMetadataSchema.shape,
  }).safeParse(value);
  if (!result.success) invalidFileResponse();
  return { ...result.data, items: result.data.items.map(parseItem) };
}

export function parseStorageCleanupResponse(value: unknown): { storageCleanupComplete: boolean } {
  return parse(StorageCleanupResponseSchema, value);
}
