import Login from "./Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-center">
        <div className="mx-auto mb-3 size-7 animate-spin rounded-full border-2 border-slate-700 border-t-white" />

        <p className="text-sm text-slate-300">
          Processing Microsoft authentication...
        </p>
      </div>
    </main>
  );
}

function ApiErrorScreen() {
  const {
    account,
    error,
    logout,
  } = useAuth();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <section className="w-full rounded-2xl border border-red-900/60 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-red-300">
                Microsoft account detected
              </p>

              <h1 className="mt-1 text-2xl font-semibold">
                WinCapture authorization failed
              </h1>
            </div>

            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Microsoft account
            </p>

            <p className="mt-1 break-all text-sm text-slate-200">
              {account?.name ||
                account?.username ||
                "Unknown"}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/20 p-4">
            <p className="text-sm leading-6 text-red-200">
              {error ||
                "The WinCapture API rejected the Microsoft access token."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthenticatedScreen() {
  const {
    account,
    user,
    logout,
  } = useAuth();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-2xl">
          <header className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-white font-bold text-slate-900">
                W
              </div>

              <div>
                <p className="text-lg font-semibold">
                  WinCapture
                </p>

                <p className="text-xs text-slate-400">
                  Microsoft authentication test
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Logout
            </button>
          </header>

          <section className="rounded-2xl border border-emerald-900/50 bg-slate-900 p-8 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                ✓
              </div>

              <div>
                <p className="text-sm font-medium text-emerald-300">
                  Microsoft Authentication Successful
                </p>

                <h1 className="text-2xl font-semibold">
                  WinCapture API authentication succeeded
                </h1>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Info
                label="Name"
                value={
                  user?.name ||
                  account?.name ||
                  "-"
                }
              />

              <Info
                label="Email"
                value={
                  user?.email ||
                  account?.username ||
                  "-"
                }
              />

              <Info
                label="Role"
                value={user?.role || "-"}
              />

              <Info
                label="Backend"
                value="Connected"
              />

              <Info
                label="Authentication Provider"
                value={
                  user?.authenticationType ||
                  "Microsoft Entra ID"
                }
              />

              <Info
                label="WinCapture User ID"
                value={
                  user?.userId?.toString() ||
                  "-"
                }
              />
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-400">
              Access to the API uses the Microsoft Entra access token directly. WinCapture does not issue a second JWT.
            </div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-slate-100">
        {value}
      </p>
    </div>
  );
}

export default function App() {
  const {
    account,
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (account && !user) {
    return <ApiErrorScreen />;
  }

  if (user) {
    return <AuthenticatedScreen />;
  }

  return <Login />;
}