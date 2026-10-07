import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Edit3,
  Images,
  Link2,
  Save,
  Share2,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  addAlbumMember,
  deleteAlbumFile,
  downloadAlbumFile,
  getAlbum,
  getAlbumFiles,
  getAlbumMembers,
  getFilePreviewUrl,
  removeAlbumMember,
  replaceAlbumFile,
  updateAlbum,
  updateAlbumMember,
  uploadAlbumFile,
} from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import FileCardGrid from "../components/files/FileCardGrid";
import useFileFavorites from "../hooks/useFileFavorites";
import useFilePreviews from "../hooks/useFilePreviews";
import { useAuth } from "../context/AuthContext";

import type {
  AlbumMemberResponse,
  AlbumResponse,
} from "../types/album";
import type { FileResponse } from "../types/file";
import { formatDate } from "../utils/formatters";

const sharePanelClass =
  "min-w-0 p-5 max-[760px]:p-[17px] max-[520px]:p-[14px]";
const permissionToggleClass =
  "inline-flex h-7 min-w-[52px] cursor-pointer items-center justify-center gap-[5px] rounded-full border border-[#dde7ee] bg-[#f4f7fa] px-2 text-[8px] font-bold text-[#8b9aa6] transition-[color,background,border-color] duration-[180ms] disabled:opacity-[0.56]";
const memberPermissionClass =
  "inline-flex min-h-[26px] cursor-pointer items-center justify-center gap-1 rounded-[7px] border border-[#dce8ef] bg-[#f4f8fa] px-[7px] text-[7px] font-[650] text-[#7c91a2] transition-[color,background,border-color] duration-[160ms] disabled:cursor-not-allowed disabled:opacity-[0.47]";

