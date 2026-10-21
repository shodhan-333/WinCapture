import { z } from "zod";
import { ApiError } from "@/shared/types/api";

// Keep sharing permissions valid: a member must be able to view before downloading.
export const AlbumMemberSchema = z.object({
  userId: z.number().int().safe().positive(),
  name: z.string().refine((value) => value.trim().length > 0),
  email: z.string().refine((value) => value.trim().length > 0),
  canView: z.boolean(),
  canDownload: z.boolean(),
  grantedAt: z.string().min(1).refine((value) => Number.isFinite(Date.parse(value))),
}).refine((member) => !member.canDownload || member.canView);

// Preserve the request correlation ID when reporting malformed sharing responses.
function invalidAlbumMembers(correlationId?: string): never {
  throw new ApiError(
    "WinCapture received invalid album sharing data. Refresh the album and retry.",
    502,
    undefined,
    correlationId,
    "INVALID_ALBUM_MEMBERS_RESPONSE",
  );
}

// Validate the member list and attach the request ID to malformed-response errors.
export function parseAlbumMembers(value: unknown, correlationId?: string): z.infer<typeof AlbumMemberSchema>[] {
  const result = z.array(AlbumMemberSchema).safeParse(value);
  if (!result.success) invalidAlbumMembers(correlationId);
  return result.data;
}
