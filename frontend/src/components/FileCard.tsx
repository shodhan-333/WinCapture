import {
  FileText,
  Star,
} from "lucide-react";

import FileActionMenu from "./files/FileActionMenu";
import type { FileResponse } from "../types/file";
import {
  formatDate,
  formatFileSize,
  formatFileType,
} from "../utils/formatters";

interface FileCardProps {
  file: FileResponse;
  previewUrl?: string;
  canManage?: boolean;
  favoritePending?: boolean;
  onFavoriteToggle: () => void;
  onReplace: () => void;
  onDetails: () => void;
  onPreview: () => void;
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
  onDetails,
  onPreview,
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
    <article className="surface group min-w-0 overflow-visible rounded-[17px] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] hover:border-[rgba(178,207,231,0.68)] hover:shadow-[0_17px_34px_rgba(49,103,149,0.12),inset_0_0_0_1px_rgba(201,222,237,0.22)]">
      <div
        className="relative m-[10px] h-[176px] min-w-0 overflow-hidden rounded-[13px] bg-[linear-gradient(145deg,#eef7fe,#e4f0f8)] max-[520px]:h-[190px]"
      >
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.originalFileName}
            loading="lazy"
            role="button"
            tabIndex={0}
            aria-label={`Open full-screen preview of ${file.originalFileName}`}
            onClick={onPreview}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onPreview(); } }}
            className="h-full w-full cursor-zoom-in object-cover transition-[transform,filter] duration-[350ms] group-hover:scale-[1.04] group-hover:saturate-[1.03]"
          />
        ) : (
          <div className={`flex h-full w-full flex-col items-center justify-center gap-2 ${category === "document" ? "bg-[linear-gradient(145deg,#f1efff,#e7e8ff)] text-[#5d67c9]" : category === "file" ? "bg-[linear-gradient(145deg,#eef6fa,#e7f0f4)]" : ""}`}>
            <span className={`grid h-[57px] w-[57px] place-items-center rounded-[17px] bg-[rgba(255,255,255,0.66)] text-[#3788da] shadow-[0_9px_20px_rgba(49,109,161,0.07),inset_0_1px_rgba(255,255,255,0.76)] ${category === "document" ? "text-[#656fd3]" : ""}`}>
              <FileText
                aria-hidden="true"
                size={38}
                strokeWidth={1.45}
              />
            </span>

            <span className="rounded-full bg-[rgba(255,255,255,0.56)] px-[7px] py-1 text-[8px] font-bold tracking-[0.08em] text-[#608099]">
              {formatFileType(file.contentType)}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,42,68,0.08),transparent_30%,rgba(11,42,68,0.16))]" />

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
          className={`absolute right-[9px] top-[9px] z-[2] grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full border border-[rgba(255,255,255,0.75)] bg-[rgba(255,255,255,0.76)] text-[#627d92] shadow-[0_7px_16px_rgba(27,76,119,0.1),inset_0_1px_rgba(255,255,255,0.85)] backdrop-blur-[9px] transition-[transform,color,background] duration-[180ms] hover:enabled:scale-[1.06] hover:enabled:bg-[rgba(255,255,255,0.9)] hover:enabled:text-[#da8b16] disabled:opacity-[0.55] ${
            file.isFavorite
              ? "text-[#e79a1b]"
              : ""
          }`}
        >
          <Star
            aria-hidden="true"
            size={17}
            strokeWidth={1.8}
            className={
              file.isFavorite
                ? "fill-current text-[#e79a1b]"
                : ""
            }
          />
        </button>

        <div className="absolute bottom-[9px] left-[9px] z-[2] rounded-full border border-[rgba(255,255,255,0.22)] bg-[rgba(10,36,57,0.33)] px-[7px] py-1 text-[8px] font-bold tracking-[0.06em] text-[rgba(255,255,255,0.96)] backdrop-blur-[7px]">
          {formatFileType(file.contentType)}
        </div>
      </div>

      <div className="min-w-0 px-[13px] pt-px pb-3">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-[1.3] font-[650] text-[#193c59]"
                title={file.originalFileName}
              >
                {file.originalFileName}
              </h3>

              <p className="mt-[5px] flex items-center gap-[5px] text-[8px] text-[#8295a5]">
                {formatFileType(file.contentType)}

                <span aria-hidden="true">
                  {"\u00B7"}
                </span>

                {formatFileSize(file.fileSize)}
              </p>
            </div>

            <FileActionMenu
              fileName={file.originalFileName}
              canManage={effectiveCanManage}
              onDetails={onDetails}
              onReplace={onReplace}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          </div>

          <p className="mt-[10px] mb-0 border-t border-[#ebf1f5] pt-[9px] text-[8px] text-[#9aaab7]">
            Added {formatDate(file.uploadedAt)}
          </p>
        </div>

      </div>
    </article>
  );
}

