import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Login() {
  const { login, error, loading } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1329] px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <section className="glass-panel rounded-2xl p-8 shadow-2xl">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 font-bold text-white shadow-lg shadow-cyan-500/20">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  WinCapture
                </span>
                <span className="rounded-md border border-cyan-800/50 bg-cyan-950 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-300">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-slate-400">WinWire Media Platform</p>
            </div>
          </div>

          {/* Heading & Description */}
          <div className="mt-6">
            <h1 className="text-xl font-semibold leading-snug text-white">
              Secure media storage & album management for WinWire.
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
              Access company event photos, shared albums, and manage media permissions through your corporate Microsoft account.
            </p>
          </div>

          {/* Error Alert if any */}
          {error && (
            <div className="mt-5">
              <ErrorMessage
                title="Authentication Failed"
                message={error}
              />
            </div>
          )}

          {/* Microsoft Single Sign-On Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => void login()}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-slate-100 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoadingSpinner size="sm" label="Connecting to Microsoft..." />
              ) : (
                <>
                  <span className="grid size-4 grid-cols-2 grid-rows-2 gap-0.5" aria-hidden="true">
                    <span className="bg-[#f25022]" />
                    <span className="bg-[#7fba00]" />
                    <span className="bg-[#00a4ef]" />
                    <span className="bg-[#ffb900]" />
                  </span>
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </button>
          </div>

          {/* Security & Entra ID Footer Note */}
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center text-xs leading-relaxed text-slate-400">
            <div className="flex items-center justify-center gap-1.5 text-slate-300">
              <svg
                className="size-3.5 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <span className="font-medium text-slate-200">Single Sign-On Enforced</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Only @winwire.com accounts authorized in Microsoft Entra ID are permitted.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
