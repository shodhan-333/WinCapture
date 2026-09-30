import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navigation = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/albums", label: "Albums" },
  { to: "/files", label: "Files" },
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
                className="h-12 w-20 object-contain drop-shadow-[0_2px_8px_rgba(14,165,233,0.2)]"
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
                  {item.label}
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
                className="profile-link flex items-center gap-2 px-3 py-2 text-sm font-medium transition"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-xs font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </span>
                {user?.name ?? "Profile"}
              </NavLink>

              <button
                type="button"
                onClick={() => void logout()}
                className="quiet-button px-3 py-2 text-sm font-medium transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
