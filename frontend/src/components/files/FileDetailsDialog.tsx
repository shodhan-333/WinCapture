import { X } from "lucide-react";

import type { FileResponse } from "../../types/file";
import {
  formatDate,
  formatFileSize,
  formatFileType,
} from "../../utils/formatters";

interface FileDetailsDialogProps {
  file: FileResponse;
  onClose: () => void;
}

export default function FileDetailsDialog({
  file,
  onClose,
}: FileDetailsDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[rgba(20,43,62,0.32)] p-4 backdrop-blur-[3px]"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-details-title"
        className="surface !bg-white !backdrop-blur-none w-[min(420px,100%)] rounded-[18px] border-[#d6e2eb] p-5 shadow-[0_24px_60px_rgba(31,67,97,0.2)]"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="page-kicker mb-2 text-[#55738d]">File details</p>
            <h2
              id="file-details-title"
              className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-semibold text-[#102d45]"
              title={file.originalFileName}
            >
              {file.originalFileName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close file details"
            className="grid h-8 w-8 flex-none cursor-pointer place-items-center rounded-[9px] border border-[#dce8f0] bg-[rgba(255,255,255,0.64)] text-[#688196] hover:bg-[#edf6fd] hover:text-[#286eae]"
          >
            <X aria-hidden="true" size={17} />
          </button>
        </header>

        <dl className="mt-5 grid grid-cols-[100px_minmax(0,1fr)] gap-x-3 gap-y-3 border-t border-[#dce6ee] pt-4 text-[11px]">
          <dt className="text-[#536d82]">File ID</dt>
          <dd className="m-0 break-all font-semibold text-[#193c59]">{file.id}</dd>
          <dt className="text-[#536d82]">Type</dt>
          <dd className="m-0 break-all font-semibold text-[#193c59]">
            {formatFileType(file.contentType)} <span className="font-medium text-[#536d82]">({file.contentType})</span>
          </dd>
          <dt className="text-[#536d82]">Size</dt>
          <dd className="m-0 font-semibold text-[#193c59]">{formatFileSize(file.fileSize)}</dd>
          <dt className="text-[#536d82]">Added</dt>
          <dd className="m-0 font-semibold text-[#193c59]">{formatDate(file.uploadedAt)}</dd>
        </dl>
      </section>
    </div>
  );
}
