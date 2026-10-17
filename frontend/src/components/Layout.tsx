import { FolderOpen, House, Images, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { appShellClass } from "./ui/uiClasses";

const navigation = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: House,
  },
  {
    to: "/albums",
    label: "Albums",
    icon: Images,
  },
  {
    to: "/files",
    label: "Files",
    icon: FolderOpen,
  },
];

const navLinkClass = (active: boolean, mobile = false) =>
  `group relative inline-flex min-h-[46px] ${
    mobile ? "w-full justify-start" : "shrink-0 justify-center"
  } items-center gap-2.5 rounded-xl border px-4
  text-[14px] font-semibold
  transition-[color,background,border-color,box-shadow,transform]
  duration-200
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-[#3787d4]
  ${
    active
      ? "border-[rgba(255,255,255,0.85)] bg-[rgba(255,255,255,0.55)] text-[#12589b] shadow-[0_4px_16px_rgba(20,54,84,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md after:absolute after:bottom-[3px] after:left-4 after:right-4 after:h-[2px] after:rounded-full after:bg-[#1f7bda] after:content-['']"
      : "border-transparent bg-transparent text-[#44627b] hover:border-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.35)] hover:text-[#18538a]"
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);

  const closeMobileNavigation = () => {
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !profileMenuRef.current?.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        profileTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  return (
    <div className={appShellClass}>
      <div className="relative z-[1] flex min-h-screen w-full flex-col">
        {/* Full-width top header */}
        <header className="glass-chrome sticky top-0 z-40 w-full border-b border-[rgba(255,255,255,0.55)]">
          <div className="mx-auto flex min-h-[82px] w-full items-center gap-5 px-8 max-[1200px]:gap-3 max-[960px]:min-h-[72px] max-[760px]:gap-3 max-[760px]:px-4">
            {/* Project logo only: no WinWire branding or WinCapture text */}
            <NavLink
              to="/dashboard"
              aria-label="Go to dashboard"
              className="flex h-[58px] w-[165px] flex-none items-center justify-start rounded-lg transition-opacity hover:opacity-85 max-[1200px]:w-[135px] max-[760px]:h-[48px] max-[760px]:w-[80px]"
              onClick={closeMobileNavigation}
            >
              <img
                src="/wincapture-logo.png"
                alt="Project logo"
                className="block max-h-[52px] max-w-full object-contain object-left max-[760px]:max-h-[44px]"
              />
            </NavLink>

            {/* Desktop navigation */}
            <nav
              aria-label="Primary navigation"
              className="flex min-w-0 flex-1 items-center justify-center gap-1 max-[1000px]:hidden"
            >
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => navLinkClass(isActive)}
                  >
                    <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile navigation toggle */}
            <button
              type="button"
              className="hidden h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-xl border border-[rgba(255,255,255,0.65)] bg-white/45 text-[#3b5973] backdrop-blur-md transition-colors hover:bg-white/70 hover:text-[#126dd7] max-[1000px]:inline-flex"
              onClick={() => setMobileOpen((current) => !current)}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-primary-navigation"
            >
              {mobileOpen ? (
                <X aria-hidden="true" size={22} />
              ) : (
                <Menu aria-hidden="true" size={22} />
              )}
            </button>

            {/* Account controls */}
            <div
              ref={profileMenuRef}
              className="relative ml-auto flex flex-none items-center border-l border-[rgba(189,211,229,0.45)] pl-5 max-[1200px]:pl-3 max-[760px]:border-l-0 max-[760px]:pl-0"
            >
              <button
                ref={profileTriggerRef}
                type="button"
                className="inline-flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-transparent p-1 text-left transition-colors hover:border-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3787d4] max-[1200px]:gap-2"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-label={`Profile menu for ${user?.name ?? "WinCapture User"}`}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                <span
                  className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[linear-gradient(135deg,#54a6ff,#1b6ecf)] text-[12px] font-bold text-white shadow-[0_4px_12px_rgba(27,110,207,0.22),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  aria-hidden="true"
                >
                  {user?.name
                    ?.split(/\s+/)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() ?? "U"}
                </span>

                <span className="grid min-w-0 gap-1 max-[760px]:hidden">
                  <strong className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-semibold text-[#183955]">
                    {user?.name ?? "WinCapture User"}
                  </strong>
                  <span className="text-[10px] font-medium text-[#658299]">
                    {user?.role ?? "User"}
                  </span>
                </span>
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="Profile options"
                  className="glass-popover absolute right-0 top-full z-[60] mt-2 min-w-[150px] rounded-xl p-1.5"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="danger-gradient-action flex min-h-[30px] w-full items-center justify-center gap-1.5 rounded-[8px] px-2.5 text-[10px] font-semibold transition-[transform,box-shadow] duration-[160ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79b7f4]"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      void logout();
                    }}
                  >
                    <LogOut aria-hidden="true" size={14} strokeWidth={1.8} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible mobile navigation */}
          {mobileOpen && (
            <nav
              id="mobile-primary-navigation"
              aria-label="Mobile navigation"
              className="border-t border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.72)] px-4 py-3 backdrop-blur-2xl min-[1001px]:hidden"
            >
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobileNavigation}
                      className={({ isActive }) => navLinkClass(isActive, true)}
                    >
                      <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </nav>
          )}
        </header>

        {/* Existing page content remains unchanged */}
        <main className="app-main min-w-0 w-full flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
