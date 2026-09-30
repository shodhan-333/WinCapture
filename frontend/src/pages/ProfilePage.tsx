import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Profile</p>
      <h2 className="mt-2 text-3xl font-semibold text-slate-900">Signed in</h2>

      <div className="mt-6 space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-xl font-semibold text-white">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="text-xl font-semibold text-slate-900">{user?.name ?? "Unknown user"}</p>
            <p className="text-sm text-slate-500">{user?.email ?? "noreply@example.com"}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Role</p>
            <p className="mt-2 text-lg font-medium text-slate-900">{user?.role ?? "User"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Authentication</p>
            <p className="mt-2 text-lg font-medium text-slate-900">Microsoft</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-6 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Sign out
      </button>
    </div>
  );
}
