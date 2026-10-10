import {
  FolderOpen,
  House,
  Images,
  LogOut,
  Menu,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";
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
  `group relative inline-flex min-h-[48px] ${
    mobile ? "w-full justify-start" : "shrink-0 justify-center"
  } items-center gap-2.5 rounded-xl border border-transparent px-4
  text-[14px] font-semibold
  transition-[color,background,border-color,box-shadow]
  duration-200
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-[#79b7f4]
  ${
    active
      ? "border-[rgba(179,213,241,0.65)] bg-[rgba(228,241,255,0.92)] text-[#0872e7] shadow-[0_4px_12px_rgba(41,113,181,0.07)] after:absolute after:bottom-[3px] after:left-4 after:right-4 after:h-[2px] after:rounded-full after:bg-[#1680ef] after:content-['']"
      : "bg-transparent text-[#526f89] hover:border-[rgba(180,209,235,0.45)] hover:bg-[rgba(230,241,251,0.7)] hover:text-[#126dd7]"
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileNavigation = () => {
    setMobileOpen(false);
  };

  return (
    <div className={appShellClass}>
      <div className="relative z-[1] flex min-h-screen w-full flex-col">
        {/* Full-width top header */}
        <header className="sticky top-0 z-40 w-full border-b border-[rgba(147,181,212,0.28)] bg-[rgba(250,253,255,0.88)] shadow-[0_5px_24px_rgba(49,105,154,0.035)] backdrop-blur-[24px]">
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
                    className={({ isActive }) =>
                      navLinkClass(isActive)
                    }
                  >
                    <Icon
                      aria-hidden="true"
                      size={21}
                      strokeWidth={1.8}
                    />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}

              {user?.role === "Admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    navLinkClass(isActive)
                  }
                >
                  <Shield
                    aria-hidden="true"
                    size={21}
                    strokeWidth={1.8}
                  />
                  <span>Admin</span>
                </NavLink>
              )}
            </nav>

            {/* Mobile navigation toggle */}
            <button
              type="button"
              className="hidden h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-xl border border-[rgba(189,211,229,0.65)] bg-white/65 text-[#476780] transition-colors hover:bg-[#e8f3ff] hover:text-[#126dd7] max-[1000px]:inline-flex"
              onClick={() =>
                setMobileOpen((current) => !current)
              }
              aria-label={
                mobileOpen
                  ? "Close navigation"
                  : "Open navigation"
              }
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
            <div className="ml-auto flex flex-none items-center gap-3 border-l border-[rgba(189,211,229,0.55)] pl-5 max-[1200px]:gap-2 max-[1200px]:pl-3 max-[760px]:border-l-0 max-[760px]:pl-0">
              <span
                className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[linear-gradient(145deg,#74bdff,#2876dc)] text-[12px] font-bold text-white shadow-[0_3px_9px_rgba(48,119,207,0.18)]"
                aria-hidden="true"
              >
                {user?.name
                  ?.split(/\s+/)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() ?? "U"}
              </span>

              <div className="grid min-w-0 gap-1 max-[760px]:hidden">
                <strong className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-semibold text-[#284763]">
                  {user?.name ?? "WinCapture User"}
                </strong>

                <span className="text-[10px] font-medium text-[#8299ab]">
                  {user?.role ?? "User"}
                </span>
              </div>

              <button
                type="button"
                className="inline-flex h-10 flex-none cursor-pointer items-center justify-center gap-2 rounded-xl border border-[rgba(189,211,229,0.75)] bg-[rgba(255,255,255,0.58)] px-3 text-[12px] font-medium text-[#58738b] transition-[color,background,border-color] duration-200 hover:border-[rgba(221,150,150,0.55)] hover:bg-[rgba(255,245,245,0.8)] hover:text-[#b84d55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79b7f4] max-[760px]:h-9 max-[760px]:px-2"
                onClick={() => void logout()}
              >
                <LogOut
                  aria-hidden="true"
                  size={17}
                  strokeWidth={1.8}
                />
                <span className="max-[600px]:sr-only">
                  Sign out
                </span>
              </button>
            </div>
          </div>

          {/* Collapsible mobile navigation */}
          {mobileOpen && (
            <nav
              id="mobile-primary-navigation"
              aria-label="Mobile navigation"
              className="border-t border-[rgba(147,181,212,0.24)] bg-[rgba(250,253,255,0.97)] px-4 py-3 min-[1001px]:hidden"
            >
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobileNavigation}
                      className={({ isActive }) =>
                        navLinkClass(isActive, true)
                      }
                    >
                      <Icon
                        aria-hidden="true"
                        size={20}
                        strokeWidth={1.8}
                      />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                {user?.role === "Admin" && (
                  <NavLink
                    to="/admin"
                    onClick={closeMobileNavigation}
                    className={({ isActive }) =>
                      navLinkClass(isActive, true)
                    }
                  >
                    <Shield
                      aria-hidden="true"
                      size={20}
                      strokeWidth={1.8}
                    />
                    <span>Admin</span>
                  </NavLink>
                )}
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