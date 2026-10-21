import { useQueries } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";

import { getAlbumFiles, getFilePreviewUrl } from "../api/albumsApi";
import type { AlbumResponse } from "@/features/albums/types/album";
import { getAccountKey } from "@/shared/utils/accountKey";

// Cache optional album cover previews with the account and album query data.
export function useAlbumCoverPreviews(
  albums: AlbumResponse[],
  instance: IPublicClientApplication,
  account: AccountInfo | null,
  userId?: number,
  isAdmin = false,
): Record<number, string> {
  const accountKey = getAccountKey(account);
  const queries = useQueries({
    queries: albums.map((album) => {
      const canManage = isAdmin || album.ownerId === userId;
      return {
        queryKey: ["album-cover-preview", accountKey, album.id, canManage, album.updatedAt],
        enabled: !!account,
        queryFn: async () => {
          if (!account) return null;
          try {
            const page = await getAlbumFiles(instance, account, album.id, 1, 100, "Images");
            const image = page.items[0];
            return image ? await getFilePreviewUrl(instance, account, image.id, album.id, canManage) : null;
          } catch {
            return null;
          }
        },
        staleTime: Infinity,
        gcTime: 60_000,
        retry: false,
      };
    }),
  });
  return Object.fromEntries(
    albums.flatMap((album, index) => {
      const url = queries[index]?.data;
      return typeof url === "string" ? [[album.id, url]] : [];
    }),
  );
}
