import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

import { getAdminAlbums, getAdminFiles } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import type { AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";

export default function AdminPage() {
  const { instance } = useMsal();
  const { account } = useAuth();
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
          getAdminAlbums(instance, account),
          getAdminFiles(instance, account),
        ]);

        setAlbums(albumResult);
        setFiles(fileResult);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load admin data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [account, instance]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-[26px] border border-slate-200 bg-white" />;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Administration</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">System overview</h2>
      </section>

      {error && <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total albums</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{albums.length}</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total files</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{files.length}</p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Latest albums</h3>
          <div className="space-y-3">
            {albums.slice(0, 5).map((album) => (
              <div key={album.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{album.albumName}</p>
                  <p className="text-xs text-slate-500">{album.ownerName}</p>
                </div>
                <span className="text-xs text-slate-400">#{album.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Latest files</h3>
          <div className="space-y-3">
            {files.slice(0, 5).map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{file.originalFileName}</p>
                  <p className="text-xs text-slate-500">{file.contentType}</p>
                </div>
                <span className="text-xs text-slate-400">{file.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
