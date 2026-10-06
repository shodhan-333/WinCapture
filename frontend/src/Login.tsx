import { useAuth } from "./context/AuthContext";

export default function Login() {
  const {
    login,
    error,
    loading,
  } = useAuth();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <section className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-white text-lg font-bold text-slate-950">
                W
              </div>

              <div>
                <p className="text-xl font-semibold">
                  WinCapture
                </p>

                <p className="text-xs text-slate-400">
                  Microsoft Entra ID
                </p>
              </div>
            </div>

            <h1 className="text-2xl font-semibold">
              Store, organize, share, and control access to company event photos.
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in with your WinWire Microsoft account to continue.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-sm leading-6 text-red-200">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => void login()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="grid size-5 grid-cols-2 grid-rows-2 gap-0.5">
              <span className="bg-[#f25022]" />
              <span className="bg-[#7fba00]" />
              <span className="bg-[#00a4ef]" />
              <span className="bg-[#ffb900]" />
            </span>

            {loading
              ? "Processing..."
              : "Sign in with Microsoft"}
          </button>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            WinCapture does not use local passwords or application-issued JWTs.
          </p>
        </section>
      </div>
    </main>
  );
}