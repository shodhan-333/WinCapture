import { useEffect, useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import {
  getAdminFiles,
  getAdminAlbums,
  downloadFile,
  deleteFile,
  deleteAlbum,
  ApiError,
} from "../api/apiClient";
import type { AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";

interface AdminProps {
  onSelectAlbum: (albumId: number) => void;
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

export default function Admin({ onSelectAlbum }: AdminProps) {
  const { instance } = useMsal();
  const account = instance.getActiveAccount();

  const [activeTab, setActiveTab] = useState<"files" | "albums">("files");

  const [files, setFiles] = useState<FileResponse[]>([]);
  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // File Download / Delete
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingFile, setDeletingFile] = useState<FileResponse | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Album Delete
  const [deletingAlbum, setDeletingAlbum] = useState<AlbumResponse | null>(null);
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);

  const fetchAdminData = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      const [filesData, albumsData] = await Promise.all([
        getAdminFiles(instance, account),
        getAdminAlbums(instance, account),
      ]);
      setFiles(filesData);
      setAlbums(albumsData);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Failed to load administration data.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [instance, account]);

  useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  // Admin download file
  const handleDownloadFile = async (file: FileResponse) => {
    if (!account) return;
    try {
      setDownloadingId(file.id);
      await downloadFile(instance, account, file.id, file.originalFileName);
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Admin delete file
  const handleDeleteFile = async () => {
    if (!account || !deletingFile) return;

    setIsDeletingFile(true);
    try {
      await deleteFile(instance, account, deletingFile.id);
      setFiles((prev) => prev.filter((f) => f.id !== deletingFile.id));
      setDeletingFile(null);
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : "Failed to delete file.");
    } finally {
      setIsDeletingFile(false);
    }
  };

  // Admin delete album
  const handleDeleteAlbum = async () => {
    if (!account || !deletingAlbum) return;

    setIsDeletingAlbum(true);
    try {
      await deleteAlbum(instance, account, deletingAlbum.id);
      setAlbums((prev) => prev.filter((a) => a.id !== deletingAlbum.id));
      setDeletingAlbum(null);
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : "Failed to delete album.");
    } finally {
      setIsDeletingAlbum(false);
    }
  };

  const totalStorageBytes = files.reduce((acc, f) => acc + f.fileSize, 0);

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoadingSpinner size="lg" label="Loading administration portal..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Administrator Portal</h1>
            <span className="rounded-md border border-amber-600/50 bg-amber-950/60 px-2 py-0.5 text-xs font-semibold text-amber-300">
              Admin Privilege
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Platform-wide oversight of media files, corporate albums, and resource utilization.
          </p>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="Admin Error"
          message={error}
          onRetry={() => void fetchAdminData()}
        />
      )}

      {/* Metrics Row */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total System Files
          </span>
          <p className="mt-2 text-3xl font-extrabold text-white">{files.length}</p>
          <p className="mt-1 text-xs text-slate-500">Across all platform users</p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total System Albums
          </span>
          <p className="mt-2 text-3xl font-extrabold text-white">{albums.length}</p>
          <p className="mt-1 text-xs text-slate-500">Active corporate collections</p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cloud Storage Consumed
          </span>
          <p className="mt-2 text-3xl font-extrabold text-cyan-300">{formatBytes(totalStorageBytes)}</p>
          <p className="mt-1 text-xs text-slate-500">In Azure Blob Storage container</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("files")}
          className={`border-b-2 px-4 py-2.5 transition ${
            activeTab === "files"
              ? "border-amber-400 text-amber-300 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          All System Files ({files.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("albums")}
          className={`border-b-2 px-4 py-2.5 transition ${
            activeTab === "albums"
              ? "border-amber-400 text-amber-300 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          All System Albums ({albums.length})
        </button>
      </div>

      {/* TAB 1: ALL FILES */}
      {activeTab === "files" && (
        <>
          {files.length === 0 ? (
            <EmptyState
              title="No Files Found"
              description="No files currently exist on the platform."
            />
          ) : (
            <div className="glass-panel overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">File ID</th>
                      <th className="px-6 py-3.5 font-semibold">Original File Name</th>
                      <th className="px-6 py-3.5 font-semibold">MIME Type</th>
                      <th className="px-6 py-3.5 font-semibold">Size</th>
                      <th className="px-6 py-3.5 font-semibold">Uploaded Date</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {files.map((file) => {
                      const isDownloading = downloadingId === file.id;

                      return (
                        <tr key={file.id} className="hover:bg-slate-800/30">
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">
                            #{file.id}
                          </td>
                          <td className="px-6 py-4 font-medium text-white truncate max-w-xs" title={file.originalFileName}>
                            {file.originalFileName}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">
                            {file.contentType}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {formatBytes(file.fileSize)}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {formatDate(file.uploadedAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void handleDownloadFile(file)}
                                disabled={isDownloading}
                                title="Download file"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                              >
                                {isDownloading ? (
                                  <div className="size-4 animate-spin rounded-full border border-slate-400 border-t-white" />
                                ) : (
                                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                  </svg>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingFile(file)}
                                title="Admin delete file"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                              >
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: ALL ALBUMS */}
      {activeTab === "albums" && (
        <>
          {albums.length === 0 ? (
            <EmptyState
              title="No Albums Found"
              description="No albums currently exist on the platform."
            />
          ) : (
            <div className="glass-panel overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Album ID</th>
                      <th className="px-6 py-3.5 font-semibold">Album Name</th>
                      <th className="px-6 py-3.5 font-semibold">Owner</th>
                      <th className="px-6 py-3.5 font-semibold">Created Date</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {albums.map((album) => (
                      <tr key={album.id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          #{album.id}
                        </td>
                        <td className="px-6 py-4 font-medium text-white truncate max-w-xs">
                          {album.albumName}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {album.ownerName} <span className="text-xs text-slate-500">(User #{album.ownerId})</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {formatDate(album.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectAlbum(album.id)}
                              className="rounded-lg p-1.5 text-cyan-400 hover:bg-slate-800 hover:text-cyan-300"
                              title="Open album"
                            >
                              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingAlbum(album)}
                              title="Admin delete album"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                            >
                              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm Delete File Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingFile)}
        title="Admin File Deletion"
        message={`Are you sure you want to permanently delete file "${deletingFile?.originalFileName}" (ID #${deletingFile?.id})? This will immediately remove it from Azure storage.`}
        confirmLabel="Delete File"
        isDestructive={true}
        isLoading={isDeletingFile}
        onConfirm={() => void handleDeleteFile()}
        onCancel={() => setDeletingFile(null)}
      />

      {/* Confirm Delete Album Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAlbum)}
        title="Admin Album Deletion"
        message={`Are you sure you want to permanently delete album "${deletingAlbum?.albumName}" (Owner: ${deletingAlbum?.ownerName})? All associated photos and sharing rights will be purged.`}
        confirmLabel="Delete Album"
        isDestructive={true}
        isLoading={isDeletingAlbum}
        onConfirm={() => void handleDeleteAlbum()}
        onCancel={() => setDeletingAlbum(null)}
      />
    </div>
  );
}
