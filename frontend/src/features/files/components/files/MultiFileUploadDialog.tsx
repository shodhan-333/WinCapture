import { useRef, useState, type DragEvent } from "react";
import { Check, FilePlus2, LoaderCircle, Trash2, Upload, X } from "lucide-react";

import { SUPPORTED_FILE_ACCEPT, validateUploadFile } from "@/features/files/constants/fileSupport";
import { ApiError } from "@/shared/types/api";
import { formatFileSize } from "@/shared/utils/formatters";

type UploadStatus = "queued" | "uploading" | "success" | "failed" | "invalid";

interface UploadItem {
  key: string;
  file: File;
  status: UploadStatus;
  message?: string;
}

interface MultiFileUploadDialogProps {
  title: string;
  description: string;
  onUpload: (file: File) => Promise<unknown>;
  onComplete: (successCount: number, failureCount: number) => void | Promise<void>;
  onUploadingChange?: (uploading: boolean) => void;
  onClose: () => void;
}

// Give common API failures actionable messages while keeping unexpected errors generic.
function getFailureMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return "Your session expired. Sign in again, then retry this file.";
  }
  if (error instanceof ApiError && error.status === 403) {
    return "You do not have permission to upload this file here.";
  }
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return error.message;
  }
  if (error instanceof ApiError && error.status >= 500) {
    return "The server could not upload this file. Please try again.";
  }
  return "Upload failed. Check your connection and try again.";
}

// Build a stable key to avoid adding the same selected file more than once.
function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

