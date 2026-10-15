import { useEffect, useRef, useState } from "react";

import type { FileResponse } from "../types/file";
import { isImagePreviewableFile } from "../constants/fileSupport";

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
  const cache = useRef(new Map<number, { signature: string; url: string }>());
  const pending = useRef(new Map<string, Promise<string>>());
  const currentSignatures = useRef(new Map<number, string>());

  useEffect(() => {
    let active = true;

    const imageFiles = files.filter((file) => isImagePreviewableFile(file.originalFileName));

    const signatureFor = (file: FileResponse) =>
      `${file.contentType}:${file.fileSize}:${file.uploadedAt}`;
    currentSignatures.current = new Map(
      imageFiles.map((file) => [file.id, signatureFor(file)]),
    );
    cache.current.forEach((entry, id) => {
      const currentFile = imageFiles.find((file) => file.id === id);
      if (!currentFile || entry.signature !== signatureFor(currentFile)) {
        URL.revokeObjectURL(entry.url);
        cache.current.delete(id);
      }
    });
    setPreviewUrls(Object.fromEntries(imageFiles.flatMap(file => {
      const entry = cache.current.get(file.id);
      return entry?.signature === signatureFor(file) ? [[file.id, entry.url]] : [];
    })));
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
            const signature = signatureFor(file);
            const pendingKey = `${file.id}:${signature}`;
            let request = pending.current.get(pendingKey);
            if (!request) {
              request = loadPreview(file);
              pending.current.set(pendingKey, request);
            }
            const cached = cache.current.get(file.id);
            const url = cached?.signature === signature ? cached.url : await request;
            const isCurrent =
              active && currentSignatures.current.get(file.id) === signature;
            if (!isCurrent) {
              // Requests shared with a newer effect may still be consumed there.
              if (currentSignatures.current.get(file.id) !== signature) {
                URL.revokeObjectURL(url);
              }
              return null;
            }

            const previous = cache.current.get(file.id);
            if (previous && previous.url !== url && previous.signature !== signature) {
              URL.revokeObjectURL(previous.url);
            }
            cache.current.set(file.id, { signature, url });

            return [file.id, url] as const;
          } catch {
            return null;
          } finally {
            pending.current.delete(`${file.id}:${signatureFor(file)}`);
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
    currentSignatures.current.clear();
    cache.current.forEach((entry) => URL.revokeObjectURL(entry.url));
    cache.current.clear();
  }, []);

  return {
    previewUrls,
    loading,
  };
}
