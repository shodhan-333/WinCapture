import {
  Download,
  FileText,
  MoreHorizontal,
  Replace,
  Star,
  Trash2,
} from "lucide-react";

import type { FileResponse } from "../types/file";
import { formatFileSize, formatFileType } from "../utils/formatters";

interface FileCardProps {
  file: FileResponse;
  previewUrl?: string;
  canManage?: boolean;
  favoritePending?: boolean;
  onFavoriteToggle: () => void;
  onReplace: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function getFileCategory(contentType: string): string {
  if (contentType.startsWith("image/")) {
    return "image";
  }

  if (contentType === "application/pdf") {
    return "document";
  }

  return "file";
}

export default function FileCard({
  file,
  previewUrl,
  canManage,
  favoritePending = false,
  onFavoriteToggle,
  onReplace,
  onDownload,
  onDelete,
}: FileCardProps) {
  const isImage =
    file.contentType.startsWith("image/");

  const effectiveCanManage =
    canManage ?? file.canManage;

  const category =
    getFileCategory(file.contentType);

  return (
    <article className="file-card surface">
      <div
        className={`file-card-preview media-preview file-category-${category}`}
      >
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.originalFileName}
            className="file-preview-image"
          />
        ) : (
          <div className="file-preview-placeholder">
            <span className="file-preview-icon">
              <FileText
                aria-hidden="true"
                size={38}
                strokeWidth={1.45}
              />
            </span>

            <span className="file-preview-type">
              {formatFileType(file.contentType)}
            </span>
          </div>
        )}

        <div className="file-card-preview-overlay" />

        <button
          type="button"
          aria-label={
            file.isFavorite
              ? `Remove ${file.originalFileName} from favorites`
              : `Add ${file.originalFileName} to favorites`
          }
          aria-pressed={file.isFavorite}
          title={
            file.isFavorite
              ? "Remove from favorites"
              : "Add to favorites"
          }
          disabled={favoritePending}
          onClick={onFavoriteToggle}
          className={`file-favorite-button ${
            file.isFavorite
              ? "is-favorite"
              : ""
          }`}
        >
          <Star
            aria-hidden="true"
            size={17}
            strokeWidth={1.8}
            className={
              file.isFavorite
                ? "fill-current"
                : ""
            }
          />
        </button>

        <div className="file-preview-badge">
          {formatFileType(file.contentType)}
        </div>
      </div>

      <div className="file-card-body">
        <div className="file-card-main">
          <div className="file-card-heading">
            <div className="min-w-0">
              <h3
                className="file-card-name"
                title={file.originalFileName}
              >
                {file.originalFileName}
              </h3>

              <p className="file-card-meta">
                {formatFileType(file.contentType)}

                <span aria-hidden="true">
                  ·
                </span>

                {formatFileSize(file.fileSize)}
              </p>
            </div>

            <details className="file-menu">
              <summary
                aria-label={`Actions for ${file.originalFileName}`}
                title="File actions"
              >
                <MoreHorizontal
                  aria-hidden="true"
                  size={19}
                  strokeWidth={1.8}
                />
              </summary>

              <div className="file-menu-popover">
                {effectiveCanManage && (
                  <button
                    type="button"
                    className="file-menu-action"
                    onClick={(event) => {
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");

                      onReplace();
                    }}
                  >
                    <Replace
                      aria-hidden="true"
                      size={16}
                      strokeWidth={1.8}
                    />

                    <span>Replace</span>
                  </button>
                )}

                <button
                  type="button"
                  className="file-menu-action"
                  onClick={(event) => {
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open");

                    onDownload();
                  }}
                >
                  <Download
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.8}
                  />

                  <span>Download</span>
                </button>

                {effectiveCanManage && (
                  <button
                    type="button"
                    className="file-menu-action is-danger"
                    onClick={(event) => {
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");

                      onDelete();
                    }}
                  >
                    <Trash2
                      aria-hidden="true"
                      size={16}
                      strokeWidth={1.8}
                    />

                    <span>Delete</span>
                  </button>
                )}
              </div>
            </details>
          </div>

          <p className="file-card-date">
            Added{" "}
            {new Date(
              file.uploadedAt,
            ).toLocaleDateString()}
          </p>
        </div>

      </div>
    </article>
  );
}