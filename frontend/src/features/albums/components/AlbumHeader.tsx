import type { ChangeEvent, RefObject } from "react";
import { CalendarDays, Edit3, Images, Save, Trash2, Upload, UserPlus } from "lucide-react";
import { SUPPORTED_FILE_ACCEPT } from "@/features/files/constants/fileSupport";
import type { AlbumResponse } from "@/features/albums/types/album";
import type { FileResponse } from "@/features/files/types/file";
import { formatDate } from "@/shared/utils/formatters";

interface AlbumHeaderProps {
  album: AlbumResponse;
  totalFiles: number;
  albumCoverPreview?: FileResponse;
  coverUrl?: string;
  canManageAlbum: boolean;
  editingName: boolean;
  albumNameDraft: string;
  uploading: boolean;
  deletingAlbum: boolean;
  albumNameInputRef: RefObject<HTMLInputElement | null>;
  replaceInputRef: RefObject<HTMLInputElement | null>;
  onNameDraftChange: (name: string) => void;
  onSaveName: () => void;
  onCancelEditing: () => void;
  onEditName: () => void;
  onUpload: () => void;
  onDelete: () => void;
  onReplaceChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function AlbumHeader({
  album,
  totalFiles,
  albumCoverPreview,
  coverUrl,
  canManageAlbum,
  editingName,
  albumNameDraft,
  uploading,
  deletingAlbum,
  albumNameInputRef,
  replaceInputRef,
  onNameDraftChange,
  onSaveName,
  onCancelEditing,
  onEditName,
  onUpload,
  onDelete,
  onReplaceChange,
}: AlbumHeaderProps) {
  return (
    <section className="surface relative flex items-center gap-3 overflow-hidden rounded-[16px] p-4 max-[760px]:flex-wrap max-[760px]:p-3">
      <div className="relative grid h-[64px] w-[78px] flex-none place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_35%),linear-gradient(145deg,rgba(215,238,255,0.7)_0%,rgba(180,218,250,0.5)_49%,rgba(215,235,250,0.65)_100%)] max-[520px]:h-[54px] max-[520px]:w-[66px]">
        {albumCoverPreview ? (
          <img
            src={coverUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <span className="absolute right-[-45px] top-[-68px] h-[115px] w-[115px] rounded-full bg-[rgba(75,158,237,0.24)]" />
            <span className="absolute bottom-[-52px] left-[-36px] h-[90px] w-[90px] rounded-full bg-[rgba(255,255,255,0.36)]" />

            <span className="relative z-[1] grid h-12 w-12 place-items-center rounded-[14px] border border-white/80 bg-white/55 text-[var(--accent)] shadow-[0_8px_20px_rgba(26,54,80,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md max-[520px]:h-[39px] max-[520px]:w-[39px] max-[520px]:rounded-xl">
              <Images aria-hidden="true" size={31} strokeWidth={1.45} />
            </span>
          </>
        )}
      </div>

      <div className="min-w-0 flex-1 basis-0 max-[760px]:basis-[calc(100%-112px)] max-[520px]:basis-[calc(100%-92px)]">
        <div className="page-kicker">
          <span className="page-kicker-dot" />
          Album collection
        </div>

        {editingName && canManageAlbum ? (
          <div className="mt-[6px] flex max-w-[650px] items-center gap-[7px] max-[760px]:flex-wrap">
            <label htmlFor="album-name" className="sr-only">
              Album name
            </label>

            <input
              ref={albumNameInputRef}
              id="album-name"
              value={albumNameDraft}
              onChange={(event) => onNameDraftChange(event.target.value)}
              className="field min-w-0 flex-1 max-[760px]:w-full max-[760px]:basis-full"
              maxLength={200}
            />

            <button type="button" onClick={onSaveName} className="primary-action compact-action">
              <Save aria-hidden="true" size={15} strokeWidth={1.8} />
              Save
            </button>

            <button
              type="button"
              onClick={onCancelEditing}
              className="secondary-action compact-action"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 max-[520px]:items-start">
            <h1 className="mt-[5px] mb-0 overflow-hidden text-ellipsis whitespace-nowrap text-[24px] leading-[1.18] font-bold tracking-[-0.035em] text-[#123653] max-[760px]:text-[21px] max-[520px]:text-[18px]">
              {album.albumName}
            </h1>

            {canManageAlbum && (
              <button
                type="button"
                className="grid h-[31px] w-[31px] flex-none place-items-center rounded-[9px] border border-white/70 bg-[rgba(255,255,255,0.5)] text-[#4f6e86] backdrop-blur-sm transition-[color,background,border-color] duration-[180ms] hover:border-white/90 hover:bg-white/75 hover:text-[#1a70cb] max-[520px]:mt-[3px]"
                onClick={onEditName}
                aria-label="Edit album name"
                title="Edit album name"
              >
                <Edit3 aria-hidden="true" size={16} strokeWidth={1.8} />
              </button>
            )}
          </div>
        )}

        <p className="mt-[7px] mb-0 text-[11px] text-[#71889c]">
          {totalFiles} {totalFiles === 1 ? "file" : "files"}
        </p>

        <div className="mt-[13px] flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-[5px] rounded-full border border-white/60 bg-[rgba(255,255,255,0.5)] px-2 py-[5px] text-[8px] font-semibold text-[#4e6c84] shadow-sm backdrop-blur-sm max-[520px]:gap-[5px] max-[520px]:text-[7px]">
            <UserPlus aria-hidden="true" size={14} strokeWidth={1.8} />
            {album.ownerName}
          </span>

          <span className="inline-flex items-center gap-[5px] rounded-full border border-white/60 bg-[rgba(255,255,255,0.5)] px-2 py-[5px] text-[8px] font-semibold text-[#4e6c84] shadow-sm backdrop-blur-sm max-[520px]:gap-[5px] max-[520px]:text-[7px]">
            <CalendarDays aria-hidden="true" size={14} strokeWidth={1.8} />
            {formatDate(album.createdAt)}
          </span>

          {album.updatedAt && (
            <span className="inline-flex items-center gap-[5px] rounded-full border border-white/60 bg-[rgba(255,255,255,0.5)] px-2 py-[5px] text-[8px] font-semibold text-[#4e6c84] shadow-sm backdrop-blur-sm max-[520px]:gap-[5px] max-[520px]:text-[7px]">
              Updated {formatDate(album.updatedAt)}
            </span>
          )}
        </div>
      </div>

      {canManageAlbum && (
        <div className="flex flex-none items-center gap-2 self-center max-[760px]:ml-auto max-[520px]:ml-0 max-[520px]:w-full">
          <button
            type="button"
            onClick={onUpload}
            disabled={uploading || deletingAlbum}
            className="primary-action flex-none justify-center disabled:opacity-60 disabled:cursor-wait max-[520px]:min-w-0 max-[520px]:flex-1"
          >
            <Upload aria-hidden="true" size={16} strokeWidth={1.8} />
            <span>{uploading ? "Adding..." : "Add files"}</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deletingAlbum || uploading}
            aria-label="Delete album"
            title="Delete album"
            className="danger-gradient-action inline-flex h-9 flex-none cursor-pointer items-center justify-center gap-[7px] rounded-[10px] px-3 text-[10px] font-semibold transition-[transform,box-shadow] duration-[180ms] disabled:cursor-wait disabled:opacity-60 max-[520px]:min-w-0 max-[520px]:flex-1"
          >
            <Trash2 aria-hidden="true" size={15} strokeWidth={1.8} />
            <span>{deletingAlbum ? "Deleting..." : "Delete album"}</span>
          </button>
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept={SUPPORTED_FILE_ACCEPT}
        className="hidden"
        onChange={onReplaceChange}
      />
    </section>
  );
}
