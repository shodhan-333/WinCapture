import { useEffect } from "react";
import { FileWarning, X } from "lucide-react";
import type { FileResponse } from "../../types/file";
import { getFileExtension } from "../../constants/fileSupport";

export default function ImagePreviewModal({ file, src, onClose }: { file: FileResponse; src?: string; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  const extension = getFileExtension(file.originalFileName);
  const isImage = [".jpg", ".jpeg", ".png", ".webp"].includes(extension);
  const isVideo = [".mp4", ".mov", ".webm"].includes(extension);
  const isAudio = [".mp3", ".wav", ".m4a"].includes(extension);
  const isPdf = extension === ".pdf";
  const isText = [".txt", ".csv"].includes(extension);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-5" role="dialog" aria-modal="true" aria-label={`Preview ${file.originalFileName}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <button type="button" onClick={onClose} aria-label="Close file preview" className="absolute right-5 top-5 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X aria-hidden="true" /></button>
    <h2 className="absolute left-5 top-5 max-w-[75vw] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-white" title={file.originalFileName}>{file.originalFileName}</h2>
    {!src ? <div className="flex flex-col items-center gap-3 text-white" role="status"><FileWarning aria-hidden="true" size={30} /><p>Preview unavailable</p><p>You can download the file instead.</p></div>
      : isImage ? <img src={src} alt={file.originalFileName} className="max-h-[90vh] max-w-[95vw] object-contain" />
      : isVideo ? <video src={src} controls playsInline className="max-h-[85vh] max-w-[95vw]" aria-label={file.originalFileName}>Video preview is not supported by this browser.</video>
      : isAudio ? <audio src={src} controls aria-label={file.originalFileName}>Audio preview is not supported by this browser.</audio>
      : isPdf ? <iframe src={src} title={`PDF preview: ${file.originalFileName}`} className="h-[85vh] w-[min(1000px,95vw)] rounded bg-white" />
      : isText ? <iframe src={src} title={`Text preview: ${file.originalFileName}`} sandbox="" className="h-[85vh] w-[min(1000px,95vw)] rounded bg-white" />
      : <div className="flex flex-col items-center gap-3 text-white"><FileWarning aria-hidden="true" size={30} /><p>Preview is not available for this file type.</p></div>}
  </div>;
}
