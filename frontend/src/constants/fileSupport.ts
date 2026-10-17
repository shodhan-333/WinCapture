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

export const SUPPORTED_FILE_ACCEPT = Object.values(FILE_EXTENSIONS)
  .flat()
  .join(",");

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot >= 0 ? fileName.slice(lastDot).toLocaleLowerCase() : "";
}

export function getFileCategory(fileName: string): FileCategory | undefined {
  const extension = getFileExtension(fileName);

  return (
    Object.entries(FILE_EXTENSIONS) as [FileCategory, readonly string[]][]
  ).find(([, extensions]) => extensions.includes(extension))?.[0];
}

export function validateUploadFile(file: File): string | undefined {
  if (!getFileCategory(file.name)) {
    return "Unsupported file format.";
  }

  if (file.size <= 0) {
    return "The selected file is empty.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Files must be 10 MB or smaller.";
  }

  return undefined;
}

export function isPreviewableFile(fileName: string): boolean {
  return getFileCategory(fileName) !== undefined;
}

export function isImagePreviewableFile(fileName: string): boolean {
  return FILE_EXTENSIONS.Images.includes(
    getFileExtension(fileName) as (typeof FILE_EXTENSIONS.Images)[number],
  );
}
