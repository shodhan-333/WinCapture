import { describe, expect, it } from "vitest";
import {
  parseAlbumResponse,
  parsePagedAlbums,
} from "../../src/features/albums/schemas/album";

const album = {
  id: 8,
  albumName: "Trips",
  ownerId: 7,
  ownerName: "Avery Morgan",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: null,
};

describe("album response schemas", () => {
  it("accepts album metadata and nullable update times", () => {
    expect(parseAlbumResponse(album)).toEqual(album);
    expect(
      parsePagedAlbums({
        items: [album],
        totalItems: 1,
        page: 1,
        pageSize: 10,
        pageCount: 1,
      }),
    ).toEqual({
      items: [album],
      totalItems: 1,
      page: 1,
      pageSize: 10,
      pageCount: 1,
    });
  });

  it("rejects malformed albums and invalid paging metadata", () => {
    expect(() => parseAlbumResponse({ ...album, ownerId: 0 })).toThrowError(
      expect.objectContaining({ code: "INVALID_ALBUM_RESPONSE", status: 502 }),
    );
    expect(() =>
      parsePagedAlbums({
        items: [],
        totalItems: -1,
        page: 1,
        pageSize: 10,
        pageCount: 0,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_ALBUM_RESPONSE", status: 502 }));
  });
});
