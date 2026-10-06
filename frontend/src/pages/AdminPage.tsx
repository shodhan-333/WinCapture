import {
  FileText,
  FolderOpen,
  Images,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

import {
  getAdminAlbums,
  getAdminFiles,
} from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import type { AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";
import {
  formatDate,
  formatFileSize,
} from "../utils/formatters";

export default function AdminPage() {
  const { instance } = useMsal();
  const { account } = useAuth();

  const [albums, setAlbums] =
    useState<AlbumResponse[]>(
      [],
    );

  const [files, setFiles] =
    useState<FileResponse[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    async function load() {
      if (!account) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          albumResult,
          fileResult,
        ] = await Promise.all([
          getAdminAlbums(
            instance,
            account,
          ),
          getAdminFiles(
            instance,
            account,
          ),
        ]);

        setAlbums(
          albumResult,
        );

        setFiles(
          fileResult,
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load admin data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [
    account,
    instance,
  ]);

  if (loading) {
    return (
      <div className="app-page">
        <section className="admin-hero skeleton-panel">
          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>

          <span className="skeleton-icon skeleton-icon-large" />
        </section>

        <section className="admin-content-grid">
          {[1, 2].map(
            (item) => (
              <div
                key={item}
                className="surface admin-list-skeleton"
              >
                <span className="skeleton-line skeleton-line-md" />
                <span className="skeleton-line skeleton-line-sm" />
                <span className="skeleton-line skeleton-line-sm" />
                <span className="skeleton-line skeleton-line-sm" />
              </div>
            ),
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="app-page admin-page">
      <section className="admin-hero surface">
        <div className="admin-hero-glow admin-hero-glow-one" />
        <div className="admin-hero-glow admin-hero-glow-two" />

        <div className="admin-hero-content">
          <div className="page-kicker">
            <span className="page-kicker-dot" />
            Administration
          </div>

          <h1 className="page-heading">
            System overview
          </h1>

          <p className="page-description">
            Monitor the albums and files
            currently managed across
            WinCapture.
          </p>
        </div>

        <div className="admin-hero-icon">
          <ShieldCheck
            aria-hidden="true"
            size={31}
            strokeWidth={1.45}
          />
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="error-banner"
        >
          <span className="error-banner-icon">
            <AlertCircle
              aria-hidden="true"
              size={17}
              strokeWidth={1.8}
            />
          </span>

          <span>{error}</span>
        </div>
      )}

      <section className="admin-content-grid">
        <section className="surface admin-panel">
          <div className="admin-panel-header">
            <div>
              <p className="dashboard-panel-kicker">
                Collections
              </p>

              <h2 className="section-title">
                Latest albums
              </h2>
            </div>

            <span className="admin-panel-count">
              {albums.length}
            </span>
          </div>

          <div className="admin-list">
            {albums.length === 0 ? (
              <div className="admin-empty-state">
                <span className="admin-empty-icon">
                  <Images
                    aria-hidden="true"
                    size={23}
                    strokeWidth={1.5}
                  />
                </span>

                <div>
                  <strong>
                    No albums available
                  </strong>

                  <p>
                    There are currently no
                    albums to display.
                  </p>
                </div>
              </div>
            ) : (
              albums
                .slice(0, 5)
                .map(
                  (album) => (
                    <div
                      key={album.id}
                      className="admin-list-row"
                    >
                      <span className="admin-row-icon album">
                        <Images
                          aria-hidden="true"
                          size={17}
                          strokeWidth={1.7}
                        />
                      </span>

                      <div className="admin-row-main">
                        <strong
                          title={
                            album.albumName
                          }
                        >
                          {
                            album.albumName
                          }
                        </strong>

                        <span>
                          Owner:{" "}
                          {
                            album.ownerName
                          }
                        </span>
                      </div>

                      <div className="admin-row-meta">
                        <small>
                          Created
                        </small>

                        <strong>
                          {formatDate(
                            album.createdAt,
                          )}
                        </strong>
                      </div>

                      <span className="admin-row-id">
                        #
                        {album.id}
                      </span>

                    </div>
                  ),
                )
            )}
          </div>
        </section>

        <section className="surface admin-panel">
          <div className="admin-panel-header">
            <div>
              <p className="dashboard-panel-kicker">
                Storage
              </p>

              <h2 className="section-title">
                Latest files
              </h2>
            </div>

            <span className="admin-panel-count">
              {files.length}
            </span>
          </div>

          <div className="admin-list">
            {files.length === 0 ? (
              <div className="admin-empty-state">
                <span className="admin-empty-icon purple">
                  <FileText
                    aria-hidden="true"
                    size={23}
                    strokeWidth={1.5}
                  />
                </span>

                <div>
                  <strong>
                    No files available
                  </strong>

                  <p>
                    There are currently no
                    files to display.
                  </p>
                </div>
              </div>
            ) : (
              files
                .slice(0, 5)
                .map(
                  (file) => (
                    <div
                      key={file.id}
                      className="admin-list-row"
                    >
                      <span className="admin-row-icon file">
                        <FolderOpen
                          aria-hidden="true"
                          size={17}
                          strokeWidth={1.7}
                        />
                      </span>

                      <div className="admin-row-main">
                        <strong
                          title={
                            file.originalFileName
                          }
                        >
                          {
                            file.originalFileName
                          }
                        </strong>

                        <span>
                          {
                            file.contentType
                          }
                        </span>
                      </div>

                      <div className="admin-row-meta">
                        <small>
                          Size
                        </small>

                        <strong>
                          {formatFileSize(
                            file.fileSize,
                          )}
                        </strong>
                      </div>

                      <span className="admin-row-id">
                        #
                        {file.id}
                      </span>

                    </div>
                  ),
                )
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
