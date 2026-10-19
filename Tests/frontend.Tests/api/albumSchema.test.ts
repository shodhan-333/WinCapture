import { describe, expect, it } from "vitest";
import { AlbumResponseSchema, PagedAlbumsSchema, parseAlbumResponse, parsePagedAlbums } from "../../../frontend/src/features/albums/schemas/album";

const album = { id: 1, albumName: "Summer", ownerId: 3, ownerName: "Casey", createdAt: "2026-01-01T00:00:00Z", updatedAt: null };

describe("album response schemas", () => {
  it("accepts valid album and paginated responses", () => {
    expect(AlbumResponseSchema.safeParse(album).success).toBe(true);
    expect(parseAlbumResponse(album)).toEqual(album);
    expect(parsePagedAlbums({ items: [album], totalItems: 1, page: 1, pageSize: 10, pageCount: 1 })).toMatchObject({ items: [album], totalItems: 1 });
  });

  it("rejects malformed fields and pagination without dropping records", () => {
    expect(AlbumResponseSchema.safeParse({ ...album, ownerId: 0 }).success).toBe(false);
    expect(PagedAlbumsSchema.safeParse({ items: [{ ...album, createdAt: "bad" }], totalItems: 1, page: 1, pageSize: 10, pageCount: 1 }).success).toBe(false);
    expect(() => parsePagedAlbums({ items: [album], totalItems: -1, page: 1, pageSize: 10, pageCount: 1 })).toThrowError(expect.objectContaining({ code: "INVALID_ALBUM_RESPONSE", status: 502 }));
  });
});
