import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
  Star,
  Play,
} from "lucide-react";

import { FileActionMenu } from "./files/FileActionMenu";
import type { FileResponse } from "@/features/files/types/file";
import { getFileCategory } from "@/features/files/constants/fileSupport";
import { formatFileType } from "@/shared/utils/formatters";
import { PreviewThumbnail } from "./files/PreviewThumbnail";

interface FileCardProps {
  file: FileResponse;
  previewUrl?: string;
  canManage?: boolean;
  favoritePending?: boolean;
  onFavoriteToggle: () => void;
  onReplace: () => void;
  onDetails: () => void;
  onPreview: (file: FileResponse, previewUrl?: string) => void;
  loadPreview?: (file: FileResponse) => Promise<string>;
  previewCacheKey?: string | null;
  onDownload: () => void;
  onDelete: () => void;
  selected?: boolean;
  onSelectionToggle?: () => void;
  selectionDisabled?: boolean;
  focused?: boolean;
}

// Display one file's preview and expose only the actions allowed by its permissions.
export function FileCard({
  file,
  previewUrl,
  canManage,
  favoritePending = false,
  onFavoriteToggle,
  onReplace,
  onDetails,
  onPreview,
  loadPreview,
  previewCacheKey = null,
  onDownload,
  onDelete,
  selected = false,
  onSelectionToggle,
  selectionDisabled = false,
  focused = false,
}: FileCardProps) {
  const fileCategory = getFileCategory(file.originalFileName);
  const isImage = fileCategory === "Images";

  const effectiveCanManage = canManage ?? file.canManage;

  const lowerFileName = file.originalFileName.toLocaleLowerCase();

  const Icon =
    fileCategory === "Images"
      ? FileImage
      : fileCategory === "Videos"
        ? FileVideo
        : fileCategory === "Audio"
          ? FileAudio
          : fileCategory === "Archives"
            ? FileArchive
            : lowerFileName.endsWith(".xlsx") || lowerFileName.endsWith(".csv")
              ? FileSpreadsheet
              : lowerFileName.endsWith(".pptx")
                ? Presentation
                : FileText;

  const cardRef = useRef<HTMLElement | null>(null);
  const [shouldLoadPreview, setShouldLoadPreview] = useState(false);
  const signature = `${file.contentType}:${file.fileSize}:${file.uploadedAt}`;
  const previewQuery = useQuery({
    queryKey: ["file-preview", previewCacheKey, file.id, signature, file.downloadUrl, file.canManage],
    enabled: shouldLoadPreview && !!loadPreview,
    queryFn: () => loadPreview!(file),
    staleTime: Infinity,
    gcTime: 60_000,
    retry: false,
  });
  const contentUrl = previewUrl ?? previewQuery.data;
  const fetchPreview = useCallback(async () => {
    if (!loadPreview) return Promise.reject(new Error("Preview is unavailable."));
    if (contentUrl) return Promise.resolve(contentUrl);
    setShouldLoadPreview(true);
    const result = await previewQuery.refetch();
    if (result.error) throw result.error;
    if (!result.data) throw new Error("Preview is unavailable.");
    return result.data;
  }, [contentUrl, loadPreview, previewQuery.refetch]);

  useEffect(() => {
    if (isImage || !loadPreview) return;
    const element = cardRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadPreview(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [isImage, loadPreview]);

  useEffect(() => {
    if (focused) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focused]);

  // Resolve the image preview if necessary, then open the file preview dialog.
  const openPreview = async () => {
    if (isImage) {
      onPreview(file, previewUrl);
      return;
    }
    try {
      onPreview(file, await fetchPreview());
    } catch {
      onPreview(file);
    }
  };

  const previewArea =
    isImage && previewUrl ? (
      <button
        type="button"
        className="h-full w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0"
        aria-label={`Open full-screen preview of ${file.originalFileName}`}
        onClick={() => onPreview(file, previewUrl)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onPreview(file, previewUrl);
          }
        }}
      >
        <img
          src={previewUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-[transform,filter] duration-[350ms] group-hover:scale-[1.04] group-hover:saturate-[1.03]"
        />
      </button>
    ) : fileCategory && !isImage ? (
      <div className="relative h-full w-full overflow-hidden">
        <PreviewThumbnail file={file} src={contentUrl} />
        <button
          type="button"
          onClick={() => void openPreview()}
          disabled={previewQuery.isFetching}
          aria-label={`Open preview of ${file.originalFileName}`}
          className="absolute inset-0 z-[1] grid cursor-pointer place-items-center border-0 bg-transparent text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#3787d4] disabled:cursor-wait"
        >
          {previewQuery.isFetching && (
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/75 bg-[#153b59]/55 shadow-lg backdrop-blur-sm">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-label="Loading preview"
              />
            </span>
          )}
        </button>
      </div>
    ) : (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.5),transparent_40%),linear-gradient(145deg,rgba(225,242,255,0.65),rgba(205,230,248,0.5))]">
        <span className="grid h-[57px] w-[57px] place-items-center rounded-[17px] border border-white/80 bg-white/60 text-[#1b74d3] shadow-[0_8px_20px_rgba(26,54,80,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md">
          <Icon aria-hidden="true" size={38} strokeWidth={1.45} />
        </span>
        <span className="rounded-full border border-white/60 bg-white/50 px-[7px] py-1 text-[8px] font-bold tracking-[0.08em] text-[#4d6b82] backdrop-blur-sm">
          {formatFileType(file.contentType)}
        </span>
      </div>
    );

  return (
    <article
      ref={cardRef}
      className={`[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] group min-w-0 overflow-visible rounded-[17px] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.85)] hover:shadow-[0_16px_40px_rgba(20,48,72,0.09),inset_0_1px_1.5px_0_rgba(255,255,255,0.92),inset_0_-1px_1px_0_rgba(255,255,255,0.25)] ${focused ? "!border-[#3787d4] ring-2 ring-[#3787d4]/35" : ""}`}
    >
      <div className="relative m-2 h-[136px] min-w-0 overflow-hidden rounded-[12px] border border-white/60 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_40%),linear-gradient(145deg,rgba(215,238,255,0.65)_0%,rgba(190,222,248,0.45)_50%,rgba(220,238,252,0.60)_100%)] max-[520px]:h-[150px]">
        {previewArea}
        {onSelectionToggle && (
          <label
            className="absolute left-2 top-2 z-[4] grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-white/80 bg-white/85 shadow-sm backdrop-blur"
            title={`Select ${file.originalFileName}`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-[#287dd7]"
              checked={selected}
              disabled={selectionDisabled}
              onChange={onSelectionToggle}
              aria-label={`Select ${file.originalFileName}`}
            />
          </label>
        )}
        {!isImage && fileCategory && (
          <span className="pointer-events-none absolute bottom-[9px] right-[9px] z-[2] rounded-full border border-white/75 bg-white/70 p-1.5 text-[#3b678a] shadow-sm backdrop-blur-sm">
            {fileCategory === "Videos" ? (
              <Play size={13} fill="currentColor" />
            ) : fileCategory === "Audio" ? (
              <Icon size={14} />
            ) : fileCategory === "Archives" ? (
              <Icon size={14} />
            ) : (
              <Icon size={14} />
            )}
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,42,68,0.06),transparent_30%,rgba(11,42,68,0.14))]" />

        <button
          type="button"
          aria-label={
            file.isFavorite
              ? `Remove ${file.originalFileName} from favorites`
              : `Add ${file.originalFileName} to favorites`
          }
          aria-pressed={file.isFavorite}
          title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
          disabled={favoritePending}
          onClick={onFavoriteToggle}
          className={`absolute right-[9px] top-[9px] z-[2] grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full border border-white/80 bg-white/60 text-[#526f86] shadow-[0_4px_14px_rgba(20,54,84,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md transition-[transform,color,background,border-color] duration-[180ms] hover:enabled:scale-[1.06] hover:enabled:bg-white/85 hover:enabled:text-[#d48410] disabled:opacity-[0.55] ${
            file.isFavorite ? "!text-[#d9850e] bg-white/80" : ""
          }`}
        >
          <Star
            aria-hidden="true"
            size={17}
            strokeWidth={1.8}
            className={file.isFavorite ? "fill-current text-[#e79a1b]" : ""}
          />
        </button>

        <div className="absolute bottom-[9px] left-[9px] z-[2] rounded-full border border-white/35 bg-[rgba(10,36,57,0.30)] px-[8px] py-1 text-[8px] font-bold tracking-[0.06em] text-white shadow-sm backdrop-blur-md">
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

              {/*
              <p className="mt-[5px] flex items-center gap-[5px] text-[8px] text-[#8295a5]">
                {formatFileType(file.contentType)}

                <span aria-hidden="true">
                  {"\u00B7"}
                </span>

                {formatFileSize(file.fileSize)}
              </p>
              */}
            </div>

            <FileActionMenu
              fileName={file.originalFileName}
              canManage={effectiveCanManage}
              canDownload={effectiveCanManage || file.canDownload}
              onDetails={onDetails}
              onReplace={onReplace}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          </div>

          {/*
          <p className="mt-[10px] mb-0 border-t border-[#ebf1f5] pt-[9px] text-[8px] text-[#9aaab7]">
            Added {formatDate(file.uploadedAt)}
          </p>
          */}
        </div>
      </div>
    </article>
  );
}
