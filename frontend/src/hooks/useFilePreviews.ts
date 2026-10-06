import { useEffect, useState } from "react";

import type { FileResponse } from "../types/file";

export type FilePreviewLoader = (
  file: FileResponse,
) => Promise<string>;

interface UseFilePreviewsResult {
  previewUrls: Record<number, string>;
  loading: boolean;
}

export default function useFilePreviews(
  files: FileResponse[],
  loadPreview: FilePreviewLoader,
): UseFilePreviewsResult {
  const [previewUrls, setPreviewUrls] =
    useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let cleanupRequested = false;
    const createdUrls: string[] = [];

    const registerUrl = (url: string) => {
      if (cleanupRequested) {
        URL.revokeObjectURL(url);
        return;
      }

      createdUrls.push(url);
    };

    const imageFiles = files.filter((file) =>
      file.contentType.startsWith("image/"),
    );

    setPreviewUrls({});
    setLoading(imageFiles.length > 0);

    if (imageFiles.length === 0) {
      return () => {
        cleanupRequested = true;
      };
    }

    const load = async () => {
      const results = await Promise.all(
        imageFiles.map(async (file) => {
          try {
            const url = await loadPreview(file);
            registerUrl(url);

            return [file.id, url] as const;
          } catch {
            return null;
          }
        }),
      );

      if (!active) {
        return;
      }

      setPreviewUrls(
        Object.fromEntries(
          results.filter(
            (entry): entry is readonly [number, string] =>
              entry !== null,
          ),
        ),
      );
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
      cleanupRequested = true;

      createdUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [files, loadPreview]);

  return {
    previewUrls,
    loading,
  };
}
