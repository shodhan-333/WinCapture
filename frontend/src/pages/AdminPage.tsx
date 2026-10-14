import { useEffect, useState } from "react";
import {
  AlertCircle,
  FileText,
  FolderOpen,
  Images,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import {
  getAdminAlbums,
  getAdminFiles,
  getMyAdminAlbums,
  getMyAdminFiles,
  deleteAlbum,
  deleteFile,
} from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import Pagination from "../components/ui/Pagination";
import { useAuth } from "../context/AuthContext";
import type { AlbumResponse } from "../types/album";
import type { AdminFileResponse } from "../types/file";
import { getAccountKey } from "../utils/accountKey";
import {
  formatDate,
  formatFileSize,
} from "../utils/formatters";

type ContentScope = "mine" | "all";
type ContentType = "albums" | "files";

const PAGE_SIZE = 10;

const scopeButtonClass = (active: boolean) =>
  `min-h-[34px] cursor-pointer rounded-[9px] border-0 px-[11px] text-[9px] font-semibold transition-[color,background,box-shadow] ${active ? "bg-white text-[#1e5f9c] shadow-[0_2px_7px_rgba(42,88,125,0.1)]" : "bg-transparent text-[#71879a] hover:text-[#315c7d]"}`;

export default function AdminPage() {
  const navigate = useNavigate();
  const { instance } = useMsal();
  const { account } = useAuth();
  const accountKey = getAccountKey(account);

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [files, setFiles] = useState<AdminFileResponse[]>([]);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [albumsPageCount, setAlbumsPageCount] = useState(1);
  const [filesPageCount, setFilesPageCount] = useState(1);
  const [scope, setScope] = useState<ContentScope>("mine");
  const [contentType, setContentType] = useState<ContentType>("albums");
  const [searchQuery, setSearchQuery] = useState("");
  const [albumsPage, setAlbumsPage] = useState(1);
  const [filesPage, setFilesPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!account) return;

      try {
        setLoading(true);
        setError(null);
        setAlbums([]);
        setFiles([]);

        const [albumResult, fileResult] = scope === "mine"
          ? await Promise.all([
              getMyAdminAlbums(instance, account, albumsPage, PAGE_SIZE, searchQuery),
              getMyAdminFiles(instance, account, filesPage, PAGE_SIZE, searchQuery),
            ])
          : await Promise.all([
              getAdminAlbums(instance, account, albumsPage, PAGE_SIZE, searchQuery),
              getAdminFiles(instance, account, filesPage, PAGE_SIZE, searchQuery),
            ]);

        if (!active) return;
        setAlbums(albumResult.items);
        setFiles(fileResult.items);
        setTotalAlbums(albumResult.totalItems);
        setTotalFiles(fileResult.totalItems);
        setAlbumsPage(albumResult.page);
        setFilesPage(fileResult.page);
        setAlbumsPageCount(albumResult.pageCount);
        setFilesPageCount(fileResult.pageCount);
      } catch (caughtError) {
        if (!active) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load admin data.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [accountKey, instance, scope, albumsPage, filesPage, searchQuery]);

  const changeScope = (nextScope: ContentScope) => {
    setScope(nextScope);
    setAlbumsPage(1);
    setFilesPage(1);
  };

  const changeContentType = (nextType: ContentType) => {
    setContentType(nextType);
    setAlbumsPage(1);
    setFilesPage(1);
  };

  const changeSearch = (value: string) => {
    setSearchQuery(value);
    setAlbumsPage(1);
    setFilesPage(1);
  };

  const handleDeleteAlbum = async (album: AlbumResponse) => {
    if (!account || !window.confirm(`Delete "${album.albumName}" and all its files? This cannot be undone.`)) return;
    try {
      setError(null);
      await deleteAlbum(instance, account, album.id);
      setAlbums((current) => current.filter((item) => item.id !== album.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? `${caughtError.message} The album remains listed, so you can retry after resolving the issue.` : "Unable to delete album. You can retry after resolving the issue.");
    }
  };

  const handleDeleteFile = async (file: AdminFileResponse) => {
    if (!account || !window.confirm(`Delete "${file.originalFileName}"? This cannot be undone.`)) return;
    try {
      setError(null);
      await deleteFile(instance, account, file.id);
      setFiles((current) => current.filter((item) => item.id !== file.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? `${caughtError.message} The file remains listed, so you can retry after resolving the issue.` : "Unable to delete file. You can retry after resolving the issue.");
    }
  };

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
            <div key={item} className="surface admin-list-skeleton">
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
            Monitor your content or review albums and files across WinCapture.
          </p>
        </div>

        <div className="relative z-[1] grid h-16 w-16 flex-none place-items-center rounded-[18px] border border-[rgba(194,218,237,0.72)] bg-[rgba(255,255,255,0.54)] text-[#397bc7] shadow-[0_12px_26px_rgba(46,101,150,0.075),inset_0_1px_rgba(255,255,255,0.8)] max-[760px]:h-[51px] max-[760px]:w-[51px] max-[760px]:rounded-[15px]">
          <ShieldCheck aria-hidden="true" size={31} strokeWidth={1.45} />
        </div>
      </section>

      {error && (
        <ErrorBanner
          message={error}
          icon={<AlertCircle aria-hidden="true" size={17} strokeWidth={1.8} />}
        />
      )}

      <section className="surface flex flex-wrap items-center gap-3 rounded-[14px] p-[12px] max-[760px]:items-stretch">
        <div className="inline-flex rounded-[11px] border border-[#dce8f0] bg-[rgba(244,248,251,0.8)] p-[3px]" role="group" aria-label="Content scope">
          <button type="button" aria-pressed={scope === "mine"} className={scopeButtonClass(scope === "mine")} onClick={() => changeScope("mine")}>My Content</button>
          <button type="button" aria-pressed={scope === "all"} className={scopeButtonClass(scope === "all")} onClick={() => changeScope("all")}>All Content</button>
        </div>

        <div className="inline-flex rounded-[11px] border border-[#dce8f0] bg-[rgba(244,248,251,0.8)] p-[3px]" role="group" aria-label="Content type">
          <button type="button" aria-pressed={contentType === "albums"} className={scopeButtonClass(contentType === "albums")} onClick={() => changeContentType("albums")}>
            <Images aria-hidden="true" className="mr-[5px] inline-block align-[-3px]" size={13} />Albums
          </button>
          <button type="button" aria-pressed={contentType === "files"} className={scopeButtonClass(contentType === "files")} onClick={() => changeContentType("files")}>
            <FolderOpen aria-hidden="true" className="mr-[5px] inline-block align-[-3px]" size={13} />Files
          </button>
        </div>

        <label className="ml-auto flex min-h-[38px] min-w-[min(260px,100%)] flex-1 items-center gap-2 rounded-[10px] border border-[#dbe8f1] bg-[rgba(255,255,255,0.63)] px-[10px] text-[#8195a5] shadow-[0_5px_14px_rgba(45,94,136,0.03)] focus-within:border-[#8bbdec] max-[760px]:ml-0 max-[760px]:basis-full">
          <Search aria-hidden="true" size={16} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder={`Search ${contentType}...`}
            aria-label={`Search ${contentType}`}
            className="w-full min-w-0 border-0 bg-transparent text-[10px] text-[#24445d] outline-none placeholder:text-[#98aab7]"
          />
        </label>
      </section>

      <section className="surface min-w-0 overflow-hidden rounded-[17px]">
        <header className="flex min-h-[70px] items-center justify-between gap-3 border-b border-[#e4edf4] px-[18px]">
          <div>
            <p className="dashboard-panel-kicker">
              {scope === "mine" ? "My Content" : "All Content"}
            </p>
            <h2 className="mt-1 mb-0 text-[16px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
              {contentType === "albums" ? "Albums" : "Files"}
            </h2>
          </div>
          <span className="inline-flex h-[27px] min-w-7 items-center justify-center rounded-full border border-[#dfeaf2] bg-[rgba(255,255,255,0.55)] px-2 text-[9px] font-semibold text-[#688096]">
            {contentType === "albums" ? totalAlbums : totalFiles}
          </span>
        </header>

        {contentType === "albums" ? (
          totalAlbums === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center gap-[11px] p-[22px]">
              <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[12px] bg-[#e9f3ff] text-[#2a7bd4]">
                <Images aria-hidden="true" size={23} strokeWidth={1.5} />
              </span>
              <div>
                <strong className="block text-[10px] font-[650] text-[#405a70]">
                  {searchQuery ? "No albums match your search" : "No albums available"}
                </strong>
                <p className="mt-1 text-[8px] text-[#8e9eaa]">
                  {searchQuery ? "Try another album name or owner." : "There are currently no albums in this scope."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {albums.map((album) => (
                <div key={album.id} className="flex min-h-[72px] items-center gap-[10px] border-b border-[#e6eef4] px-[15px] py-[10px] transition-[background,padding] duration-[170ms] hover:bg-[rgba(231,242,252,0.58)] hover:pl-[18px] last:border-b-0 max-[520px]:gap-[7px] max-[520px]:px-[11px]">
                  <span className="grid h-[37px] w-[37px] flex-none place-items-center rounded-[11px] bg-[#eaf3ff] text-[#2b7ed8]">
                    <Images aria-hidden="true" size={17} strokeWidth={1.7} />
                  </span>
                  <div className="grid min-w-0 flex-1 gap-1">
                    <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#355269]" title={album.albumName}>
                      {album.albumName}
                    </strong>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[8px] text-[#879aa9]">
                      Owner: {album.ownerName} (#{album.ownerId})
                    </span>
                  </div>
                  <div className="grid flex-none gap-0.5 text-right max-[520px]:hidden">
                    <small className="text-[7px] text-[#a0aeb9]">Created</small>
                    <strong className="text-[8px] font-semibold text-[#73899b]">{formatDate(album.createdAt)}</strong>
                  </div>
                  <span className="flex-none text-[8px] text-[#9baab6] max-[520px]:hidden">#{album.id}</span>
                  <div className="flex flex-none items-center gap-1">
                    <button type="button" onClick={() => navigate(`/albums/${album.id}`)} className="inline-flex min-h-[30px] items-center gap-1 rounded-[8px] border border-[#dce8f0] bg-[rgba(255,255,255,0.7)] px-2 text-[9px] font-semibold text-[#397bc7] hover:bg-white" aria-label={`Manage access to ${album.albumName}`} title="Open album and manage access">
                      <Settings2 aria-hidden="true" size={13} />Manage
                    </button>
                    <button type="button" onClick={() => void handleDeleteAlbum(album)} className="grid h-[30px] w-[30px] place-items-center rounded-[8px] border border-[#f0dada] bg-[rgba(255,255,255,0.7)] text-[#ae5555] hover:bg-[#fff1f1]" aria-label={`Delete album ${album.albumName}`} title="Delete album">
                      <Trash2 aria-hidden="true" size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : totalFiles === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center gap-[11px] p-[22px]">
            <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[12px] bg-[#efedff] text-[#6e65ce]">
              <FileText aria-hidden="true" size={23} strokeWidth={1.5} />
            </span>
            <div>
              <strong className="block text-[10px] font-[650] text-[#405a70]">
                {searchQuery ? "No files match your search" : "No files available"}
              </strong>
              <p className="mt-1 text-[8px] text-[#8e9eaa]">
                {searchQuery ? "Try another filename, uploader, or album." : "There are currently no files in this scope."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {files.map((file) => (
              <div key={file.id} className="flex min-h-[72px] items-center gap-[10px] border-b border-[#e6eef4] px-[15px] py-[10px] transition-[background,padding] duration-[170ms] hover:bg-[rgba(231,242,252,0.58)] hover:pl-[18px] last:border-b-0 max-[520px]:gap-[7px] max-[520px]:px-[11px]">
                <span className="grid h-[37px] w-[37px] flex-none place-items-center rounded-[11px] bg-[#efedff] text-[#6c68d2]">
                  <FolderOpen aria-hidden="true" size={17} strokeWidth={1.7} />
                </span>
                <div className="grid min-w-0 flex-1 gap-1">
                  <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#355269]" title={file.originalFileName}>
                    {file.originalFileName}
                  </strong>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[8px] text-[#879aa9]">
                    Uploaded by: {file.uploaderName} (#{file.uploadedBy})
                    {file.albumId !== null
                      ? ` \u00B7 Album: ${file.albumName ?? "Unknown album"} (#${file.albumId})`
                      : " \u00B7 Personal file"}
                  </span>
                </div>
                <div className="grid flex-none gap-0.5 text-right max-[520px]:hidden">
                  <small className="text-[7px] text-[#a0aeb9]">{file.contentType}</small>
                  <strong className="text-[8px] font-semibold text-[#73899b]">{formatFileSize(file.fileSize)}</strong>
                </div>
                <span className="flex-none text-[8px] text-[#9baab6] max-[520px]:hidden">#{file.id}</span>
                <button type="button" onClick={() => void handleDeleteFile(file)} className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[8px] border border-[#f0dada] bg-[rgba(255,255,255,0.7)] text-[#ae5555] hover:bg-[#fff1f1]" aria-label={`Delete file ${file.originalFileName}`} title="Delete file">
                  <Trash2 aria-hidden="true" size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {((contentType === "albums" && totalAlbums > 0) ||
          (contentType === "files" && totalFiles > 0)) && (
          <Pagination
            currentPage={contentType === "albums" ? albumsPage : filesPage}
            pageCount={contentType === "albums" ? albumsPageCount : filesPageCount}
            onPageChange={contentType === "albums" ? setAlbumsPage : setFilesPage}
          />
        )}
      </section>
    </div>
  );
}
