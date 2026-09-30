import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function Header({
  onToggleSidebar,
  isSidebarOpen,
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, account, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = user?.name || account?.name || "WinWire User";
  const email = user?.email || account?.username || "";
  const role = user?.role || "User";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get("search") ?? "");
  }, [location.search]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/dashboard?search=${encodeURIComponent(query)}` : "/dashboard");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] w-full items-center gap-4 border-b border-slate-800 bg-slate-950/95 px-4 sm:gap-6 sm:px-6">
      <div className="flex shrink-0 items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={isSidebarOpen}
          className="grid size-10 place-items-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 transition hover:bg-slate-700 hover:text-white md:hidden"
        >
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            {isSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>

        <img src="/winwire-logo.png" alt="WinCapture" className="h-auto w-32 sm:w-40" />
      </div>

      <form onSubmit={handleSearch} className="hidden min-w-0 max-w-[504px] flex-1 sm:block">
        <label className="flex h-10 items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 text-slate-400 transition focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/40">
          <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search photos, albums, or files..."
            aria-label="Search photos, albums, or files"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
          <kbd className="hidden rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 lg:block">Enter</kbd>
        </label>
      </form>

      {/* Right side: User information & Logout */}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-label={`Open ${displayName} profile menu`}
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-slate-800"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-600 bg-slate-800 text-xs font-semibold text-slate-100" aria-hidden="true">
              {initials || "U"}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-32 truncate text-xs font-semibold text-slate-100">{displayName}</span>
              <span className="block text-[10px] text-slate-400">{role}</span>
            </span>
            <svg className="hidden size-3.5 text-slate-400 sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl">
              {email && <p className="truncate px-2 py-1.5 text-xs text-slate-400">{email}</p>}
              <button type="button" onClick={() => { setProfileOpen(false); navigate("/profile"); }} className="block w-full rounded-md px-2 py-2 text-left text-sm text-slate-200 hover:bg-slate-800">My profile</button>
              <button type="button" onClick={() => void logout()} className="block w-full rounded-md px-2 py-2 text-left text-sm text-slate-200 hover:bg-slate-800">Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
