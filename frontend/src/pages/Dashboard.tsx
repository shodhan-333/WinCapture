import { useEffect, useState } from "react";
import {
  ArrowRight,
  FolderOpen,
  Images,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import {
  getAdminFiles,
  getAlbums,
  getFiles,
} from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import { useAuth } from "../context/AuthContext";
import type { AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";
import {
  formatDate,
  formatFileSize,
  formatFileType,
} from "../utils/formatters";

const dashboardPanelClass =
  "surface min-w-0 overflow-hidden rounded-[18px]";
const dashboardPanelHeaderClass =
  "flex min-h-[73px] items-center justify-between gap-4 border-b border-[#e4edf4] px-[19px] max-[520px]:min-h-[63px] max-[520px]:px-[14px]";
const dashboardListRowClass =
  "flex min-h-[78px] w-full cursor-pointer items-center gap-[11px] border-0 border-b border-[#e6eef4] bg-transparent px-[17px] py-[11px] text-left text-inherit transition-[background,padding] duration-[170ms] hover:bg-[rgba(228,241,252,0.66)] hover:pl-5 last:border-b-0 max-[520px]:min-h-[68px] max-[520px]:px-3 max-[520px]:hover:pl-[14px]";
const dashboardIconClass =
  "grid h-[39px] w-[39px] flex-none place-items-center rounded-[11px] bg-[#e8f3ff] text-[#2c82e4] max-[520px]:h-[34px] max-[520px]:w-[34px]";

export default function Dashboard() {
  const { instance } = useMsal();
  const { account, user } = useAuth();
  const navigate = useNavigate();

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!account) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [albumResult, fileResult] =
          await Promise.all([
            getAlbums(instance, account),
            user?.role === "Admin"
              ? getAdminFiles(instance, account)
              : getFiles(instance, account),
          ]);

        setAlbums(albumResult);
        setFiles(fileResult);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [account, instance, user?.role]);

  if (loading) {
    return (
      <div className="app-page">
        <section className="skeleton-panel flex min-h-[218px] items-center justify-between p-[30px] max-[960px]:items-start max-[960px]:flex-col max-[760px]:[min-height:auto] max-[760px]:rounded-[17px] max-[760px]:px-5 max-[760px]:py-[23px]">
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

        <section className="grid grid-cols-2 gap-[14px] max-[760px]:gap-[10px]">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="skeleton-panel flex min-h-[118px] items-center gap-[13px] rounded-[17px] p-[18px] max-[760px]:min-h-[102px] max-[760px]:p-[14px] max-[520px]:min-h-[96px]"
            >
              <span className="skeleton-icon" />
              <span className="skeleton-line skeleton-line-sm" />
              <span className="skeleton-line skeleton-line-value" />
            </div>
          ))}
        </section>

        <section className="grid grid-cols-2 gap-[18px] max-[960px]:grid-cols-1 max-[760px]:gap-[13px]">
          <div className="skeleton-panel min-h-[355px] rounded-[18px]" />
          <div className="skeleton-panel min-h-[355px] rounded-[18px]" />
        </section>
      </div>
    );
  }

  return (
    <div className="app-page">
      <section className="surface after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.22)_52%,transparent_67%)] after:content-[''] relative flex min-h-[218px] items-stretch justify-between gap-7 overflow-hidden rounded-[21px] px-8 py-[30px] max-[960px]:items-start max-[960px]:flex-col max-[760px]:[min-height:auto] max-[760px]:rounded-[17px] max-[760px]:px-5 max-[760px]:py-[23px]">
        <div className="pointer-events-none absolute right-[-85px] top-[-130px] h-[280px] w-[280px] rounded-full bg-[rgba(100,182,255,0.16)] blur-[2px]" />
        <div className="pointer-events-none absolute right-[20%] bottom-[-180px] h-[220px] w-[220px] rounded-full bg-[rgba(188,222,255,0.18)] blur-[2px]" />

        <div className="relative z-[1] flex max-w-[740px] flex-col justify-center">
          <div className="mb-2 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.11em] text-[#6e8ba4]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#1b86ee] shadow-[0_0_0_4px_rgba(27,134,238,0.08)]" />
            Your workspace
          </div>

          <h1 className="m-0 text-[clamp(27px,3vw,39px)] leading-[1.08] font-bold tracking-[-0.045em] text-[#0b2f51] max-[760px]:text-[27px]">
            Welcome back,{" "}
            <span className="text-[#2278d7]">
              {user?.name ?? "User"}
            </span>
          </h1>

          <p className="mt-3 mb-0 max-w-[620px] text-[12px] leading-[1.7] text-[#6f879c] max-[760px]:text-[10px]">
            Keep your albums organized, manage your
            files, and access your shared collections
            from one place.
          </p>

          <div className="mt-5 flex flex-wrap gap-[9px] max-[760px]:w-full max-[760px]:[&>button]:flex-1">
            <button
              type="button"
              onClick={() => navigate("/albums")}
              className="primary-action"
            >
              <Images
                aria-hidden="true"
                size={17}
                strokeWidth={1.8}
              />
              <span>Browse albums</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/files")}
              className="secondary-action"
            >
              <FolderOpen
                aria-hidden="true"
                size={17}
                strokeWidth={1.8}
              />
              <span>Open files</span>
            </button>
          </div>
        </div>

      </section>

      {error && <ErrorBanner message={error} />}

      <section className="grid grid-cols-2 gap-[14px] max-[760px]:gap-[10px]">
        <button
          type="button"
          className="surface group relative flex min-h-[118px] cursor-pointer items-center gap-[13px] rounded-[17px] px-[18px] py-[18px] text-left transition-[transform,border-color,box-shadow] duration-[180ms] hover:-translate-y-0.5 hover:border-[rgba(169,205,231,0.62)] hover:shadow-[0_17px_34px_rgba(51,105,151,0.09),inset_0_0_0_1px_rgba(197,221,238,0.26)] max-[760px]:min-h-[102px] max-[760px]:p-[14px] max-[520px]:min-h-[96px]"
          onClick={() => navigate("/albums")}
        >
          <span className="grid h-[43px] w-[43px] flex-none place-items-center rounded-[13px] bg-[#e5f1ff] text-[#1678ec] max-[760px]:h-[37px] max-[760px]:w-[37px] max-[760px]:rounded-[11px]">
            <Images
              aria-hidden="true"
              size={19}
              strokeWidth={1.8}
            />
          </span>

          <span className="grid min-w-0 gap-1">
            <small className="text-[10px] font-semibold text-[#7d93a5]">Albums</small>
            <strong className="text-[22px] leading-[1.1] font-bold tracking-[-0.03em] text-[#143653] max-[760px]:text-[18px]">{albums.length}</strong>
          </span>

          <ArrowRight
            aria-hidden="true"
            className="ml-auto text-[#9aafbf] transition-[transform,color] duration-[180ms] group-hover:translate-x-0.5 group-hover:text-[#2679d5] max-[520px]:hidden"
            size={17}
            strokeWidth={1.8}
          />
        </button>

        <button
          type="button"
          className="surface group relative flex min-h-[118px] cursor-pointer items-center gap-[13px] rounded-[17px] px-[18px] py-[18px] text-left transition-[transform,border-color,box-shadow] duration-[180ms] hover:-translate-y-0.5 hover:border-[rgba(169,205,231,0.62)] hover:shadow-[0_17px_34px_rgba(51,105,151,0.09),inset_0_0_0_1px_rgba(197,221,238,0.26)] max-[760px]:min-h-[102px] max-[760px]:p-[14px] max-[520px]:min-h-[96px]"
          onClick={() => navigate("/files")}
        >
          <span className="grid h-[43px] w-[43px] flex-none place-items-center rounded-[13px] bg-[#edeaff] text-[#7162db] max-[760px]:h-[37px] max-[760px]:w-[37px] max-[760px]:rounded-[11px]">
            <FolderOpen
              aria-hidden="true"
              size={19}
              strokeWidth={1.8}
            />
          </span>

          <span className="grid min-w-0 gap-1">
            <small className="text-[10px] font-semibold text-[#7d93a5]">Files</small>
            <strong className="text-[22px] leading-[1.1] font-bold tracking-[-0.03em] text-[#143653] max-[760px]:text-[18px]">{files.length}</strong>
          </span>

          <ArrowRight
            aria-hidden="true"
            className="ml-auto text-[#9aafbf] transition-[transform,color] duration-[180ms] group-hover:translate-x-0.5 group-hover:text-[#2679d5]"
            size={17}
            strokeWidth={1.8}
          />
        </button>

      </section>

        <section className="grid grid-cols-2 gap-[18px] max-[960px]:grid-cols-1 max-[760px]:gap-[13px]">
        <section className={dashboardPanelClass}>
          <div className={dashboardPanelHeaderClass}>
            <div>
              <p className="dashboard-panel-kicker">
                Collections
              </p>

              <h2 className="mt-1 mb-0 text-[15px] font-[650] tracking-[-0.02em] text-[#153756]">
                Recent albums
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/albums")}
              className="inline-flex cursor-pointer items-center gap-[5px] border-0 bg-transparent text-[10px] font-semibold text-[#1572dd] hover:text-[#0b5fbf]"
            >
              View all
              <ArrowRight
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />
            </button>
          </div>

          <div className="flex flex-col">
            {albums.length === 0 ? (
              <div className="flex min-h-[230px] items-center justify-center gap-3 p-6">
                <span className="grid h-[45px] w-[45px] flex-none place-items-center rounded-[13px] bg-[#e8f3ff] text-[#2b7fd9]">
                  <Images
                    aria-hidden="true"
                    size={21}
                    strokeWidth={1.6}
                  />
                </span>

                <div className="min-w-0">
                  <strong className="block text-[11px] font-semibold text-[#334f68]">
                    No albums yet
                  </strong>

                  <p className="mt-[5px] max-w-[280px] text-[9px] leading-[1.5] text-[#8498a8]">
                    Create your first album to
                    start organizing your files.
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
              albums.slice(0, 4).map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/albums/${album.id}`,
                    )
                  }
                  className={dashboardListRowClass}
                >
                  <span className={`${dashboardIconClass} bg-[#e8f2ff] text-[#287bd7]`}>
                    <Images
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.7}
                    />
                  </span>

                  <span className="grid min-w-0 flex-1 gap-1">
                    <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-[#26445f]">
                      {album.albumName}
                    </strong>

                    <small className="overflow-hidden text-ellipsis whitespace-nowrap text-[9px] text-[#7c91a2]">
                      Owner: {album.ownerName}
                    </small>
                  </span>

                  <span className="flex-none text-[9px] text-[#8ca0b0] max-[760px]:hidden">
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

        <section className={dashboardPanelClass}>
          <div className={dashboardPanelHeaderClass}>
            <div>
              <p className="dashboard-panel-kicker">
                Your library
              </p>

              <h2 className="mt-1 mb-0 text-[15px] font-[650] tracking-[-0.02em] text-[#153756]">
                Recent files
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/files")}
              className="inline-flex cursor-pointer items-center gap-[5px] border-0 bg-transparent text-[10px] font-semibold text-[#1572dd] hover:text-[#0b5fbf]"
            >
              View all
              <ArrowRight
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />
            </button>
          </div>

          <div className="flex flex-col">
            {files.length === 0 ? (
              <div className="flex min-h-[230px] items-center justify-center gap-3 p-6">
                <span className="grid h-[45px] w-[45px] flex-none place-items-center rounded-[13px] bg-[#eeeaff] text-[#7161da]">
                  <FolderOpen
                    aria-hidden="true"
                    size={21}
                    strokeWidth={1.6}
                  />
                </span>

                <div className="min-w-0">
                  <strong className="block text-[11px] font-semibold text-[#334f68]">
                    No files uploaded yet
                  </strong>

                  <p className="mt-[5px] max-w-[280px] text-[9px] leading-[1.5] text-[#8498a8]">
                    Upload a file to see it
                    appear in your library.
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
              files.slice(0, 4).map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() =>
                    navigate("/files")
                  }
                  className={dashboardListRowClass}
                >
                  <span className={`${dashboardIconClass} bg-[#efedff] text-[#6b6bd8]`}>
                    {file.contentType.startsWith(
                      "image/",
                    ) ? (
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
                    <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-[#26445f]">
                      {file.originalFileName}
                    </strong>

                    <small className="overflow-hidden text-ellipsis whitespace-nowrap text-[9px] text-[#7c91a2]">
                      {formatFileType(
                        file.contentType,
                      )}
                      <span aria-hidden="true">
                        {" Â· "}
                      </span>
                      {formatFileSize(
                        file.fileSize,
                      )}
                    </small>
                  </span>

                  <span className="flex-none text-[9px] text-[#8ca0b0] max-[760px]:hidden">
                    {new Date(
                      file.uploadedAt,
                    ).toLocaleDateString()}
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

