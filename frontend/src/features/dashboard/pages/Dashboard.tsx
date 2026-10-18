import { useCallback, useMemo, useState } from "react";
import { FolderOpen, Images } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { Link } from "react-router-dom";

import { getFilePreviewUrl } from "@/features/albums";
import { getFilePreviewUrlByPath } from "@/shared/api/previews";
import { FilePreviewModal, useFilePreviews } from "@/features/files";
import { ErrorBanner } from "@/shared/components/ui/ErrorBanner";
import { useAuth } from "@/features/auth";
import { useAlbumCoverPreviews, type AlbumResponse } from "@/features/albums";
import type { UserRole } from "@/features/auth";
import { getAccountKey } from "@/shared/utils/accountKey";
import { getAdminContentScope, setAdminContentScope } from "@/shared/utils/adminContentScope";
import { useDashboardAdminActions } from "@/features/dashboard/hooks/useDashboardAdminActions";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { DASHBOARD_FILE_CATEGORIES } from "@/features/dashboard/constants/dashboard";
import type { DashboardFile } from "@/features/dashboard/types/dashboard";
import { DashboardAlbumsPanel } from "@/features/dashboard/components/DashboardAlbumsPanel";
import { DashboardFilesPanel } from "@/features/dashboard/components/DashboardFilesPanel";

const dashboardStatCardClass =
  "surface group relative flex min-h-[78px] cursor-pointer items-center gap-2.5 overflow-hidden rounded-[16px] px-3 py-2 text-left transition-[transform,border-color,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.85)] hover:shadow-[var(--glass-shadow-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] max-[760px]:min-h-[74px] max-[760px]:gap-2 max-[760px]:px-2.5 max-[760px]:py-2";

// Keep dashboard access role-driven. Add a role here when the backend grants it
// access to application-wide content management.
const dashboardRoleCapabilities: Record<UserRole, { canViewAllContent: boolean }> = {
  User: { canViewAllContent: false },
  Admin: { canViewAllContent: true },
};

