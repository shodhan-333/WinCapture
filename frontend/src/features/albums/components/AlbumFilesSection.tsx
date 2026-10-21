import { Upload } from "lucide-react";
import { BulkSelectionToolbar, FileCardGrid } from "@/features/files";
import { FILE_CATEGORY_FILTERS } from "@/features/files/constants/fileSupport";
import type { FileCategoryFilter } from "@/features/files/constants/fileSupport";
import type { FileResponse } from "@/features/files/types/file";
import { Pagination } from "@/shared/components/ui/Pagination";

interface AlbumFilesSectionProps {
  files: FileResponse[];
  previewUrls: Record<number, string>;
  favoritePendingIds: Set<number>;
  loadPreview: (file: FileResponse) => Promise<string>;
  canManageAlbum: boolean;
  categoryFilter: FileCategoryFilter;
  currentPage: number;
  pageCount: number;
  totalFiles: number;
  selectionMode: boolean;
  selectedIds: Set<number>;
  bulkPending: boolean;
  onCategoryChange: (category: FileCategoryFilter) => void;
  onStartSelection: () => void;
  onCancelSelection: () => void;
  onSelectAll: (ids: number[]) => void;
  onBulkAction: (action: "remove" | "delete") => void;
  onFavoriteToggle: (file: FileResponse) => void;
  onReplace: (file: FileResponse) => void;
  onDetails: (file: FileResponse) => void;
  onPreview: (file: FileResponse, source?: string) => void;
  onDownload: (file: FileResponse) => void;
  onDelete: (file: FileResponse) => void;
  onSelectionToggle: (file: FileResponse) => void;
  onUploadFirstFile: () => void;
  onPageChange: (page: number) => void;
}

