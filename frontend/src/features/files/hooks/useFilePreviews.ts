import { useQueries } from "@tanstack/react-query";

import type { FileResponse } from "@/features/files/types/file";
import { isImagePreviewableFile } from "@/features/files/constants/fileSupport";

export type FilePreviewLoader<TFile extends FileResponse = FileResponse> = (file: TFile) => Promise<string>;

interface UseFilePreviewsResult {
  previewUrls: Record<number, string>;
  loading: boolean;
}

// Cache authenticated blob previews by account and file version in TanStack Query.
export function useFilePreviews<TFile extends FileResponse>(
  files: TFile[],
  loadPreview: FilePreviewLoader<TFile>,
  accountKey: string | null = null,
): UseFilePreviewsResult {
  const imageFiles = files.filter(
    (file) => file.contentType.startsWith("image/") && isImagePreviewableFile(file.originalFileName),
  );
  const queries = useQueries({
    queries: imageFiles.map((file) => {
      const signature = `${file.contentType}:${file.fileSize}:${file.uploadedAt}`;
      return {
        queryKey: ["file-preview", accountKey, file.id, signature, file.downloadUrl, file.canManage],
        queryFn: () => loadPreview(file).catch(() => null),
        staleTime: Infinity,
        gcTime: 60_000,
        retry: false,
      };
    }),
  });
  const previewUrls = Object.fromEntries(
    imageFiles.flatMap((file, index) => {
      const url = queries[index]?.data;
      return typeof url === "string" ? [[file.id, url]] : [];
    }),
  );
  return { previewUrls, loading: queries.some((query) => query.isFetching) };
}
