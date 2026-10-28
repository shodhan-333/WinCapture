import { describe, expect, it } from "vitest";
import {
  FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  getFileCategory,
  getFileExtension,
  isImagePreviewableFile,
  isPreviewableFile,
  UploadFileSchema,
  validateUploadFile,
} from "../../src/features/files/constants/fileSupport";

describe("supported file rules", () => {
  it("classifies exactly the backend-supported extensions", () => {
    expect(FILE_EXTENSIONS).toEqual({
      Images: [".jpg", ".jpeg", ".png", ".webp"],
      Documents: [".pdf", ".txt", ".csv", ".docx", ".xlsx", ".pptx"],
      Videos: [".mp4", ".mov", ".webm"],
      Audio: [".mp3", ".wav", ".m4a"],
      Archives: [".zip"],
    });
    expect(getFileCategory("PHOTO.JPEG")).toBe("Images");
    expect(getFileCategory("notes.csv")).toBe("Documents");
    expect(getFileCategory("bundle.zip")).toBe("Archives");
    expect(getFileCategory("clip.webm")).toBe("Videos");
    expect(getFileCategory("voice.m4a")).toBe("Audio");
    expect(getFileCategory("script.html")).toBeUndefined();
    expect(getFileExtension("README")).toBe("");
    expect(getFileExtension("IMAGE.PNG")).toBe(".png");
    expect(isPreviewableFile("voice.wav")).toBe(true);
    expect(isPreviewableFile("script.html")).toBe(false);
    expect(isImagePreviewableFile("IMAGE.JPEG")).toBe(true);
    expect(isImagePreviewableFile("poster.gif")).toBe(false);
  });

  it("enforces nonempty files and the exact 10 MiB limit", () => {
    const file = (name: string, size: number) => new File([new Uint8Array(size)], name);
    expect(validateUploadFile(file("empty.pdf", 0))).toMatch(/empty/i);
    expect(validateUploadFile(file("oversize.pdf", MAX_FILE_SIZE_BYTES + 1))).toMatch(/10 MB/i);
    expect(validateUploadFile(file("limit.pdf", MAX_FILE_SIZE_BYTES))).toBeUndefined();
    expect(validateUploadFile(file("no.exe", 1))).toMatch(/Unsupported/i);
    expect(UploadFileSchema.safeParse({}).success).toBe(false);
  });
});
