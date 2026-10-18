import { ApiError } from "@/shared/types/api";
import type { AlbumMemberResponse } from "@/features/albums/types/album";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidAlbumMembers(correlationId?: string): never {
  throw new ApiError(
    "WinCapture received invalid album sharing data. Refresh the album and retry.",
    502,
    undefined,
    correlationId,
    "INVALID_ALBUM_MEMBERS_RESPONSE",
  );
}

export function parseAlbumMembers(value: unknown, correlationId?: string): AlbumMemberResponse[] {
  if (!Array.isArray(value)) invalidAlbumMembers(correlationId);

  return value.map((member): AlbumMemberResponse => {
    if (!isRecord(member)) invalidAlbumMembers(correlationId);

    const { userId, name, email, canView, canDownload, grantedAt } = member;
    if (typeof userId !== "number" || !Number.isSafeInteger(userId) || userId <= 0) {
      invalidAlbumMembers(correlationId);
    }
    if (typeof name !== "string" || !name.trim()) invalidAlbumMembers(correlationId);
    if (typeof email !== "string" || !email.trim()) invalidAlbumMembers(correlationId);
    if (typeof canView !== "boolean" || typeof canDownload !== "boolean") {
      invalidAlbumMembers(correlationId);
    }
    if (canDownload && !canView) invalidAlbumMembers(correlationId);
    if (typeof grantedAt !== "string" || !Number.isFinite(Date.parse(grantedAt))) {
      invalidAlbumMembers(correlationId);
    }

    return { userId, name, email, canView, canDownload, grantedAt };
  });
}
