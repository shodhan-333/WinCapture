import { useEffect, useState } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";

import { getAlbumFiles, getFilePreviewUrl } from "../api/apiClient";
import type { AlbumResponse } from "../types/album";

export default function useAlbumCoverPreviews(
  albums: AlbumResponse[],
  instance: IPublicClientApplication,
  account: AccountInfo | null,
  userId?: number,
  isAdmin = false,
): Record<number, string> {
  const [coverUrls, setCoverUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;
    let cleanupRequested = false;
    const createdUrls: string[] = [];

    const registerUrl = (url: string) => {
      if (cleanupRequested) {
        URL.revokeObjectURL(url);
      } else {
        createdUrls.push(url);
      }
    };

    setCoverUrls({});

    if (!account || albums.length === 0) {
      return () => {
        cleanupRequested = true;
      };
    }

    const load = async () => {
      const entries = await Promise.all(
        albums.map(async (album) => {
          try {
            const files = await getAlbumFiles(instance, account, album.id);
            const image = files.find((file) => file.contentType.startsWith("image/"));
            if (!image) return null;

            const canManage = isAdmin || album.ownerId === userId;
            const url = await getFilePreviewUrl(
              instance,
              account,
              image.id,
              album.id,
              canManage,
            );
            registerUrl(url);
            return [album.id, url] as const;
          } catch {
            return null;
          }
        }),
      );

      if (!active) return;
      setCoverUrls(
        Object.fromEntries(
          entries.filter((entry): entry is readonly [number, string] => entry !== null),
        ),
      );
    };

    void load();

    return () => {
      active = false;
      cleanupRequested = true;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [account, albums, instance, isAdmin, userId]);

  return coverUrls;
}
