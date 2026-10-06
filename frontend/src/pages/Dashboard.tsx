import { useEffect, useState } from "react";
import {
  ArrowRight,
  FolderOpen,
  Images,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import {
  getAdminFiles,
  getAlbums,
  getFiles,
} from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import { useAuth } from "../context/AuthContext";
import type { AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";
import {
  formatDate,
  formatFileSize,
  formatFileType,
} from "../utils/formatters";

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

        const [albumResult, fileResult] =
          await Promise.all([
            getAlbums(instance, account),
            user?.role === "Admin"
              ? getAdminFiles(instance, account)
              : getFiles(instance, account),
          ]);

        setAlbums(albumResult);
        setFiles(fileResult);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [account, instance, user?.role]);

  if (loading) {
    return (
      <div className="app-page">
        <section className="dashboard-hero skeleton-panel">
          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>

          <div className="skeleton-actions">
            <span className="skeleton-button" />
            <span className="skeleton-button skeleton-button-wide" />
          </div>
        </section>

        <section className="dashboard-stat-grid">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="dashboard-stat-card skeleton-panel"
            >
              <span className="skeleton-icon" />
              <span className="skeleton-line skeleton-line-sm" />
              <span className="skeleton-line skeleton-line-value" />
            </div>
          ))}
        </section>

        <section className="dashboard-content-grid">
          <div className="dashboard-panel skeleton-panel skeleton-panel-tall" />
          <div className="dashboard-panel skeleton-panel skeleton-panel-tall" />
        </section>
      </div>
    );
  }

  return (
    <div className="app-page">
      <section className="dashboard-hero surface">
        <div className="dashboard-hero-glow dashboard-hero-glow-one" />
        <div className="dashboard-hero-glow dashboard-hero-glow-two" />

        <div className="dashboard-hero-content">
          <div className="dashboard-eyebrow">
            <span className="dashboard-eyebrow-dot" />
            Your workspace
          </div>

          <h1 className="dashboard-hero-title">
            Welcome back,{" "}
            <span>
              {user?.name ?? "User"}
            </span>
          </h1>

          <p className="dashboard-hero-description">
            Keep your albums organized, manage your
            files, and access your shared collections
            from one place.
          </p>

          <div className="dashboard-hero-actions">
            <button
              type="button"
              onClick={() => navigate("/albums")}
              className="primary-action"
            >
              <Images
                aria-hidden="true"
                size={17}
                strokeWidth={1.8}
              />
              <span>Browse albums</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/files")}
              className="secondary-action"
            >
              <FolderOpen
                aria-hidden="true"
                size={17}
                strokeWidth={1.8}
              />
              <span>Open files</span>
            </button>
          </div>
        </div>

      </section>

      {error && <ErrorBanner message={error} />}

      <section className="dashboard-stat-grid">
        <button
          type="button"
          className="dashboard-stat-card surface"
          onClick={() => navigate("/albums")}
        >
          <span className="dashboard-stat-icon blue">
            <Images
              aria-hidden="true"
              size={19}
              strokeWidth={1.8}
            />
          </span>

          <span className="dashboard-stat-copy">
            <small>Albums</small>
            <strong>{albums.length}</strong>
          </span>

          <ArrowRight
            aria-hidden="true"
            className="dashboard-stat-arrow"
            size={17}
            strokeWidth={1.8}
          />
        </button>

        <button
          type="button"
          className="dashboard-stat-card surface"
          onClick={() => navigate("/files")}
        >
          <span className="dashboard-stat-icon purple">
            <FolderOpen
              aria-hidden="true"
              size={19}
              strokeWidth={1.8}
            />
          </span>

          <span className="dashboard-stat-copy">
            <small>Files</small>
            <strong>{files.length}</strong>
          </span>

          <ArrowRight
            aria-hidden="true"
            className="dashboard-stat-arrow"
            size={17}
            strokeWidth={1.8}
          />
        </button>

      </section>

      <section className="dashboard-content-grid">
        <section className="dashboard-panel surface">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-kicker">
                Collections
              </p>

              <h2 className="dashboard-panel-title">
                Recent albums
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/albums")}
              className="dashboard-view-all"
            >
              View all
              <ArrowRight
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />
            </button>
          </div>

          <div className="dashboard-list">
            {albums.length === 0 ? (
              <div className="dashboard-empty-state">
                <span className="dashboard-empty-icon">
                  <Images
                    aria-hidden="true"
                    size={21}
                    strokeWidth={1.6}
                  />
                </span>

                <div>
                  <strong>
                    No albums yet
                  </strong>

                  <p>
                    Create your first album to
                    start organizing your files.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/albums")}
                  className="secondary-action compact-action"
                >
                  Open albums
                </button>
              </div>
            ) : (
              albums.slice(0, 4).map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/albums/${album.id}`,
                    )
                  }
                  className="dashboard-list-row"
                >
                  <span className="dashboard-list-icon album">
                    <Images
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.7}
                    />
                  </span>

                  <span className="dashboard-list-main">
                    <strong>
                      {album.albumName}
                    </strong>

                    <small>
                      Owner: {album.ownerName}
                    </small>
                  </span>

                  <span className="dashboard-list-meta">
                    {formatDate(album.createdAt)}
                  </span>

                  <ArrowRight
                    aria-hidden="true"
                    className="dashboard-list-arrow"
                    size={15}
                    strokeWidth={1.8}
                  />
                </button>
              ))
            )}
          </div>
        </section>

        <section className="dashboard-panel surface">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-kicker">
                Your library
              </p>

              <h2 className="dashboard-panel-title">
                Recent files
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/files")}
              className="dashboard-view-all"
            >
              View all
              <ArrowRight
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />
            </button>
          </div>

          <div className="dashboard-list">
            {files.length === 0 ? (
              <div className="dashboard-empty-state">
                <span className="dashboard-empty-icon purple">
                  <FolderOpen
                    aria-hidden="true"
                    size={21}
                    strokeWidth={1.6}
                  />
                </span>

                <div>
                  <strong>
                    No files uploaded yet
                  </strong>

                  <p>
                    Upload a file to see it
                    appear in your library.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/files")}
                  className="secondary-action compact-action"
                >
                  Open files
                </button>
              </div>
            ) : (
              files.slice(0, 4).map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() =>
                    navigate("/files")
                  }
                  className="dashboard-list-row"
                >
                  <span className="dashboard-file-icon">
                    {file.contentType.startsWith(
                      "image/",
                    ) ? (
                      <span className="dashboard-file-image-icon">
                        IMG
                      </span>
                    ) : (
                      <FolderOpen
                        aria-hidden="true"
                        size={18}
                        strokeWidth={1.7}
                      />
                    )}
                  </span>

                  <span className="dashboard-list-main">
                    <strong>
                      {file.originalFileName}
                    </strong>

                    <small>
                      {formatFileType(
                        file.contentType,
                      )}
                      <span aria-hidden="true">
                        {" Â· "}
                      </span>
                      {formatFileSize(
                        file.fileSize,
                      )}
                    </small>
                  </span>

                  <span className="dashboard-list-meta">
                    {new Date(
                      file.uploadedAt,
                    ).toLocaleDateString()}
                  </span>

                  <ArrowRight
                    aria-hidden="true"
                    className="dashboard-list-arrow"
                    size={15}
                    strokeWidth={1.8}
                  />
                </button>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

