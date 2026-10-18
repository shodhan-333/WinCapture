import { describe, expect, it } from "vitest";
import { parseAlbumMembers } from "../../../frontend/src/features/albums/schemas/albumMember";

const validMember = {
  userId: 9,
  name: "Jordan Lee",
  email: "jordan@example.com",
  canView: true,
  canDownload: false,
  grantedAt: "2026-01-01T00:00:00Z",
};

describe("parseAlbumMembers", () => {
  it("accepts valid album access records", () => {
    expect(parseAlbumMembers([validMember])).toEqual([validMember]);
  });

  it("rejects invalid permission combinations with a correlation ID", () => {
    expect(() =>
      parseAlbumMembers(
        [{ ...validMember, canView: false, canDownload: true }],
        "correlation-invalid",
      ),
    ).toThrow(
      expect.objectContaining({
        name: "ApiError",
        status: 502,
        code: "INVALID_ALBUM_MEMBERS_RESPONSE",
        correlationId: "correlation-invalid",
      }),
    );
  });
});
