import { LogOut, ShieldCheck, UserRound } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="app-page max-w-3xl">
      <section className="page-toolbar surface">
        <div>
          <p className="page-kicker">Account</p>
          <h2 className="page-heading">Profile</h2>
        </div>
      </section>

      <section className="surface identity-section">
        <div className="identity-avatar">
          <span className="sr-only">Account avatar</span>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-xl font-semibold text-white">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-semibold text-slate-900">{user?.name ?? "Unknown user"}</p>
            <p className="text-sm text-slate-500">{user?.email ?? "noreply@example.com"}</p>
        </div>
      </section>

      <section className="surface account-settings">
        <h3 className="section-title mb-2">Account</h3>
        <div className="settings-row">
          <span className="settings-label"><UserRound aria-hidden="true" size={18} /> Role</span>
          <span className="text-sm font-medium text-slate-900">{user?.role ?? "User"}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label"><ShieldCheck aria-hidden="true" size={18} /> Authentication</span>
          <span className="text-sm font-medium text-slate-900">Microsoft</span>
        </div>
      </section>

      <button
        type="button"
        onClick={() => void logout()}
        className="danger-action self-start gap-2"
      >
        <LogOut aria-hidden="true" size={17} /> Sign out
      </button>
    </div>
  );
}
