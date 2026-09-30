import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  msalTenantId,
  msalClientId,
  apiScope,
  apiBaseUrl,
} from "../authConfig";

export default function Profile() {
  const { user, account, logout, refreshUser, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setFeedback(null);
    try {
      await refreshUser();
      setFeedback("User profile and permissions synchronized with Microsoft Entra ID.");
    } catch {
      setFeedback("Failed to synchronize user profile.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const isAdmin = user?.role === "Admin";

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">User Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Your Microsoft corporate identity and WinCapture authorization credentials.
        </p>
      </div>

      {feedback && (
        <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/40 p-3.5 text-xs text-cyan-200">
          {feedback}
        </div>
      )}

      {/* Identity Card */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-cyan-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : "W"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{user?.name || account?.name}</h2>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                    isAdmin
                      ? "border border-amber-600/50 bg-amber-950/60 text-amber-300"
                      : "border border-slate-700 bg-slate-800 text-slate-300"
                  }`}
                >
                  {user?.role || "User"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{user?.email || account?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
            >
              {isRefreshing ? (
                <div className="size-3.5 animate-spin rounded-full border border-slate-400 border-t-white" />
              ) : (
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              )}
              <span>Sync Claims</span>
            </button>

            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-medium text-rose-300 transition hover:border-rose-900/60 hover:bg-rose-950/40 hover:text-rose-200"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Claims & Mapping Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              WinCapture User ID
            </p>
            <p className="mt-1 font-mono text-sm text-slate-100">
              #{user?.userId ?? "-"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Application Role
            </p>
            <p className="mt-1 text-sm font-semibold text-cyan-300">
              {user?.role ?? "-"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Authentication Provider
            </p>
            <p className="mt-1 text-sm text-slate-100">
              {user?.authenticationType || "Microsoft Entra ID"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Target API Environment
            </p>
            <p className="mt-1 truncate font-mono text-xs text-slate-300">
              {apiBaseUrl}
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-bold text-white">Microsoft Entra Settings</h3>
        <p className="mt-1 text-xs text-slate-400">
          Configuration parameters active for this WinCapture session.
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 sm:flex-row sm:items-center">
            <span className="text-xs text-slate-400">Tenant ID</span>
            <span className="font-mono text-xs text-slate-200">{msalTenantId || "-"}</span>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 sm:flex-row sm:items-center">
            <span className="text-xs text-slate-400">SPA Client ID</span>
            <span className="font-mono text-xs text-slate-200">{msalClientId || "-"}</span>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 sm:flex-row sm:items-center">
            <span className="text-xs text-slate-400">Delegated API Scope</span>
            <span className="font-mono text-xs text-cyan-300">{apiScope || "-"}</span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs leading-relaxed text-slate-400">
          <p className="font-medium text-slate-300">Direct Token Authorization</p>
          <p className="mt-1 text-[11px]">
            WinCapture communicates directly with the ASP.NET Core backend using the Microsoft Entra access token in the Authorization header. No secondary application tokens or local passwords are stored or generated.
          </p>
        </div>
      </section>
    </div>
  );
}