export function Dashboard() {
  const { instance } = useMsal();
  const { account, user } = useAuth();
  const accountKey = getAccountKey(account);
  const canViewAllContent = user
    ? (dashboardRoleCapabilities[user.role]?.canViewAllContent ?? false)
    : false;

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [files, setFiles] = useState<DashboardFile[]>([]);
  const [contentScope, setContentScope] = useState<"mine" | "all">(() => getAdminContentScope());
  const [contentVersion, setContentVersion] = useState(0);
  const [allAlbumsPage, setAllAlbumsPage] = useState(1);
  const [allFilesPage, setAllFilesPage] = useState(1);
  const [allAlbumsSearch, setAllAlbumsSearch] = useState("");
  const [allFilesSearch, setAllFilesSearch] = useState("");
  const [allAlbumsPageCount, setAllAlbumsPageCount] = useState(1);
  const [allFilesPageCount, setAllFilesPageCount] = useState(1);
  const [allAlbumsCount, setAllAlbumsCount] = useState(0);
  const [allFilesCount, setAllFilesCount] = useState(0);
  const { fileCategoryCounts, loading, hasLoaded, error, setError } = useDashboardData({
    instance,
    account,
    accountKey,
    canViewAllContent,
    contentScope,
    contentVersion,
    allAlbumsPage,
    allFilesPage,
    allAlbumsSearch,
    allFilesSearch,
    setAlbums,
    setFiles,
    setAllAlbumsPage,
    setAllFilesPage,
    setAllAlbumsPageCount,
    setAllFilesPageCount,
    setAllAlbumsCount,
    setAllFilesCount,
  });

  // Keep these arrays stable while their source data is unchanged. The preview
  // hooks use the array reference as an effect dependency and should not restart
  // their network requests after unrelated dashboard state updates.
  const recentAlbums = useMemo(
    () =>
      [...albums].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [albums],
  );
  const recentFiles = useMemo(
    () =>
      [...files].sort((left, right) => Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt)),
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
    (file: DashboardFile) => {
      if (!account) {
        throw new Error("An authenticated account is required.");
      }

      if (contentScope === "all" && canViewAllContent) {
        const path =
          file.albumId == null
            ? `/api/files/${file.id}/download`
            : `/api/albums/${file.albumId}/files/${file.id}/download`;
        return getFilePreviewUrlByPath(instance, account, path, file.contentType);
      }

      return getFilePreviewUrl(instance, account, file.id);
    },
    // Keep this callback stable when MSAL refreshes the same account object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountKey, canViewAllContent, contentScope, instance],
  );

  const { previewUrls: recentFilePreviewUrls } = useFilePreviews(recentFiles, loadFilePreview);

  const { handleDeleteAlbum, handleDeleteFile } = useDashboardAdminActions({
    instance,
    account,
    canManageContent: canViewAllContent,
    setAlbums,
    setFiles,
    resetAdminPages: () => {
      setAllAlbumsPage(1);
      setAllFilesPage(1);
    },
    refreshContent: () => setContentVersion((version) => version + 1),
    setError,
  });

  const [previewFile, setPreviewFile] = useState<DashboardFile | null>(null);

  // Keep the dashboard layout stable after its initial load.
  if (loading && !hasLoaded) {
    return (
      <div className="app-page !gap-3">
        <section className="skeleton-panel flex min-h-[138px] items-center justify-between rounded-[20px] p-6">
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
              className="skeleton-panel flex min-h-[76px] items-center gap-3 rounded-[17px] p-[10px]"
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
            Welcome back, <span className="text-[#397eaf]">{user?.name ?? "User"}</span>
          </h1>
          <p className="mb-0 mt-2 max-w-[620px] text-[12px] leading-[1.55] text-[#687f91] max-[760px]:mt-2 max-[760px]:text-[11px]">
            Keep your albums organized, manage your files, and access your shared collections from
            one place.
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
            onClick={() => {
              setAdminContentScope("mine");
              setContentScope("mine");
            }}
            className={`min-h-10 rounded-[10px] px-3.5 text-sm font-semibold transition-colors ${contentScope === "mine" ? "bg-white/80 text-[#145a99] shadow-sm" : "text-[#617c91] hover:bg-white/40"}`}
          >
            My Content
          </button>
          <button
            type="button"
            aria-pressed={contentScope === "all"}
            onClick={() => {
              setAdminContentScope("all");
              setContentScope("all");
            }}
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
        {DASHBOARD_FILE_CATEGORIES.map(({ label, icon: CategoryIcon }) => (
          <div key={label} className={`${dashboardStatCardClass} rounded-[15px]`}>
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
        <DashboardAlbumsPanel
          albums={recentAlbums}
          coverUrls={albumCoverUrls}
          contentScope={contentScope}
          canViewAllContent={canViewAllContent}
          albumCount={allAlbumsCount}
          search={allAlbumsSearch}
          page={allAlbumsPage}
          pageCount={allAlbumsPageCount}
          onSearchChange={(value) => {
            setAllAlbumsSearch(value);
            setAllAlbumsPage(1);
          }}
          onPageChange={setAllAlbumsPage}
          onDelete={(album) => void handleDeleteAlbum(album)}
        />
        <DashboardFilesPanel
          files={recentFiles}
          previewUrls={recentFilePreviewUrls}
          contentScope={contentScope}
          canViewAllContent={canViewAllContent}
          fileCount={allFilesCount}
          search={allFilesSearch}
          page={allFilesPage}
          pageCount={allFilesPageCount}
          onSearchChange={(value) => {
            setAllFilesSearch(value);
            setAllFilesPage(1);
          }}
          onPageChange={setAllFilesPage}
          onPreview={setPreviewFile}
          onDelete={(file) => void handleDeleteFile(file)}
        />
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
