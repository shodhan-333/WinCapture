import { FileText, MoreHorizontal, Replace, Trash2, Download } from "lucide-react";

import type { FileResponse } from "../types/file";

interface FileCardProps {
  file: FileResponse;
  previewUrl?: string;
  canManage?: boolean;
  onReplace: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

function formatFileType(contentType: string): string {
  const [type, subtype] = contentType.split("/");
  return subtype ? subtype.toUpperCase() : type.toUpperCase();
}

export default function FileCard({
  file,
  previewUrl,
  canManage = true,
  onReplace,
  onDownload,
  onDelete,
}: FileCardProps) {
  const isImage = file.contentType.startsWith("image/");

  return (
    <article className="surface file-card min-w-0 p-3">
      <div className="file-card-preview media-preview mb-3">
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.originalFileName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
            <FileText aria-hidden="true" size={34} strokeWidth={1.5} />
            <span className="text-xs font-semibold tracking-wide">{formatFileType(file.contentType)}</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-slate-900" title={file.originalFileName}>
            {file.originalFileName}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {formatFileType(file.contentType)} <span aria-hidden="true">·</span> {formatFileSize(file.fileSize)}
          </p>
        </div>

        <details className="file-menu shrink-0">
          <summary aria-label={`Actions for ${file.originalFileName}`} title="File actions">
            <MoreHorizontal aria-hidden="true" size={20} />
          </summary>
          <div className="file-menu-popover">
            {canManage && (
              <button
                type="button"
                className="file-menu-action"
                onClick={(event) => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  onReplace();
                }}
              >
                <Replace aria-hidden="true" size={16} /> Replace
              </button>
            )}
            <button
              type="button"
              className="file-menu-action"
              onClick={(event) => {
                event.currentTarget.closest("details")?.removeAttribute("open");
                onDownload();
              }}
            >
              <Download aria-hidden="true" size={16} /> Download
            </button>
            {canManage && (
              <button
                type="button"
                className="file-menu-action is-danger"
                onClick={(event) => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  onDelete();
                }}
              >
                <Trash2 aria-hidden="true" size={16} /> Delete
              </button>
            )}
          </div>
        </details>
      </div>
      <p className="mt-3 truncate border-t border-slate-100 px-1 pt-2 text-[11px] text-slate-400">
        Added {new Date(file.uploadedAt).toLocaleDateString()}
      </p>
    </article>
  );
}