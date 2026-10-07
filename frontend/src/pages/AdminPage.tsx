import {
  FileText,
  FolderOpen,
  Images,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

import {
  getAdminAlbums,
  getAdminFiles,
} from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import { useAuth } from "../context/AuthContext";
import type { AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";
import {
  formatDate,
  formatFileSize,
} from "../utils/formatters";

export default function AdminPage() {
  const { instance } = useMsal();
  const { account } = useAuth();

  const [albums, setAlbums] =
    useState<AlbumResponse[]>([]);
  const [files, setFiles] =
    useState<FileResponse[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);

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
            getAdminAlbums(instance, account),
            getAdminFiles(instance, account),
          ]);

        setAlbums(albumResult);
        setFiles(fileResult);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load admin data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [account, instance]);

  if (loading) {
    return (
      <div className="app-page">
        <section className="skeleton-panel relative flex min-h-[174px] items-center justify-between overflow-hidden rounded-[20px] px-[30px] py-[28px] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.22)_52%,transparent_67%)] after:content-[''] max-[760px]:[min-height:auto] max-[760px]:px-5 max-[760px]:py-[22px]">
          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>

          <span className="skeleton-icon skeleton-icon-large" />
        </section>

        <section className="grid grid-cols-2 gap-[17px] max-[960px]:grid-cols-1">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="surface admin-list-skeleton"
            >
              <span className="skeleton-line skeleton-line-md" />
              <span className="skeleton-line skeleton-line-sm" />
              <span className="skeleton-line skeleton-line-sm" />
              <span className="skeleton-line skeleton-line-sm" />
            </div>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="app-page admin-page">
      <section className="surface relative flex min-h-[174px] items-center justify-between overflow-hidden rounded-[20px] px-[30px] py-[28px] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.22)_52%,transparent_67%)] after:content-[''] max-[760px]:[min-height:auto] max-[760px]:px-5 max-[760px]:py-[22px]">
        <div className="pointer-events-none absolute right-[-70px] top-[-130px] h-[230px] w-[230px] rounded-full bg-[rgba(119,177,246,0.15)] blur-[2px]" />
        <div className="pointer-events-none absolute bottom-[-155px] right-[26%] h-[190px] w-[190px] rounded-full bg-[rgba(213,230,249,0.35)] blur-[2px]" />

        <div className="relative z-[1]">
          <div className="page-kicker">
            <span className="page-kicker-dot" />
            Administration
          </div>

          <h1 className="page-heading">System overview</h1>

          <p className="page-description">
            Monitor the albums and files currently managed across
            WinCapture.
          </p>
        </div>

        <div className="relative z-[1] grid h-16 w-16 flex-none place-items-center rounded-[18px] border border-[rgba(194,218,237,0.72)] bg-[rgba(255,255,255,0.54)] text-[#397bc7] shadow-[0_12px_26px_rgba(46,101,150,0.075),inset_0_1px_rgba(255,255,255,0.8)] max-[760px]:h-[51px] max-[760px]:w-[51px] max-[760px]:rounded-[15px]">
          <ShieldCheck
            aria-hidden="true"
            size={31}
            strokeWidth={1.45}
          />
        </div>
      </section>

      {error && (
        <ErrorBanner
          message={error}
          icon={
            <AlertCircle
              aria-hidden="true"
              size={17}
              strokeWidth={1.8}
            />
          }
        />
      )}

      <section className="grid grid-cols-2 gap-[17px] max-[960px]:grid-cols-1">
        <section className="surface min-w-0 overflow-hidden rounded-[17px]">
          <div className="flex min-h-[70px] items-center justify-between gap-3 border-b border-[#e4edf4] px-[18px]">
            <div>
              <p className="dashboard-panel-kicker">
                Collections
              </p>

              <h2 className="mt-1 mb-0 text-[16px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
                Latest albums
              </h2>
            </div>

            <span className="inline-flex h-[27px] min-w-7 items-center justify-center rounded-full border border-[#dfeaf2] bg-[rgba(255,255,255,0.55)] px-2 text-[9px] font-semibold text-[#688096]">
              {albums.length}
            </span>
          </div>

          <div className="flex flex-col">
            {albums.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center gap-[11px] p-[22px]">
                <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[12px] bg-[#e9f3ff] text-[#2a7bd4]">
                  <Images
                    aria-hidden="true"
                    size={23}
                    strokeWidth={1.5}
                  />
                </span>

                <div>
                  <strong className="block text-[10px] font-[650] text-[#405a70]">No albums available</strong>

                  <p className="mt-1 text-[8px] text-[#8e9eaa]">
                    There are currently no albums to display.
                  </p>
                </div>
              </div>
            ) : (
              albums.slice(0, 5).map((album) => (
                <div
                  key={album.id}
                  className="flex min-h-[72px] items-center gap-[10px] border-b border-[#e6eef4] px-[15px] py-[10px] transition-[background,padding] duration-[170ms] hover:bg-[rgba(231,242,252,0.58)] hover:pl-[18px] last:border-b-0 max-[520px]:gap-[7px] max-[520px]:px-[11px]"
                >
                  <span className="grid h-[37px] w-[37px] flex-none place-items-center rounded-[11px] bg-[#eaf3ff] text-[#2b7ed8]">
                    <Images
                      aria-hidden="true"
                      size={17}
                      strokeWidth={1.7}
                    />
                  </span>

                  <div className="grid min-w-0 flex-1 gap-1">
                    <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#355269]" title={album.albumName}>
                      {album.albumName}
                    </strong>

                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[8px] text-[#879aa9]">Owner: {album.ownerName}</span>
                  </div>

                  <div className="grid flex-none gap-0.5 text-right max-[520px]:hidden">
                    <small className="text-[7px] text-[#a0aeb9]">Created</small>

                    <strong className="text-[8px] font-semibold text-[#73899b]">{formatDate(album.createdAt)}</strong>
                  </div>

                  <span className="flex-none text-[8px] text-[#9baab6] max-[520px]:hidden">
                    #{album.id}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="surface min-w-0 overflow-hidden rounded-[17px]">
          <div className="flex min-h-[70px] items-center justify-between gap-3 border-b border-[#e4edf4] px-[18px]">
            <div>
              <p className="dashboard-panel-kicker">
                Storage
              </p>

              <h2 className="mt-1 mb-0 text-[16px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
                Latest files
              </h2>
            </div>

            <span className="inline-flex h-[27px] min-w-7 items-center justify-center rounded-full border border-[#dfeaf2] bg-[rgba(255,255,255,0.55)] px-2 text-[9px] font-semibold text-[#688096]">
              {files.length}
            </span>
          </div>

          <div className="flex flex-col">
            {files.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center gap-[11px] p-[22px]">
                <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[12px] bg-[#efedff] text-[#6e65ce]">
                  <FileText
                    aria-hidden="true"
                    size={23}
                    strokeWidth={1.5}
                  />
                </span>

                <div>
                  <strong className="block text-[10px] font-[650] text-[#405a70]">No files available</strong>

                  <p className="mt-1 text-[8px] text-[#8e9eaa]">
                    There are currently no files to display.
                  </p>
                </div>
              </div>
            ) : (
              files.slice(0, 5).map((file) => (
                <div
                  key={file.id}
                  className="flex min-h-[72px] items-center gap-[10px] border-b border-[#e6eef4] px-[15px] py-[10px] transition-[background,padding] duration-[170ms] hover:bg-[rgba(231,242,252,0.58)] hover:pl-[18px] last:border-b-0 max-[520px]:gap-[7px] max-[520px]:px-[11px]"
                >
                  <span className="grid h-[37px] w-[37px] flex-none place-items-center rounded-[11px] bg-[#efedff] text-[#6c68d2]">
                    <FolderOpen
                      aria-hidden="true"
                      size={17}
                      strokeWidth={1.7}
                    />
                  </span>

                  <div className="grid min-w-0 flex-1 gap-1">
                    <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#355269]" title={file.originalFileName}>
                      {file.originalFileName}
                    </strong>

                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[8px] text-[#879aa9]">{file.contentType}</span>
                  </div>

                  <div className="grid flex-none gap-0.5 text-right max-[520px]:hidden">
                    <small className="text-[7px] text-[#a0aeb9]">Size</small>

                    <strong className="text-[8px] font-semibold text-[#73899b]">{formatFileSize(file.fileSize)}</strong>
                  </div>

                  <span className="flex-none text-[8px] text-[#9baab6] max-[520px]:hidden">
                    #{file.id}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
