import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function Header({
  onToggleSidebar,
  isSidebarOpen,
}: HeaderProps) {
  const { user, account, logout } = useAuth();

  const displayName = user?.name || account?.name || "WinWire User";
  const email = user?.email || account?.username || "";
  const role = user?.role || "User";
  const isAdmin = role === "Admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
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

        {/* WinWire / WinCapture Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 font-bold text-white shadow-md shadow-cyan-500/20">
            W
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                WinCapture
              </span>
              <span className="hidden rounded-md bg-cyan-950 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-300 border border-cyan-800/50 sm:inline-block">
                ENTERPRISE
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-400 sm:block">
              WinWire Media Portal
            </p>
          </div>
        </div>
      </div>

      {/* Right side: User information & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="max-w-[140px] truncate text-xs font-semibold text-slate-200 sm:max-w-xs sm:text-sm">
              {displayName}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                isAdmin
                  ? "border border-amber-600/50 bg-amber-950/60 text-amber-300"
                  : "border border-slate-700 bg-slate-800 text-slate-300"
              }`}
            >
              {role}
            </span>
          </div>
          {email && (
            <p className="hidden truncate text-[11px] text-slate-400 sm:block sm:max-w-xs">
              {email}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          aria-label="Sign out"
          title="Sign out of WinCapture"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
        >
          <svg
            className="size-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
