import { useEffect, useState, useCallback, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { useAuth } from "../context/AuthContext";
import {
  getFiles,
  uploadFile,
  replaceFile,
  downloadFile,
  deleteFile,
  ApiError,
} from "../api/apiClient";
import {
  type FileResponse,
  ALLOWED_FILE_EXTENSIONS,
  MAXIMUM_FILE_SIZE_BYTES,
} from "../types/file";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";

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

export default function Files() {
  const { instance } = useMsal();
  const { account, user } = useAuth();

  const [files, setFiles] = useState<FileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: "grid" | "table"
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Upload state
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Replace state
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingFileId, setReplacingFileId] = useState<number | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Download state
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Delete state
  const [deletingFile, setDeletingFile] = useState<FileResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview Modal state
  const [selectedFile, setSelectedFile] = useState<FileResponse | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getFiles(instance, account);
      setFiles(data);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Failed to load your personal files. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [instance, account]);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  // Validate file helper
  const validateFile = (file: File): string | null => {
    if (file.size > MAXIMUM_FILE_SIZE_BYTES) {
      return "The selected file exceeds the maximum allowed size of 10 MB.";
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(ext as (typeof ALLOWED_FILE_EXTENSIONS)[number])) {
      return "The selected file format is not supported. Allowed formats: JPG, PNG, GIF, PDF.";
    }
    return null;
  };

  // Upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !account) return;

    setUploadError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadFile(instance, account, file);
      setFiles((prev) => [uploaded, ...prev]);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    } catch (caught) {
      setUploadError(
        caught instanceof ApiError ? caught.message : "Failed to upload file to gallery.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Replace trigger
  const triggerReplace = (fileId: number) => {
    setReplacingFileId(fileId);
    setUploadError(null);
    replaceInputRef.current?.click();
  };

  // Replace file handler
  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !account || replacingFileId === null) return;

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
      return;
    }

    setIsReplacing(true);
    try {
      const updated = await replaceFile(instance, account, replacingFileId, file);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      if (replaceInputRef.current) replaceInputRef.current.value = "";
      setReplacingFileId(null);
    } catch (caught) {
      setUploadError(
        caught instanceof ApiError ? caught.message : "Failed to replace file content.",
      );
    } finally {
      setIsReplacing(false);
    }
  };

  // Download handler
  const handleDownload = async (file: FileResponse) => {
    if (!account) return;
    try {
      setDownloadingId(file.id);
      await downloadFile(instance, account, file.id, file.originalFileName);
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : "Failed to download file.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!account || !deletingFile) return;

    setIsDeleting(true);
    try {
      await deleteFile(instance, account, deletingFile.id);
      setFiles((prev) => prev.filter((f) => f.id !== deletingFile.id));
      setDeletingFile(null);
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : "Failed to delete file.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Check role: upload is restricted to role "User" in backend FilesController line 57
  const canUploadPersonal = user?.role === "User";

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoadingSpinner size="lg" label="Loading media files..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={uploadInputRef}
        onChange={(e) => void handleUpload(e)}
        accept=".jpg,.jpeg,.png,.gif,.pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={(e) => void handleReplace(e)}
        accept=".jpg,.jpeg,.png,.gif,.pdf"
        className="hidden"
      />

      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Gallery</h1>
          <p className="mt-1 text-sm text-slate-400">
            Personal photos and media assets stored in your WinCapture cloud space.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-900/80 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`rounded-lg p-1.5 transition ${
                viewMode === "grid"
                  ? "bg-slate-800 text-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-label="Table view"
              className={`rounded-lg p-1.5 transition ${
                viewMode === "table"
                  ? "bg-slate-800 text-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          {/* Upload Button */}
          {canUploadPersonal && (
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {isUploading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
              <span>{isUploading ? "Uploading..." : "Upload File"}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="Error Loading Files"
          message={error}
          onRetry={() => void fetchFiles()}
        />
      )}

      {uploadError && (
        <ErrorMessage message={uploadError} onDismiss={() => setUploadError(null)} />
      )}

      {isReplacing && (
        <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/40 p-4 text-xs text-cyan-200">
          Replacing file content in Azure Blob Storage...
        </div>
      )}

      {/* Files Display */}
      {files.length === 0 ? (
        <EmptyState
          title="No Personal Files Uploaded"
          description="Your personal photo gallery is currently empty. Upload photos from corporate events or presentations."
          actionText={canUploadPersonal ? "Upload Photo" : undefined}
          onAction={canUploadPersonal ? () => uploadInputRef.current?.click() : undefined}
        />
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => {
            const isDownloading = downloadingId === file.id;
            const isPdf = file.contentType === "application/pdf";

            return (
              <div
                key={file.id}
                className="card-hover glass-panel flex flex-col justify-between overflow-hidden rounded-2xl"
              >
                {/* Media Preview Box */}
                <button
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  aria-label={`View details for ${file.originalFileName}`}
                  className="group relative flex h-48 w-full items-center justify-center overflow-hidden bg-slate-950/70"
                >
                  {isPdf ? (
                    <div className="flex flex-col items-center justify-center text-rose-400">
                      <svg className="size-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="mt-2 text-xs font-semibold uppercase">PDF Document</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-cyan-400">
                      <svg className="size-12 transition group-hover:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a2.25 2.25 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <span className="mt-2 text-xs text-slate-400 group-hover:text-cyan-300">View file details</span>
                    </div>
                  )}
                </button>

                {/* Card Info & Actions */}
                <div className="p-4">
                  <p className="truncate text-sm font-semibold text-slate-100" title={file.originalFileName}>
                    {file.originalFileName}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatBytes(file.fileSize)} • {formatDate(file.uploadedAt)}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <button
                      type="button"
                      onClick={() => void handleDownload(file)}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <div className="size-3.5 animate-spin rounded-full border border-slate-400 border-t-white" />
                      ) : (
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      )}
                      <span>Download</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Replace button */}
                      <button
                        type="button"
                        onClick={() => triggerReplace(file.id)}
                        title="Replace file"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => setDeletingFile(file)}
                        title="Delete file"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">File Name</th>
                  <th className="px-6 py-3.5 font-semibold">Format</th>
                  <th className="px-6 py-3.5 font-semibold">Size</th>
                  <th className="px-6 py-3.5 font-semibold">Uploaded</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {files.map((file) => {
                  const isDownloading = downloadingId === file.id;

                  return (
                    <tr key={file.id} className="hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-medium text-white">
                        <button
                          type="button"
                          onClick={() => setSelectedFile(file)}
                          aria-label={`View details for ${file.originalFileName}`}
                          className="flex items-center gap-2.5 text-left hover:text-cyan-400"
                        >
                          <svg className="size-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span className="truncate max-w-xs">{file.originalFileName}</span>
                        </button>
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
                            onClick={() => void handleDownload(file)}
                            disabled={isDownloading}
                            title="Download file"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerReplace(file.id)}
                            title="Replace file content"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingFile(file)}
                            title="Delete file"
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

      {/* File Details Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedFile.originalFileName}</h3>
                <p className="text-xs text-slate-400">File Properties</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">File Size</span>
                <span className="font-medium text-white">{formatBytes(selectedFile.fileSize)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">MIME Content Type</span>
                <span className="font-mono text-cyan-300">{selectedFile.contentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Uploaded At</span>
                <span className="font-medium text-white">{formatDate(selectedFile.uploadedAt)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Storage Asset ID</span>
                <span className="font-mono text-slate-300">#{selectedFile.id}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDownload(selectedFile);
                  setSelectedFile(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-cyan-500"
              >
                Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingFile)}
        title="Delete Photo"
        message={`Are you sure you want to permanently delete "${deletingFile?.originalFileName}"? This will delete the blob from Azure storage and cannot be undone.`}
        confirmLabel="Delete File"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeletingFile(null)}
      />
    </div>
  );
}
