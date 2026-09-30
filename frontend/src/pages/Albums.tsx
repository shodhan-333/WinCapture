import { useEffect, useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  ApiError,
} from "../api/apiClient";
import type { AlbumResponse } from "../types/album";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";

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

export default function Albums() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { instance } = useMsal();
  const { account, user } = useAuth();

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter tab: "all" | "owned" | "shared"
  const [filterTab, setFilterTab] = useState<"all" | "owned" | "shared">(() =>
    searchParams.get("filter") === "shared"
      ? "shared"
      : searchParams.get("filter") === "owned"
        ? "owned"
        : "all",
  );

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(() => searchParams.get("create") === "true");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit Modal state
  const [editingAlbum, setEditingAlbum] = useState<AlbumResponse | null>(null);
  const [editAlbumName, setEditAlbumName] = useState("");

  // Delete Dialog state
  const [deletingAlbum, setDeletingAlbum] = useState<AlbumResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const filter = searchParams.get("filter");
    setFilterTab(filter === "shared" || filter === "owned" ? filter : "all");
    setIsCreateOpen(searchParams.get("create") === "true");
  }, [searchParams]);

  const updateFilter = (filter: "all" | "owned" | "shared") => {
    setFilterTab(filter);
    setSearchParams((current) => {
      if (filter === "all") current.delete("filter");
      else current.set("filter", filter);
      return current;
    }, { replace: true });
  };

  const openCreateModal = () => {
    setModalError(null);
    setNewAlbumName("");
    setIsCreateOpen(true);
    setSearchParams((current) => {
      current.set("create", "true");
      return current;
    }, { replace: true });
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setSearchParams((current) => {
      current.delete("create");
      return current;
    }, { replace: true });
  };

  const fetchAlbums = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getAlbums(instance, account);
      setAlbums(data);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Failed to load albums. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [instance, account]);

  useEffect(() => {
    void fetchAlbums();
  }, [fetchAlbums]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !newAlbumName.trim()) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      const created = await createAlbum(instance, account, {
        albumName: newAlbumName.trim(),
      });
      setAlbums((prev) => [created, ...prev]);
      setNewAlbumName("");
      closeCreateModal();
    } catch (caught) {
      setModalError(
        caught instanceof ApiError ? caught.message : "Failed to create album.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !editingAlbum || !editAlbumName.trim()) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      const updated = await updateAlbum(instance, account, editingAlbum.id, {
        albumName: editAlbumName.trim(),
      });
      setAlbums((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditingAlbum(null);
    } catch (caught) {
      setModalError(
        caught instanceof ApiError ? caught.message : "Failed to update album name.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!account || !deletingAlbum) return;

    setIsDeleting(true);
    try {
      await deleteAlbum(instance, account, deletingAlbum.id);
      setAlbums((prev) => prev.filter((a) => a.id !== deletingAlbum.id));
      setDeletingAlbum(null);
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : "Failed to delete album.");
    } finally {
      setIsDeleting(false);
    }
  };

  const currentUserId = user?.userId ?? -1;
  const isAdmin = user?.role === "Admin";

  const ownedAlbums = albums.filter((a) => a.ownerId === currentUserId);
  const sharedAlbums = albums.filter((a) => a.ownerId !== currentUserId);

  const displayedAlbums =
    filterTab === "owned"
      ? ownedAlbums
      : filterTab === "shared"
      ? sharedAlbums
      : albums;

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoadingSpinner size="lg" label="Loading company albums..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Albums</h1>
          <p className="mt-1 text-sm text-slate-400">
            Organize company event photos and collaborate with team members.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>New Album</span>
        </button>
      </div>

      {error && (
        <ErrorMessage
          title="Error Loading Albums"
          message={error}
          onRetry={() => void fetchAlbums()}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 text-sm font-medium">
        <button
          type="button"
          onClick={() => updateFilter("all")}
          className={`border-b-2 px-4 py-2.5 transition ${
            filterTab === "all"
              ? "border-cyan-400 text-cyan-300 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          All Accessible ({albums.length})
        </button>
        <button
          type="button"
          onClick={() => updateFilter("owned")}
          className={`border-b-2 px-4 py-2.5 transition ${
            filterTab === "owned"
              ? "border-cyan-400 text-cyan-300 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Created by Me ({ownedAlbums.length})
        </button>
        <button
          type="button"
          onClick={() => updateFilter("shared")}
          className={`border-b-2 px-4 py-2.5 transition ${
            filterTab === "shared"
              ? "border-cyan-400 text-cyan-300 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Shared with Me ({sharedAlbums.length})
        </button>
      </div>

      {/* Album Grid */}
      {displayedAlbums.length === 0 ? (
        <EmptyState
          title={
            filterTab === "owned"
              ? "No Albums Created by You"
              : filterTab === "shared"
              ? "No Albums Shared with You"
              : "No Albums Available"
          }
          description="Create your first company photo album or ask a colleague to share an album with your WinWire account."
          actionText="Create an Album"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedAlbums.map((album) => {
            const isOwner = album.ownerId === currentUserId;
            const canManage = isOwner || isAdmin;

            return (
              <div
                key={album.id}
                className="card-hover glass-panel flex flex-col justify-between rounded-2xl p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-cyan-400">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    </div>

                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        isOwner
                          ? "border border-cyan-800/60 bg-cyan-950/60 text-cyan-300"
                          : "border border-slate-700 bg-slate-800 text-slate-300"
                      }`}
                    >
                      {isOwner ? "Owner" : "Shared"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/albums/${album.id}`)}
                    className="mt-4 text-left text-base font-bold text-white transition hover:text-cyan-400"
                  >
                    {album.albumName}
                  </button>

                  <p className="mt-1 text-xs text-slate-400">
                    Created by <span className="text-slate-300">{album.ownerName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatDate(album.createdAt)}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/albums/${album.id}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    <span>Open Album</span>
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModalError(null);
                          setEditingAlbum(album);
                          setEditAlbumName(album.albumName);
                        }}
                        title="Edit album name"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingAlbum(album)}
                        title="Delete album"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Album Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create New Album</h3>
            <p className="mt-1 text-xs text-slate-400">
              Create an album to organize and share event photos with your team.
            </p>

            {modalError && (
              <div className="mt-3">
                <ErrorMessage message={modalError} />
              </div>
            )}

            <form onSubmit={handleCreateAlbum} className="mt-4 space-y-4">
              <div>
                <label htmlFor="album-name" className="block text-xs font-semibold text-slate-300">
                  Album Name
                </label>
                <input
                  id="album-name"
                  type="text"
                  required
                  maxLength={200}
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="e.g. WinWire Annual Hackathon 2026"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newAlbumName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-cyan-500 disabled:opacity-50"
                >
                  {isSubmitting && (
                    <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  )}
                  Create Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Album Modal */}
      {editingAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Rename Album</h3>
            <p className="mt-1 text-xs text-slate-400">
              Update the name for this album.
            </p>

            {modalError && (
              <div className="mt-3">
                <ErrorMessage message={modalError} />
              </div>
            )}

            <form onSubmit={handleUpdateAlbum} className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-album-name" className="block text-xs font-semibold text-slate-300">
                  Album Name
                </label>
                <input
                  id="edit-album-name"
                  type="text"
                  required
                  maxLength={200}
                  value={editAlbumName}
                  onChange={(e) => setEditAlbumName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAlbum(null)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editAlbumName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-cyan-500 disabled:opacity-50"
                >
                  {isSubmitting && (
                    <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAlbum)}
        title="Delete Album"
        message={`Are you sure you want to delete "${deletingAlbum?.albumName}"? All photos in this album and sharing permissions will be removed.`}
        confirmLabel="Delete Album"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={() => void handleDeleteAlbum()}
        onCancel={() => setDeletingAlbum(null)}
      />
    </div>
  );
}