// Render album category filters, file selection actions, cards, and pagination.
export function AlbumFilesSection({
  files,
  previewUrls,
  favoritePendingIds,
  loadPreview,
  canManageAlbum,
  categoryFilter,
  currentPage,
  pageCount,
  totalFiles,
  selectionMode,
  selectedIds,
  bulkPending,
  onCategoryChange,
  onStartSelection,
  onCancelSelection,
  onSelectAll,
  onBulkAction,
  onFavoriteToggle,
  onReplace,
  onDetails,
  onPreview,
  onDownload,
  onDelete,
  onSelectionToggle,
  onUploadFirstFile,
  onPageChange,
}: AlbumFilesSectionProps) {
  return (
    <section className="min-w-0">
      <div className="mb-[15px] flex items-end justify-between gap-[18px]">
        <div>
          <p className="[margin:0] [display:inline-flex] [align-items:center] [gap:7px] [color:#6f8ba3] [font-size:11px] [line-height:1.2] [font-weight:700] [letter-spacing:0.11em] [text-transform:uppercase]">Collection content</p>

          <h2 className="mt-1 mb-0 text-[16px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
            Files
          </h2>
        </div>
      </div>

      <div
        className="mb-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter album files by category"
      >
        {FILE_CATEGORY_FILTERS.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={categoryFilter === category}
            onClick={() => onCategoryChange(category)}
            className={`[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#245277] [border:1px_solid_rgba(255,_255,_255,_0.58)] [background:rgba(255,_255,_255,_0.48)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.9),_0_3px_12px_rgba(24,_52,_78,_0.03)] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[color:#164063] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.68)] [&:hover:not(:disabled)]:[border-color:rgba(255,_255,_255,_0.88)] [&:hover:not(:disabled)]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.95),_0_5px_16px_rgba(24,_52,_78,_0.05)] min-h-[32px] px-3 py-1 text-[9px] ${
              categoryFilter === category
                ? "!border-white/80 !bg-white/70 !text-[#145a99] shadow-[0_3px_12px_rgba(20,54,84,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]"
                : ""
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {canManageAlbum && !selectionMode && files.length > 0 && (
        <button type="button" onClick={onStartSelection} className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#245277] [border:1px_solid_rgba(255,_255,_255,_0.58)] [background:rgba(255,_255,_255,_0.48)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.9),_0_3px_12px_rgba(24,_52,_78,_0.03)] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[color:#164063] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.68)] [&:hover:not(:disabled)]:[border-color:rgba(255,_255,_255,_0.88)] [&:hover:not(:disabled)]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.95),_0_5px_16px_rgba(24,_52,_78,_0.05)] mb-4">
          Select files
        </button>
      )}
      {canManageAlbum && selectionMode && (
        <BulkSelectionToolbar
          selectedCount={selectedIds.size}
          visibleCount={files.length}
          disabled={bulkPending}
          onSelectAll={() =>
            onSelectAll(files.filter((file) => file.canManage).map((file) => file.id))
          }
          onCancel={onCancelSelection}
          actions={
            <>
              <button
                type="button"
                disabled={!selectedIds.size || bulkPending}
                onClick={() => onBulkAction("remove")}
                className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)] disabled:opacity-50"
              >
                Remove from album
              </button>
              <button
                type="button"
                disabled={!selectedIds.size || bulkPending}
                onClick={() => onBulkAction("delete")}
                className="[color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.32)] [background:linear-gradient(135deg,_rgba(230,_58,_72,_0.88)_0%,_rgba(198,_28,_42,_0.95)_100%)] [box-shadow:0_8px_20px_rgba(200,_32,_48,_0.18),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.38)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(200,_32,_48,_0.24),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.48)] inline-flex min-h-[36px] items-center rounded-[10px] px-3 text-[10px] font-semibold text-white disabled:opacity-50"
              >
                Delete permanently
              </button>
            </>
          }
        />
      )}

      <FileCardGrid
        files={files}
        previewUrls={previewUrls}
        favoritePendingIds={favoritePendingIds}
        loadPreview={loadPreview}
        canManage={canManageAlbum}
        onFavoriteToggle={onFavoriteToggle}
        onReplace={onReplace}
        onDetails={onDetails}
        onPreview={onPreview}
        onDownload={onDownload}
        onDelete={onDelete}
        selectionMode={selectionMode && canManageAlbum}
        selectionDisabled={bulkPending}
        selectedIds={selectedIds}
        selectionEligible={(file) => file.canManage}
        onSelectionToggle={onSelectionToggle}
        empty={
          <section className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] flex min-h-[300px] flex-col items-center justify-center rounded-[18px] px-[22px] py-[38px] text-center">
            <span className="grid h-[62px] w-[62px] place-items-center rounded-[19px] bg-[#e7f3ff] text-[#287dd7] shadow-[inset_0_1px_rgba(255,255,255,0.72),0_7px_18px_rgba(45,111,176,0.06)]">
              <Upload aria-hidden="true" size={25} strokeWidth={1.5} />
            </span>

            <h3 className="mt-4 mb-0 text-[15px] font-[650] text-[#29445d]">
              {totalFiles === 0
                ? "No files in this album"
                : `No ${categoryFilter.toLocaleLowerCase()} found`}
            </h3>

            <p className="mt-[7px] mb-[18px] max-w-[390px] text-[10px] leading-[1.6] text-[#8497a7]">
              {totalFiles === 0
                ? "Add images, documents, videos, audio files, or ZIP archives to start building this collection."
                : `There are no ${categoryFilter.toLocaleLowerCase()} in this album. Try another category or select All.`}
            </p>

            {canManageAlbum && totalFiles === 0 && (
              <button type="button" onClick={onUploadFirstFile} className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)]">
                <Upload aria-hidden="true" size={16} strokeWidth={1.8} />
                Add your first file
              </button>
            )}
          </section>
        }
      />

      {totalFiles > 0 && (
        <Pagination currentPage={currentPage} pageCount={pageCount} onPageChange={onPageChange} />
      )}
    </section>
  );
}
