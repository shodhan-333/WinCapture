import type { ReactNode } from "react";

import { FileCard } from "../FileCard";
import type { FileResponse } from "@/features/files/types/file";

interface FileCardGridProps {
  files: FileResponse[];
  previewUrls: Record<number, string>;
  favoritePendingIds: ReadonlySet<number>;
  canManage?: boolean | ((file: FileResponse) => boolean);
  onFavoriteToggle: (file: FileResponse) => void;
  onReplace: (file: FileResponse) => void;
  onDetails: (file: FileResponse) => void;
  onPreview: (file: FileResponse, previewUrl?: string) => void;
  loadPreview?: (file: FileResponse) => Promise<string>;
  previewCacheKey?: string | null;
  onDownload: (file: FileResponse) => void;
  onDelete: (file: FileResponse) => void;
  empty?: ReactNode;
  selectionMode?: boolean;
  selectedIds?: ReadonlySet<number>;
  onSelectionToggle?: (file: FileResponse) => void;
  selectionEligible?: (file: FileResponse) => boolean;
  selectionDisabled?: boolean;
  focusedFileId?: number | null;
}

// Render reusable file cards while applying per-file management and selection rules.
export function FileCardGrid({
  files,
  previewUrls,
  favoritePendingIds,
  canManage = false,
  onFavoriteToggle,
  onReplace,
  onDetails,
  onPreview,
  loadPreview,
  previewCacheKey,
  onDownload,
  onDelete,
  empty,
  selectionMode = false,
  selectedIds,
  onSelectionToggle,
  selectionEligible,
  selectionDisabled = false,
  focusedFileId = null,
}: FileCardGridProps) {
  if (files.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
      {files.map((file) => {
        const effectiveCanManage = typeof canManage === "function" ? canManage(file) : canManage;

        return (
          <FileCard
            key={file.id}
            file={file}
            previewUrl={previewUrls[file.id]}
            loadPreview={loadPreview}
            previewCacheKey={previewCacheKey}
            canManage={effectiveCanManage}
            favoritePending={favoritePendingIds.has(file.id)}
            onFavoriteToggle={() => onFavoriteToggle(file)}
            onReplace={() => onReplace(file)}
            onDetails={() => onDetails(file)}
            onPreview={(selectedFile, url) => onPreview(selectedFile, url)}
            onDownload={() => onDownload(file)}
            onDelete={() => onDelete(file)}
            selected={selectedIds?.has(file.id)}
            onSelectionToggle={
              selectionMode && (selectionEligible?.(file) ?? true)
                ? () => onSelectionToggle?.(file)
                : undefined
            }
            selectionDisabled={selectionDisabled}
            focused={file.id === focusedFileId}
          />
        );
      })}
    </div>
  );
}
