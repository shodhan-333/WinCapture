import { ArrowRight, Images, Settings2, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Pagination } from "@/shared/components/ui/Pagination";
import { SearchField } from "@/shared/components/ui/SearchField";
import { formatDate } from "@/shared/utils/formatters";
import type { AlbumResponse } from "@/features/albums/types/album";

const dashboardPanelClass = "surface relative isolate min-w-0 overflow-hidden rounded-[20px]";
const dashboardPanelHeaderClass =
  "flex min-h-[68px] items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.45)] bg-[rgba(255,255,255,0.32)] px-6 backdrop-blur-[20px] max-[520px]:min-h-[62px] max-[520px]:px-4";
const dashboardListRowClass =
  "group/row flex min-h-[66px] w-full cursor-pointer items-center gap-3 border-b border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.18)] px-5 py-2 text-left text-inherit transition-[background,box-shadow] duration-200 hover:bg-[rgba(255,255,255,0.48)] hover:shadow-[inset_3px_0_0_rgba(30,120,214,0.55)] last:border-b-0 focus-visible:bg-[rgba(255,255,255,0.52)] max-[520px]:min-h-[60px] max-[520px]:px-4";
const dashboardIconClass =
  "grid h-[38px] w-[38px] flex-none place-items-center overflow-hidden rounded-[12px] border border-white/80 bg-[rgba(255,255,255,0.55)] text-[var(--accent)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(26,54,80,0.05)] backdrop-blur-[16px] max-[520px]:h-[34px] max-[520px]:w-[34px] max-[520px]:rounded-[11px]";
const dashboardViewAllClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/75 bg-white/45 px-3 py-1.5 text-[12px] font-semibold text-[#156ecb] shadow-sm backdrop-blur-md transition-colors hover:bg-white/75 hover:text-[#0b5fbf] max-[520px]:px-2.5 max-[520px]:text-[11px]";

interface DashboardAlbumsPanelProps {
  albums: AlbumResponse[];
  coverUrls: Record<number, string | undefined>;
  contentScope: "mine" | "all";
  canViewAllContent: boolean;
  albumCount: number;
  search: string;
  page: number;
  pageCount: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onDelete: (album: AlbumResponse) => void;
}

export function DashboardAlbumsPanel({
  albums,
  coverUrls,
  contentScope,
  canViewAllContent,
  albumCount,
  search,
  page,
  pageCount,
  onSearchChange,
  onPageChange,
  onDelete,
}: DashboardAlbumsPanelProps) {
  const navigate = useNavigate();
  const allContent = contentScope === "all" && canViewAllContent;

  return (
    <section className={dashboardPanelClass}>
      <div className={dashboardPanelHeaderClass}>
        <div>
          <p className="dashboard-panel-kicker">Collections</p>
          <h2 className="mb-0 mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#153756] max-[520px]:text-[16px]">
            {contentScope === "all" ? "All Albums" : "My Albums"}
          </h2>
        </div>
        {allContent ? (
          <span className="inline-flex h-[27px] min-w-7 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.50)] px-2 text-[9px] font-semibold text-[#54738c] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
            {albumCount}
          </span>
        ) : (
          <Link to="/albums" className={dashboardViewAllClass}>
            View all
            <ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />
          </Link>
        )}
      </div>

      {allContent && (
        <div className="border-b border-[rgba(255,255,255,0.4)] p-3">
          <SearchField
            value={search}
            onChange={onSearchChange}
            placeholder="Search albums..."
            ariaLabel="Search all albums"
            className="flex min-h-[36px] items-center gap-2 rounded-[10px] border border-white/70 bg-[rgba(255,255,255,0.48)] px-2.5 text-[#71889c]"
            inputClassName="w-full min-w-0 border-0 bg-transparent text-[10px] text-[#24445d] outline-none placeholder:text-[#98aab7]"
            clearLabel="Clear album search"
            onClear={() => onSearchChange("")}
          />
        </div>
      )}

      <div className="flex flex-col">
        {albums.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center gap-4 bg-white/20 p-7 backdrop-blur-md max-[520px]:flex-wrap max-[520px]:p-5">
            <span className="grid h-[54px] w-[54px] flex-none place-items-center rounded-[18px] border border-white/80 bg-white/50 text-[#32678d] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_rgba(26,54,80,0.05)] backdrop-blur-md">
              <Images aria-hidden="true" size={21} strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <strong className="block text-[14px] font-semibold tracking-[-0.01em] text-[#334f68]">
                {contentScope === "all" ? "No albums found" : "No albums yet"}
              </strong>
              <p className="mb-0 mt-1.5 max-w-[300px] text-[12px] leading-[1.6] text-[#8498a8]">
                {contentScope === "all"
                  ? "No users have created an album yet."
                  : "Create your first album to start organizing your files."}
              </p>
            </div>
            <Link to="/albums" className="secondary-action compact-action">
              Open albums
            </Link>
          </div>
        ) : (
          albums.map((album) => (
            <div key={album.id} className={dashboardListRowClass}>
              <span className={`${dashboardIconClass} relative bg-[#e8f2ff] text-[#287bd7]`}>
                {coverUrls[album.id] ? (
                  <img
                    src={coverUrls[album.id]}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/row:scale-105"
                  />
                ) : (
                  <Images aria-hidden="true" size={18} strokeWidth={1.7} />
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!allContent) navigate(`/albums/${album.id}`);
                }}
                className="grid min-w-0 flex-1 gap-1 text-left"
              >
                <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-[#26445f] max-[520px]:text-[12px]">
                  {album.albumName}
                </strong>
                <small className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#7c91a2] max-[520px]:text-[10px]">
                  {contentScope === "all"
                    ? `Owner: ${album.ownerName} (#${album.ownerId})`
                    : `Owner: ${album.ownerName}`}
                </small>
              </button>
              <span className="flex-none text-[11px] text-[#8299aa] max-[760px]:hidden">
                {formatDate(album.createdAt)}
              </span>
              {allContent ? (
                <div className="flex flex-none items-center gap-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/albums/${album.id}`)}
                    className="secondary-action compact-action inline-flex !min-h-[30px] !cursor-pointer items-center gap-1 !rounded-[8px] !px-2 text-[9px] font-semibold !text-[#2b72bd] hover:!border-[rgba(117,181,232,0.62)] hover:!bg-[linear-gradient(135deg,rgba(226,243,255,0.92),rgba(203,229,250,0.88))] hover:!text-[#1f659f]"
                    aria-label={`Manage album ${album.albumName}`}
                  >
                    <Settings2 aria-hidden="true" size={13} /> Manage
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(album)}
                    className="secondary-action grid h-[30px] w-[30px] !cursor-pointer place-items-center !rounded-[8px] !p-0 !text-[#6b8295] hover:!border-[rgba(240,160,160,0.6)] hover:!bg-[rgba(255,235,235,0.85)] hover:!text-[#b4232d]"
                    aria-label={`Delete album ${album.albumName}`}
                    title="Delete album"
                  >
                    <Trash2 aria-hidden="true" size={13} />
                  </button>
                </div>
              ) : (
                <ArrowRight aria-hidden="true" className="flex-none text-[#9cafbd]" size={15} />
              )}
            </div>
          ))
        )}
      </div>
      {allContent && albumCount > 0 && (
        <Pagination currentPage={page} pageCount={pageCount} onPageChange={onPageChange} />
      )}
    </section>
  );
}
