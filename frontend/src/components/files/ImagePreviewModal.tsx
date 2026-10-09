import { useEffect } from "react";
import { X } from "lucide-react";
import type { FileResponse } from "../../types/file";

export default function ImagePreviewModal({ file, src, onClose }: { file: FileResponse; src?: string; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-5" role="dialog" aria-modal="true" aria-label={`Preview ${file.originalFileName}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <button type="button" onClick={onClose} aria-label="Close image preview" className="absolute right-5 top-5 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"><X aria-hidden="true" /></button>
    {src ? <img src={src} alt={file.originalFileName} className="max-h-[90vh] max-w-[95vw] object-contain" /> : <p className="text-white">Preview unavailable</p>}
  </div>;
}
