import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import { createAlbum, getAlbums } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import type { AlbumResponse } from "../types/album";

export default function AlbumsPage() {
  const { instance } = useMsal();
  const { account } = useAuth();
  const navigate = useNavigate();

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [albumName, setAlbumName] = useState("");

  const loadAlbums = async () => {
    if (!account) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setAlbums(await getAlbums(instance, account));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load albums.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAlbums();
  }, [account, instance]);

  const handleCreateAlbum = async () => {
    if (!account || !albumName.trim()) {
      setError("Album name is required.");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const created = await createAlbum(instance, account, { albumName: albumName.trim() });
      setAlbumName("");
      navigate(`/albums/${created.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create album.");
    } finally {
      setCreating(false);
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
          <h2 className="page-heading">Albums</h2>
        </div>

        <div className="flex w-full gap-2 md:w-auto">
          <input
            value={albumName}
            onChange={(event) => setAlbumName(event.target.value)}
            placeholder="New album name"
            className="field min-w-0 flex-1 md:w-64"
          />
          <button
            type="button"
            onClick={() => void handleCreateAlbum()}
            disabled={creating}
            className="primary-action whitespace-nowrap disabled:opacity-60"
          >
            {creating ? "Creating..." : "New album"}
          </button>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {albums.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            No albums available.
          </div>
        ) : (
          albums.map((album) => (
            <button
              key={album.id}
              type="button"
              onClick={() => navigate(`/albums/${album.id}`)}
              className="surface p-5 text-left transition hover:border-sky-200 hover:bg-sky-50/30"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="page-kicker">Album</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{album.albumName}</h3>
                </div>
                <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                  #{album.id}
                </span>
              </div>

              <dl className="space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                <div className="flex justify-between gap-3"><dt>Owner</dt><dd className="font-medium text-slate-900">{album.ownerName}</dd></div>
                <div className="flex justify-between gap-3"><dt>Created</dt><dd>{new Date(album.createdAt).toLocaleDateString()}</dd></div>
                <div className="flex justify-between gap-3"><dt>Updated</dt><dd>{album.updatedAt ? new Date(album.updatedAt).toLocaleDateString() : "Never"}</dd></div>
              </dl>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
