import { useEffect, useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { useAuth } from "../context/AuthContext";
import {
  getAlbums,
  getFiles,
  downloadFile,
  ApiError,
} from "../api/apiClient";
import type { AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";
import type { NavTab } from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

interface DashboardProps {
  onNavigateTab: (tab: NavTab) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function Dashboard({ onNavigateTab }: DashboardProps) {
  const { instance } = useMsal();
  const { account, user } = useAuth();

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      const [albumsData, filesData] = await Promise.all([
        getAlbums(instance, account),
        getFiles(instance, account),
      ]);

      setAlbums(albumsData);
      setFiles(filesData);
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

  const handleDownload = async (file: FileResponse) => {
    if (!account) return;
    try {
      setDownloadingId(file.id);
      await downloadFile(instance, account, file.id, file.originalFileName);
    } catch (caught) {
      alert(caught instanceof Error ? caught.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoadingSpinner size="lg" label="Loading enterprise dashboard..." />
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

  // Calculate metrics
  const totalStorageBytes = files.reduce((acc, f) => acc + f.fileSize, 0);
  const recentFiles = [...files]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 5);
  const recentAlbums = [...albums]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const hasData = albums.length > 0 || files.length > 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <section className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-800/60 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-300">
            <span>Microsoft Entra Single Sign-On Active</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back, {user?.name || "WinWire Colleague"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
            Manage your company photo collections, organize team event albums, and securely share assets across WinWire.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab("albums")}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Explore Albums</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("files")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span>Upload Photos</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </section>

      {/* Metrics Row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Metric 1: Accessible Albums */}
        <div className="card-hover glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Accessible Albums
            </span>
            <div className="grid size-9 place-items-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-white">{albums.length}</p>
          <p className="mt-1 text-xs text-slate-400">Owned by you or shared with member permissions</p>
        </div>

        {/* Metric 2: Uploaded Photos */}
        <div className="card-hover glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Personal Files
            </span>
            <div className="grid size-9 place-items-center rounded-xl bg-blue-500/15 text-blue-400">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a2.25 2.25 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-white">{files.length}</p>
          <p className="mt-1 text-xs text-slate-400">Photos stored in your personal cloud gallery</p>
        </div>

        {/* Metric 3: Storage Used */}
        <div className="card-hover glass-panel rounded-2xl p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Storage Utilized
            </span>
            <div className="grid size-9 place-items-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-white">{formatBytes(totalStorageBytes)}</p>
          <p className="mt-1 text-xs text-slate-400">Stored on Azure Blob Storage</p>
        </div>
      </section>

      {/* Main Split: Recent Albums & Recent Files */}
      {!hasData ? (
        <EmptyState
          title="No Media Assets Found"
          description="You haven't uploaded any personal files or created any albums yet. Start by creating an album or uploading photos."
          actionText="Create Your First Album"
          onAction={() => onNavigateTab("albums")}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Albums Column */}
          <section className="glass-panel flex flex-col rounded-2xl p-6">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Recent Albums</h2>
                <p className="text-xs text-slate-400">Your latest company photo collections</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("albums")}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                View all ({albums.length})
              </button>
            </div>

            {recentAlbums.length === 0 ? (
              <div className="grid flex-1 place-items-center py-8 text-xs text-slate-500">
                No accessible albums yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onNavigateTab("albums")}
                    className="flex cursor-pointer items-center justify-between py-3.5 transition hover:bg-slate-800/40 rounded-lg px-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-slate-800 text-cyan-400">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{album.albumName}</p>
                        <p className="text-xs text-slate-400">
                          Owner: {album.ownerName} • Created {formatDate(album.createdAt)}
                        </p>
                      </div>
                    </div>
                    <svg className="size-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Files Column */}
          <section className="glass-panel flex flex-col rounded-2xl p-6">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Recent Personal Uploads</h2>
                <p className="text-xs text-slate-400">Recently uploaded photo files</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("files")}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                View all ({files.length})
              </button>
            </div>

            {recentFiles.length === 0 ? (
              <div className="grid flex-1 place-items-center py-8 text-xs text-slate-500">
                No personal files uploaded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentFiles.map((file) => {
                  const isDownloading = downloadingId === file.id;
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between py-3 rounded-lg px-2 transition hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-800 text-blue-400">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-100">{file.originalFileName}</p>
                          <p className="text-xs text-slate-400">
                            {formatBytes(file.fileSize)} • {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleDownload(file)}
                        disabled={isDownloading}
                        title="Download file"
                        className="ml-2 rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <div className="size-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                        ) : (
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
