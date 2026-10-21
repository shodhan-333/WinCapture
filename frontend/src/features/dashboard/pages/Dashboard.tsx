import { useCallback, useMemo, useState } from "react";
import { FolderOpen, Images } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { Link } from "react-router-dom";

import { getFilePreviewUrl } from "@/features/albums";
import { getFilePreviewUrlByPath } from "@/shared/api/previews";
import { FilePreviewModal, useFilePreviews } from "@/features/files";
import { ErrorBanner } from "@/shared/components/ui/ErrorBanner";
import { useAuth } from "@/features/auth";
import { useAlbumCoverPreviews } from "@/features/albums";
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
  "[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] group relative flex min-h-[78px] cursor-pointer items-center gap-2.5 overflow-hidden rounded-[16px] px-3 py-2 text-left transition-[transform,border-color,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.85)] hover:shadow-[0_16px_40px_rgba(20,48,72,0.09),inset_0_1px_1.5px_0_rgba(255,255,255,0.92),inset_0_-1px_1px_0_rgba(255,255,255,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3787d4] max-[760px]:min-h-[74px] max-[760px]:gap-2 max-[760px]:px-2.5 max-[760px]:py-2";

// Keep dashboard access role-driven. Add a role here when the backend grants it
// access to application-wide content management.
const dashboardRoleCapabilities: Record<UserRole, { canViewAllContent: boolean }> = {
  User: { canViewAllContent: false },
  Admin: { canViewAllContent: true },
};

// Combines dashboard data, previews, admin actions, and the album/file panels.
export function Dashboard() {
  const { instance } = useMsal();
  const { account, user } = useAuth();
  const accountKey = getAccountKey(account);
  const canViewAllContent = user
    ? (dashboardRoleCapabilities[user.role]?.canViewAllContent ?? false)
    : false;

  const [contentScope, setContentScope] = useState<"mine" | "all">(() => getAdminContentScope());
  const [allAlbumsPage, setAllAlbumsPage] = useState(1);
  const [allFilesPage, setAllFilesPage] = useState(1);
  const [allAlbumsSearch, setAllAlbumsSearch] = useState("");
  const [allFilesSearch, setAllFilesSearch] = useState("");
  const {
    albums,
    files,
    fileCategoryCounts,
    loading,
    hasLoaded,
    error: queryError,
    allAlbumsCount,
    allFilesCount,
    allAlbumsPageCount,
    allFilesPageCount,
  } = useDashboardData({
    instance,
    account,
    accountKey,
    canViewAllContent,
    contentScope,
    allAlbumsPage,
    allFilesPage,
    allAlbumsSearch,
    allFilesSearch,
    setAllAlbumsPage,
    setAllFilesPage,
  });

  // Keep these arrays stable while their source data is unchanged; preview query keys
  // reuse cached blobs when unrelated dashboard controls change.
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

  const { previewUrls: recentFilePreviewUrls } = useFilePreviews(recentFiles, loadFilePreview, accountKey);

  const { handleDeleteAlbum, handleDeleteFile, error: adminActionError } = useDashboardAdminActions({
    instance,
    account,
    canManageContent: canViewAllContent,
    resetAdminPages: () => {
      setAllAlbumsPage(1);
      setAllFilesPage(1);
    },
  });
  const error = adminActionError ?? queryError;

  const [previewFile, setPreviewFile] = useState<DashboardFile | null>(null);

  if (loading && !hasLoaded) {
    return (
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-6 py-7 max-[760px]:px-4">
        <section className="animate-skeleton-shimmer min-h-[138px] overflow-hidden rounded-[20px] border border-white/60 bg-white/35 p-6 shadow-[0_8px_30px_rgba(24,52,78,0.06)]" />
        <section className="grid grid-cols-2 gap-4 max-[760px]:gap-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="animate-skeleton-shimmer flex min-h-[76px] items-center gap-3 overflow-hidden rounded-[17px] border border-white/60 bg-white/35 p-3 shadow-[0_8px_30px_rgba(24,52,78,0.06)]"
            >
              <span className="h-[42px] w-[42px] rounded-[13px] bg-[rgba(200,222,238,0.65)]" />
              <span className="h-[22px] w-1/3 rounded-full bg-[rgba(200,222,238,0.65)]" />
              <span className="h-[22px] w-[30%] rounded-full bg-[rgba(200,222,238,0.65)]" />
            </div>
          ))}
        </section>
        <section className="grid grid-cols-2 gap-5 max-[960px]:grid-cols-1 max-[760px]:gap-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="animate-skeleton-shimmer min-h-[355px] overflow-hidden rounded-[18px] border border-white/60 bg-white/35 shadow-[0_8px_30px_rgba(24,52,78,0.06)]"
            />
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="[width:min(1440px,_100%)] [margin:0_auto] [padding:28px_42px_64px] [display:flex] [flex-direction:column] [gap:18px] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[color:#193850] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[background-color:rgba(255,_255,_255,_0.45)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[-webkit-backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select]:[color:#193850] [&_select]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_select]:[background-color:rgba(255,_255,_255,_0.45)] [&_select]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_select]:[backdrop-filter:blur(12px)] [&_select]:[-webkit-backdrop-filter:blur(12px)] [&_select]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_textarea]:[color:#193850] [&_textarea]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_textarea]:[background-color:rgba(255,_255,_255,_0.45)] [&_textarea]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_textarea]:[backdrop-filter:blur(12px)] [&_textarea]:[-webkit-backdrop-filter:blur(12px)] [&_textarea]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_select:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_select:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_select:focus]:[outline-offset:1px] [&_textarea:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_textarea:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_textarea:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_textarea:focus]:[outline-offset:1px] max-[1200px]:[padding-right:28px] max-[1200px]:[padding-left:28px] max-[760px]:[padding:24px_17px_94px] max-[760px]:[gap:17px] !gap-3">
      <section className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] relative flex min-h-[138px] items-center justify-between gap-4 overflow-hidden rounded-[20px] px-6 py-4 max-[960px]:flex-col max-[960px]:items-start max-[760px]:rounded-[17px] max-[760px]:px-4 max-[760px]:py-4">
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
              className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)] [min-height:36px] [padding-right:13px] [padding-left:13px] [font-size:11px] !min-h-[36px] !rounded-[10px] !px-3 text-[10px]"
            >
              <Images aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>Browse albums</span>
            </Link>
            <Link
              to="/files"
              className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#245277] [border:1px_solid_rgba(255,_255,_255,_0.58)] [background:rgba(255,_255,_255,_0.48)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.9),_0_3px_12px_rgba(24,_52,_78,_0.03)] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[color:#164063] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.68)] [&:hover:not(:disabled)]:[border-color:rgba(255,_255,_255,_0.88)] [&:hover:not(:disabled)]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.95),_0_5px_16px_rgba(24,_52,_78,_0.05)] [min-height:36px] [padding-right:13px] [padding-left:13px] [font-size:11px] !min-h-[36px] !rounded-[10px] !px-3 text-[10px]"
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
          className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] flex w-fit max-w-full flex-wrap items-center gap-1.5 rounded-[15px] p-1.5"
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
