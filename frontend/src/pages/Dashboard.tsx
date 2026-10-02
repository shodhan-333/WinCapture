import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

import { getAlbums, getFiles, getAdminFiles } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import type { AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";

export default function Dashboard() {
  const { instance } = useMsal();
  const { account, user } = useAuth();
  const navigate = useNavigate();

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!account) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [albumResult, fileResult] = await Promise.all([
          getAlbums(instance, account),
          user?.role === "Admin" ? getAdminFiles(instance, account) : getFiles(instance, account),
        ]);

        setAlbums(albumResult);
        setFiles(fileResult);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [account, instance, user?.role]);

  if (loading) {
    return (
      <section className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-40 animate-pulse rounded-[26px] border border-slate-200 bg-white" />
        ))}
      </section>
    );
  }

  return (
    <div className="app-page">
      <section className="page-toolbar surface">
        <div>
          <p className="page-kicker">Your workspace at a glance</p>
          <h2 className="page-heading">Welcome back, {user?.name ?? "User"}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate("/albums")} className="secondary-action">Albums</button>
          <button type="button" onClick={() => navigate("/files")} className="primary-action">Open files</button>
        </div>
      </section>

      {error && (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="workspace-stats grid gap-3 md:grid-cols-2">
        <div className="surface p-5">
          <p className="text-sm font-medium text-slate-500">Albums</p>
          <p className="metric-value mt-4">{albums.length}</p>
        </div>

        <div className="surface p-5">
          <p className="text-sm font-medium text-slate-500">Files</p>
          <p className="metric-value mt-4">{files.length}</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="section-title">Recent albums</h3>
            <button type="button" onClick={() => navigate("/albums")} className="text-sm font-semibold text-sky-700 hover:text-sky-600">
              View all
            </button>
          </div>

          <div className="space-y-3">
            {albums.length === 0 ? (
              <p className="text-sm text-slate-500">No albums yet.</p>
            ) : (
              albums.slice(0, 4).map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => navigate(`/albums/${album.id}`)}
                  className="surface-muted interactive-row flex w-full items-center justify-between px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{album.albumName}</p>
                    <p className="text-xs text-slate-500">Owner: {album.ownerName}</p>
                  </div>
                  <span className="text-sm text-slate-400">→</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="section-title">Recent files</h3>
            <button type="button" onClick={() => navigate("/files")} className="text-sm font-semibold text-sky-700 hover:text-sky-600">
              View all
            </button>
          </div>

          <div className="space-y-3">
            {files.length === 0 ? (
              <p className="text-sm text-slate-500">No files uploaded yet.</p>
            ) : (
              files.slice(0, 4).map((file) => (
                <button key={file.id} type="button" onClick={() => navigate("/files")} className="surface-muted interactive-row flex w-full items-center justify-between px-4 py-3 text-left">
                  <div>
                    <p className="max-w-[28ch] truncate font-medium text-slate-900">{file.originalFileName}</p>
                    <p className="text-xs text-slate-500">{file.contentType}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {file.fileSize > 1024 * 1024 ? `${(file.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${file.fileSize} B`}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
