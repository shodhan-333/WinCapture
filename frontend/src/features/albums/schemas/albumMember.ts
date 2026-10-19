import { z } from "zod";
import { ApiError } from "@/shared/types/api";

export const AlbumMemberSchema = z.object({
  userId: z.number().int().safe().positive(),
  name: z.string().refine((value) => value.trim().length > 0),
  email: z.string().refine((value) => value.trim().length > 0),
  canView: z.boolean(),
  canDownload: z.boolean(),
  grantedAt: z.string().min(1).refine((value) => Number.isFinite(Date.parse(value))),
}).refine((member) => !member.canDownload || member.canView);

function invalidAlbumMembers(correlationId?: string): never {
  throw new ApiError(
    "WinCapture received invalid album sharing data. Refresh the album and retry.",
    502,
    undefined,
    correlationId,
    "INVALID_ALBUM_MEMBERS_RESPONSE",
  );
}

export function parseAlbumMembers(value: unknown, correlationId?: string): z.infer<typeof AlbumMemberSchema>[] {
  const result = z.array(AlbumMemberSchema).safeParse(value);
  if (!result.success) invalidAlbumMembers(correlationId);
  return result.data;
}
