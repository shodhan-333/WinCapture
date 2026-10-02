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
    <div className="app-page">
      <section className="page-toolbar surface">
        <div>
          <p className="page-kicker">Administration</p>
          <h2 className="page-heading">System overview</h2>
        </div>
      </section>

      {error && <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="surface p-5">
          <p className="text-sm text-slate-500">Total albums</p>
          <p className="metric-value mt-4">{albums.length}</p>
        </div>
        <div className="surface p-5">
          <p className="text-sm text-slate-500">Total files</p>
          <p className="metric-value mt-4">{files.length}</p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="surface p-5">
          <h3 className="section-title mb-4">Latest albums</h3>
          <div className="space-y-3">
            {albums.slice(0, 5).map((album) => (
              <div key={album.id} className="surface-muted flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{album.albumName}</p>
                  <p className="text-xs text-slate-500">{album.ownerName}</p>
                </div>
                <span className="text-xs text-slate-400">#{album.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-5">
          <h3 className="section-title mb-4">Latest files</h3>
          <div className="space-y-3">
            {files.slice(0, 5).map((file) => (
              <div key={file.id} className="surface-muted flex items-center justify-between px-4 py-3">
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
