import { describe, expect, it } from "vitest";
import {
  parseAdminFileResponse,
  parseFileResponse,
  parsePagedResponse,
} from "../../../frontend/src/features/files/schemas/fileResponse";

const file = {
  id: 9,
  originalFileName: "photo.png",
  contentType: "image/png",
  fileSize: 128,
  uploadedAt: "2026-01-01T00:00:00Z",
  url: "/api/files/9/preview",
  downloadUrl: "/api/files/9/download",
  isFavorite: false,
  canManage: true,
  canDownload: true,
};

describe("file response schemas", () => {
  it("accepts valid file metadata and paged responses", () => {
    expect(parseFileResponse(file)).toEqual(file);
    expect(
      parsePagedResponse(
        { items: [file], totalItems: 1, page: 1, pageSize: 10, pageCount: 1 },
        parseFileResponse,
      ),
    ).toEqual({
      items: [file],
      totalItems: 1,
      page: 1,
      pageSize: 10,
      pageCount: 1,
    });
  });

  it("rejects malformed file data and invalid paging metadata", () => {
    expect(() => parseFileResponse({ ...file, fileSize: -1 })).toThrowError(
      expect.objectContaining({ code: "INVALID_FILE_RESPONSE", status: 502 }),
    );
    expect(() =>
      parsePagedResponse(
        { items: [], totalItems: -1, page: 1, pageSize: 10, pageCount: 0 },
        parseFileResponse,
      ),
    ).toThrowError(expect.objectContaining({ code: "INVALID_FILE_RESPONSE", status: 502 }));
  });

  it("accepts nullable album metadata on admin file responses", () => {
    expect(
      parseAdminFileResponse({
        id: 9,
        originalFileName: "photo.png",
        contentType: "image/png",
        fileSize: 128,
        uploadedAt: "2026-01-01T00:00:00Z",
        uploadedBy: 7,
        uploaderName: "Avery Morgan",
        albumId: null,
        albumName: null,
      }),
    ).toMatchObject({ id: 9, albumId: null, albumName: null });
  });
});
