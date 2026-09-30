import { useEffect, useRef, useState } from "react";
import { useMsal } from "@azure/msal-react";

import {
  deleteFile,
  downloadFile,
  getFilePreviewUrl,
  getFiles,
  replaceFile,
  uploadFile,
} from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import type { FileResponse } from "../types/file";

export default function FilesPage() {
  const { instance } = useMsal();
  const { account } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetIdRef = useRef<number | null>(null);

  const [files, setFiles] = useState<FileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});

  const loadPreviewUrls = async (nextFiles: FileResponse[]) => {
    if (!account) {
      return;
    }

    const imageFiles = nextFiles.filter((file) => file.contentType.startsWith("image/"));

    if (imageFiles.length === 0) {
      setPreviewUrls({});
      return;
    }

    const urls = await Promise.all(
      imageFiles.map(async (file) => ({
        id: file.id,
        url: await getFilePreviewUrl(instance, account, file.id),
      })),
    );

    setPreviewUrls((previous) => ({
      ...previous,
      ...Object.fromEntries(urls.map((entry) => [entry.id, entry.url])),
    }));
  };

  const loadFiles = async () => {
    if (!account) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nextFiles = await getFiles(instance, account);
      setFiles(nextFiles);
      await loadPreviewUrls(nextFiles);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, [account, instance]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !account) {
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await uploadFile(instance, account, selectedFile);
      event.target.value = "";
      await loadFiles();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    const fileId = replaceTargetIdRef.current;

    if (!selectedFile || !account || fileId === null) {
      return;
    }

    try {
      setError(null);
      await replaceFile(instance, account, fileId, selectedFile);
      await loadFiles();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Replace failed.");
    } finally {
      replaceTargetIdRef.current = null;
      event.target.value = "";
    }
  };

  const handleDownload = async (file: FileResponse) => {
    if (!account) {
      return;
    }

    try {
      setError(null);
      await downloadFile(instance, account, file.id, file.originalFileName);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Download failed.");
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!account) {
      return;
    }

    try {
      setError(null);
      await deleteFile(instance, account, fileId);
      await loadFiles();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Delete failed.");
    }
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-[26px] border border-slate-200 bg-white" />;
  }

  return (
    <div className="app-page">
      <section className="page-toolbar surface">
        <div>
          <p className="page-kicker">Your library</p>
          <h2 className="page-heading">Files</h2>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="primary-action"
        >
          {uploading ? "Uploading..." : "Upload file"}
        </button>

        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        <input ref={replaceInputRef} type="file" className="hidden" onChange={handleReplace} />
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {files.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            No files uploaded yet.
          </div>
        ) : (
          files.map((file) => (
            <article key={file.id} className="surface p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900">{file.originalFileName}</p>
                  <p className="text-xs text-slate-500">{file.contentType}</p>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                  {file.fileSize > 1024 * 1024 ? `${(file.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${file.fileSize} B`}
                </span>
              </div>

              {file.contentType.startsWith("image/") ? (
                <img
                  src={previewUrls[file.id] ?? file.downloadUrl}
                  alt={file.originalFileName}
                  className="media-preview mb-3 h-44 w-full rounded-xl border border-slate-200"
                />
              ) : (
                <div className="surface-muted mb-3 flex h-44 items-center justify-center px-4 text-sm text-slate-500">
                  {file.originalFileName}
                </div>
              )}

              <div className="surface-muted mb-3 px-3 py-2 text-xs text-slate-600">
                Uploaded {new Date(file.uploadedAt).toLocaleString()}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    replaceTargetIdRef.current = file.id;
                    if (replaceInputRef.current) {
                      replaceInputRef.current.value = "";
                      replaceInputRef.current.click();
                    }
                  }}
                  className="secondary-action flex-1"
                >
                  Replace
                </button>
                <button type="button" onClick={() => void handleDownload(file)} className="secondary-action flex-1">
                  Download
                </button>
                <button type="button" onClick={() => void handleDelete(file.id)} className="danger-action flex-1">
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
