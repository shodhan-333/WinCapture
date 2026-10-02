import { FolderOpen, House, Images, LogOut, Shield, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navigation = [
  { to: "/dashboard", label: "Home", icon: House },
  { to: "/albums", label: "Albums", icon: Images },
  { to: "/files", label: "Files", icon: FolderOpen },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <div className="app-container py-0">
        <header className="app-header">
          <div className="app-header-inner">
            <div className="app-brand flex items-center">
              <img
                src="/winwire-logo.png"
                alt="WinWire logo"
                  className="h-12 w-20 object-contain"
              />
            </div>

            <nav className="app-nav">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `app-nav-link ${isActive ? "is-active" : ""}`
                  }
                >
                  {item.label === "Home" ? "Dashboard" : item.label}
                </NavLink>
              ))}

              {user?.role === "Admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `app-nav-link ${isActive ? "is-active" : ""}`
                  }
                >
                  Admin
                </NavLink>
              )}
            </nav>

            <div className="app-user-actions">
              <NavLink
                to="/profile"
                aria-label={`Profile: ${user?.name ?? "User"}`}
                className="profile-link flex items-center gap-2 px-3 py-2 text-sm font-medium transition"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </span>
                <span className="user-name max-w-36 truncate">{user?.name ?? "Profile"}</span>
              </NavLink>

              <button
                type="button"
                aria-label="Sign out"
                onClick={() => void logout()}
                className="quiet-button signout-button px-3 py-2 text-sm font-medium transition"
              >
                <LogOut aria-hidden="true" size={17} />
                <span className="signout-label">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="app-main pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Primary navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label === "Home" ? "Dashboard" : item.label}
              className={({ isActive }) => `mobile-nav-link ${isActive ? "is-active" : ""}`}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        {user?.role === "Admin" && (
          <NavLink
            to="/admin"
            aria-label="Admin"
            className={({ isActive }) => `mobile-nav-link ${isActive ? "is-active" : ""}`}
          >
            <Shield aria-hidden="true" size={20} strokeWidth={1.8} />
            <span>Admin</span>
          </NavLink>
        )}
        <NavLink
          to="/profile"
          aria-label="Profile"
          className={({ isActive }) => `mobile-nav-link ${isActive ? "is-active" : ""}`}
        >
          <UserRound aria-hidden="true" size={20} strokeWidth={1.8} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
