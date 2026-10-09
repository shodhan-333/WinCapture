import type { ReactNode } from "react";

import FileCard from "../FileCard";
import type { FileResponse } from "../../types/file";

interface FileCardGridProps {
  files: FileResponse[];
  previewUrls: Record<number, string>;
  favoritePendingIds: ReadonlySet<number>;
  canManage?: boolean | ((file: FileResponse) => boolean);
  onFavoriteToggle: (file: FileResponse) => void;
  onReplace: (file: FileResponse) => void;
  onDetails: (file: FileResponse) => void;
  onPreview: (file: FileResponse) => void;
  onDownload: (file: FileResponse) => void;
  onDelete: (file: FileResponse) => void;
  empty?: ReactNode;
}

export default function FileCardGrid({
  files,
  previewUrls,
  favoritePendingIds,
  canManage = false,
  onFavoriteToggle,
  onReplace,
  onDetails,
  onPreview,
  onDownload,
  onDelete,
  empty,
}: FileCardGridProps) {
  if (files.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="grid grid-cols-3 gap-[17px] max-[1200px]:grid-cols-2 max-[760px]:grid-cols-2 max-[760px]:gap-3 max-[520px]:grid-cols-1">
      {files.map((file) => {
        const effectiveCanManage =
          typeof canManage === "function"
            ? canManage(file)
            : canManage;

        return (
          <FileCard
            key={file.id}
            file={file}
            previewUrl={previewUrls[file.id]}
            canManage={effectiveCanManage}
            favoritePending={favoritePendingIds.has(
              file.id,
            )}
            onFavoriteToggle={() =>
              onFavoriteToggle(file)
            }
            onReplace={() => onReplace(file)}
            onDetails={() => onDetails(file)}
            onPreview={() => onPreview(file)}
            onDownload={() => onDownload(file)}
            onDelete={() => onDelete(file)}
          />
        );
      })}
    </div>
  );
}
