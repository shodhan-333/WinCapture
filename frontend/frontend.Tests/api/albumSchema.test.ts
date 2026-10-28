import { describe, expect, it } from "vitest";
import {
  AddAlbumMemberRequestSchema,
  AlbumNameRequestSchema,
  AlbumResponseSchema,
  PagedAlbumsSchema,
  UpdateAlbumMemberRequestSchema,
  parseAlbumResponse,
  parsePagedAlbums,
  validateAlbumNameRequest,
} from "../../src/features/albums/schemas/album";

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

  it("validates album names and enforces view permission for downloads", () => {
    expect(AlbumNameRequestSchema.safeParse({ albumName: "  Summer  " }).success).toBe(true);
    expect(validateAlbumNameRequest({ albumName: " Summer " })).toEqual({ albumName: " Summer " });
    for (const input of [{ albumName: "" }, { albumName: "  " }, { albumName: "x".repeat(201) }, null]) {
      expect(AlbumNameRequestSchema.safeParse(input).success).toBe(false);
      expect(() => validateAlbumNameRequest(input)).toThrowError(expect.objectContaining({ status: 400 }));
    }

    expect(AddAlbumMemberRequestSchema.safeParse({ email: "person@example.test", canView: true, canDownload: true }).success).toBe(true);
    expect(AddAlbumMemberRequestSchema.safeParse({ email: "person@example.test", canView: false, canDownload: false }).success).toBe(true);
    expect(AddAlbumMemberRequestSchema.safeParse({ email: "person@example.test", canView: false, canDownload: true }).success).toBe(false);
    expect(UpdateAlbumMemberRequestSchema.safeParse({ canView: false, canDownload: true }).success).toBe(false);
    expect(UpdateAlbumMemberRequestSchema.safeParse({ canView: false, canDownload: false }).success).toBe(true);
  });

  it("rejects whitespace-only owner or album labels and accepts an updated timestamp", () => {
    expect(AlbumResponseSchema.safeParse({ ...album, albumName: "  " }).success).toBe(false);
    expect(AlbumResponseSchema.safeParse({ ...album, ownerName: "\t" }).success).toBe(false);
    expect(AlbumResponseSchema.safeParse({ ...album, updatedAt: "2026-02-01T00:00:00Z" }).success).toBe(true);
    expect(AlbumResponseSchema.safeParse({ ...album, updatedAt: "" }).success).toBe(false);
  });
});
