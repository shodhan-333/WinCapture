import { useEffect, useState } from "react";
import { CalendarDays, FolderOpen, Images, ArrowUpRight } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import { useCreateAlbumMutation } from "@/features/albums/hooks/albumQueries";
import { ErrorBanner } from "@/shared/components/ui/ErrorBanner";
import { Pagination } from "@/shared/components/ui/Pagination";
import { SearchField } from "@/shared/components/ui/SearchField";
import { pageHeaderClass, pageHeaderSkeletonClass } from "@/shared/components/ui/uiClasses";
import { useAlbumCoverPreviews } from "@/features/albums/hooks/useAlbumCoverPreviews";
import { useAuth } from "@/features/auth";
import { getAccountKey } from "@/shared/utils/accountKey";
import { formatDate } from "@/shared/utils/formatters";
import { getAdminContentScope } from "@/shared/utils/adminContentScope";
import { useAlbumsData, type AlbumFilter } from "@/features/albums/hooks/useAlbumsData";

// Coordinate album search, filtering, creation, pagination, and cover previews.
export function AlbumsPage() {
  const { instance } = useMsal();
  const { account, user } = useAuth();
  const accountKey = getAccountKey(account);
  const createAlbumMutation = useCreateAlbumMutation({ instance, account, accountKey });
  const isAdminAllContent = user?.role === "Admin" && getAdminContentScope() === "all";
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [albumFilter, setAlbumFilter] = useState<AlbumFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const { albums, pageCount, totalItems, loading, hasLoaded, error, setError } = useAlbumsData({
    instance,
    account,
    accountKey,
    userId: user?.userId,
    isAdminAllContent,
    currentPage,
    albumFilter,
    searchQuery,
    setCurrentPage,
  });
  const coverUrls = useAlbumCoverPreviews(
    albums,
    instance,
    account,
    user?.userId,
    user?.role === "Admin",
  );

  useEffect(() => {
    // Debounce search so each keystroke does not trigger a separate API request.
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  // Create the requested album, clear the form, and open its detail route.
  const handleCreateAlbum = async () => {
    if (!account || !albumName.trim()) {
      setError("Album name is required.");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const created = await createAlbumMutation.mutateAsync({
        albumName: albumName.trim(),
      });

      setAlbumName("");

      navigate(`/albums/${created.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create album.");
    } finally {
      setCreating(false);
    }
  };

  // Use skeletons on the initial load; later requests keep the existing page visible.
  if (loading && !hasLoaded) {
    return (
      <div className="[width:min(1440px,_100%)] [margin:0_auto] [padding:28px_42px_64px] [display:flex] [flex-direction:column] [gap:18px] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[color:#193850] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[background-color:rgba(255,_255,_255,_0.45)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[-webkit-backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select]:[color:#193850] [&_select]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_select]:[background-color:rgba(255,_255,_255,_0.45)] [&_select]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_select]:[backdrop-filter:blur(12px)] [&_select]:[-webkit-backdrop-filter:blur(12px)] [&_select]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_textarea]:[color:#193850] [&_textarea]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_textarea]:[background-color:rgba(255,_255,_255,_0.45)] [&_textarea]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_textarea]:[backdrop-filter:blur(12px)] [&_textarea]:[-webkit-backdrop-filter:blur(12px)] [&_textarea]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_select:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_select:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_select:focus]:[outline-offset:1px] [&_textarea:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_textarea:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_textarea:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_textarea:focus]:[outline-offset:1px] max-[1200px]:[padding-right:28px] max-[1200px]:[padding-left:28px] max-[760px]:[padding:24px_17px_94px] max-[760px]:[gap:17px]">
        <section className={pageHeaderSkeletonClass}>
          <div className="[&::after]:[content:''] [&::after]:[position:absolute] [&::after]:[top:0] [&::after]:[bottom:0] [&::after]:[width:35%] [&::after]:[transform:translateX(-130%)] [&::after]:[background:linear-gradient(90deg,_transparent,_rgba(255,_255,_255,_0.5),_transparent)] animate-skeleton-shimmer [position:relative] [overflow:hidden] [width:min(600px,_100%)]">
            <span className="[display:block] [position:relative] [overflow:hidden] [height:9px] [border-radius:999px] [background:rgba(200,_222,_238,_0.65)] [&+&]:[margin-top:8px] [width:26%]" />
            <span className="[display:block] [position:relative] [overflow:hidden] [height:9px] [border-radius:999px] [background:rgba(200,_222,_238,_0.65)] [&+&]:[margin-top:8px] [width:68%] [height:19px]" />
            <span className="[display:block] [position:relative] [overflow:hidden] [height:9px] [border-radius:999px] [background:rgba(200,_222,_238,_0.65)] [&+&]:[margin-top:8px] [width:52%]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="[&::after]:[content:''] [&::after]:[position:absolute] [&::after]:[top:0] [&::after]:[bottom:0] [&::after]:[width:35%] [&::after]:[transform:translateX(-130%)] [&::after]:[background:linear-gradient(90deg,_transparent,_rgba(255,_255,_255,_0.5),_transparent)] animate-skeleton-shimmer [position:relative] [overflow:hidden] [width:160px] [height:40px] [display:inline-block] [border-radius:10px] [background:rgba(200,_222,_238,_0.65)]" />
            <span className="[&::after]:[content:''] [&::after]:[position:absolute] [&::after]:[top:0] [&::after]:[bottom:0] [&::after]:[width:35%] [&::after]:[transform:translateX(-130%)] [&::after]:[background:linear-gradient(90deg,_transparent,_rgba(255,_255,_255,_0.5),_transparent)] animate-skeleton-shimmer [position:relative] [overflow:hidden] [width:100px] [height:39px] [display:inline-block] [border-radius:10px] [background:rgba(200,_222,_238,_0.65)] [width:138px]" />
          </div>
        </section>

        <section className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <article
              key={item}
              className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] min-h-[270px] w-full min-w-0 cursor-pointer overflow-hidden rounded-[16px] p-0 text-left text-inherit transition-[transform,box-shadow,border-color] duration-[220ms] hover:-translate-y-1 hover:border-[rgba(180,209,231,0.75)] hover:shadow-[0_18px_38px_rgba(49,102,148,0.13),inset_0_0_0_1px_rgba(202,224,240,0.3)]"
            >
              <div className="relative h-[148px] w-full overflow-hidden bg-[linear-gradient(145deg,#e3edf5,#d7e5ef)] after:absolute after:top-0 after:bottom-0 after:w-[35%] after:translate-x-[-130%] after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.56),transparent)] after:animate-[skeleton-shimmer_1.55s_infinite_ease-in-out] after:content-['']" />

              <div className="p-4">
                <span className="[display:block] [position:relative] [overflow:hidden] [height:9px] [border-radius:999px] [background:rgba(200,_222,_238,_0.65)] [&+&]:[margin-top:8px] [width:26%]" />
                <span className="[display:block] [position:relative] [overflow:hidden] [height:9px] [border-radius:999px] [background:rgba(200,_222,_238,_0.65)] [&+&]:[margin-top:8px] [width:52%]" />
                <span className="[display:block] [position:relative] [overflow:hidden] [height:9px] [border-radius:999px] [background:rgba(200,_222,_238,_0.65)] [&+&]:[margin-top:8px] [width:42%]" />
              </div>
            </article>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="[width:min(1440px,_100%)] [margin:0_auto] [padding:28px_42px_64px] [display:flex] [flex-direction:column] [gap:18px] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[color:#193850] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[background-color:rgba(255,_255,_255,_0.45)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[-webkit-backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select]:[color:#193850] [&_select]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_select]:[background-color:rgba(255,_255,_255,_0.45)] [&_select]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_select]:[backdrop-filter:blur(12px)] [&_select]:[-webkit-backdrop-filter:blur(12px)] [&_select]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_textarea]:[color:#193850] [&_textarea]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_textarea]:[background-color:rgba(255,_255,_255,_0.45)] [&_textarea]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_textarea]:[backdrop-filter:blur(12px)] [&_textarea]:[-webkit-backdrop-filter:blur(12px)] [&_textarea]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_select:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_select:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_select:focus]:[outline-offset:1px] [&_textarea:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_textarea:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_textarea:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_textarea:focus]:[outline-offset:1px] max-[1200px]:[padding-right:28px] max-[1200px]:[padding-left:28px] max-[760px]:[padding:24px_17px_94px] max-[760px]:[gap:17px]">
      <section className={pageHeaderClass}>
        <div className="min-w-0">
          <h1 className="[margin:5px_0_0] [color:#0d3153] [font-size:26px] [line-height:1.16] [font-weight:700] [letter-spacing:-0.035em] max-[760px]:[font-size:22px] flex items-center gap-3">
            <span className="[width:6px] [height:6px] [border-radius:50%] [background:#398fe7] [box-shadow:0_0_0_4px_rgba(57,_143,_231,_0.09)]" aria-hidden="true" />
            Albums
          </h1>

          <p className="[max-width:640px] [margin:8px_0_0] [color:#70869a] [font-size:12px] [line-height:1.65] max-[760px]:[font-size:10px]">
            Organize your images and files into collections that are easy to access and share.
          </p>
        </div>

        <div className="flex flex-[0_1_430px] gap-2 max-[960px]:w-full max-[960px]:basis-auto max-[760px]:flex-col">
          <label htmlFor="new-album-name" className="sr-only">
            New album name
          </label>

          <input
            id="new-album-name"
            value={albumName}
            onChange={(event) => setAlbumName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !creating) {
                void handleCreateAlbum();
              }
            }}
            placeholder="New album name"
            className="[min-height:42px] [padding:0_13px] [color:#193850] [border:1px_solid_rgba(255,_255,_255,_0.58)] [border-radius:12px] [background:rgba(255,_255,_255,_0.45)] [outline:0] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)] [transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background_180ms_ease] [&::placeholder]:[color:#8fa5b7] [&:hover]:[background:rgba(255,_255,_255,_0.6)] [&:hover]:[border-color:rgba(255,_255,_255,_0.82)] [&:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&:focus]:[background:rgba(255,_255,_255,_0.72)] [&:focus]:[box-shadow:0_0_0_3px_rgba(30,_120,_214,_0.16),_inset_0_1px_1px_rgba(255,_255,_255,_0.9)] min-w-0 flex-1"
            maxLength={200}
          />

          <button
            type="button"
            onClick={() => void handleCreateAlbum()}
            disabled={creating}
            className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)] flex-none disabled:opacity-60 disabled:cursor-wait max-[760px]:w-full"
          >
            <Images aria-hidden="true" size={17} strokeWidth={1.8} />

            <span>{creating ? "Creating..." : "New album"}</span>
          </button>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      <section className="flex flex-wrap items-center justify-between gap-3 max-[760px]:items-stretch">
        {!isAdminAllContent && (
          <div
            className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:rgba(255,_255,_255,_0.28)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_4px_16px_rgba(24,_52,_78,_0.03)] [backdrop-filter:blur(16px)_saturate(160%)] [-webkit-backdrop-filter:blur(16px)_saturate(160%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] inline-flex flex-wrap gap-1 rounded-[11px] p-[3px]"
            role="group"
            aria-label="Album filters"
          >
            {(
              [
                ["all", "All"],
                ["shared", "Shared with me"],
                ["mine", "My albums"],
              ] as const
            ).map(([value, label]) => (
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
        )}

        <SearchField
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search albums"
          ariaLabel="Search albums"
          className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:rgba(255,_255,_255,_0.28)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_4px_16px_rgba(24,_52,_78,_0.03)] [backdrop-filter:blur(16px)_saturate(160%)] [-webkit-backdrop-filter:blur(16px)_saturate(160%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] flex min-h-[39px] w-[min(300px,100%)] items-center gap-2 rounded-[11px] px-[11px] text-[#8195a5] focus-within:border-[#87a9c2] focus-within:shadow-[0_0_0_3px_rgba(84,132,169,0.1)] max-[760px]:w-full"
          inputClassName="min-w-0 flex-1 border-0 bg-transparent text-[11px] text-[#284963] outline-none placeholder:text-[#8b9eae]"
          iconSize={15}
        />
      </section>

      <section className="min-w-0">
        {albums.length === 0 ? (
          <section className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] flex min-h-[300px] flex-col items-center justify-center rounded-[18px] px-[22px] py-[38px] text-center">
            <span className="grid h-[62px] w-[62px] place-items-center rounded-[19px] border border-white/80 bg-white/50 text-[#1b74d3] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_6px_18px_rgba(26,54,80,0.06)] backdrop-blur-md">
              <Images aria-hidden="true" size={28} strokeWidth={1.5} />
            </span>

            <h2 className="mt-4 mb-0 text-[15px] font-[650] text-[#29445d]">No albums available</h2>

            <p className="mt-[7px] mb-[18px] max-w-[390px] text-[10px] leading-[1.6] text-[#8497a7]">
              Create your first album to start organizing your WinCapture files.
            </p>

            <div className="albums-empty-actions">
              <button
                type="button"
                onClick={() => {
                  document.getElementById("new-album-name")?.focus();
                }}
                className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)]"
              >
                <Images aria-hidden="true" size={16} strokeWidth={1.8} />
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
                onClick={() => navigate(`/albums/${album.id}`)}
                className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] group w-full min-w-0 cursor-pointer overflow-hidden rounded-[16px] p-0 text-left text-inherit transition-[transform,box-shadow,border-color] duration-[220ms] hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.85)] hover:shadow-[0_16px_40px_rgba(20,48,72,0.09),inset_0_1px_1.5px_0_rgba(255,255,255,0.92),inset_0_-1px_1px_0_rgba(255,255,255,0.25)]"
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
                          <Images aria-hidden="true" size={28} strokeWidth={1.45} />
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
                        <FolderOpen aria-hidden="true" size={14} strokeWidth={1.7} />
                      </span>

                      <span className="grid min-w-0 gap-0.5">
                        <small className="text-[11px] text-[#869cb0]">Owner</small>
                        <strong
                          className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#3b5973]"
                          title={album.ownerName}
                        >
                          {album.ownerName}
                        </strong>
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-[9px] border border-white/60 bg-[rgba(255,255,255,0.5)] text-[#246bb1]">
                        <CalendarDays aria-hidden="true" size={14} strokeWidth={1.7} />
                      </span>

                      <span className="grid min-w-0 gap-0.5">
                        <small className="text-[11px] text-[#869cb0]">Created</small>
                        <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[#3b5973]">
                          {formatDate(album.createdAt)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-[13px] flex items-center justify-between gap-[10px] border-t border-[rgba(255,255,255,0.45)] pt-[11px] text-[8px] text-[#8299aa]">
                    <span>
                      {album.updatedAt ? `Updated ${formatDate(album.updatedAt)}` : "Not updated"}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[8px] font-semibold text-[#1a74d2]">
                      Open
                      <ArrowUpRight aria-hidden="true" size={13} strokeWidth={1.8} />
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
