import { useEffect, useRef, useState } from "react";
import { Archive, FileText, FileWarning, Headphones, LoaderCircle, Play, Presentation, Table2 } from "lucide-react";
import type * as PDFJs from "pdfjs-dist";
import { getPreviewExtension, readFilePreview, type PreviewContent } from "../../utils/filePreview";
import type { FileResponse } from "../../types/file";

function PdfThumbnail({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let task: PDFJs.PDFDocumentLoadingTask | undefined;
    let renderTask: PDFJs.RenderTask | undefined;
    void Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")])
      .then(async ([pdfjs, worker]) => {
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const response = await fetch(src);
        if (!response.ok) throw new Error("Preview content could not be read.");
        const data = await response.arrayBuffer();
        if (cancelled) return;
        task = pdfjs.getDocument({ data });
        const document = await task.promise;
        if (cancelled) return;
        const page = await document.getPage(1);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const viewport = page.getViewport({ scale: 0.45 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTask = page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport });
        await renderTask.promise;
      }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; renderTask?.cancel(); void task?.destroy(); };
  }, [src]);
  return failed ? <PreviewFallback icon={<FileWarning size={31} />} label="PDF preview unavailable" /> : <canvas ref={canvasRef} aria-label="First page of PDF" className="h-full w-full bg-white object-contain" />;
}

function PreviewFallback({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,#eef6fa,#e7f0f4)] text-[#5280a1]">{icon}<span className="max-w-[90%] truncate text-[9px] font-semibold">{label}</span></div>;
}

export default function PreviewThumbnail({ file, src }: { file: FileResponse; src?: string }) {
  const extension = getPreviewExtension(file.originalFileName);
  const [content, setContent] = useState<PreviewContent | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setContent(null); setFailed(false);
    if (!src || ![".txt", ".csv", ".docx", ".xlsx", ".pptx", ".zip"].includes(extension)) return () => { active = false; };
    void readFilePreview(src, extension).then((value) => { if (active) setContent(value); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [src, extension]);

  if (extension === ".pdf" && src) return <PdfThumbnail src={src} />;
  if (extension === ".mp4" || extension === ".mov" || extension === ".webm") return failed ? <PreviewFallback icon={<FileWarning size={31} />} label="Video thumbnail unavailable" /> : src ? <video src={src} muted playsInline preload="auto" aria-label={`Video frame preview of ${file.originalFileName}`} className="h-full w-full bg-[#172b3d] object-cover" onError={() => setFailed(true)} /> : <PreviewFallback icon={<Play size={31} />} label="Video" />;
  if ([".mp3", ".wav", ".m4a"].includes(extension)) return <PreviewFallback icon={<Headphones size={35} />} label="Audio preview" />;
  if (failed) return <PreviewFallback icon={<FileWarning size={31} />} label="Preview unavailable" />;
  if (!src) return <PreviewFallback icon={<FileText size={31} />} label={`${file.contentType.split("/").pop()?.toLocaleUpperCase() ?? "File"} preview`} />;
  if (!content) return <PreviewFallback icon={<LoaderCircle className="animate-spin" size={28} />} label="Loading preview…" />;
  if (content.kind === "text") return <div className="h-full w-full overflow-hidden bg-white p-3 text-left"><pre className="m-0 whitespace-pre-wrap break-words text-[8px] leading-[1.45] text-[#536b7e]">{content.text.slice(0, 1800)}</pre></div>;
  if (content.kind === "table") return <div className="h-full w-full overflow-hidden bg-white p-2"><div className="overflow-hidden rounded border border-[#e3ebf1]"><table className="w-full border-collapse text-left text-[7px] text-[#536b7e]"><tbody>{content.rows.slice(0, 8).map((row, i) => <tr key={i} className={i === 0 ? "bg-[#eef6fc] font-semibold" : ""}>{row.slice(0, 5).map((cell, j) => <td key={j} className="max-w-[80px] truncate border-b border-r border-[#e8eef3] px-1 py-[3px]">{cell}</td>)}</tr>)}</tbody></table></div></div>;
  if (content.kind === "slide") return <div className="relative h-full w-full overflow-hidden bg-white shadow-inner" aria-label="First PowerPoint slide text preview">{content.shapes.slice(0, 15).map((shape, index) => <span key={index} className="absolute overflow-hidden text-ellipsis text-[6px] leading-tight text-[#28445b]" style={{ left: `${shape.x / content.width * 100}%`, top: `${shape.y / content.height * 100}%`, width: `${shape.width / content.width * 100}%`, height: `${shape.height / content.height * 100}%` }}>{shape.text}</span>)}{content.shapes.length === 0 && <PreviewFallback icon={<Presentation size={31} />} label="Slide text unavailable" />}</div>;
  if (content.kind === "archive") return <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,#fff6e9,#f8ead7)] text-[#a66a23]"><Archive size={36} strokeWidth={1.5} /><span className="rounded-full bg-white/70 px-2 py-1 text-[8px] font-bold">{content.entries.length} entries</span></div>;
  return <PreviewFallback icon={<Table2 size={31} />} label="File preview" />;
}