export default function AlbumDetailPage() {
  const { instance } = useMsal();

  const {
    account,
    user,
  } = useAuth();

  const { albumId } =
    useParams();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const replaceInputRef =
    useRef<HTMLInputElement | null>(null);

  const replaceTargetIdRef =
    useRef<number | null>(null);

  const [album, setAlbum] =
    useState<AlbumResponse | null>(null);

  const [files, setFiles] =
    useState<FileResponse[]>([]);

  const [members, setMembers] =
    useState<AlbumMemberResponse[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [memberEmail, setMemberEmail] =
    useState("");

  const [canView, setCanView] =
    useState(true);

  const [canDownload, setCanDownload] =
    useState(true);

  const [albumNameDraft, setAlbumNameDraft] =
    useState("");

  const [editingName, setEditingName] =
    useState(false);

  const numericAlbumId =
    Number(
      albumId ?? "0",
    );

  const canManageAlbum = Boolean(
    album &&
      user &&
      (user.role === "Admin" ||
        album.ownerId === user.userId),
  );

  const loadPreview = useCallback(
    async (file: FileResponse) => {
      if (!account) {
        throw new Error(
          "An authenticated account is required.",
        );
      }

      return getFilePreviewUrl(
        instance,
        account,
        file.id,
        numericAlbumId,
        canManageAlbum,
      );
    },
    [
      account,
      canManageAlbum,
      instance,
      numericAlbumId,
    ],
  );

  const {
    previewUrls,
    loading: previewsLoading,
  } = useFilePreviews(
    files,
    loadPreview,
  );

  const loadAlbumData = async () => {
    if (
      !account ||
      !Number.isFinite(numericAlbumId)
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const albumResult = await getAlbum(
        instance,
        account,
        numericAlbumId,
      );

      setAlbum(albumResult);
      setAlbumNameDraft(
        albumResult.albumName,
      );

      const nextCanManageAlbum =
        user?.role === "Admin" ||
        albumResult.ownerId === user?.userId;

      const fileResult =
        await getAlbumFiles(
          instance,
          account,
          numericAlbumId,
        );

      setFiles(fileResult);

      if (nextCanManageAlbum) {
        try {
          setMembers(
            await getAlbumMembers(
              instance,
              account,
              numericAlbumId,
            ),
          );
        } catch {
          setMembers([]);
          setError(
            "Album opened, but sharing settings could not be loaded.",
          );
        }
      } else {
        setMembers([]);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load album details.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    () => {
      void loadAlbumData();
    },
    [
      account,
      instance,
      numericAlbumId,
      user?.role,
      user?.userId,
    ],
  );

  const handleFavoriteSuccess =
    useCallback(
      (
        file: FileResponse,
        nextFavorite: boolean,
      ) => {
        setFiles((previous) =>
          previous.map(
            (currentFile) =>
              currentFile.id === file.id
                ? {
                    ...currentFile,
                    isFavorite:
                      nextFavorite,
                  }
                : currentFile,
          ),
        );
      },
      [],
    );

  const handleFavoriteError =
    useCallback(
      (message: string) => {
        setError(message);
      },
      [],
    );

  const {
    pendingIds:
      favoritePendingIds,
    toggleFavorite,
  } = useFileFavorites({
    instance,
    account,
    onSuccess:
      handleFavoriteSuccess,
    onError:
      handleFavoriteError,
  });

  const handleUpload =
    async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      const selectedFile =
        event.target.files?.[0];

      if (
        !selectedFile ||
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setUploading(true);
        setError(null);

        await uploadAlbumFile(
          instance,
          account,
          numericAlbumId,
          selectedFile,
        );

        event.target.value = "";

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Upload failed.",
        );
      } finally {
        setUploading(false);
      }
    };

  const handleDownload =
    async (
      file: FileResponse,
    ) => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setError(null);

        await downloadAlbumFile(
          instance,
          account,
          numericAlbumId,
          file.id,
          file.originalFileName,
        );
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Download failed.",
        );
      }
    };

  const handleDelete =
    async (
      fileId: number,
    ) => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setError(null);

        await deleteAlbumFile(
          instance,
          account,
          numericAlbumId,
          fileId,
        );

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Delete failed.",
        );
      }
    };

  const handleReplace =
    async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      const selectedFile =
        event.target.files?.[0];

      const fileId =
        replaceTargetIdRef.current;

      if (
        !selectedFile ||
        !account ||
        !Number.isFinite(
          numericAlbumId,
        ) ||
        fileId === null
      ) {
        return;
      }

      try {
        setError(null);

        await replaceAlbumFile(
          instance,
          account,
          numericAlbumId,
          fileId,
          selectedFile,
        );

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Replace failed.",
        );
      } finally {
        replaceTargetIdRef.current =
          null;

        event.target.value = "";
      }
    };

  const handleUpdateAlbum =
    async () => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        ) ||
        !albumNameDraft.trim()
      ) {
        setError(
          "Album name is required.",
        );

        return;
      }

      try {
        setError(null);

        const updated =
          await updateAlbum(
            instance,
            account,
            numericAlbumId,
            {
              albumName:
                albumNameDraft.trim(),
            },
          );

        setAlbum(updated);

        setAlbumNameDraft(
          updated.albumName,
        );

        setEditingName(false);
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to update album.",
        );
      }
    };

  const handleAddMember =
    async () => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        ) ||
        !memberEmail.trim()
      ) {
        setError(
          "An email address is required to share the album.",
        );

        return;
      }

      try {
        setError(null);

        await addAlbumMember(
          instance,
          account,
          numericAlbumId,
          {
            email:
              memberEmail.trim(),
            canView,
            canDownload,
          },
        );

        setMemberEmail("");
        setCanView(true);
        setCanDownload(true);

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to share album.",
        );
      }
    };

  const handleUpdateMember =
    async (
      userId: number,
      nextView: boolean,
      nextDownload: boolean,
    ) => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setError(null);

        await updateAlbumMember(
          instance,
          account,
          numericAlbumId,
          userId,
          {
            canView:
              nextView,
            canDownload:
              nextDownload,
          },
        );

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to update member access.",
        );
      }
    };

  const handleRemoveMember =
    async (
      userId: number,
    ) => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setError(null);

        await removeAlbumMember(
          instance,
          account,
          numericAlbumId,
          userId,
        );

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to revoke access.",
        );
      }
    };

  if (
    loading ||
    previewsLoading
  ) {
    return (
      <div className="app-page">
        <section className="skeleton-panel relative flex items-center gap-[17px] overflow-hidden rounded-[20px] p-[22px] max-[760px]:flex-wrap max-[760px]:p-[18px]">
          <div className="h-[78px] w-[95px] flex-none rounded-2xl bg-[#dce9f2]" />

          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>
        </section>

        <section className="grid grid-cols-3 gap-[17px]">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="surface h-[315px] rounded-[17px]"
              />
            ),
          )}
        </section>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="app-page">
        <section
          role="alert"
          className="surface album-not-found"
        >
          <span className="album-not-found-icon">
            <Images
              aria-hidden="true"
              size={28}
              strokeWidth={1.5}
            />
          </span>

          <h1>
            Album not found
          </h1>

          <p>
            {error ??
              "The requested album could not be loaded."}
          </p>

          <Link
            to="/albums"
            className="primary-action"
          >
            <ArrowLeft
              aria-hidden="true"
              size={16}
              strokeWidth={1.8}
            />
            Back to albums
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="app-page gap-5">
      <div className="flex min-h-[22px]">
        <Link
          to="/albums"
          className="inline-flex items-center gap-[7px] text-[11px] font-semibold text-[#648199] transition-[color,transform] duration-[180ms] hover:-translate-x-px hover:text-[#176fca]"
        >
          <ArrowLeft
            aria-hidden="true"
            size={16}
            strokeWidth={1.8}
          />
          Albums
        </Link>
      </div>

      <section className="surface relative flex items-center gap-[17px] overflow-hidden rounded-[20px] p-[22px] max-[760px]:flex-wrap max-[760px]:p-[18px]">
        <div className="relative grid h-[78px] w-[95px] flex-none place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.66),transparent_30%),linear-gradient(145deg,#dff2ff_0%,#b7daf6_49%,#dceefa_100%)] max-[520px]:h-[65px] max-[520px]:w-[75px]">
          <span className="absolute right-[-45px] top-[-68px] h-[115px] w-[115px] rounded-full bg-[rgba(75,158,237,0.24)]" />
          <span className="absolute bottom-[-52px] left-[-36px] h-[90px] w-[90px] rounded-full bg-[rgba(255,255,255,0.36)]" />

          <span className="relative z-[1] grid h-12 w-12 place-items-center rounded-[14px] border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.5)] text-[#237edb] shadow-[0_12px_27px_rgba(49,110,169,0.11),inset_0_1px_rgba(255,255,255,0.7)] backdrop-blur-[11px] max-[520px]:h-[39px] max-[520px]:w-[39px] max-[520px]:rounded-xl">
            <Images
              aria-hidden="true"
              size={31}
              strokeWidth={1.45}
            />
          </span>
        </div>

        <div className="min-w-0 flex-1 basis-0 max-[760px]:basis-[calc(100%-112px)] max-[520px]:basis-[calc(100%-92px)]">
          <div className="page-kicker">
            <span className="page-kicker-dot" />
            Album collection
          </div>

          {editingName &&
          canManageAlbum ? (
            <div className="mt-[6px] flex max-w-[650px] items-center gap-[7px] max-[760px]:flex-wrap">
              <label
                htmlFor="album-name"
                className="sr-only"
              >
                Album name
              </label>

              <input
                id="album-name"
                value={
                  albumNameDraft
                }
                onChange={(
                  event,
                ) =>
                  setAlbumNameDraft(
                    event.target.value,
                  )
                }
                className="field min-w-0 flex-1 max-[760px]:w-full max-[760px]:basis-full"
                maxLength={200}
                autoFocus
              />

              <button
                type="button"
                onClick={() =>
                  void handleUpdateAlbum()
                }
                className="primary-action compact-action"
              >
                <Save
                  aria-hidden="true"
                  size={15}
                  strokeWidth={1.8}
                />
                Save
              </button>

              <button
                type="button"
                onClick={() => {
                  setAlbumNameDraft(
                    album.albumName,
                  );
                  setEditingName(false);
                }}
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
                  className="grid h-[31px] w-[31px] flex-none place-items-center rounded-[9px] border border-[#dce9f2] bg-[rgba(255,255,255,0.63)] text-[#628097] transition-[color,background] duration-[180ms] hover:bg-[#eef7ff] hover:text-[#1a70cb] max-[520px]:mt-[3px]"
                  onClick={() =>
                    setEditingName(true)
                  }
                  aria-label="Edit album name"
                  title="Edit album name"
                >
                  <Edit3
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.8}
                  />
                </button>
              )}
            </div>
          )}

          <p className="mt-[7px] mb-0 text-[11px] text-[#71889c]">
            {files.length}{" "}
            {files.length === 1
              ? "file"
              : "files"}{" "}
          </p>

          <div className="mt-[13px] flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-[5px] rounded-full border border-[#dceaf3] bg-[rgba(255,255,255,0.47)] px-2 py-[5px] text-[8px] font-semibold text-[#638096] max-[520px]:gap-[5px] max-[520px]:text-[7px]">
              <UserPlus
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />
              {album.ownerName}
            </span>

            <span className="inline-flex items-center gap-[5px] rounded-full border border-[#dceaf3] bg-[rgba(255,255,255,0.47)] px-2 py-[5px] text-[8px] font-semibold text-[#638096] max-[520px]:gap-[5px] max-[520px]:text-[7px]">
              <CalendarDays
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />
              {formatDate(
                album.createdAt,
              )}
            </span>

            {album.updatedAt && (
              <span className="inline-flex items-center gap-[5px] rounded-full border border-[#dceaf3] bg-[rgba(255,255,255,0.47)] px-2 py-[5px] text-[8px] font-semibold text-[#638096] max-[520px]:gap-[5px] max-[520px]:text-[7px]">
                Updated{" "}
                {formatDate(
                  album.updatedAt,
                )}
              </span>
            )}
          </div>
        </div>

        {canManageAlbum && (
          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={uploading}
            className="primary-action flex-none self-center disabled:opacity-60 disabled:cursor-wait max-[760px]:ml-auto max-[520px]:ml-0 max-[520px]:w-full"
          >
            <Upload
              aria-hidden="true"
              size={16}
              strokeWidth={1.8}
            />

            <span>
              {uploading
                ? "Adding..."
                : "Add files"}
            </span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
        />

        <input
          ref={replaceInputRef}
          type="file"
          className="hidden"
          onChange={handleReplace}
        />
      </section>

      {error && (
        <ErrorBanner
          message={error}
        />
      )}

      <section className="min-w-0">
        <div className="mb-[15px] flex items-end justify-between gap-[18px]">
          <div>
            <p className="dashboard-panel-kicker">
              Collection content
            </p>

            <h2 className="mt-1 mb-0 text-[16px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
              Files
            </h2>
          </div>
        </div>

        <FileCardGrid
          files={files}
          previewUrls={previewUrls}
          favoritePendingIds={
            favoritePendingIds
          }
          canManage={
            canManageAlbum
          }
          onFavoriteToggle={(
            file,
          ) =>
            void toggleFavorite(
              file,
            )
          }
          onReplace={(file) => {
            replaceTargetIdRef.current =
              file.id;

            if (
              replaceInputRef.current
            ) {
              replaceInputRef.current.value =
                "";

              replaceInputRef.current.click();
            }
          }}
          onDownload={(file) =>
            void handleDownload(
              file,
            )
          }
          onDelete={(file) =>
            void handleDelete(
              file.id,
            )
          }
          empty={
            <section className="surface flex min-h-[300px] flex-col items-center justify-center rounded-[18px] px-[22px] py-[38px] text-center">
              <span className="grid h-[62px] w-[62px] place-items-center rounded-[19px] bg-[#e7f3ff] text-[#287dd7] shadow-[inset_0_1px_rgba(255,255,255,0.72),0_7px_18px_rgba(45,111,176,0.06)]">
                <Upload
                  aria-hidden="true"
                  size={25}
                  strokeWidth={1.5}
                />
              </span>

              <h3 className="mt-4 mb-0 text-[15px] font-[650] text-[#29445d]">
                No files in this album
              </h3>

              <p className="mt-[7px] mb-[18px] max-w-[390px] text-[10px] leading-[1.6] text-[#8497a7]">
                Add images or PDF documents
                to start building this
                collection.
              </p>

              {canManageAlbum && (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="primary-action"
                >
                  <Upload
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.8}
                  />
                  Add your first file
                </button>
              )}
            </section>
          }
        />
      </section>

      {canManageAlbum && (
        <details className="surface group overflow-hidden rounded-[18px]">
          <summary className="flex min-h-[76px] cursor-pointer select-none items-center gap-[11px] px-4 py-3 transition-colors duration-[180ms] hover:bg-[rgba(235,244,251,0.5)] group-open:border-b group-open:border-[#e4edf4] max-[520px]:px-3 [&::-webkit-details-marker]:hidden">
            <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[11px] bg-[#e8f3ff] text-[#2d7dd7]">
              <Share2
                aria-hidden="true"
                size={18}
                strokeWidth={1.8}
              />
            </span>

            <span className="grid min-w-0 flex-1 gap-[3px]">
              <strong className="text-[11px] font-[650] text-[#35526a]">
                Share access
              </strong>

              <small className="text-[8px] text-[#8799a7]">
                Manage who can view and
                download this album
              </small>
            </span>

            <span className="inline-flex h-[27px] min-w-[34px] items-center justify-center gap-1 rounded-full bg-[#eef4f8] px-2 text-[8px] font-semibold text-[#6d8395]">
              <Users
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />
              {members.length}
            </span>

            <ChevronDown
              aria-hidden="true"
              className="text-[#8da0af] transition-transform duration-[180ms] group-open:rotate-180"
              size={18}
              strokeWidth={1.8}
            />
          </summary>

          <div className="grid grid-cols-[minmax(280px,0.85fr)_minmax(0,1.45fr)] gap-0 max-[960px]:grid-cols-1 max-[760px]:block max-[520px]:overflow-hidden">
            <div className={`${sharePanelClass} border-r border-[#e4edf4] max-[960px]:border-r-0 max-[960px]:border-b max-[960px]:border-[#e4edf4]`}>
              <div className="mb-[15px] flex items-center justify-between gap-[14px]">
                <div>
                  <p className="dashboard-panel-kicker">
                    Album permissions
                  </p>

                  <h3 className="mt-1 mb-0 text-[16px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
                    Invite a WinWire user
                  </h3>
                </div>

                <span className="grid h-[33px] w-[33px] flex-none place-items-center rounded-[10px] bg-[#eaf4ff] text-[#347fcf]">
                  <UserPlus
                    aria-hidden="true"
                    size={17}
                    strokeWidth={1.8}
                  />
                </span>
              </div>

              <label
                htmlFor="share-email"
                className="field-label"
              >
                Email address
              </label>

              <input
                id="share-email"
                type="email"
                value={memberEmail}
                onChange={(
                  event,
                ) =>
                  setMemberEmail(
                    event.target.value,
                  )
                }
                placeholder="name@winwire.com"
                className="field w-full"
              />

              <div className="mt-[11px] overflow-hidden rounded-xl border border-[#e4edf3] bg-[rgba(255,255,255,0.28)]">
                <div className="flex min-h-[60px] items-center justify-between gap-3 border-b border-[#e8eef3] px-3 py-[10px] last:border-0">
                  <div className="grid min-w-0 gap-[3px]">
                    <strong className="text-[9px] font-[650] text-[#4b647a]">
                      Can view
                    </strong>

                    <span className="text-[8px] leading-[1.4] text-[#91a1ad]">
                      Allow this person to
                      open the album.
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-pressed={
                      canView
                    }
                    onClick={() => {
                      setCanView(
                        (
                          previous,
                        ) =>
                          !previous,
                      );

                      if (
                        canView
                      ) {
                        setCanDownload(
                          false,
                        );
                      }
                    }}
                    className={`${permissionToggleClass} ${
                      canView
                        ? "border-[#cfece2] bg-[#edf9f5] text-[#23866f]"
                        : ""
                    }`}
                  >
                    <span aria-hidden="true" className={`h-[6px] w-[6px] flex-none rounded-full ${canView ? "bg-[#1db18a]" : "bg-[#a7b5c0]"}`} />

                    {canView
                      ? "On"
                      : "Off"}
                  </button>
                </div>

                <div className="flex min-h-[60px] items-center justify-between gap-3 border-b border-[#e8eef3] px-3 py-[10px] last:border-0">
                  <div className="grid min-w-0 gap-[3px]">
                    <strong className="text-[9px] font-[650] text-[#4b647a]">
                      Can download
                    </strong>

                    <span className="text-[8px] leading-[1.4] text-[#91a1ad]">
                      Allow files to be
                      downloaded.
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-pressed={
                      canDownload
                    }
                    disabled={
                      !canView
                    }
                    onClick={() =>
                      setCanDownload(
                        (
                          previous,
                        ) =>
                          !previous,
                      )
                    }
                    className={`${permissionToggleClass} ${
                      canDownload
                        ? "border-[#cfece2] bg-[#edf9f5] text-[#23866f]"
                        : ""
                    } ${
                      !canView
                        ? "cursor-not-allowed opacity-[0.56]"
                        : ""
                    }`}
                  >
                    <span aria-hidden="true" className={`h-[6px] w-[6px] flex-none rounded-full ${canDownload ? "bg-[#1db18a]" : "bg-[#a7b5c0]"}`} />

                    {canDownload
                      ? "On"
                      : "Off"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleAddMember()
                }
                className="primary-action mt-4 w-full"
              >
                <Link2
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.8}
                />
                Share album
              </button>
            </div>

            <div className={`${sharePanelClass} min-h-[300px]`}>
              <div className="mb-[15px] flex items-center justify-between gap-[14px]">
                <div>
                  <p className="dashboard-panel-kicker">
                    Current members
                  </p>

                  <h3 className="mt-1 mb-0 text-[16px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
                    People with access
                  </h3>
                </div>

                <span className="inline-flex h-[27px] min-w-[29px] items-center justify-center rounded-full bg-[#eff4f7] text-[8px] font-semibold text-[#718698]">
                  {members.length}
                </span>
              </div>

              {members.length === 0 ? (
                <div className="flex min-h-[205px] flex-col items-center justify-center text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#edf3f7] text-[#6e879b]">
                    <Users
                      aria-hidden="true"
                      size={23}
                      strokeWidth={1.5}
                    />
                  </span>

                  <p className="mt-3 mb-0.5 text-[10px] font-semibold text-[#587087]">
                    No one else has
                    access yet.
                  </p>

                  <small className="text-[8px] text-[#95a4af]">
                    Invite a WinWire user
                    using the form.
                  </small>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#e4edf3] bg-[rgba(255,255,255,0.24)] max-[760px]:rounded-[10px]">
                  {members.map(
                    (
                      member,
                    ) => (
                      <div
                        key={
                          member.userId
                        }
                        className="flex min-w-0 items-center gap-[9px] border-b border-[#e7eef3] px-[11px] py-[10px] transition-colors duration-[170ms] hover:bg-[rgba(235,244,251,0.48)] last:border-b-0 max-[760px]:flex-wrap"
                      >
                        <div className="grid h-[31px] w-[31px] flex-none place-items-center rounded-full bg-[#e8f3ff] text-[9px] font-bold text-[#2f73bb]">
                          {member.name
                            ?.charAt(
                              0,
                            )
                            .toUpperCase() ??
                            member.email
                              .charAt(
                                0,
                              )
                              .toUpperCase()}
                        </div>

                        <div className="grid min-w-0 flex-1 gap-0.5">
                          <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[9px] font-[650] text-[#3b556b]">
                            {member.name ||
                              member.email}
                          </strong>

                          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[8px] text-[#8899a6]">
                            {
                              member.email
                            }
                          </span>

                          <small className="text-[7px] text-[#a0aeb8]">
                            Granted{" "}
                            {formatDate(
                              member.grantedAt,
                            )}
                          </small>
                        </div>

                        <div className="flex flex-wrap justify-end gap-1 max-[760px]:w-full max-[760px]:justify-start max-[760px]:pl-10 max-[520px]:pl-10">
                          <button
                            type="button"
                            aria-pressed={
                              member.canView
                            }
                            onClick={() =>
                              void handleUpdateMember(
                                member.userId,
                                !member.canView,
                                !member.canView &&
                                member.canDownload
                                  ? false
                                  : member.canDownload,
                              )
                            }
                            className={`${memberPermissionClass} ${
                              member.canView
                                ? "border-[#d2ece5] bg-[#ebf9f5] text-[#227f6b]"
                                : ""
                            }`}
                          >
                            {member.canView && (
                              <Check
                                aria-hidden="true"
                                size={12}
                                strokeWidth={2}
                              />
                            )}
                            View
                          </button>

                          <button
                            type="button"
                            aria-pressed={
                              member.canDownload
                            }
                            disabled={
                              !member.canView
                            }
                            onClick={() =>
                              void handleUpdateMember(
                                member.userId,
                                member.canView,
                                !member.canDownload,
                              )
                            }
                            className={`${memberPermissionClass} ${
                              member.canDownload
                                ? "border-[#d2ece5] bg-[#ebf9f5] text-[#227f6b]"
                                : ""
                            } ${
                              !member.canView
                                ? "cursor-not-allowed opacity-[0.47]"
                                : ""
                            }`}
                          >
                            {member.canDownload && (
                              <Download
                                aria-hidden="true"
                                size={12}
                                strokeWidth={1.9}
                              />
                            )}
                            Download
                          </button>

                          <button
                            type="button"
                            aria-label={`Revoke access for ${member.email}`}
                            title="Revoke access"
                            onClick={() =>
                              void handleRemoveMember(
                                member.userId,
                              )
                            }
                            className="inline-flex min-h-[26px] cursor-pointer items-center justify-center gap-1 rounded-[7px] border border-[#efd6d8] bg-[#fff3f4] px-[7px] text-[7px] font-[650] text-[#d25259] transition-[color,background,border-color] duration-[160ms] hover:bg-[#ffe9eb] hover:text-[#bd3e47] max-[520px]:w-7 max-[520px]:px-0"
                          >
                            <Trash2
                              aria-hidden="true"
                              size={15}
                              strokeWidth={1.8}
                            />
                            <span className="max-[520px]:hidden">
                              Revoke
                            </span>
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </details>
      )}

      {!canManageAlbum && (
        <section className="surface flex items-center gap-[11px] rounded-[13px] px-[15px] py-[13px]">
          <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[10px] bg-[#eaf3fa] text-[#4c7597]">
            <Users
              aria-hidden="true"
              size={17}
              strokeWidth={1.8}
            />
          </span>

          <div className="min-w-0">
            <strong className="block text-[10px] font-[650] text-[#446078]">
              Shared album
            </strong>

            <p className="mt-[3px] text-[9px] text-[#899baa]">
              You have access to this
              collection based on the
              permissions assigned to your
              account.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
