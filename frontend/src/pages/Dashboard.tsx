import { useCallback, useEffect, useState } from "react";
import { ArrowRight, FolderOpen, Images } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import {
  getMyAlbums,
  getFilePreviewUrl,
  getFiles,
} from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import { useAuth } from "../context/AuthContext";
import useAlbumCoverPreviews from "../hooks/useAlbumCoverPreviews";
import useFilePreviews from "../hooks/useFilePreviews";
import type { AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";
import {
  formatDate,
  formatFileSize,
  formatFileType,
} from "../utils/formatters";
import { getAccountKey } from "../utils/accountKey";

const dashboardPanelClass =
  "relative isolate min-w-0 overflow-hidden rounded-[26px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.70),rgba(255,255,255,0.44)_52%,rgba(232,244,255,0.42))] shadow-[0_22px_58px_rgba(43,94,137,0.10),inset_0_1px_0_rgba(255,255,255,0.96),inset_0_0_0_1px_rgba(178,210,234,0.16)] backdrop-blur-[30px]";

const dashboardPanelHeaderClass =
  "flex min-h-[82px] items-center justify-between gap-4 border-b border-[rgba(190,216,236,0.52)] bg-[rgba(255,255,255,0.27)] px-6 backdrop-blur-[24px] max-[520px]:min-h-[72px] max-[520px]:px-4";

const dashboardListRowClass =
  "group/row flex min-h-[82px] w-full cursor-pointer items-center gap-3 border-b border-[rgba(193,216,234,0.46)] bg-[rgba(255,255,255,0.10)] px-5 py-3 text-left text-inherit transition-[background,box-shadow] duration-200 hover:bg-[rgba(225,241,255,0.48)] hover:shadow-[inset_3px_0_0_rgba(55,139,230,0.55)] last:border-b-0 focus-visible:bg-[rgba(225,241,255,0.54)] max-[520px]:min-h-[72px] max-[520px]:px-4";

const dashboardIconClass =
  "grid h-[46px] w-[46px] flex-none place-items-center overflow-hidden rounded-[15px] border border-white/90 bg-[rgba(231,243,255,0.74)] text-[#267fe2] shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_8px_18px_rgba(66,131,188,0.09)] backdrop-blur-[18px] max-[520px]:h-[40px] max-[520px]:w-[40px] max-[520px]:rounded-[13px]";

const dashboardStatCardClass =
  "group relative flex min-h-[132px] cursor-pointer items-center gap-4 overflow-hidden rounded-[25px] border border-white/80 bg-[linear-gradient(142deg,rgba(255,255,255,0.73),rgba(255,255,255,0.48)_52%,rgba(230,243,255,0.45))] px-6 py-5 text-left shadow-[0_20px_48px_rgba(53,105,150,0.085),inset_0_1px_0_rgba(255,255,255,0.98)] backdrop-blur-[30px] transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(141,193,233,0.86)] hover:shadow-[0_26px_54px_rgba(51,105,151,0.14),inset_0_1px_0_rgba(255,255,255,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#80b8ee] max-[760px]:min-h-[112px] max-[760px]:gap-3 max-[760px]:px-4 max-[760px]:py-4 max-[520px]:min-h-[102px]";

const dashboardViewAllClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/80 bg-white/35 px-3 py-2 text-[12px] font-semibold text-[#1572dd] transition-colors hover:bg-white/75 hover:text-[#0b5fbf] max-[520px]:px-2.5 max-[520px]:text-[11px]";

export default function Dashboard() {
  const { instance } = useMsal();
  const { account, user } = useAuth();
  const accountKey = getAccountKey(account);
  const navigate = useNavigate();

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [albumCount, setAlbumCount] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recentAlbums = albums;
  const recentFiles = files;

  const albumCoverUrls = useAlbumCoverPreviews(
    recentAlbums,
    instance,
    account,
    user?.userId,
  );

  const loadFilePreview = useCallback(
    (file: FileResponse) => {
      if (!account) {
        throw new Error("An authenticated account is required.");
      }

      return getFilePreviewUrl(instance, account, file.id);
    },
    [accountKey, instance],
  );

  const { previewUrls: recentFilePreviewUrls } = useFilePreviews(
    recentFiles,
    loadFilePreview,
  );

  useEffect(() => {
    let active = true;

    async function load() {
      if (!account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [albumResult, fileResult] = await Promise.all([
          getMyAlbums(instance, account, 1, 4),
          getFiles(instance, account, 1, 4),
        ]);

        if (!active) return;

        setAlbums(albumResult.items);
        setFiles(fileResult.items);
        setAlbumCount(albumResult.totalItems);
        setFileCount(fileResult.totalItems);
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
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [account?.homeAccountId, instance]);

  if (loading) {
    return (
      <div className="app-page">
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
              className="skeleton-panel flex min-h-[118px] items-center gap-[13px] rounded-[17px] p-[18px] max-[760px]:min-h-[102px] max-[760px]:p-[14px]"
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
    <div className="app-page relative isolate before:pointer-events-none before:absolute before:inset-[-28px] before:-z-10 before:bg-[radial-gradient(ellipse_at_7%_3%,rgba(100,180,255,0.17),transparent_36%),radial-gradient(ellipse_at_94%_18%,rgba(169,151,255,0.14),transparent_34%)] before:content-['']">
      {/* Welcome hero */}
      <section className="relative isolate flex min-h-[246px] items-stretch justify-between gap-8 overflow-hidden rounded-[30px] border border-white/85 bg-[linear-gradient(128deg,rgba(255,255,255,0.78),rgba(239,248,255,0.55)_47%,rgba(222,234,255,0.47)_76%,rgba(236,231,255,0.42))] px-9 py-8 shadow-[0_28px_76px_rgba(45,100,151,0.14),inset_0_1px_0_rgba(255,255,255,0.98),inset_0_0_0_1px_rgba(177,213,240,0.18)] backdrop-blur-[34px] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(116deg,rgba(255,255,255,0.38),transparent_26%,transparent_64%,rgba(255,255,255,0.28))] after:content-[''] max-[960px]:flex-col max-[960px]:items-start max-[760px]:rounded-[23px] max-[760px]:px-5 max-[760px]:py-6">
        <div className="pointer-events-none absolute right-[-72px] top-[-136px] h-[320px] w-[320px] rounded-full bg-[rgba(99,181,255,0.19)] blur-[5px]" />
        <div className="pointer-events-none absolute right-[19%] bottom-[-190px] h-[280px] w-[280px] rounded-full bg-[rgba(177,170,255,0.16)] blur-[10px]" />
        <div className="pointer-events-none absolute bottom-[-145px] left-[28%] h-[210px] w-[210px] rounded-full bg-[rgba(143,220,255,0.14)] blur-[10px]" />

        <div className="relative z-[1] flex max-w-[740px] flex-col justify-center">
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/85 bg-white/45 px-3 py-[7px] text-[10px] font-bold uppercase tracking-[0.12em] text-[#66839d] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_6px_16px_rgba(65,118,159,0.04)] backdrop-blur-[18px]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#1b86ee] shadow-[0_0_0_4px_rgba(27,134,238,0.08)]" />
            Your workspace
          </div>

          <h1 className="m-0 text-[clamp(32px,3.6vw,46px)] font-bold leading-[1.06] tracking-[-0.05em] text-[#0b2f51] max-[760px]:text-[31px]">
            Welcome back,{" "}
            <span className="text-[#2278d7]">
              {user?.name ?? "User"}
            </span>
          </h1>

          <p className="mb-0 mt-4 max-w-[620px] text-[14px] leading-[1.75] text-[#657f97] max-[760px]:mt-3 max-[760px]:text-[12px]">
            Keep your albums organized, manage your files, and access your
            shared collections from one place.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 max-[760px]:mt-5 max-[760px]:w-full max-[760px]:[&>button]:flex-1">
            <button
              type="button"
              onClick={() => navigate("/albums")}
              className="primary-action !min-h-[46px] !rounded-[14px] !px-5 shadow-[0_10px_24px_rgba(20,105,223,0.22),inset_0_1px_0_rgba(255,255,255,0.28)]"
            >
              <Images aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>Browse albums</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/files")}
              className="secondary-action !min-h-[46px] !rounded-[14px] !border-white/90 !bg-white/60 !px-5 !shadow-[0_8px_20px_rgba(43,100,147,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-[20px]"
            >
              <FolderOpen aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>Open files</span>
            </button>
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      {/* Glass statistics */}
      <section className="grid grid-cols-2 gap-4 max-[760px]:gap-[10px]">
        <button
          type="button"
          className={dashboardStatCardClass}
          onClick={() => navigate("/albums")}
        >
          <span className="grid h-[54px] w-[54px] flex-none place-items-center rounded-[18px] border border-white/90 bg-[linear-gradient(145deg,rgba(228,242,255,0.96),rgba(207,230,255,0.68))] text-[#1678ec] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_9px_20px_rgba(66,131,188,0.10)] backdrop-blur-[18px] max-[760px]:h-[43px] max-[760px]:w-[43px] max-[760px]:rounded-[14px]">
            <Images aria-hidden="true" size={19} strokeWidth={1.8} />
          </span>

          <span className="grid min-w-0 gap-1">
            <small className="text-[12px] font-semibold tracking-[0.01em] text-[#71889c] max-[760px]:text-[11px]">
              Albums
            </small>
            <strong className="text-[29px] font-bold leading-[1.08] tracking-[-0.045em] text-[#143653] max-[760px]:text-[23px]">
              {albumCount}
            </strong>
          </span>

          <ArrowRight
            aria-hidden="true"
            className="ml-auto text-[#9aafbf] transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-[#2679d5] max-[520px]:hidden"
            size={17}
            strokeWidth={1.8}
          />
        </button>

        <button
          type="button"
          className={dashboardStatCardClass}
          onClick={() => navigate("/files")}
        >
          <span className="grid h-[54px] w-[54px] flex-none place-items-center rounded-[18px] border border-white/90 bg-[linear-gradient(145deg,rgba(239,235,255,0.96),rgba(220,214,255,0.72))] text-[#7162db] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_9px_20px_rgba(114,98,219,0.10)] backdrop-blur-[18px] max-[760px]:h-[43px] max-[760px]:w-[43px] max-[760px]:rounded-[14px]">
            <FolderOpen aria-hidden="true" size={19} strokeWidth={1.8} />
          </span>

          <span className="grid min-w-0 gap-1">
            <small className="text-[12px] font-semibold tracking-[0.01em] text-[#71889c] max-[760px]:text-[11px]">
              Files
            </small>
            <strong className="text-[29px] font-bold leading-[1.08] tracking-[-0.045em] text-[#143653] max-[760px]:text-[23px]">
              {fileCount}
            </strong>
          </span>

          <ArrowRight
            aria-hidden="true"
            className="ml-auto text-[#9aafbf] transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-[#2679d5]"
            size={17}
            strokeWidth={1.8}
          />
        </button>
      </section>

      {/* Recent collections and files */}
      <section className="grid grid-cols-2 gap-5 max-[960px]:grid-cols-1 max-[760px]:gap-4">
        {/* Recent albums */}
        <section className={dashboardPanelClass}>
          <div className={dashboardPanelHeaderClass}>
            <div>
              <p className="dashboard-panel-kicker">Collections</p>
              <h2 className="mb-0 mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#153756] max-[520px]:text-[16px]">
                Recent albums
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/albums")}
              className={dashboardViewAllClass}
            >
              View all
              <ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />
            </button>
          </div>

          <div className="flex flex-col">
            {albums.length === 0 ? (
              <div className="flex min-h-[250px] items-center justify-center gap-4 bg-white/10 p-7 max-[520px]:flex-wrap max-[520px]:p-5">
                <span className="grid h-[54px] w-[54px] flex-none place-items-center rounded-[18px] border border-white/80 bg-[linear-gradient(145deg,rgba(233,245,255,0.96),rgba(214,234,255,0.74))] text-[#2b7fd9] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_rgba(66,131,188,0.08)]">
                  <Images aria-hidden="true" size={21} strokeWidth={1.6} />
                </span>

                <div className="min-w-0">
                  <strong className="block text-[14px] font-semibold tracking-[-0.01em] text-[#334f68]">
                    No albums yet
                  </strong>
                  <p className="mb-0 mt-1.5 max-w-[300px] text-[12px] leading-[1.6] text-[#8498a8]">
                    Create your first album to start organizing your files.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/albums")}
                  className="secondary-action compact-action"
                >
                  Open albums
                </button>
              </div>
            ) : (
              recentAlbums.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => navigate(`/albums/${album.id}`)}
                  className={dashboardListRowClass}
                >
                  <span className={`${dashboardIconClass} relative bg-[#e8f2ff] text-[#287bd7]`}>
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

                  <span className="grid min-w-0 flex-1 gap-1">
                    <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-[#26445f] max-[520px]:text-[12px]">
                      {album.albumName}
                    </strong>
                    <small className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#7c91a2] max-[520px]:text-[10px]">
                      Owner: {album.ownerName}
                    </small>
                  </span>

                  <span className="flex-none text-[11px] text-[#8299aa] max-[760px]:hidden">
                    {formatDate(album.createdAt)}
                  </span>

                  <ArrowRight
                    aria-hidden="true"
                    className="flex-none text-[#9cafbd]"
                    size={15}
                    strokeWidth={1.8}
                  />
                </button>
              ))
            )}
          </div>
        </section>

        {/* Recent files */}
        <section className={dashboardPanelClass}>
          <div className={dashboardPanelHeaderClass}>
            <div>
              <p className="dashboard-panel-kicker">Your library</p>
              <h2 className="mb-0 mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#153756] max-[520px]:text-[16px]">
                Recent files
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/files")}
              className={dashboardViewAllClass}
            >
              View all
              <ArrowRight aria-hidden="true" size={14} strokeWidth={1.8} />
            </button>
          </div>

          <div className="flex flex-col">
            {files.length === 0 ? (
              <div className="flex min-h-[250px] items-center justify-center gap-4 bg-white/10 p-7 max-[520px]:flex-wrap max-[520px]:p-5">
                <span className="grid h-[54px] w-[54px] flex-none place-items-center rounded-[18px] border border-white/80 bg-[linear-gradient(145deg,rgba(241,237,255,0.96),rgba(223,218,255,0.74))] text-[#7161da] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_rgba(114,98,219,0.08)]">
                  <FolderOpen
                    aria-hidden="true"
                    size={21}
                    strokeWidth={1.6}
                  />
                </span>

                <div className="min-w-0">
                  <strong className="block text-[14px] font-semibold tracking-[-0.01em] text-[#334f68]">
                    No files uploaded yet
                  </strong>
                  <p className="mb-0 mt-1.5 max-w-[300px] text-[12px] leading-[1.6] text-[#8498a8]">
                    Upload a file to see it appear in your library.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/files")}
                  className="secondary-action compact-action"
                >
                  Open files
                </button>
              </div>
            ) : (
              recentFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => navigate("/files")}
                  className={dashboardListRowClass}
                >
                  <span className={`${dashboardIconClass} relative bg-[#efedff] text-[#6b6bd8]`}>
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
                  </span>

                  <span className="grid min-w-0 flex-1 gap-1">
                    <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-[#26445f] max-[520px]:text-[12px]">
                      {file.originalFileName}
                    </strong>
                    <small className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#7c91a2] max-[520px]:text-[10px]">
                      {formatFileType(file.contentType)}
                      <span aria-hidden="true">{" \u00B7 "}</span>
                      {formatFileSize(file.fileSize)}
                    </small>
                  </span>

                  <span className="flex-none text-[11px] text-[#8299aa] max-[760px]:hidden">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </span>

                  <ArrowRight
                    aria-hidden="true"
                    className="flex-none text-[#9cafbd]"
                    size={15}
                    strokeWidth={1.8}
                  />
                </button>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
