import { useEffect, useRef, useState } from "react";
import {
  Archive,
  FileText,
  FileWarning,
  Headphones,
  LoaderCircle,
  Play,
  Presentation,
  Table2,
} from "lucide-react";
import type * as PDFJs from "pdfjs-dist";
import { getFileCategory, getFileExtension } from "@/features/files/constants/fileSupport";
import { readFilePreview, type PreviewContent } from "@/features/files/utils/filePreview";
import type { FileResponse } from "@/features/files/types/file";

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
        renderTask = page.render({
          canvas,
          canvasContext: canvas.getContext("2d")!,
          viewport,
        });
        await renderTask.promise;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      renderTask?.cancel();
      void task?.destroy();
    };
  }, [src]);
  return failed ? (
    <PreviewFallback icon={<FileWarning size={31} />} label="PDF preview unavailable" />
  ) : (
    <canvas
      ref={canvasRef}
      aria-label="First page of PDF"
      className="h-full w-full bg-white object-contain"
    />
  );
}

function PreviewFallback({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,rgba(235,244,252,0.65),rgba(225,236,246,0.50))] text-[#467498] backdrop-blur-md">
      {icon}
      <span className="max-w-[90%] truncate text-[9px] font-semibold">{label}</span>
    </div>
  );
}

export function PreviewThumbnail({ file, src }: { file: FileResponse; src?: string }) {
  const extension = getFileExtension(file.originalFileName);
  const fileCategory = getFileCategory(file.originalFileName);
  const hasRichPreview =
    (fileCategory === "Documents" && extension !== ".pdf") || fileCategory === "Archives";
  const [content, setContent] = useState<PreviewContent | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setContent(null);
    setFailed(false);
    if (!src || !hasRichPreview)
      return () => {
        active = false;
      };
    void readFilePreview(src, extension)
      .then((value) => {
        if (active) setContent(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [src, extension, hasRichPreview]);

  if (extension === ".pdf" && src) return <PdfThumbnail src={src} />;
  if (fileCategory === "Videos")
    return failed ? (
      <PreviewFallback icon={<FileWarning size={31} />} label="Video thumbnail unavailable" />
    ) : src ? (
      <video
        src={src}
        muted
        playsInline
        preload="auto"
        aria-label={`Video frame preview of ${file.originalFileName}`}
        className="h-full w-full bg-[#172b3d] object-cover"
        onError={() => setFailed(true)}
      />
    ) : (
      <PreviewFallback icon={<Play size={31} />} label="Video" />
    );
  if (fileCategory === "Audio")
    return <PreviewFallback icon={<Headphones size={35} />} label="Audio preview" />;
  if (failed)
    return <PreviewFallback icon={<FileWarning size={31} />} label="Preview unavailable" />;
  if (!src)
    return (
      <PreviewFallback
        icon={<FileText size={31} />}
        label={`${file.contentType.split("/").pop()?.toLocaleUpperCase() ?? "File"} preview`}
      />
    );
  if (!content)
    return (
      <PreviewFallback
        icon={<LoaderCircle className="animate-spin" size={28} />}
        label="Loading previewâ€¦"
      />
    );
  if (content.kind === "text")
    return (
      <div className="h-full w-full overflow-hidden bg-[rgba(255,255,255,0.75)] p-3 text-left backdrop-blur-md">
        <pre className="m-0 whitespace-pre-wrap break-words text-[8px] leading-[1.45] text-[#536b7e]">
          {content.text.slice(0, 1800)}
        </pre>
      </div>
    );
  if (content.kind === "table")
    return (
      <div className="h-full w-full overflow-hidden bg-[rgba(255,255,255,0.75)] p-2 backdrop-blur-md">
        <div className="overflow-hidden rounded border border-white/60 bg-[rgba(255,255,255,0.6)]">
          <table className="w-full border-collapse text-left text-[7px] text-[#536b7e]">
            <tbody>
              {content.rows.slice(0, 8).map((row, i) => (
                <tr
                  key={i}
                  className={
                    i === 0 ? "bg-[rgba(235,244,252,0.85)] font-semibold text-[#183a57]" : ""
                  }
                >
                  {row.slice(0, 5).map((cell, j) => (
                    <td
                      key={j}
                      className="max-w-[80px] truncate border-b border-r border-[#e8eef3] px-1 py-[3px]"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  if (content.kind === "slide")
    return (
      <div
        className="relative h-full w-full overflow-hidden bg-[rgba(255,255,255,0.85)] shadow-inner backdrop-blur-md"
        aria-label="First PowerPoint slide text preview"
      >
        {content.shapes.slice(0, 15).map((shape, index) => (
          <span
            key={index}
            className="absolute overflow-hidden text-ellipsis text-[6px] leading-tight text-[#28445b]"
            style={{
              left: `${(shape.x / content.width) * 100}%`,
              top: `${(shape.y / content.height) * 100}%`,
              width: `${(shape.width / content.width) * 100}%`,
              height: `${(shape.height / content.height) * 100}%`,
            }}
          >
            {shape.text}
          </span>
        ))}
        {content.shapes.length === 0 && (
          <PreviewFallback icon={<Presentation size={31} />} label="Slide text unavailable" />
        )}
      </div>
    );
  if (content.kind === "archive")
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,rgba(255,248,238,0.75),rgba(250,238,222,0.65))] text-[#a66a23] backdrop-blur-md">
        <Archive size={36} strokeWidth={1.5} />
        <span className="rounded-full border border-white/70 bg-white/80 px-2 py-1 text-[8px] font-bold shadow-sm">
          {content.entries.length} entries
        </span>
      </div>
    );
  return <PreviewFallback icon={<Table2 size={31} />} label="File preview" />;
}
