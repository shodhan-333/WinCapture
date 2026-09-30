import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

interface NavigationItem {
  label: string;
  path: string;
  icon: (active: boolean) => ReactNode;
  adminOnly?: boolean;
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-5 transition ${
        active ? "text-cyan-400" : "text-slate-400"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function AlbumsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-5 transition ${
        active ? "text-cyan-400" : "text-slate-400"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
      />
    </svg>
  );
}

function FilesIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-5 transition ${
        active ? "text-cyan-400" : "text-slate-400"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-5 transition ${
        active ? "text-cyan-400" : "text-slate-400"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function AdminIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-5 transition ${
        active ? "text-amber-400" : "text-slate-400"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const { user } = useAuth();

  const isAdmin = user?.role === "Admin";

  const navigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: (active) => <DashboardIcon active={active} />,
    },
    {
      label: "Albums",
      path: "/albums",
      icon: (active) => <AlbumsIcon active={active} />,
    },
    {
      label: "My Files",
      path: "/files",
      icon: (active) => <FilesIcon active={active} />,
    },
    {
      label: "My Profile",
      path: "/profile",
      icon: (active) => <ProfileIcon active={active} />,
    },
    {
      label: "Admin Portal",
      path: "/admin",
      adminOnly: true,
      icon: (active) => <AdminIcon active={active} />,
    },
  ];

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-900/95 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6 md:hidden">
          <span className="text-sm font-bold text-white">
            Menu
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1 text-slate-400 hover:text-white"
          >
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 p-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                  isActive
                    ? item.adminOnly
                      ? "border border-amber-500/30 bg-amber-950/40 text-amber-200 shadow-sm"
                      : "border border-cyan-500/30 bg-cyan-950/40 text-cyan-200 shadow-sm"
                    : "border border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon(isActive)}

                  <span>{item.label}</span>

                  {item.adminOnly && (
                    <span className="ml-auto rounded bg-amber-900/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                      Admin
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800/80 p-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-[11px] font-medium text-slate-400">
              Connected
            </p>

            <p className="mt-0.5 text-xs text-slate-300">
              Microsoft Entra ID
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}