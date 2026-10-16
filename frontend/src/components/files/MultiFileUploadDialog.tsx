import { useRef, useState, type DragEvent } from "react";
import { Check, FilePlus2, LoaderCircle, Trash2, Upload, X } from "lucide-react";

import { SUPPORTED_FILE_ACCEPT, validateUploadFile } from "../../constants/fileSupport";
import { ApiError } from "../../types/api";
import { formatFileSize } from "../../utils/formatters";

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

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export default function MultiFileUploadDialog({
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
        return [{
          key,
          file,
          status: validationMessage ? "invalid" as const : "queued" as const,
          message: validationMessage,
        }];
      });
      return [...current, ...additions];
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isUploading) addFiles(event.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (isUploading) return;
    const queued = items.filter((item) => item.status === "queued");
    if (queued.length === 0) return;

    setIsUploading(true);
    onUploadingChange?.(true);
    let successCount = 0;
    let failureCount = items.filter((item) => item.status === "invalid").length;

    try {
      for (const item of queued) {
        setItems((current) => current.map((entry) =>
          entry.key === item.key ? { ...entry, status: "uploading", message: undefined } : entry,
        ));
        try {
          await onUpload(item.file);
          successCount += 1;
          setItems((current) => current.map((entry) =>
            entry.key === item.key ? { ...entry, status: "success", message: undefined } : entry,
          ));
        } catch (error) {
          failureCount += 1;
          setItems((current) => current.map((entry) =>
            entry.key === item.key ? { ...entry, status: "failed", message: getFailureMessage(error) } : entry,
          ));
        }
      }
      setFinished(true);
      await onComplete(successCount, failureCount);
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  };

  const completedCount = items.filter((item) => item.status === "success" || item.status === "failed" || item.status === "invalid").length;
  const validCount = items.filter((item) => item.status === "queued").length;
  const successCount = items.filter((item) => item.status === "success").length;
  const failureCount = items.filter((item) => item.status === "failed" || item.status === "invalid").length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(10,24,38,0.62)] p-4 backdrop-blur-md" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="multi-upload-title" className="surface w-full max-w-[620px] overflow-hidden rounded-[20px] border border-white/80 shadow-[0_24px_80px_rgba(9,30,50,0.32)]">
        <header className="flex items-start justify-between gap-4 border-b border-white/55 px-5 py-4">
          <div>
            <h2 id="multi-upload-title" className="m-0 text-[17px] font-[700] text-[#183b59]">{title}</h2>
            <p className="mb-0 mt-1 text-[11px] leading-relaxed text-[#71879a]">{description}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isUploading} aria-label="Close upload dialog" className="grid h-8 w-8 flex-none place-items-center rounded-full border border-white/70 bg-white/55 text-[#58738a] disabled:opacity-50"><X size={16} /></button>
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
              onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false); }}
              onDrop={handleDrop}
              className={`rounded-[15px] border border-dashed px-4 py-7 text-center transition-colors ${isDragging ? "border-[#4a9be2] bg-[rgba(222,241,255,0.8)]" : "border-[rgba(111,157,190,0.4)] bg-[rgba(255,255,255,0.35)]"}`}
            >
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-[14px] border border-white/80 bg-white/65 text-[#2879d1]"><FilePlus2 size={21} /></span>
              <p className="mb-0 mt-3 text-[12px] font-semibold text-[#38566f]">Drop files here, or choose files</p>
              <p className="mb-3 mt-1 text-[10px] text-[#8296a6]">Supported formats only · up to 10 MB per file</p>
              <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="secondary-action min-h-[32px] px-3 text-[10px] disabled:opacity-50">Choose files</button>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="m-0 text-[11px] font-semibold text-[#38566f]">Selected files ({items.length})</h3>
                {!isUploading && !finished && <button type="button" onClick={() => setItems([])} className="text-[10px] font-semibold text-[#71879a] hover:text-[#285c84]">Clear all</button>}
              </div>
              <ul className="m-0 grid list-none gap-2 p-0">
                {items.map((item) => (
                  <li key={item.key} className="flex items-center gap-3 rounded-[11px] border border-white/65 bg-white/45 px-3 py-2">
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-[9px] bg-[rgba(230,241,250,0.75)] text-[#5283aa]"><FilePlus2 size={15} /></span>
                    <span className="min-w-0 flex-1">
                      <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#38566f]" title={item.file.name}>{item.file.name}</strong>
                      <span className="text-[9px] text-[#8296a6]">{formatFileSize(item.file.size)}{item.message ? ` · ${item.message}` : ""}</span>
                    </span>
                    <span className={`flex-none text-[9px] font-semibold ${item.status === "success" ? "text-[#34734b]" : item.status === "failed" || item.status === "invalid" ? "text-[#b2454d]" : "text-[#54738c]"}`} role={item.status === "failed" || item.status === "invalid" ? "status" : undefined}>
                      {item.status === "queued" ? "Ready" : item.status === "uploading" ? <span className="inline-flex items-center gap-1"><LoaderCircle size={12} className="animate-spin" />Uploading</span> : item.status === "success" ? <span className="inline-flex items-center gap-1"><Check size={12} />Uploaded</span> : item.status === "invalid" ? "Invalid" : "Failed"}
                    </span>
                    {!isUploading && !finished && <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.key !== item.key))} aria-label={`Remove ${item.file.name}`} className="grid h-7 w-7 flex-none place-items-center rounded-[8px] text-[#9b6870] hover:bg-[#fff0f1]"><Trash2 size={13} /></button>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isUploading && (
            <div className="mt-4" role="status" aria-live="polite">
              <div className="mb-1 flex justify-between text-[9px] font-semibold text-[#54738c]"><span>Uploading files</span><span>{completedCount} of {items.length}</span></div>
              <div role="progressbar" aria-label="Files uploaded" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={completedCount} className="h-2 overflow-hidden rounded-full bg-[rgba(90,135,170,0.15)]"><div className="h-full rounded-full bg-[#438bd0] transition-[width] duration-300" style={{ width: `${items.length ? completedCount / items.length * 100 : 0}%` }} /></div>
              <p className="mb-0 mt-1 text-[9px] text-[#8296a6]">Each file uploads separately so other files can continue if one fails.</p>
            </div>
          )}

          {finished && (
            <p role="status" className="glass-alert-success mt-4 rounded-[11px] px-3 py-2 text-[10px] font-medium">
              Uploads finished: {successCount} successful, {failureCount} failed.
            </p>
          )}
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-white/55 px-5 py-4">
          <button type="button" onClick={onClose} disabled={isUploading} className="secondary-action min-h-[36px] px-4 text-[10px] disabled:opacity-50">{finished ? "Close" : "Cancel"}</button>
          {!finished && <button type="button" onClick={() => void handleUpload()} disabled={isUploading || validCount === 0} className="primary-action min-h-[36px] px-4 text-[10px] disabled:cursor-not-allowed disabled:opacity-55"><Upload size={14} />{isUploading ? "Uploading..." : `Upload ${validCount} file${validCount === 1 ? "" : "s"}`}</button>}
        </footer>
      </section>
    </div>
  );
}
