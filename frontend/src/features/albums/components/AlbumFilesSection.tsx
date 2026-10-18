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
          <p className="dashboard-panel-kicker">Collection content</p>

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
            className={`secondary-action min-h-[32px] px-3 py-1 text-[9px] ${
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
        <button type="button" onClick={onStartSelection} className="secondary-action mb-4">
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
                className="primary-action disabled:opacity-50"
              >
                Remove from album
              </button>
              <button
                type="button"
                disabled={!selectedIds.size || bulkPending}
                onClick={() => onBulkAction("delete")}
                className="danger-gradient-action inline-flex min-h-[36px] items-center rounded-[10px] px-3 text-[10px] font-semibold text-white disabled:opacity-50"
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
          <section className="surface flex min-h-[300px] flex-col items-center justify-center rounded-[18px] px-[22px] py-[38px] text-center">
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
              <button type="button" onClick={onUploadFirstFile} className="primary-action">
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
