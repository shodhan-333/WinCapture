import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  FolderOpen,
  Images,
  ArrowUpRight,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import { createAlbum, getAlbums, getMyAlbums, getSharedAlbums } from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import Pagination from "../components/ui/Pagination";
import SearchField from "../components/ui/SearchField";
import {
  pageHeaderClass,
  pageHeaderSkeletonClass,
} from "../components/ui/uiClasses";
import useAlbumCoverPreviews from "../hooks/useAlbumCoverPreviews";
import { useAuth } from "../context/AuthContext";
import type { AlbumResponse } from "../types/album";
import type { PagedResponse } from "../types/api";
import { ApiError } from "../types/api";
import { formatDate } from "../utils/formatters";
import { getAccountKey } from "../utils/accountKey";

const PAGE_SIZE = 9;
type AlbumFilter = "all" | "shared" | "mine";

export default function AlbumsPage() {
  const { instance } = useMsal();
  const { account, user } = useAuth();
  const accountKey = getAccountKey(account);
  const navigate = useNavigate();

  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [albumFilter, setAlbumFilter] = useState<AlbumFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const loadRequestVersion = useRef(0);
  const coverUrls = useAlbumCoverPreviews(
    albums,
    instance,
    account,
    user?.userId,
    user?.role === "Admin",
  );

  const loadAlbums = async (
    requestedPage: number = currentPage,
    requestedFilter: AlbumFilter = albumFilter,
    requestedSearch: string = searchQuery,
  ) => {
    const requestVersion = ++loadRequestVersion.current;
    if (!account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let page: PagedResponse<AlbumResponse>;
      if (requestedFilter === "shared") {
        try {
          page = await getSharedAlbums(
            instance,
            account,
            requestedPage,
            PAGE_SIZE,
            requestedSearch,
          );
        } catch (caughtError) {
          // Fall back only when the shared-albums endpoint is missing; other API
          // errors should be surfaced instead of being treated as a deployment mismatch.
          if (!(caughtError instanceof ApiError) || caughtError.status !== 404 || !user?.userId) {
            throw caughtError;
          }

          // The accessible-albums endpoint still checks view permission. Load its
          // pages and filter out albums owned by the current user until the
          // shared-albums endpoint is available in the deployed backend.
          const firstPage = await getAlbums(instance, account, 1, 100, requestedSearch);
          if (requestVersion !== loadRequestVersion.current) return;
          const accessibleAlbums = [...firstPage.items];
          for (let pageNumber = 2; pageNumber <= firstPage.pageCount; pageNumber += 1) {
            const nextPage = await getAlbums(instance, account, pageNumber, 100, requestedSearch);
            if (requestVersion !== loadRequestVersion.current) return;
            accessibleAlbums.push(...nextPage.items);
          }

          const sharedAlbums = accessibleAlbums.filter((item) => item.ownerId !== user.userId);
          const startIndex = (requestedPage - 1) * PAGE_SIZE;
          page = {
            items: sharedAlbums.slice(startIndex, startIndex + PAGE_SIZE),
            totalItems: sharedAlbums.length,
            page: requestedPage,
            pageSize: PAGE_SIZE,
            pageCount: Math.ceil(sharedAlbums.length / PAGE_SIZE),
          };
        }
      } else {
        const loadPage = requestedFilter === "mine" ? getMyAlbums : getAlbums;
        page = await loadPage(
          instance,
          account,
          requestedPage,
          PAGE_SIZE,
          requestedSearch,
        );
      }
      if (requestVersion !== loadRequestVersion.current) return;
      setAlbums(page.items);
      setCurrentPage(page.page);
      setPageCount(page.pageCount);
      setTotalItems(page.totalItems);
    } catch (caughtError) {
      if (requestVersion !== loadRequestVersion.current) return;
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load albums.",
      );
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    void loadAlbums(currentPage, albumFilter, searchQuery);
    return () => {
      loadRequestVersion.current += 1;
    };
  }, [accountKey, instance, currentPage, albumFilter, searchQuery]);

  useEffect(() => {
    // Debounce search so each keystroke does not trigger a separate API request.
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const handleCreateAlbum = async () => {
    if (!account || !albumName.trim()) {
      setError("Album name is required.");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const created = await createAlbum(
        instance,
        account,
        {
          albumName: albumName.trim(),
        },
      );

      setAlbumName("");

      navigate(
        `/albums/${created.id}`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create album.",
      );
    } finally {
      setCreating(false);
    }
  };

  // Use skeletons on the initial load; later requests keep the existing page visible.
  if (loading && !hasLoaded) {
    return (
      <div className="app-page">
        <section className={pageHeaderSkeletonClass}>
          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>

          <div className="flex items-center gap-2">
            <span className="skeleton-field" />
            <span className="skeleton-button skeleton-button-wide" />
          </div>
        </section>

        <section className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
          {[1, 2, 3, 4, 5, 6].map(
            (item) => (
              <article
                key={item}
                className="surface min-h-[270px] w-full min-w-0 cursor-pointer overflow-hidden rounded-[16px] p-0 text-left text-inherit transition-[transform,box-shadow,border-color] duration-[220ms] hover:-translate-y-1 hover:border-[rgba(180,209,231,0.75)] hover:shadow-[0_18px_38px_rgba(49,102,148,0.13),inset_0_0_0_1px_rgba(202,224,240,0.3)]"
              >
                <div className="relative h-[148px] w-full overflow-hidden bg-[linear-gradient(145deg,#e3edf5,#d7e5ef)] after:absolute after:top-0 after:bottom-0 after:w-[35%] after:translate-x-[-130%] after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.56),transparent)] after:animate-[skeleton-shimmer_1.55s_infinite_ease-in-out] after:content-['']" />

                <div className="p-4">
                  <span className="skeleton-line skeleton-line-sm" />
                  <span className="skeleton-line skeleton-line-md" />
                  <span className="skeleton-line skeleton-line-xs" />
                </div>
              </article>
            ),
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="app-page">
      <section className={pageHeaderClass}>
        <div className="min-w-0">
          <h1 className="page-heading flex items-center gap-3">
            <span className="page-kicker-dot" aria-hidden="true" />
            Albums
          </h1>

          <p className="page-description">
            Organize your images and files into
            collections that are easy to access
            and share.
          </p>
        </div>

        <div className="flex flex-[0_1_430px] gap-2 max-[960px]:w-full max-[960px]:basis-auto max-[760px]:flex-col">
          <label
            htmlFor="new-album-name"
            className="sr-only"
          >
            New album name
          </label>

          <input
            id="new-album-name"
            value={albumName}
            onChange={(event) =>
              setAlbumName(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !creating
              ) {
                void handleCreateAlbum();
              }
            }}
            placeholder="New album name"
            className="field min-w-0 flex-1"
            maxLength={200}
          />

          <button
            type="button"
            onClick={() =>
              void handleCreateAlbum()
            }
            disabled={creating}
            className="primary-action flex-none disabled:opacity-60 disabled:cursor-wait max-[760px]:w-full"
          >
            <Images
              aria-hidden="true"
              size={17}
              strokeWidth={1.8}
            />

            <span>
              {creating
                ? "Creating..."
                : "New album"}
            </span>
          </button>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      <section className="flex flex-wrap items-center justify-between gap-3 max-[760px]:items-stretch">
        <div className="glass-toolbar inline-flex flex-wrap gap-1 rounded-[11px] p-[3px]" role="group" aria-label="Album filters">
          {([
            ["all", "All"],
            ["shared", "Shared with me"],
            ["mine", "My albums"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={albumFilter === value}
              onClick={() => {
                setAlbumFilter(value);
                setCurrentPage(1);
              }}
              className={`min-h-[33px] rounded-[8px] border px-3 text-[10px] font-semibold transition-[color,background,box-shadow,border-color] ${albumFilter === value ? "border-white/80 bg-white/70 text-[#145a99] shadow-[0_3px_12px_rgba(20,54,84,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]" : "border-transparent bg-transparent text-[#557086] hover:bg-white/30 hover:text-[#194b75]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <SearchField
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search albums"
          ariaLabel="Search albums"
          className="glass-toolbar flex min-h-[39px] w-[min(300px,100%)] items-center gap-2 rounded-[11px] px-[11px] text-[#8195a5] focus-within:border-[#87a9c2] focus-within:shadow-[0_0_0_3px_rgba(84,132,169,0.1)] max-[760px]:w-full"
          inputClassName="min-w-0 flex-1 border-0 bg-transparent text-[11px] text-[#284963] outline-none placeholder:text-[#8b9eae]"
          iconSize={15}
        />
      </section>

      <section className="min-w-0">
        {albums.length === 0 ? (
          <section className="surface flex min-h-[300px] flex-col items-center justify-center rounded-[18px] px-[22px] py-[38px] text-center">
            <span className="grid h-[62px] w-[62px] place-items-center rounded-[19px] border border-white/80 bg-white/50 text-[#1b74d3] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_6px_18px_rgba(26,54,80,0.06)] backdrop-blur-md">
              <Images
                aria-hidden="true"
                size={28}
                strokeWidth={1.5}
              />
            </span>

            <h2 className="mt-4 mb-0 text-[15px] font-[650] text-[#29445d]">No albums available</h2>

            <p className="mt-[7px] mb-[18px] max-w-[390px] text-[10px] leading-[1.6] text-[#8497a7]">
              Create your first album to start
              organizing your WinCapture files.
            </p>

            <div className="albums-empty-actions">
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById(
                      "new-album-name",
                    )
                    ?.focus();
                }}
                className="primary-action"
              >
                <Images
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.8}
                />
                Create album
              </button>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
            {albums.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/albums/${album.id}`,
                    )
                  }
                  className="surface group w-full min-w-0 cursor-pointer overflow-hidden rounded-[16px] p-0 text-left text-inherit transition-[transform,box-shadow,border-color] duration-[220ms] hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.85)] hover:shadow-[var(--glass-shadow-raised)]"
                >
                <div className="relative h-[148px] overflow-hidden max-[760px]:h-[132px] max-[520px]:h-[148px]">
                  <div className="relative grid h-full w-full place-items-center overflow-hidden bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_35%),linear-gradient(145deg,rgba(215,238,255,0.7)_0%,rgba(180,218,250,0.5)_48%,rgba(215,235,250,0.65)_100%)]">
                    {coverUrls[album.id] ? (
                      <img
                        src={coverUrls[album.id]}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <>
                        <span className="absolute right-[-22px] top-[-92px] h-[170px] w-[170px] rounded-full bg-[rgba(75,158,237,0.24)] blur-[1px]" />
                        <span className="absolute bottom-[-78px] left-[-23px] h-[125px] w-[125px] rounded-full bg-[rgba(255,255,255,0.36)] blur-[1px]" />

                        <span className="relative z-[1] grid h-[61px] w-[61px] place-items-center rounded-[18px] border border-[rgba(255,255,255,0.8)] bg-[rgba(255,255,255,0.55)] text-[#1b74d3] shadow-[0_8px_20px_rgba(26,54,80,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md">
                          <Images
                            aria-hidden="true"
                            size={28}
                            strokeWidth={1.45}
                          />
                        </span>
                      </>
                    )}
                  </div>


                </div>

                <div className="px-[15px] pt-[15px] pb-[13px] max-[760px]:p-3">
                  <h3
                    className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-[1.3] font-[650] text-[#183b59]"
                    title={album.albumName}
                  >
                    {album.albumName}
                  </h3>

                  <div className="mt-[15px] grid grid-cols-2 gap-[9px] border-t border-[rgba(255,255,255,0.45)] pt-3 max-[760px]:grid-cols-1 max-[760px]:gap-[7px]">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-[9px] border border-white/60 bg-[rgba(255,255,255,0.5)] text-[#246bb1]">
                        <FolderOpen
                          aria-hidden="true"
                          size={14}
                          strokeWidth={1.7}
                        />
                      </span>

                      <span className="grid min-w-0 gap-0.5">
                        <small className="text-[11px] text-[#869cb0]">Owner</small>
                        <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#3b5973]"
                          title={
                            album.ownerName
                          }
                        >
                          {album.ownerName}
                        </strong>
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-[9px] border border-white/60 bg-[rgba(255,255,255,0.5)] text-[#246bb1]">
                        <CalendarDays
                          aria-hidden="true"
                          size={14}
                          strokeWidth={1.7}
                        />
                      </span>

                      <span className="grid min-w-0 gap-0.5">
                        <small className="text-[11px] text-[#869cb0]">Created</small>
                        <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#3b5973]">
                          {formatDate(
                            album.createdAt,
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-[13px] flex items-center justify-between gap-[10px] border-t border-[rgba(255,255,255,0.45)] pt-[11px] text-[8px] text-[#8299aa]">
                    <span>
                      {album.updatedAt
                        ? `Updated ${formatDate(
                            album.updatedAt,
                          )}`
                        : "Not updated"}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[8px] font-semibold text-[#1a74d2]">
                      Open
                      <ArrowUpRight
                        aria-hidden="true"
                        size={13}
                        strokeWidth={1.8}
                      />
                    </span>
                  </div>
                </div>
                </button>
            ))}
          </div>
        )}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            pageCount={pageCount}
            onPageChange={setCurrentPage}
          />
        )}
      </section>
    </div>
  );
}
