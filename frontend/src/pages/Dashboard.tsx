import { useEffect, useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAlbums,
  getAlbumFiles,
  getFiles,
  getFilePreviewUrl,
  ApiError,
} from "../api/apiClient";
import type { AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

interface AlbumDashboardAsset {
  files: FileResponse[];
  cover: FileResponse | null;
}

const albumColors = [
  "border-sky-500/30 bg-sky-500/10 text-sky-200",
  "border-rose-500/30 bg-rose-500/10 text-rose-200",
  "border-amber-500/30 bg-amber-500/10 text-amber-100",
  "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  "border-violet-500/30 bg-violet-500/10 text-violet-200",
];

function isImage(file: FileResponse): boolean {
  return file.contentType.startsWith("image/");
}

function displayFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function photoCount(files: FileResponse[]): string {
  const count = files.filter(isImage).length;
  return `${count} ${count === 1 ? "photo" : "photos"}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const { instance } = useMsal();
  const { account, user } = useAuth();

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [albumAssets, setAlbumAssets] = useState<Record<number, AlbumDashboardAsset>>({});
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      const [albumsData, filesData] = await Promise.all([
        getAlbums(instance, account),
        getFiles(instance, account),
      ]);
      const albumsToLoad = [...albumsData]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      const albumAssetEntries = await Promise.all(
        albumsToLoad.map(async (album) => {
          try {
            const albumFiles = await getAlbumFiles(instance, account, album.id);
            return [album.id, {
              files: albumFiles,
              cover: albumFiles.find(isImage) ?? null,
            }] as const;
          } catch {
            return [album.id, { files: [], cover: null }] as const;
          }
        }),
      );

      setAlbums(albumsData);
      setFiles(filesData);
      setAlbumAssets(Object.fromEntries(albumAssetEntries));
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Failed to load dashboard overview data. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [instance, account]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!account) return;

    const previews: { key: string; file: FileResponse; albumId?: number }[] = [
      ...files.filter(isImage).map((file) => ({
        key: `file-${file.id}`,
        file,
      })),
      ...Object.entries(albumAssets).flatMap(([albumId, asset]) =>
        asset.files.filter(isImage).map((file) => ({
          key: `album-${albumId}-${file.id}`,
          file,
          albumId: Number(albumId),
        })),
      ),
    ].sort((a, b) => new Date(b.file.uploadedAt).getTime() - new Date(a.file.uploadedAt).getTime()).slice(0, 8);
    let isCurrent = true;
    const createdUrls: string[] = [];

    void Promise.all(previews.map(async ({ key, file, albumId }) => {
      try {
        const url = await getFilePreviewUrl(instance, account, file.id, albumId);
        createdUrls.push(url);
        return [key, url] as const;
      } catch {
        return null;
      }
    })).then((results) => {
      if (!isCurrent) {
        createdUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      setPreviewUrls(Object.fromEntries(results.filter((item): item is readonly [string, string] => item !== null)));
    });

    return () => {
      isCurrent = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [instance, account, files, albumAssets]);

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoadingSpinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorMessage
          title="Dashboard Error"
          message={error}
          onRetry={() => void loadDashboardData()}
        />
      </div>
    );
  }

  const recentPhotos = [
    ...files.filter(isImage).map((file) => ({ key: `file-${file.id}`, file, albumId: undefined as number | undefined })),
    ...Object.entries(albumAssets).flatMap(([albumId, asset]) =>
      asset.files.filter(isImage).map((file) => ({ key: `album-${albumId}-${file.id}`, file, albumId: Number(albumId) })),
    ),
  ]
    .sort((a, b) => new Date(b.file.uploadedAt).getTime() - new Date(a.file.uploadedAt).getTime())
    .filter(({ file }) => !searchQuery || file.originalFileName.toLowerCase().includes(searchQuery))
    .slice(0, 8);
  const recentAlbums = [...albums]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((album) => !searchQuery || album.albumName.toLowerCase().includes(searchQuery))
    .slice(0, 5);
  const shareAlbum = recentAlbums.find((album) => album.ownerId === user?.userId);

  return (
    <div className="dashboard-grid pb-8">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="mt-1 text-2xl font-semibold text-white">Photos</h1>
            <p className="mt-0.5 text-sm text-slate-400">Your library</p>
          </div>
          <button type="button" onClick={() => navigate("/files")} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-sky-500">
            <span aria-hidden="true">+</span> Upload photos
          </button>
        </div>

        <section className="workspace-panel p-3 sm:p-4" aria-labelledby="recent-photos-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-photos-heading" className="text-base font-semibold text-slate-100">Recent Photos</h2>
            <button type="button" onClick={() => navigate("/files")} className="text-xs font-semibold text-sky-400 hover:text-sky-300">View all</button>
          </div>
          {recentPhotos.length ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {recentPhotos.map(({ key, file, albumId }) => (
                <button key={key} type="button" onClick={() => navigate(albumId ? `/albums/${albumId}` : "/files")} className="photo-tile group" aria-label={`Open ${file.originalFileName}`}>
                  {previewUrls[key] ? (
                    <img src={previewUrls[key]} alt="" className="photo-tile-image" />
                  ) : (
                    <div className="photo-tile-placeholder"><span aria-hidden="true">▧</span></div>
                  )}
                  <span className="photo-tile-caption">{displayFileName(file.originalFileName)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-6 text-center">
              <div>
                <p className="text-sm font-medium text-slate-200">{searchQuery ? "No matching photos" : "Your photo library is empty"}</p>
                <p className="mt-1 text-xs text-slate-400">Upload an image to see it here.</p>
              </div>
            </div>
          )}
        </section>

        <section className="workspace-panel p-3 sm:p-4" aria-labelledby="albums-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="albums-heading" className="text-base font-semibold text-slate-100">Albums</h2>
            <button type="button" onClick={() => navigate("/albums")} className="text-xs font-semibold text-sky-400 hover:text-sky-300">View all</button>
          </div>
          {recentAlbums.length ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {recentAlbums.map((album, index) => {
                const cover = albumAssets[album.id]?.cover;
                const coverPreview = cover ? previewUrls[`album-${album.id}-${cover.id}`] : undefined;
                return (
                  <button key={album.id} type="button" onClick={() => navigate(`/albums/${album.id}`)} className="album-tile text-left">
                    <span className="album-tile-image">
                      {coverPreview ? <img src={coverPreview} alt="" /> : <span className={`album-tile-fallback ${albumColors[index % albumColors.length]}`} aria-hidden="true">▱</span>}
                    </span>
                    <span className="mt-2 block truncate text-xs font-medium text-slate-100">{album.albumName}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">{photoCount(albumAssets[album.id]?.files ?? [])}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-slate-700 text-center">
              <p className="text-sm text-slate-400">{searchQuery ? "No matching albums" : "No albums yet"}</p>
            </div>
          )}
        </section>
      </div>

      <aside className="min-w-0 space-y-4">
        <section className="workspace-panel p-3" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="mb-3 text-base font-semibold text-slate-100">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => navigate("/albums?create=true")} className="quick-action bg-emerald-600 hover:bg-emerald-500">
              <span className="text-2xl leading-none" aria-hidden="true">+</span><span>Create<br />Album</span>
            </button>
            <button type="button" onClick={() => navigate(shareAlbum ? `/albums/${shareAlbum.id}?tab=members` : "/albums?create=true")} className="quick-action bg-orange-500 hover:bg-orange-400">
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 13.5v4.75A2.25 2.25 0 007.25 20.5h9.5A2.25 2.25 0 0019 18.25V13.5" /></svg><span>Share<br />Album</span>
            </button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            <button type="button" onClick={() => navigate("/files")} aria-label="Open my files" title="My files" className="shortcut-button bg-amber-500 hover:bg-amber-400">＋</button>
            <button type="button" onClick={() => navigate("/albums")} aria-label="Browse albums" title="Browse albums" className="shortcut-button bg-rose-500 hover:bg-rose-400">▧</button>
            <button type="button" onClick={() => navigate("/profile")} aria-label="Open profile" title="Profile" className="shortcut-button bg-blue-500 hover:bg-blue-400">♙</button>
            {user?.role === "Admin" ? (
              <button type="button" onClick={() => navigate("/admin")} aria-label="Open admin portal" title="Admin portal" className="shortcut-button bg-violet-500 hover:bg-violet-400">⚙</button>
            ) : (
              <button type="button" onClick={() => navigate("/profile")} aria-label="Open account settings" title="Account settings" className="shortcut-button bg-violet-500 hover:bg-violet-400">⚙</button>
            )}
          </div>
        </section>

        <section className="workspace-panel p-3" aria-labelledby="my-albums-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="my-albums-heading" className="text-base font-semibold text-slate-100">My Albums</h2>
            <button type="button" onClick={() => navigate("/albums")} className="text-xs font-semibold text-sky-400 hover:text-sky-300">View all</button>
          </div>
          <div className="space-y-2">
            {recentAlbums.length ? recentAlbums.map((album, index) => {
              const cover = albumAssets[album.id]?.cover;
              const coverPreview = cover ? previewUrls[`album-${album.id}-${cover.id}`] : undefined;
              return (
                <button key={album.id} type="button" onClick={() => navigate(`/albums/${album.id}`)} className={`album-list-item ${albumColors[index % albumColors.length]}`}>
                  {coverPreview ? <img src={coverPreview} alt="" className="size-10 rounded-md object-cover" /> : <span className="grid size-10 place-items-center rounded-md bg-slate-950/30 text-lg" aria-hidden="true">▱</span>}
                  <span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-semibold">{album.albumName}</span><span className="mt-0.5 block text-[10px] opacity-75">{photoCount(albumAssets[album.id]?.files ?? [])}</span></span>
                  <svg className="size-4 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" /></svg>
                </button>
              );
            }) : <p className="rounded-lg bg-slate-900 px-3 py-4 text-center text-xs text-slate-400">No albums yet</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}
