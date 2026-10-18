import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { FileResponse } from "@/features/files/types/file";
import { formatDate, formatFileSize, formatFileType } from "@/shared/utils/formatters";

interface FileDetailsDialogProps {
  file: FileResponse;
  onClose: () => void;
}

export function FileDetailsDialog({ file, onClose }: FileDetailsDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-[rgba(15,35,55,0.30)] p-4 backdrop-blur-[12px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default border-0 bg-transparent"
        aria-label="Close file details backdrop"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-details-title"
        className="glass-dialog relative z-[1] w-[min(430px,100%)] rounded-[20px] p-6 shadow-[0_24px_64px_rgba(16,40,64,0.16)]"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="page-kicker mb-2 text-[#5a778e]">File details</p>
            <h2
              id="file-details-title"
              className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-semibold text-[#143653]"
              title={file.originalFileName}
            >
              {file.originalFileName}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close file details"
            className="grid h-8 w-8 flex-none cursor-pointer place-items-center rounded-[10px] border border-white/70 bg-white/55 text-[#506d84] shadow-sm backdrop-blur-sm transition-colors hover:border-white/90 hover:bg-white/80 hover:text-[var(--accent)]"
          >
            <X aria-hidden="true" size={17} />
          </button>
        </header>

        <dl className="mt-5 grid grid-cols-[100px_minmax(0,1fr)] gap-x-3 gap-y-3 border-t border-[rgba(255,255,255,0.45)] pt-4 text-[11px]">
          <dt className="text-[#5a778e]">File ID</dt>
          <dd className="m-0 break-all font-semibold text-[#163855]">{file.id}</dd>
          <dt className="text-[#5a778e]">Type</dt>
          <dd className="m-0 break-all font-semibold text-[#163855]">
            {formatFileType(file.contentType)}{" "}
            <span className="font-medium text-[#658299]">({file.contentType})</span>
          </dd>
          <dt className="text-[#5a778e]">Size</dt>
          <dd className="m-0 font-semibold text-[#163855]">{formatFileSize(file.fileSize)}</dd>
          <dt className="text-[#5a778e]">Added</dt>
          <dd className="m-0 font-semibold text-[#163855]">{formatDate(file.uploadedAt)}</dd>
        </dl>
      </section>
    </div>
  );
}
