import { z } from "zod";
import { ApiError } from "@/shared/types/api";

// Validate API identifiers and timestamps before album data enters the UI.
const positiveId = z.number().int().safe().positive();
const validDate = z.string().min(1).refine((value) => Number.isFinite(Date.parse(value)));

export const AlbumResponseSchema = z.object({
  id: positiveId,
  albumName: z.string().refine((value) => value.trim().length > 0),
  ownerId: positiveId,
  ownerName: z.string().refine((value) => value.trim().length > 0),
  createdAt: validDate,
  updatedAt: validDate.nullable(),
});

export const PagedAlbumsSchema = z.object({
  items: z.array(AlbumResponseSchema),
  totalItems: z.number().int().safe().nonnegative(),
  page: z.number().int().safe().positive(),
  pageSize: z.number().int().safe().positive(),
  pageCount: z.number().int().safe().nonnegative(),
});

export const AlbumNameRequestSchema = z.object({ albumName: z.string().min(1).max(200).refine((value) => value.trim().length > 0) });
export const AddAlbumMemberRequestSchema = z.object({
  email: z.email(),
  canView: z.boolean(),
  canDownload: z.boolean(),
}).refine((request) => request.canView || !request.canDownload);
export const UpdateAlbumMemberRequestSchema = z.object({
  canView: z.boolean(),
  canDownload: z.boolean(),
}).refine((request) => request.canView || !request.canDownload);

// Convert invalid user input into the same API error shape used by request handlers.
export function validateAlbumNameRequest(value: unknown) {
  const result = AlbumNameRequestSchema.safeParse(value);
  if (!result.success) throw new ApiError("Album name must contain 1 to 200 characters.", 400);
  return result.data;
}

// Treat malformed server responses as gateway errors instead of rendering partial data.
function invalidAlbumResponse(): never {
  throw new ApiError(
    "WinCapture received invalid album information. Refresh and try again.",
    502,
    undefined,
    undefined,
    "INVALID_ALBUM_RESPONSE",
  );
}

// Parse one untrusted API album response into its validated type.
export function parseAlbumResponse(value: unknown) {
  const result = AlbumResponseSchema.safeParse(value);
  if (!result.success) invalidAlbumResponse();
  return result.data;
}

// Validate page metadata and every album in a list response.
export function parsePagedAlbums(value: unknown) {
  const result = PagedAlbumsSchema.safeParse(value);
  if (!result.success) invalidAlbumResponse();
  return result.data;
}
