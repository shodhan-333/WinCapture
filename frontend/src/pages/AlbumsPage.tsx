import { useEffect, useState } from "react";
import {
  CalendarDays,
  FolderOpen,
  Images,
  ArrowUpRight,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import { createAlbum, getAlbums } from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import { useAuth } from "../context/AuthContext";
import type { AlbumResponse } from "../types/album";
import { formatDate } from "../utils/formatters";

export default function AlbumsPage() {
  const { instance } = useMsal();
  const { account } = useAuth();
  const navigate = useNavigate();

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [albumName, setAlbumName] = useState("");

  const loadAlbums = async () => {
    if (!account) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      setAlbums(
        await getAlbums(
          instance,
          account,
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load albums.",
      );
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

      const created = await createAlbum(
        instance,
        account,
        {
          albumName: albumName.trim(),
        },
      );

      setAlbumName("");

      navigate(
        `/albums/${created.id}`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create album.",
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="app-page">
        <section className="albums-page-header skeleton-panel">
          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>

          <div className="albums-create-skeleton">
            <span className="skeleton-field" />
            <span className="skeleton-button skeleton-button-wide" />
          </div>
        </section>

        <section className="albums-grid">
          {[1, 2, 3, 4, 5, 6].map(
            (item) => (
              <article
                key={item}
                className="album-card album-card-skeleton surface"
              >
                <div className="album-card-cover-skeleton" />

                <div className="album-card-skeleton-body">
                  <span className="skeleton-line skeleton-line-sm" />
                  <span className="skeleton-line skeleton-line-md" />
                  <span className="skeleton-line skeleton-line-xs" />
                </div>
              </article>
            ),
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="app-page">
      <section className="albums-page-header surface">
        <div className="albums-heading">
          <div className="page-kicker">
            <span className="page-kicker-dot" />
            Your library
          </div>

          <h1 className="page-heading">
            Albums
          </h1>

          <p className="page-description">
            Organize your images and files into
            collections that are easy to access
            and share.
          </p>
        </div>

        <div className="album-create-panel">
          <label
            htmlFor="new-album-name"
            className="sr-only"
          >
            New album name
          </label>

          <input
            id="new-album-name"
            value={albumName}
            onChange={(event) =>
              setAlbumName(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !creating
              ) {
                void handleCreateAlbum();
              }
            }}
            placeholder="New album name"
            className="field album-create-field"
            maxLength={200}
          />

          <button
            type="button"
            onClick={() =>
              void handleCreateAlbum()
            }
            disabled={creating}
            className="primary-action album-create-button disabled:opacity-60 disabled:cursor-wait"
          >
            <Images
              aria-hidden="true"
              size={17}
              strokeWidth={1.8}
            />

            <span>
              {creating
                ? "Creating..."
                : "New album"}
            </span>
          </button>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      <section className="albums-section">
        {albums.length === 0 ? (
          <section className="surface albums-empty-state">
            <span className="albums-empty-icon">
              <Images
                aria-hidden="true"
                size={28}
                strokeWidth={1.5}
              />
            </span>

            <h2>No albums available</h2>

            <p>
              Create your first album to start
              organizing your WinCapture files.
            </p>

            <div className="albums-empty-actions">
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById(
                      "new-album-name",
                    )
                    ?.focus();
                }}
                className="primary-action"
              >
                <Images
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.8}
                />
                Create album
              </button>
            </div>
          </section>
        ) : (
          <div className="albums-grid">
            {albums.map((album) => (
              <button
                key={album.id}
                type="button"
                onClick={() =>
                  navigate(
                    `/albums/${album.id}`,
                  )
                }
                className="album-card surface"
              >
                <div className="album-card-cover">
                  <div className="album-card-cover-background">
                    <span className="album-cover-orb album-cover-orb-one" />
                    <span className="album-cover-orb album-cover-orb-two" />

                    <span className="album-cover-icon">
                      <Images
                        aria-hidden="true"
                        size={28}
                        strokeWidth={1.45}
                      />
                    </span>
                  </div>

                  <span className="album-card-open">
                    <ArrowUpRight
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.8}
                    />
                  </span>

                </div>

                <div className="album-card-body">
                  <h3
                    className="album-card-title"
                    title={album.albumName}
                  >
                    {album.albumName}
                  </h3>

                  <div className="album-card-details">
                    <div className="album-detail-item">
                      <span className="album-detail-icon">
                        <FolderOpen
                          aria-hidden="true"
                          size={14}
                          strokeWidth={1.7}
                        />
                      </span>

                      <span>
                        <small>Owner</small>
                        <strong
                          title={
                            album.ownerName
                          }
                        >
                          {album.ownerName}
                        </strong>
                      </span>
                    </div>

                    <div className="album-detail-item">
                      <span className="album-detail-icon">
                        <CalendarDays
                          aria-hidden="true"
                          size={14}
                          strokeWidth={1.7}
                        />
                      </span>

                      <span>
                        <small>Created</small>
                        <strong>
                          {formatDate(
                            album.createdAt,
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="album-card-footer">
                    <span>
                      {album.updatedAt
                        ? `Updated ${formatDate(
                            album.updatedAt,
                          )}`
                        : "Not updated"}
                    </span>

                    <span className="album-card-footer-link">
                      Open
                      <ArrowUpRight
                        aria-hidden="true"
                        size={13}
                        strokeWidth={1.8}
                      />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

