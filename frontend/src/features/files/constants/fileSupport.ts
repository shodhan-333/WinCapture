import { z } from "zod";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const FILE_EXTENSIONS = {
  Images: [".jpg", ".jpeg", ".png", ".webp"],
  Documents: [".pdf", ".txt", ".csv", ".docx", ".xlsx", ".pptx"],
  Videos: [".mp4", ".mov", ".webm"],
  Audio: [".mp3", ".wav", ".m4a"],
  Archives: [".zip"],
} as const;

export type FileCategory = keyof typeof FILE_EXTENSIONS;
export type FileCategoryFilter = "All" | FileCategory;

export const FILE_CATEGORY_FILTERS: FileCategoryFilter[] = [
  "All",
  "Images",
  "Documents",
  "Videos",
  "Audio",
  "Archives",
];

export const SUPPORTED_FILE_ACCEPT = Object.values(FILE_EXTENSIONS).flat().join(",");

export const UploadFileSchema = z.custom<File>(
  (value) => typeof File !== "undefined" && value instanceof File,
  "Select a valid file.",
).superRefine((file, context) => {
  if (typeof File === "undefined" || !(file instanceof File)) return;
  if (!getFileCategory(file.name)) {
    context.addIssue({ code: "custom", message: "Unsupported file format." });
  }
  if (file.size <= 0) {
    context.addIssue({ code: "custom", message: "The selected file is empty." });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    context.addIssue({ code: "custom", message: "Files must be 10 MB or smaller." });
  }
});

// Normalize and return the suffix used to classify a file.
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot >= 0 ? fileName.slice(lastDot).toLocaleLowerCase() : "";
}

// Match a file extension to the supported upload category.
export function getFileCategory(fileName: string): FileCategory | undefined {
  const extension = getFileExtension(fileName);

  return (Object.entries(FILE_EXTENSIONS) as [FileCategory, readonly string[]][]).find(
    ([, extensions]) => extensions.includes(extension),
  )?.[0];
}

// Reject unsupported, empty, or oversized files before upload requests are sent.
export function validateUploadFile(file: File): string | undefined {
  const result = UploadFileSchema.safeParse(file);
  return result.success ? undefined : result.error.issues[0]?.message ?? "Select a valid file.";
}

// Check whether a file extension belongs to any supported preview category.
export function isPreviewableFile(fileName: string): boolean {
  return getFileCategory(fileName) !== undefined;
}

// Limit image previews to the image formats handled by the preview UI.
export function isImagePreviewableFile(fileName: string): boolean {
  return FILE_EXTENSIONS.Images.includes(
    getFileExtension(fileName) as (typeof FILE_EXTENSIONS.Images)[number],
  );
}
