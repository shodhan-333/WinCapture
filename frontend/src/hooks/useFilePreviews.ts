import { useEffect, useRef, useState } from "react";

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
  const cache = useRef(new Map<number, string>());
  const pending = useRef(new Map<number, Promise<string>>());

  useEffect(() => {
    let active = true;

    const imageFiles = files.filter((file) =>
      file.contentType.startsWith("image/"),
    );

    setPreviewUrls(Object.fromEntries(imageFiles.flatMap(file => cache.current.has(file.id) ? [[file.id, cache.current.get(file.id)!]] : [])));
    setLoading(imageFiles.length > 0);

    if (imageFiles.length === 0) {
      return () => {
        active = false;
      };
    }

    const load = async () => {
      const results = await Promise.all(
        imageFiles.map(async (file) => {
          try {
            let request = pending.current.get(file.id);
            if (!request) {
              request = loadPreview(file);
              pending.current.set(file.id, request);
            }
            const url = cache.current.get(file.id) ?? await request;
            cache.current.set(file.id, url);

            return [file.id, url] as const;
          } catch {
            return null;
          } finally {
            pending.current.delete(file.id);
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
    };
  }, [files, loadPreview]);

  useEffect(() => () => {
    cache.current.forEach((url) => URL.revokeObjectURL(url));
    cache.current.clear();
  }, []);

  return {
    previewUrls,
    loading,
  };
}
