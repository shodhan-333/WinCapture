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
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  brandMarkClass,
  brandMarkLetterClass,
  appShellClass,
} from "./ui/uiClasses";

const navLinkClass = (active: boolean) =>
  `group relative flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-transparent px-3 text-[13px] font-medium text-[#57728a] transition-[color,background,border-color,transform,box-shadow] duration-[180ms] hover:border-[rgba(180,209,235,0.34)] hover:bg-[rgba(226,239,251,0.72)] hover:text-[#126dd7] active:translate-y-px ${active ? "is-active border-[rgba(179,213,241,0.55)] bg-[linear-gradient(135deg,rgba(225,240,255,0.96),rgba(210,232,252,0.76))] font-semibold text-[#0872e7] shadow-[0_8px_18px_rgba(41,113,181,0.07),inset_0_1px_rgba(255,255,255,0.68)] before:absolute before:top-[9px] before:bottom-[9px] before:left-[-1px] before:w-[3px] before:rounded-[99px] before:bg-[#1680ef] before:content-['']" : ""}`;

const navIconClass =
  "grid h-7 w-7 flex-none place-items-center rounded-[9px] bg-[rgba(231,241,250,0.58)] text-current transition-[background,color] duration-[180ms] group-[.is-active]:bg-[rgba(255,255,255,0.62)] group-[.is-active]:text-[#0872e7]";

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

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const pageTitle = pathname.startsWith("/albums/")
    ? "Album details"
    : navigation.find((item) => item.to === pathname)?.label ??
      (pathname === "/admin" ? "Admin" : "Dashboard");

  const closeMobileNavigation = () => {
    setMobileOpen(false);
  };

  return (
    <div className={appShellClass}>
      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-[252px] min-w-[252px] flex-col border-r border-[rgba(137,174,210,0.25)] bg-[linear-gradient(180deg,rgba(252,254,255,0.9),rgba(246,251,255,0.78))] px-[15px] pt-[22px] pb-4 shadow-[10px_0_35px_rgba(47,97,143,0.055),inset_-1px_0_rgba(255,255,255,0.52)] backdrop-blur-[28px] transition-[transform,box-shadow] duration-[240ms] max-[960px]:w-56 max-[960px]:min-w-56 max-[760px]:-translate-x-[105%] max-[760px]:shadow-[12px_0_38px_rgba(28,68,101,0.15)] ${mobileOpen ? "max-[760px]:translate-x-0" : ""}`}
        aria-label="Primary navigation"
      >
        <div className="flex min-h-[46px] items-center justify-between px-[6px] pl-2">
          <NavLink
            to="/dashboard"
            className="inline-flex min-w-0 items-center gap-[11px] rounded-[14px] transition-[transform,opacity] duration-[180ms] hover:-translate-y-px hover:opacity-[0.96]"
            onClick={closeMobileNavigation}
            aria-label="WinCapture dashboard"
          >
            <span className={brandMarkClass} aria-hidden="true">
              <span className={brandMarkLetterClass}>W</span>
            </span>

            <span className="grid min-w-0 gap-0.5">
              <strong className="text-[15px] leading-[1.1] font-bold tracking-[-0.02em] text-[#102d4d]">WinCapture</strong>
              <small className="text-[9px] leading-none font-medium text-[#7b94aa]">WinWire</small>
            </span>
          </NavLink>

          <button
            type="button"
            className="hidden h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-0 bg-[rgba(231,241,250,0.65)] text-[#5d7890] transition-[color,background] duration-[180ms] hover:bg-[#e2effc] hover:text-[#166fd7] max-[760px]:inline-flex"
            onClick={closeMobileNavigation}
            aria-label="Close navigation"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>

        <nav className="mt-[30px] flex flex-col gap-[6px]">
          <p className="mx-[10px] mt-0 mb-[5px] text-[9px] leading-[1.2] font-bold tracking-[0.12em] text-[#8aa1b4] uppercase">Workspace</p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileNavigation}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <span className={navIconClass}>
                  <Icon
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.8}
                  />
                </span>

                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {user?.role === "Admin" && (
            <>
              <div className="mx-2 my-3 h-px bg-[rgba(204,222,237,0.72)]" />

              <p className="mx-[10px] mt-0 mb-[5px] text-[9px] leading-[1.2] font-bold tracking-[0.12em] text-[#8aa1b4] uppercase">
                Administration
              </p>

              <NavLink
                to="/admin"
                onClick={closeMobileNavigation}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <span className={navIconClass}>
                  <Shield
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.8}
                  />
                </span>

                <span>Admin</span>
              </NavLink>
            </>
          )}
        </nav>

      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[50] block h-full w-full cursor-pointer border-0 bg-[rgba(15,39,59,0.2)] backdrop-blur-[2px]"
          onClick={closeMobileNavigation}
          aria-label="Close navigation"
        />
      )}

      <div className="relative z-[1] ml-[252px] min-h-screen w-[calc(100%-252px)] max-[960px]:ml-56 max-[960px]:w-[calc(100%-224px)] max-[760px]:ml-0 max-[760px]:w-full">
        <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-[rgba(147,181,212,0.22)] bg-[rgba(250,253,255,0.46)] px-[40px] pr-[38px] shadow-[0_8px_26px_rgba(49,105,154,0.025)] backdrop-blur-[22px] max-[1200px]:px-7 max-[760px]:h-[68px] max-[760px]:px-[17px]">
          <div className="flex min-w-0 items-center gap-[15px] max-[760px]:gap-[9px]">
            <button
              type="button"
              className="hidden h-9 w-9 flex-none cursor-pointer place-items-center rounded-[10px] border-0 bg-[rgba(236,245,251,0.68)] text-[#567186] max-[760px]:grid"
              onClick={() =>
                setMobileOpen((current) => !current)
              }
              aria-label={
                mobileOpen
                  ? "Close navigation"
                  : "Open navigation"
              }
              aria-expanded={mobileOpen}
            >
              <Menu
                aria-hidden="true"
                size={21}
                strokeWidth={1.8}
              />
            </button>

            <h1 className="m-0 truncate text-[16px] font-[650] tracking-[-0.02em] text-[#22425d] max-[760px]:text-[14px]">
              {pageTitle}
            </h1>

          </div>

          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[linear-gradient(145deg,#74bdff,#4687db)] text-[10px] font-bold text-white">
              {user?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() ?? "U"}
            </span>
            <span className="grid min-w-0 gap-[2px] max-[520px]:hidden">
              <strong className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-[#284763]">
                {user?.name ?? "WinCapture User"}
              </strong>
              <small className="text-[9px] text-[#8299ab]">{user?.role ?? "User"}</small>
            </span>
            <button
              type="button"
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-[rgba(189,211,229,0.68)] bg-[rgba(255,255,255,0.38)] px-[11px] text-[11px] font-medium text-[#6b8297] transition-[color,background,border-color] duration-[180ms] hover:border-[rgba(221,150,150,0.48)] hover:bg-[rgba(255,245,245,0.62)] hover:text-[#b84d55]"
              onClick={() => void logout()}
            >
              <LogOut aria-hidden="true" size={15} strokeWidth={1.8} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

