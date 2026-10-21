import { useEffect, useState } from "react";
import { FileWarning, Headphones, LoaderCircle, X } from "lucide-react";
import type { FileResponse } from "@/features/files/types/file";
import { getFileCategory, getFileExtension } from "@/features/files/constants/fileSupport";
import { readFilePreview, type PreviewContent } from "@/features/files/utils/filePreview";

// Render delimited or workbook rows in a scrollable preview table.
function ContentTable({ rows }: { rows: string[][] }) {
  if (!rows.length) return <p className="p-5 text-sm text-[#7890a3]">No tabular content found.</p>;
  return (
    <div className="h-full overflow-auto">
      <table className="min-w-full border-collapse text-left text-xs text-[#38566e]">
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i === 0 ? "bg-[rgba(235,244,252,0.85)] font-semibold text-[#183a57]" : ""}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="max-w-[360px] whitespace-pre-wrap border-b border-r border-[#e5edf3] px-3 py-2 align-top"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Place extracted slide text using its original document coordinates.
function SlidePreview({ content }: { content: Extract<PreviewContent, { kind: "slide" }> }) {
  return (
    <div
      className="relative mx-auto aspect-video w-full max-w-[1100px] overflow-hidden rounded-[16px] border border-white/50 bg-[rgba(255,255,255,0.92)] shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-md"
      aria-label="First slide preview"
    >
      {content.shapes.map((shape, index) => (
        <div
          key={index}
          className="absolute overflow-hidden whitespace-pre-wrap break-words px-1 text-[clamp(8px,1.1vw,18px)] leading-[1.15] text-[#233f58]"
          style={{
            position: "absolute",
            left: `${(shape.x / content.width) * 100}%`,
            top: `${(shape.y / content.height) * 100}%`,
            width: `${(shape.width / content.width) * 100}%`,
            height: `${(shape.height / content.height) * 100}%`,
          }}
        >
          {shape.text}
        </div>
      ))}
    </div>
  );
}

// List archive entry names and sizes without extracting the archive to disk.
function ArchiveListing({
  entries,
}: {
  entries: Extract<PreviewContent, { kind: "archive" }>["entries"];
}) {
  return (
    <div className="max-h-[78vh] w-full max-w-[900px] overflow-auto rounded-[16px] border border-white/60 bg-[rgba(255,255,255,0.88)] p-5 text-[#24425d] shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <h3 className="mb-3 mt-0 text-sm font-semibold">
        Archive contents{" "}
        <span className="font-normal text-[#8295a5]">
          ({entries.length}
          {entries.length === 2000 ? "+" : ""} entries)
        </span>
      </h3>
      <ul className="m-0 list-none p-0">
        {entries.map((entry, i) => {
          const extension =
            entry.name.split("/").pop()?.split(".").pop()?.toLocaleUpperCase() ||
            (entry.directory ? "FOLDER" : "FILE");
          const sizeLabel =
            entry.size === undefined
              ? "Size unavailable"
              : entry.size < 1024
                ? `${entry.size} B`
                : `${(entry.size / 1024).toFixed(1)} KB`;
          return (
            <li
              key={`${entry.name}-${i}`}
              className="flex items-center justify-between gap-4 border-t border-[rgba(200,220,235,0.5)] py-2 text-xs"
            >
              <span className="min-w-0 truncate">
                <span className="mr-2 rounded border border-white/60 bg-[rgba(235,244,252,0.85)] px-1.5 py-1 text-[9px] font-bold text-[#4a6e8f]">
                  {extension}
                </span>
                {entry.name}
              </span>
              <span className="flex-none text-[#8295a5]">
                {entry.directory ? "Folder" : sizeLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Render native media or parsed document previews and ignore stale async preview results.
export function FilePreviewModal({
  file,
  src,
  onClose,
}: {
  file: FileResponse;
  src?: string;
  onClose: () => void;
}) {
  const extension = getFileExtension(file.originalFileName);
  const fileCategory = getFileCategory(file.originalFileName);
  const isImage = fileCategory === "Images";
  const isVideo = fileCategory === "Videos";
  const isAudio = fileCategory === "Audio";
  const isPdf = extension === ".pdf";
  const [content, setContent] = useState<PreviewContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  useEffect(() => {
    // Close the active preview when the user presses Escape.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  // Parse document previews only; native image, media, and PDF elements render their own content.
  useEffect(() => {
    let active = true;
    setContent(null);
    setError(null);
    setMediaError(false);
    if (!src || isImage || isVideo || isAudio || isPdf)
      return () => {
        active = false;
      };
    void readFilePreview(src, extension)
      .then((result) => {
        if (active) setContent(result);
      })
      .catch((caughtError) => {
        if (active)
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "This file could not be previewed. It may be damaged or use an unsupported feature.",
          );
      });
    return () => {
      active = false;
    };
  }, [src, extension, isImage, isVideo, isAudio, isPdf]);
  // Display media duration in the compact minutes-and-seconds format.
  const formatDuration = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,24,38,0.76)] p-5 backdrop-blur-[24px] saturate-[180%]"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${file.originalFileName}`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default border-0 bg-transparent"
        aria-label="Close file preview backdrop"
        onClick={onClose}
      />
      <h2
        className="pointer-events-none absolute left-5 top-5 z-[1] max-w-[75vw] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-white"
        title={file.originalFileName}
      >
        {file.originalFileName}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close file preview"
        className="absolute right-5 top-4 z-[1] rounded-full border border-white/30 bg-white/15 p-2.5 text-white backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_rgba(255,255,255,0.4)] transition-all hover:bg-white/30 hover:border-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        <X aria-hidden="true" />
      </button>
      {!src ? (
        <div className="flex flex-col items-center gap-3 text-white" role="status">
          <FileWarning aria-hidden="true" size={30} />
          <p>Preview unavailable</p>
          <p>You can download the file instead.</p>
        </div>
      ) : isImage ? (
        <img
          src={src}
          alt={file.originalFileName}
          className="max-h-[88vh] max-w-[95vw] object-contain"
        />
      ) : isVideo ? (
        <div className="flex flex-col items-center gap-2">
          {mediaError ? (
            <p role="status" className="text-sm text-white">
              This video could not be played. The codec may not be supported by this browser; you
              can download the file instead.
            </p>
          ) : (
            <video
              src={src}
              controls
              playsInline
              preload="metadata"
              className="max-h-[84vh] max-w-[95vw] rounded-lg"
              aria-label={`Video preview: ${file.originalFileName}`}
              onError={() => setMediaError(true)}
            >
              Video playback is not supported by this browser.
            </video>
          )}
        </div>
      ) : isAudio ? (
        <div className="flex w-full max-w-[560px] flex-col items-center gap-5 rounded-[24px] border border-white/30 bg-[rgba(255,255,255,0.18)] px-8 py-10 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.4)] backdrop-blur-2xl">
          <span className="grid h-20 w-20 place-items-center rounded-[24px] bg-white/15 backdrop-blur-md">
            <Headphones aria-hidden="true" size={38} />
          </span>
          <p className="m-0 text-base font-semibold">{file.originalFileName}</p>
          <p className="m-0 text-xs text-white/75">Audio preview</p>
          {mediaError ? (
            <p role="status" className="m-0 text-sm">
              Audio could not be played in this browser.
            </p>
          ) : (
            <audio
              src={src}
              controls
              preload="metadata"
              aria-label={`Audio preview: ${file.originalFileName}`}
              onError={() => setMediaError(true)}
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
              className="w-full"
            />
          )}
          <p className="m-0 text-xs text-white/70">
            {duration !== null && Number.isFinite(duration)
              ? `Duration ${formatDuration(duration)}`
              : "Duration loads when playback is ready"}
          </p>
        </div>
      ) : isPdf ? (
        <iframe
          src={src}
          title={`PDF preview: ${file.originalFileName}`}
          className="h-[84vh] w-[min(1050px,95vw)] rounded-[16px] border border-white/40 bg-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        />
      ) : error ? (
        <div
          className="flex max-w-[560px] flex-col items-center gap-3 text-center text-white"
          role="alert"
        >
          <FileWarning aria-hidden="true" size={30} />
          <p>{error}</p>
        </div>
      ) : !content ? (
        <div role="status" className="flex items-center gap-3 text-white">
          <LoaderCircle className="animate-spin" />
          Reading file previewâ€¦
        </div>
      ) : content.kind === "text" ? (
        <pre className="max-h-[84vh] w-[min(1050px,95vw)] overflow-auto whitespace-pre-wrap break-words rounded-[16px] border border-white/60 bg-[rgba(255,255,255,0.90)] p-6 text-left text-sm leading-relaxed text-[#1d3d5a] shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          {content.text || "This file is empty."}
        </pre>
      ) : content.kind === "table" ? (
        <div className="h-[84vh] w-[min(1050px,95vw)] overflow-auto rounded-[16px] border border-white/60 bg-[rgba(255,255,255,0.90)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          {content.sheetName && (
            <h3 className="px-3 py-2 text-sm font-semibold text-[#1d3d5a]">{content.sheetName}</h3>
          )}
          <ContentTable rows={content.rows} />
        </div>
      ) : content.kind === "slide" ? (
        <div className="w-[min(1050px,95vw)]">
          <SlidePreview content={content} />
          {content.shapes.length === 0 && (
            <p className="text-center text-white">This slide has no extractable text content.</p>
          )}
          <p className="mt-2 text-center text-xs text-white/75">Slide 1 text preview</p>
        </div>
      ) : content.kind === "archive" ? (
        <ArchiveListing entries={content.entries} />
      ) : null}
    </div>
  );
}
