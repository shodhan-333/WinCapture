import { useEffect, useState } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";

import { getAlbumFiles, getFilePreviewUrl } from "../api/albumsApi";
import type { AlbumResponse } from "@/features/albums/types/album";
import { getAccountKey } from "@/shared/utils/accountKey";

export function useAlbumCoverPreviews(
  albums: AlbumResponse[],
  instance: IPublicClientApplication,
  account: AccountInfo | null,
  userId?: number,
  isAdmin = false,
): Record<number, string> {
  const [coverUrls, setCoverUrls] = useState<Record<number, string>>({});
  const accountKey = getAccountKey(account);

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
            const page = await getAlbumFiles(instance, account, album.id, 1, 100, "Images");
            const image = page.items[0];
            if (!image) return null;

            const canManage = isAdmin || album.ownerId === userId;
            const url = await getFilePreviewUrl(instance, account, image.id, album.id, canManage);
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
    // Account object refreshes with an unchanged homeAccountId do not require refetching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountKey, albums, instance, isAdmin, userId]);

  return coverUrls;
}
