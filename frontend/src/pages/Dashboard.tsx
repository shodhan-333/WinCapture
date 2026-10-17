import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowRight,
  FileText,
  Film,
  FolderOpen,
  Images,
  Music,
  Settings2,
  Trash2,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { Link, useNavigate } from "react-router-dom";

import {
  deleteAlbum,
  deleteFile,
  getMyAlbums,
  getAdminAlbums,
  getAdminFiles,
  getFilePreviewUrl,
  getFilePreviewUrlByPath,
  getFiles,
} from "../api/apiClient";
import FilePreviewModal from "../components/files/FilePreviewModal";
import ErrorBanner from "../components/ui/ErrorBanner";
import Pagination from "../components/ui/Pagination";
import SearchField from "../components/ui/SearchField";
import { useAuth } from "../context/AuthContext";
import useAlbumCoverPreviews from "../hooks/useAlbumCoverPreviews";
import useFilePreviews from "../hooks/useFilePreviews";
import type { AlbumResponse } from "../types/album";
import type { AdminFileResponse, FileResponse } from "../types/file";
import type { UserRole } from "../types/auth";
import {
  formatDate,
  formatFileSize,
  formatFileType,
} from "../utils/formatters";
import { getAccountKey } from "../utils/accountKey";

const dashboardPanelClass =
  "surface relative isolate min-w-0 overflow-hidden rounded-[20px]";

const dashboardPanelHeaderClass =
  "flex min-h-[68px] items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.45)] bg-[rgba(255,255,255,0.32)] px-6 backdrop-blur-[20px] max-[520px]:min-h-[62px] max-[520px]:px-4";

const dashboardListRowClass =
  "group/row flex min-h-[66px] w-full cursor-pointer items-center gap-3 border-b border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.18)] px-5 py-2 text-left text-inherit transition-[background,box-shadow] duration-200 hover:bg-[rgba(255,255,255,0.48)] hover:shadow-[inset_3px_0_0_rgba(30,120,214,0.55)] last:border-b-0 focus-visible:bg-[rgba(255,255,255,0.52)] max-[520px]:min-h-[60px] max-[520px]:px-4";

const dashboardIconClass =
  "grid h-[38px] w-[38px] flex-none place-items-center overflow-hidden rounded-[12px] border border-white/80 bg-[rgba(255,255,255,0.55)] text-[#1b74d3] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(26,54,80,0.05)] backdrop-blur-[16px] max-[520px]:h-[34px] max-[520px]:w-[34px] max-[520px]:rounded-[11px]";

const dashboardStatCardClass =
  "surface group relative flex min-h-[78px] cursor-pointer items-center gap-2.5 overflow-hidden rounded-[16px] px-3 py-2 text-left transition-[transform,border-color,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.85)] hover:shadow-[var(--glass-shadow-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3787d4] max-[760px]:min-h-[74px] max-[760px]:gap-2 max-[760px]:px-2.5 max-[760px]:py-2";

const dashboardViewAllClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/75 bg-white/45 px-3 py-1.5 text-[12px] font-semibold text-[#156ecb] shadow-sm backdrop-blur-md transition-colors hover:bg-white/75 hover:text-[#0b5fbf] max-[520px]:px-2.5 max-[520px]:text-[11px]";

const dashboardFileCategories = [
  { label: "Images", icon: Images },
  { label: "Documents", icon: FileText },
  { label: "Videos", icon: Film },
  { label: "Audio", icon: Music },
  { label: "Archives", icon: Archive },
] as const;
const ALL_CONTENT_PAGE_SIZE = 10;

type DashboardFile = FileResponse &
  Partial<Pick<AdminFileResponse, "uploadedBy" | "uploaderName" | "albumId" | "albumName">>;

// Keep dashboard access role-driven. Add a role here when the backend grants it
// access to application-wide content management.
const dashboardRoleCapabilities: Record<
  UserRole,
  { canViewAllContent: boolean }
> = {
  User: { canViewAllContent: false },
  Admin: { canViewAllContent: true },
};

export default function Dashboard() {
  const { instance } = useMsal();
  const { account, user } = useAuth();
  const accountKey = getAccountKey(account);
  const navigate = useNavigate();
  const canViewAllContent = user
    ? dashboardRoleCapabilities[user.role]?.canViewAllContent ?? false
    : false;

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [files, setFiles] = useState<DashboardFile[]>([]);
  const [fileCategoryCounts, setFileCategoryCounts] = useState<
    Record<string, number>
  >({});
  const [contentScope, setContentScope] = useState<"mine" | "all">("mine");
  const [contentVersion, setContentVersion] = useState(0);
  const [allAlbumsPage, setAllAlbumsPage] = useState(1);
  const [allFilesPage, setAllFilesPage] = useState(1);
  const [allAlbumsSearch, setAllAlbumsSearch] = useState("");
  const [allFilesSearch, setAllFilesSearch] = useState("");
  const [allAlbumsPageCount, setAllAlbumsPageCount] = useState(1);
  const [allFilesPageCount, setAllFilesPageCount] = useState(1);
  const [allAlbumsCount, setAllAlbumsCount] = useState(0);
  const [allFilesCount, setAllFilesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recentDataKey = useRef<string | null>(null);
  const categoryCountsCache = useRef(
    new Map<
      string,
      {
        version: number;
        counts: Record<string, number>;
      }
    >(),
  );

  // Keep these arrays stable while their source data is unchanged. The preview
  // hooks use the array reference as an effect dependency and should not restart
  // their network requests after unrelated dashboard state updates.
  const recentAlbums = useMemo(
    () =>
      [...albums].sort(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
      ),
    [albums],
  );
  const recentFiles = useMemo(
    () =>
      [...files].sort(
        (left, right) => Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt),
      ),
    [files],
  );

  const albumCoverUrls = useAlbumCoverPreviews(
    recentAlbums,
    instance,
    account,
    user?.userId,
    contentScope === "all" && canViewAllContent,
  );

  const loadFilePreview = useCallback(
    (file: FileResponse) => {
      if (!account) {
        throw new Error("An authenticated account is required.");
      }

      const adminFile = file as DashboardFile;
      if (contentScope === "all" && canViewAllContent) {
        const path = adminFile.albumId === null
          ? `/api/files/${file.id}/download`
          : `/api/albums/${adminFile.albumId}/files/${file.id}/download`;
        return getFilePreviewUrlByPath(instance, account, path, file.contentType);
      }

      return getFilePreviewUrl(instance, account, file.id);
    },
    [accountKey, canViewAllContent, contentScope, instance],
  );

  const { previewUrls: recentFilePreviewUrls } = useFilePreviews(
    recentFiles,
    loadFilePreview,
    contentScope === "all" && canViewAllContent,
  );

  useEffect(() => {
    let active = true;

    async function load() {
      if (!account) {
        setLoading(false);
        return;
      }

      const requestedRecentKey = canViewAllContent && contentScope === "all"
        ? `${accountKey}:all:${contentVersion}:${allAlbumsPage}:${allFilesPage}:${allAlbumsSearch}:${allFilesSearch}`
        : `${accountKey}:mine:${contentVersion}`;
      // Counts follow the same effective scope as the list requests. Keeping
      // the capability in this key prevents an "all" count cache from being
      // reused if the signed-in user's role changes during the session.
      const effectiveContentScope =
        contentScope === "all" && canViewAllContent ? "all" : "mine";
      const requestedCountsKey = `${accountKey}:${effectiveContentScope}`;
      const cachedCounts = categoryCountsCache.current.get(requestedCountsKey);
      const countsAreCurrent = cachedCounts?.version === contentVersion;
      const shouldLoadRecent = recentDataKey.current !== requestedRecentKey;
      const shouldLoadCounts = !countsAreCurrent;

      if (!shouldLoadRecent && !shouldLoadCounts) {
        setFileCategoryCounts(cachedCounts.counts);
        setLoading(false);
        setHasLoaded(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setFileCategoryCounts(countsAreCurrent ? cachedCounts.counts : {});

        const recentRequest = !shouldLoadRecent
          ? Promise.resolve(null)
          : contentScope === "all" && canViewAllContent
            ? Promise.all([
                getAdminAlbums(
                  instance,
                  account,
                  allAlbumsPage,
                  ALL_CONTENT_PAGE_SIZE,
                  allAlbumsSearch.trim() || undefined,
                ),
                getAdminFiles(
                  instance,
                  account,
                  allFilesPage,
                  ALL_CONTENT_PAGE_SIZE,
                  allFilesSearch.trim() || undefined,
                ),
              ]).then(([albumResult, fileResult]) => ({
                albums: albumResult.items,
                albumsPage: albumResult.page,
                albumsPageCount: albumResult.pageCount,
                albumsCount: albumResult.totalItems,
                filesPage: fileResult.page,
                filesPageCount: fileResult.pageCount,
                filesCount: fileResult.totalItems,
                files: fileResult.items.map((file): DashboardFile => ({
                  ...file,
                  url: "",
                  downloadUrl: file.albumId === null
                    ? `/api/files/${file.id}/download`
                    : `/api/albums/${file.albumId}/files/${file.id}/download`,
                  isFavorite: false,
                  canManage: true,
                  canDownload: true,
                })),
              }))
            : Promise.all([
                getMyAlbums(instance, account, 1, 4),
                getFiles(instance, account, 1, 4),
              ]).then(([albumResult, fileResult]) => ({
                albums: albumResult.items,
                files: fileResult.items,
                albumsPage: 1,
                albumsPageCount: 1,
                albumsCount: albumResult.totalItems,
                filesPage: 1,
                filesPageCount: 1,
                filesCount: fileResult.totalItems,
              }));

        const [recentResults, categoryResults] = await Promise.all([
          recentRequest,
          shouldLoadCounts
            ? Promise.all(
                dashboardFileCategories.map(({ label }) =>
                  effectiveContentScope === "all"
                    ? getAdminFiles(instance, account, 1, 1, undefined, label)
                    : getFiles(instance, account, 1, 1, undefined, label),
                ),
              )
            : Promise.resolve([]),
        ]);

        if (!active) return;

        if (recentResults) {
          setAlbums(recentResults.albums);
          setFiles(recentResults.files);
          setAllAlbumsPage(recentResults.albumsPage);
          setAllAlbumsPageCount(recentResults.albumsPageCount);
          setAllAlbumsCount(recentResults.albumsCount);
          setAllFilesPage(recentResults.filesPage);
          setAllFilesPageCount(recentResults.filesPageCount);
          setAllFilesCount(recentResults.filesCount);
          recentDataKey.current = requestedRecentKey;
        }
        if (shouldLoadCounts) {
          const counts = Object.fromEntries(
            dashboardFileCategories.map(({ label }, index) => [
              label,
              categoryResults[index].totalItems,
            ]),
          );
          categoryCountsCache.current.set(requestedCountsKey, {
            version: contentVersion,
            counts,
          });
          setFileCategoryCounts(counts);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load dashboard data.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [
    accountKey,
    allAlbumsPage,
    allAlbumsSearch,
    allFilesPage,
    allFilesSearch,
    canViewAllContent,
    contentScope,
    contentVersion,
    instance,
  ]);

  const handleDeleteAlbum = async (album: AlbumResponse) => {
    if (
      !account ||
      !canViewAllContent ||
      !window.confirm(
        `Delete "${album.albumName}" and all its files? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setError(null);
      await deleteAlbum(instance, account, album.id);
      setAlbums((current) => current.filter((item) => item.id !== album.id));
      setAllAlbumsPage(1);
      setAllFilesPage(1);
      setContentVersion((version) => version + 1);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? `${caughtError.message} The album remains listed, so you can retry.`
          : "Unable to delete album. You can retry after resolving the issue.",
      );
    }
  };

  const handleDeleteFile = async (file: DashboardFile) => {
    if (
      !account ||
      !canViewAllContent ||
      !window.confirm(
        `Delete "${file.originalFileName}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setError(null);
      await deleteFile(instance, account, file.id);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      setAllAlbumsPage(1);
      setAllFilesPage(1);
      setContentVersion((version) => version + 1);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? `${caughtError.message} The file remains listed, so you can retry.`
          : "Unable to delete file. You can retry after resolving the issue.",
      );
    }
  };

  const [previewFile, setPreviewFile] = useState<DashboardFile | null>(null);

  // Show skeletons only on the first load; subsequent refreshes keep the page layout visible.
  if (loading && !hasLoaded) {
    return (
      <div className="app-page !gap-3">
        <section className="skeleton-panel flex min-h-[218px] items-center justify-between p-[30px] max-[960px]:flex-col max-[960px]:items-start max-[760px]:rounded-[17px] max-[760px]:px-5 max-[760px]:py-[23px]">
          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>

          <div className="flex gap-2">
            <span className="skeleton-button" />
            <span className="skeleton-button skeleton-button-wide" />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 max-[760px]:gap-[10px]">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="skeleton-panel flex min-h-[76px] items-center gap-3 rounded-[17px] p-[10px] max-[760px]:min-h-[70px] max-[760px]:p-2.5"
            >
              <span className="skeleton-icon" />
              <span className="skeleton-line skeleton-line-sm" />
              <span className="skeleton-line skeleton-line-value" />
            </div>
          ))}
        </section>

        <section className="grid grid-cols-2 gap-5 max-[960px]:grid-cols-1 max-[760px]:gap-4">
          <div className="skeleton-panel min-h-[355px] rounded-[18px]" />
          <div className="skeleton-panel min-h-[355px] rounded-[18px]" />
        </section>
      </div>
    );
  }

  return (
    <div className="app-page !gap-3">
      <section className="surface relative flex min-h-[138px] items-center justify-between gap-4 overflow-hidden rounded-[20px] px-6 py-4 max-[960px]:flex-col max-[960px]:items-start max-[760px]:rounded-[17px] max-[760px]:px-4 max-[760px]:py-4">
        <div className="relative z-[1] flex max-w-[740px] flex-col justify-center">
          <h1 className="m-0 text-[clamp(28px,2.7vw,35px)] font-bold leading-[1.04] tracking-[-0.045em] text-[#173a55] max-[760px]:text-[27px]">
            Welcome back,{" "}
            <span className="text-[#397eaf]">{user?.name ?? "User"}</span>
          </h1>

          <p className="mb-0 mt-2 max-w-[620px] text-[12px] leading-[1.55] text-[#687f91] max-[760px]:mt-2 max-[760px]:text-[11px]">
            Keep your albums organized, manage your files, and access your
            shared collections from one place.
          </p>

          <div className="mt-3 flex flex-wrap gap-2 max-[760px]:mt-3 max-[760px]:w-full max-[760px]:[&>button]:flex-1">
            <Link
              to="/albums"
              className="primary-action compact-action !min-h-[36px] !rounded-[10px] !px-3 text-[10px]"
            >
              <Images aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>Browse albums</span>
            </Link>

            <Link
              to="/files"
              className="secondary-action compact-action !min-h-[36px] !rounded-[10px] !px-3 text-[10px]"
            >
              <FolderOpen aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>Open files</span>
            </Link>
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      {canViewAllContent && (
        <section
          className="surface flex w-fit max-w-full flex-wrap items-center gap-1.5 rounded-[15px] p-1.5"
          role="group"
          aria-label="Dashboard content scope"
        >
          <button
            type="button"
            aria-pressed={contentScope === "mine"}
            onClick={() => setContentScope("mine")}
            className={`min-h-10 rounded-[10px] px-3.5 text-sm font-semibold transition-colors ${contentScope === "mine" ? "bg-white/80 text-[#145a99] shadow-sm" : "text-[#617c91] hover:bg-white/40"}`}
          >
            My Content
          </button>
          <button
            type="button"
            aria-pressed={contentScope === "all"}
            onClick={() => setContentScope("all")}
            className={`min-h-10 rounded-[10px] px-3.5 text-sm font-semibold transition-colors ${contentScope === "all" ? "bg-white/80 text-[#145a99] shadow-sm" : "text-[#617c91] hover:bg-white/40"}`}
          >
            All Content
          </button>
        </section>
      )}

      <section
        aria-label="File counts by type"
        className="grid grid-cols-5 gap-2.5 max-[960px]:grid-cols-3 max-[760px]:grid-cols-2 max-[520px]:gap-2"
      >
        {dashboardFileCategories.map(({ label, icon: CategoryIcon }) => (
          <div
            key={label}
            className={`${dashboardStatCardClass} rounded-[15px]`}
          >
            <CategoryIcon
              aria-hidden="true"
              className="flex-none text-[#267fe2]"
              size={19}
              strokeWidth={1.8}
            />
            <span className="grid min-w-0 gap-0">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#71889c] max-[520px]:text-[9px]">
                {label}
              </span>
              <strong className="text-[19px] font-bold leading-none tracking-[-0.04em] text-[#143653]">
                {fileCategoryCounts[label] ?? 0}
              </strong>
            </span>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-5 max-[960px]:grid-cols-1 max-[760px]:gap-4">
          <section className={dashboardPanelClass}>
            <div className={dashboardPanelHeaderClass}>
              <div>
                <p className="dashboard-panel-kicker">Collections</p>
                <h2 className="mb-0 mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#153756] max-[520px]:text-[16px]">
                  {contentScope === "all" ? "All Albums" : "My Albums"}
                </h2>
              </div>

              {contentScope === "all" && canViewAllContent ? (
                <span className="inline-flex h-[27px] min-w-7 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.50)] px-2 text-[9px] font-semibold text-[#54738c] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                  {allAlbumsCount}
                </span>
              ) : (
                <Link
                  to="/albums"
                  className={dashboardViewAllClass}
                >
                  View all
                  <ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />
                </Link>
              )}
            </div>

            {contentScope === "all" && canViewAllContent && (
              <div className="border-b border-[rgba(255,255,255,0.4)] p-3">
                <SearchField
                  value={allAlbumsSearch}
                  onChange={(value) => {
                    setAllAlbumsSearch(value);
                    setAllAlbumsPage(1);
                  }}
                  placeholder="Search albums..."
                  ariaLabel="Search all albums"
                  className="flex min-h-[36px] items-center gap-2 rounded-[10px] border border-white/70 bg-[rgba(255,255,255,0.48)] px-2.5 text-[#71889c]"
                  inputClassName="w-full min-w-0 border-0 bg-transparent text-[10px] text-[#24445d] outline-none placeholder:text-[#98aab7]"
                  clearLabel="Clear album search"
                  onClear={() => {
                    setAllAlbumsSearch("");
                    setAllAlbumsPage(1);
                  }}
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

                  <Link
                    to="/albums"
                    className="secondary-action compact-action"
                  >
                    Open albums
                  </Link>
                </div>
              ) : (
                recentAlbums.map((album) => (
                  <div
                    key={album.id}
                    className={dashboardListRowClass}
                  >
                    <span
                      className={`${dashboardIconClass} relative bg-[#e8f2ff] text-[#287bd7]`}
                    >
                      {albumCoverUrls[album.id] ? (
                        <img
                          src={albumCoverUrls[album.id]}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/row:scale-105"
                        />
                      ) : (
                        <Images
                          aria-hidden="true"
                          size={18}
                          strokeWidth={1.7}
                        />
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate(`/albums/${album.id}`)}
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

                    {contentScope === "all" && canViewAllContent ? (
                      <div className="flex flex-none items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/albums/${album.id}`)}
                          className="secondary-action compact-action inline-flex !min-h-[30px] !cursor-pointer items-center gap-1 !rounded-[8px] !px-2 text-[9px] font-semibold !text-[#2b72bd] hover:!border-[rgba(117,181,232,0.62)] hover:!bg-[linear-gradient(135deg,rgba(226,243,255,0.92),rgba(203,229,250,0.88))] hover:!text-[#1f659f]"
                          aria-label={`Manage album ${album.albumName}`}
                        >
                          <Settings2 aria-hidden="true" size={13} />
                          Manage
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteAlbum(album)}
                          className="secondary-action grid h-[30px] w-[30px] !cursor-pointer place-items-center !rounded-[8px] !p-0 !text-[#6b8295] hover:!border-[rgba(240,160,160,0.6)] hover:!bg-[rgba(255,235,235,0.85)] hover:!text-[#b4232d]"
                          aria-label={`Delete album ${album.albumName}`}
                          title="Delete album"
                        >
                          <Trash2 aria-hidden="true" size={13} />
                        </button>
                      </div>
                    ) : (
                      <ArrowRight
                        aria-hidden="true"
                        className="flex-none text-[#9cafbd]"
                        size={15}
                        strokeWidth={1.8}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
            {contentScope === "all" && canViewAllContent && allAlbumsCount > 0 && (
              <Pagination
                currentPage={allAlbumsPage}
                pageCount={allAlbumsPageCount}
                onPageChange={setAllAlbumsPage}
              />
            )}
          </section>

          <section className={dashboardPanelClass}>
            <div className={dashboardPanelHeaderClass}>
              <div>
                <h2 className="mb-0 mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#153756] max-[520px]:text-[16px]">
                  {contentScope === "all" ? "All Files" : "My Files"}
                </h2>
              </div>

              {contentScope === "all" && canViewAllContent ? (
                <span className="inline-flex h-[27px] min-w-7 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.50)] px-2 text-[9px] font-semibold text-[#54738c] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                  {allFilesCount}
                </span>
              ) : (
                <Link
                  to="/files"
                  className={dashboardViewAllClass}
                >
                  View all
                  <ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />
                </Link>
              )}
            </div>

            {contentScope === "all" && canViewAllContent && (
              <div className="border-b border-[rgba(255,255,255,0.4)] p-3">
                <SearchField
                  value={allFilesSearch}
                  onChange={(value) => {
                    setAllFilesSearch(value);
                    setAllFilesPage(1);
                  }}
                  placeholder="Search files..."
                  ariaLabel="Search all files"
                  className="flex min-h-[36px] items-center gap-2 rounded-[10px] border border-white/70 bg-[rgba(255,255,255,0.48)] px-2.5 text-[#71889c]"
                  inputClassName="w-full min-w-0 border-0 bg-transparent text-[10px] text-[#24445d] outline-none placeholder:text-[#98aab7]"
                  clearLabel="Clear file search"
                  onClear={() => {
                    setAllFilesSearch("");
                    setAllFilesPage(1);
                  }}
                />
              </div>
            )}

            <div className="flex flex-col">
              {files.length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center gap-4 bg-white/20 p-7 backdrop-blur-md max-[520px]:flex-wrap max-[520px]:p-5">
                  <span className="grid h-[54px] w-[54px] flex-none place-items-center rounded-[18px] border border-white/80 bg-white/50 text-[#32678d] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_rgba(26,54,80,0.05)] backdrop-blur-md">
                    <FolderOpen
                      aria-hidden="true"
                      size={21}
                      strokeWidth={1.6}
                    />
                  </span>

                  <div className="min-w-0">
                    <strong className="block text-[14px] font-semibold tracking-[-0.01em] text-[#334f68]">
                      {contentScope === "all" ? "No files found" : "No files uploaded yet"}
                    </strong>
                    <p className="mb-0 mt-1.5 max-w-[300px] text-[12px] leading-[1.6] text-[#8498a8]">
                      {contentScope === "all"
                        ? "No users have uploaded a file yet."
                        : "Upload a file to see it appear in your library."}
                    </p>
                  </div>

                  <Link
                    to="/files"
                    className="secondary-action compact-action"
                  >
                    Open files
                  </Link>
                </div>
              ) : (
                recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className={dashboardListRowClass}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (contentScope === "all" && canViewAllContent) {
                          setPreviewFile(file);
                        } else {
                          navigate("/files");
                        }
                      }}
                      className={`${dashboardIconClass} relative bg-[#edf2f5] text-[#607d92]`}
                      aria-label={
                        contentScope === "all"
                          ? `Preview ${file.originalFileName}`
                          : `Open ${file.originalFileName} in files`
                      }
                    >
                      {recentFilePreviewUrls[file.id] ? (
                        <img
                          src={recentFilePreviewUrls[file.id]}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/row:scale-105"
                        />
                      ) : file.contentType.startsWith("image/") ? (
                        <span className="text-[8px] font-extrabold tracking-[0.04em]">
                          IMG
                        </span>
                      ) : (
                        <FolderOpen
                          aria-hidden="true"
                          size={18}
                          strokeWidth={1.7}
                        />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/files")}
                      className="grid min-w-0 flex-1 gap-1 text-left"
                    >
                      <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-[#26445f] max-[520px]:text-[12px]">
                        {file.originalFileName}
                      </strong>
                      <small className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#7c91a2] max-[520px]:text-[10px]">
                        {contentScope === "all" && file.uploaderName
                          ? `Uploaded by: ${file.uploaderName} (#${file.uploadedBy})${file.albumId === null ? " · Personal file" : ` · Album: ${file.albumName ?? "Unknown album"} (#${file.albumId})`}`
                          : `${formatFileType(file.contentType)} · ${formatFileSize(file.fileSize)}`}
                      </small>
                    </button>

                    <span className="flex-none text-[11px] text-[#8299aa] max-[760px]:hidden">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>

                    {contentScope === "all" && canViewAllContent ? (
                      <div className="flex flex-none items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate("/files")}
                          className="secondary-action compact-action inline-flex !min-h-[30px] !cursor-pointer items-center gap-1 !rounded-[8px] !px-2 text-[9px] font-semibold !text-[#2b72bd] hover:!border-[rgba(117,181,232,0.62)] hover:!bg-[linear-gradient(135deg,rgba(226,243,255,0.92),rgba(203,229,250,0.88))] hover:!text-[#1f659f]"
                          aria-label={`Manage file ${file.originalFileName}`}
                        >
                          <Settings2 aria-hidden="true" size={13} />
                          Manage
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteFile(file)}
                          className="secondary-action grid h-[30px] w-[30px] flex-none !cursor-pointer place-items-center !rounded-[8px] !p-0 !text-[#6b8295] hover:!border-[rgba(240,160,160,0.6)] hover:!bg-[rgba(255,235,235,0.85)] hover:!text-[#b4232d]"
                          aria-label={`Delete file ${file.originalFileName}`}
                          title="Delete file"
                        >
                          <Trash2 aria-hidden="true" size={13} />
                        </button>
                      </div>
                    ) : (
                      <ArrowRight
                        aria-hidden="true"
                        className="flex-none text-[#9cafbd]"
                        size={15}
                        strokeWidth={1.8}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
            {contentScope === "all" && canViewAllContent && allFilesCount > 0 && (
              <Pagination
                currentPage={allFilesPage}
                pageCount={allFilesPageCount}
                onPageChange={setAllFilesPage}
              />
            )}
          </section>
      </section>
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          src={recentFilePreviewUrls[previewFile.id]}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