// Validate a batch, upload valid files one at a time, and retain per-file outcomes.
export function MultiFileUploadDialog({
  title,
  description,
  onUpload,
  onComplete,
  onUploadingChange,
  onClose,
}: MultiFileUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [finished, setFinished] = useState(false);

  // Validate new selections and append files that are not already queued.
  const addFiles = (selected: FileList | File[]) => {
    const incoming = Array.from(selected);
    if (incoming.length === 0) return;
    setFinished(false);
    setItems((current) => {
      const known = new Set(current.map((item) => item.key));
      const additions = incoming.flatMap((file) => {
        const key = fileKey(file);
        if (known.has(key)) return [];
        known.add(key);
        const validationMessage = validateUploadFile(file);
        return [
          {
            key,
            file,
            status: validationMessage ? ("invalid" as const) : ("queued" as const),
            message: validationMessage,
          },
        ];
      });
      return [...current, ...additions];
    });
  };

  // Add dropped files unless an upload is already in progress.
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isUploading) addFiles(event.dataTransfer.files);
  };

  // Upload queued files independently and report the final success/failure counts.
  const handleUpload = async () => {
    if (isUploading) return;
    const queued = items.filter((item) => item.status === "queued");
    if (queued.length === 0) return;

    setIsUploading(true);
    onUploadingChange?.(true);
    let successCount = 0;
    let failureCount = items.filter((item) => item.status === "invalid").length;

    try {
      // Sequential requests keep each file's progress and failure independent.
      for (const item of queued) {
        setItems((current) =>
          current.map((entry) =>
            entry.key === item.key ? { ...entry, status: "uploading", message: undefined } : entry,
          ),
        );
        try {
          await onUpload(item.file);
          successCount += 1;
          setItems((current) =>
            current.map((entry) =>
              entry.key === item.key ? { ...entry, status: "success", message: undefined } : entry,
            ),
          );
        } catch (error) {
          failureCount += 1;
          setItems((current) =>
            current.map((entry) =>
              entry.key === item.key
                ? { ...entry, status: "failed", message: getFailureMessage(error) }
                : entry,
            ),
          );
        }
      }
      setFinished(true);
      await onComplete(successCount, failureCount);
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  };

  const completedCount = items.filter(
    (item) => item.status === "success" || item.status === "failed" || item.status === "invalid",
  ).length;
  const validCount = items.filter((item) => item.status === "queued").length;
  const successCount = items.filter((item) => item.status === "success").length;
  const failureCount = items.filter(
    (item) => item.status === "failed" || item.status === "invalid",
  ).length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(10,24,38,0.62)] p-4 backdrop-blur-md"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="multi-upload-title"
        className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] w-full max-w-[620px] overflow-hidden rounded-[20px] border border-white/80 shadow-[0_24px_80px_rgba(9,30,50,0.32)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/55 px-5 py-4">
          <div>
            <h2 id="multi-upload-title" className="m-0 text-[17px] font-[700] text-[#183b59]">
              {title}
            </h2>
            <p className="mb-0 mt-1 text-[11px] leading-relaxed text-[#38566f]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close upload dialog"
            className="grid h-8 w-8 flex-none place-items-center rounded-full border border-white/70 bg-white/55 text-[#58738a] disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </header>

        <div className="max-h-[min(65vh,560px)] overflow-y-auto p-5">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={SUPPORTED_FILE_ACCEPT}
            className="hidden"
            aria-label="Choose files to upload"
            disabled={isUploading || finished}
            onChange={(event) => {
              if (event.currentTarget.files) addFiles(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />

          {!finished && (
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (
                  !(event.relatedTarget instanceof Node) ||
                  !event.currentTarget.contains(event.relatedTarget)
                )
                  setIsDragging(false);
              }}
              onDrop={handleDrop}
              className={`rounded-[15px] border border-dashed px-4 py-7 text-center transition-colors ${isDragging ? "border-[#4a9be2] bg-[rgba(222,241,255,0.8)]" : "border-[rgba(111,157,190,0.4)] bg-[rgba(255,255,255,0.35)]"}`}
            >
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-[14px] border border-white/80 bg-white/65 text-[#2879d1]">
                <FilePlus2 size={21} />
              </span>
              <p className="mb-0 mt-3 text-[12px] font-semibold text-[#38566f]">
                Drop files here, or choose files
              </p>
              <p className="mb-3 mt-1 text-[11px] text-[#38566f]">up to 10 MB per file</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#245277] [border:1px_solid_rgba(255,_255,_255,_0.58)] [background:rgba(255,_255,_255,_0.48)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.9),_0_3px_12px_rgba(24,_52,_78,_0.03)] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[color:#164063] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.68)] [&:hover:not(:disabled)]:[border-color:rgba(255,_255,_255,_0.88)] [&:hover:not(:disabled)]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.95),_0_5px_16px_rgba(24,_52,_78,_0.05)] min-h-[32px] px-3 text-[10px] disabled:opacity-50"
              >
                Choose files
              </button>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="m-0 text-[11px] font-semibold text-[#38566f]">
                  Selected files ({items.length})
                </h3>
                {!isUploading && !finished && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-[12px] font-bold text-[#245277] hover:text-[#123b5c]"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <ul className="m-0 grid list-none gap-2 p-0">
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center gap-3 rounded-[11px] border border-white/65 bg-white/45 px-3 py-2"
                  >
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-[9px] bg-[rgba(230,241,250,0.75)] text-[#5283aa]">
                      <FilePlus2 size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong
                        className="block overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#38566f]"
                        title={item.file.name}
                      >
                        {item.file.name}
                      </strong>
                      <span className="text-[11px] font-semibold text-[#526b80]">
                        {formatFileSize(item.file.size)}
                        {item.message ? ` Â· ${item.message}` : ""}
                      </span>
                    </span>
                    <span
                      className={`flex-none text-[11px] font-bold ${item.status === "success" ? "text-[#24633b]" : item.status === "failed" || item.status === "invalid" ? "text-[#a52f39]" : "text-[#245277]"}`}
                      role={
                        item.status === "failed" || item.status === "invalid" ? "status" : undefined
                      }
                    >
                      {item.status === "queued" ? (
                        "Ready"
                      ) : item.status === "uploading" ? (
                        <span className="inline-flex items-center gap-1">
                          <LoaderCircle size={12} className="animate-spin" />
                          Uploading
                        </span>
                      ) : item.status === "success" ? (
                        <span className="inline-flex items-center gap-1">
                          <Check size={12} />
                          Uploaded
                        </span>
                      ) : item.status === "invalid" ? (
                        "Invalid"
                      ) : (
                        "Failed"
                      )}
                    </span>
                    {!isUploading && !finished && (
                      <button
                        type="button"
                        onClick={() =>
                          setItems((current) => current.filter((entry) => entry.key !== item.key))
                        }
                        aria-label={`Remove ${item.file.name}`}
                        className="grid h-7 w-7 flex-none place-items-center rounded-[8px] text-[#c2414b] hover:bg-[#fff0f1]"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isUploading && (
            <div className="mt-4" role="status" aria-live="polite">
              <div className="mb-2 flex items-center justify-between text-[13px] font-bold text-[#244761]">
                <span>Uploading files</span>
                <span className="rounded-md bg-[#e7f1fa] px-2 py-0.5 text-[#174f7d]">
                  {completedCount} of {items.length}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Files uploaded"
                aria-valuemin={0}
                aria-valuemax={items.length}
                aria-valuenow={completedCount}
                className="h-2 overflow-hidden rounded-full bg-[rgba(90,135,170,0.15)]"
              >
                <div
                  className="h-full rounded-full bg-[#438bd0] transition-[width] duration-300"
                  style={{ width: `${items.length ? (completedCount / items.length) * 100 : 0}%` }}
                />
              </div>
              <p className="mb-0 mt-2 text-[11px] text-[#526b80]">
                Each file uploads separately so other files can continue if one fails.
              </p>
            </div>
          )}

          {finished && (
            <p
              role="status"
              className="[border:1px_solid_rgba(40,_165,_95,_0.3)] [background:rgba(240,_253,_246,_0.55)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.88),_0_6px_18px_rgba(30,_95,_50,_0.03)] [backdrop-filter:blur(14px)_saturate(160%)] [-webkit-backdrop-filter:blur(14px)_saturate(160%)] mt-4 rounded-[11px] px-3 py-2 text-[10px] font-medium"
            >
              Uploads finished: {successCount} successful, {failureCount} failed.
            </p>
          )}
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-white/55 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#245277] [border:1px_solid_rgba(255,_255,_255,_0.58)] [background:rgba(255,_255,_255,_0.48)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.9),_0_3px_12px_rgba(24,_52,_78,_0.03)] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[color:#164063] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.68)] [&:hover:not(:disabled)]:[border-color:rgba(255,_255,_255,_0.88)] [&:hover:not(:disabled)]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.95),_0_5px_16px_rgba(24,_52,_78,_0.05)] min-h-[36px] px-4 text-[10px] disabled:opacity-50"
          >
            {finished ? "Close" : "Cancel"}
          </button>
          {!finished && (
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={isUploading || validCount === 0}
              className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)] min-h-[36px] px-4 text-[10px] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Upload size={14} />
              {isUploading
                ? "Uploading..."
                : `Upload ${validCount} file${validCount === 1 ? "" : "s"}`}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
