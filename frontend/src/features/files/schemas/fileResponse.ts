import { z } from "zod";
import { ApiError, type PagedResponse } from "@/shared/types/api";

// Validate file metadata at the API boundary before it reaches file views.
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

export type FileResponse = z.infer<typeof FileResponseSchema>;
export type AdminFileResponse = z.infer<typeof AdminFileResponseSchema>;

export const StorageCleanupResponseSchema = z.object({ storageCleanupComplete: z.boolean() });
export const PaginationMetadataSchema = z.object({
  totalItems: z.number().int().safe().nonnegative(),
  page: z.number().int().safe().positive(),
  pageSize: z.number().int().safe().positive(),
  pageCount: z.number().int().safe().nonnegative(),
});

// Report malformed server data consistently instead of exposing incomplete file records.
function invalidFileResponse(): never {
  throw new ApiError(
    "WinCapture received invalid file information. Refresh and try again.",
    502,
    undefined,
    undefined,
    "INVALID_FILE_RESPONSE",
  );
}

// Parse unknown API data with a schema and normalize malformed responses.
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) invalidFileResponse();
  return result.data;
}

// Validate one regular file response.
export function parseFileResponse(value: unknown): FileResponse {
  return parse(FileResponseSchema, value);
}

// Validate the extended metadata returned by admin file endpoints.
export function parseAdminFileResponse(value: unknown): AdminFileResponse {
  return parse(AdminFileResponseSchema, value);
}

// Validate page metadata and parse each item with its endpoint-specific schema.
export function parsePagedResponse<T>(value: unknown, parseItem: (item: unknown) => T): PagedResponse<T> {
  const result = z.object({
    items: z.array(z.unknown()),
    ...PaginationMetadataSchema.shape,
  }).safeParse(value);
  if (!result.success) invalidFileResponse();
  return { ...result.data, items: result.data.items.map(parseItem) };
}

// Validate the cleanup status returned after a file deletion.
export function parseStorageCleanupResponse(value: unknown): { storageCleanupComplete: boolean } {
  return parse(StorageCleanupResponseSchema, value);
}
