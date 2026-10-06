import {
  FolderOpen,
  House,
  Images,
  LogOut,
  Menu,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/formatters";

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

  const closeMobileNavigation = () => {
    setMobileOpen(false);
  };

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
        aria-label="Primary navigation"
      >
        <div className="sidebar-brand">
          <NavLink
            to="/dashboard"
            className="brand-link"
            onClick={closeMobileNavigation}
            aria-label="WinCapture dashboard"
          >
            <span className="brand-mark" aria-hidden="true">
              <span>W</span>
            </span>

            <span className="brand-copy">
              <strong>WinCapture</strong>
              <small>WinWire</small>
            </span>
          </NavLink>

          <button
            type="button"
            className="sidebar-close"
            onClick={closeMobileNavigation}
            aria-label="Close navigation"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Workspace</p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileNavigation}
                className={({ isActive }) =>
                  `sidebar-nav-link ${
                    isActive ? "is-active" : ""
                  }`
                }
              >
                <span className="sidebar-nav-icon">
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
              <div className="sidebar-divider" />

              <p className="sidebar-section-label">
                Administration
              </p>

              <NavLink
                to="/admin"
                onClick={closeMobileNavigation}
                className={({ isActive }) =>
                  `sidebar-nav-link ${
                    isActive ? "is-active" : ""
                  }`
                }
              >
                <span className="sidebar-nav-icon">
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

        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            onClick={closeMobileNavigation}
            className={({ isActive }) =>
              `sidebar-nav-link ${
                isActive ? "is-active" : ""
              }`
            }
          >
            <span className="sidebar-nav-icon">
              <UserRound
                aria-hidden="true"
                size={18}
                strokeWidth={1.8}
              />
            </span>

            <span>Profile</span>
          </NavLink>

          <button
            type="button"
            className="sidebar-nav-link sidebar-signout"
            onClick={() => void logout()}
          >
            <span className="sidebar-nav-icon">
              <LogOut
                aria-hidden="true"
                size={18}
                strokeWidth={1.8}
              />
            </span>

            <span>Sign out</span>
          </button>

          <div className="sidebar-user-card">
            <span className="sidebar-user-avatar">
              {getInitials(user?.name)}
            </span>

            <span className="sidebar-user-copy">
              <strong>
                {user?.name ?? "WinCapture User"}
              </strong>

              <small>
                {user?.role ?? "User"}
              </small>
            </span>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="navigation-scrim"
          onClick={closeMobileNavigation}
          aria-label="Close navigation"
        />
      )}

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
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

            <div className="mobile-brand">
              <span className="brand-mark small" aria-hidden="true">
                <span>W</span>
              </span>

              <span>WinCapture</span>
            </div>

          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}