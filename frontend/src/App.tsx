import {
  useEffect,
  useRef,
} from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import {
  brandMarkClass,
  brandMarkLetterClass,
} from "./components/ui/uiClasses";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AlbumsPage from "./pages/AlbumsPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import FilesPage from "./pages/FilesPage";
import AdminPage from "./pages/AdminPage";

function AuthGate() {
  const {
    account,
    user,
    loading,
    login,
    logout,
    error,
    refreshUser,
  } = useAuth();
  const redirectStarted = useRef(false);

  useEffect(() => {
    // Start sign-in only once while unauthenticated to avoid repeated redirects.
    if (!loading && !error && !account && !user && !redirectStarted.current) {
      redirectStarted.current = true;
      void login();
    }

    // Reset the guard when an account or user becomes available.
    if (account || user) redirectStarted.current = false;
  }, [account, error, loading, login, user]);

  if (loading) {
    return (
      <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.98),transparent_28%),radial-gradient(circle_at_82%_75%,rgba(117,190,255,0.22),transparent_31%),linear-gradient(145deg,#f6faff_0%,#e5f1fc_49%,#f6f7fb_100%)] p-6 max-[520px]:p-[17px]">
        <div className="pointer-events-none absolute right-[-90px] top-[-170px] z-[-1] h-[340px] w-[340px] rounded-full bg-[rgba(86,169,242,0.16)] blur-[1px]" />
        <div className="pointer-events-none absolute bottom-[-150px] left-[-100px] z-[-1] h-[280px] w-[280px] rounded-full bg-[rgba(103,181,247,0.13)] blur-[1px]" />

        <section className="surface relative w-[min(460px,100%)] rounded-[23px] p-[30px] shadow-[0_24px_60px_rgba(44,93,135,0.11),inset_0_1px_rgba(255,255,255,0.86)] max-[520px]:rounded-[19px] max-[520px]:px-5 max-[520px]:py-[23px]">
          <div className="flex items-center gap-[11px]">
            <span className={brandMarkClass} aria-hidden="true">
              <span className={brandMarkLetterClass}>W</span>
            </span>

            <div className="grid gap-0.5">
              <strong className="text-[15px] font-bold tracking-[-0.02em] text-[#173653]">
                WinCapture
              </strong>

              <small className="text-[9px] font-medium text-[#8498aa]">
                WinWire
              </small>
            </div>
          </div>

          <div className="mt-[42px] flex items-center gap-[14px] max-[520px]:mt-[34px]">
            <span className="h-[42px] w-[42px] flex-none animate-[auth-spin_850ms_linear_infinite] rounded-full border-[3px] border-[#dce8f1] border-t-[#2c8bea] motion-reduce:animate-none" />

            <div>
              <h1 className="m-0 text-[16px] leading-[1.3] font-[650] tracking-[-0.02em] text-[#183a57]">
                Connecting to Microsoft
              </h1>

              <p className="mt-[5px] text-[10px] leading-[1.55] text-[#8195a6]">
                Preparing your secure
                WinCapture workspace.
              </p>
            </div>
          </div>

          <div className="mt-[30px] h-[5px] overflow-hidden rounded-full bg-[#e6eef4]">
            <span className="block h-full w-[42%] animate-[auth-progress_1.6s_ease-in-out_infinite] rounded-[inherit] bg-[linear-gradient(90deg,#61b4ff,#1777ed)] motion-reduce:animate-none" />
          </div>

          <span className="mt-[14px] block text-center text-[8px] font-medium text-[#98a8b5]">
            Microsoft Entra ID authentication
          </span>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.98),transparent_28%),radial-gradient(circle_at_82%_75%,rgba(117,190,255,0.22),transparent_31%),linear-gradient(145deg,#f6faff_0%,#e5f1fc_49%,#f6f7fb_100%)] p-6 max-[520px]:p-[17px]">
        <div className="pointer-events-none absolute right-[-90px] top-[-170px] z-[-1] h-[340px] w-[340px] rounded-full bg-[rgba(86,169,242,0.16)] blur-[1px]" />
        <div className="pointer-events-none absolute bottom-[-150px] left-[-100px] z-[-1] h-[280px] w-[280px] rounded-full bg-[rgba(103,181,247,0.13)] blur-[1px]" />

        <section className="surface relative w-[min(460px,100%)] rounded-[22px] p-7 shadow-[0_24px_60px_rgba(44,93,135,0.11),inset_0_1px_rgba(255,255,255,0.86)]">
          <h1 className="text-lg font-semibold text-[#183a57]">Unable to connect to WinCapture</h1>
          <p role="alert" className="mt-3 text-sm text-[#60798e]">{error}</p>
          <div className="mt-5 flex gap-3">
            <button className="primary-action" type="button" onClick={() => void (account ? refreshUser() : login())}>Retry</button>
            <button className="secondary-action" type="button" onClick={() => void logout()}>Sign out</button>
          </div>
        </section>
      </main>
    );
  }

  if (!account && !user) {
    return (
      <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.98),transparent_28%),radial-gradient(circle_at_82%_75%,rgba(117,190,255,0.22),transparent_31%),linear-gradient(145deg,#f6faff_0%,#e5f1fc_49%,#f6f7fb_100%)] p-6 max-[520px]:p-[17px]">
        <div className="pointer-events-none absolute right-[-90px] top-[-170px] z-[-1] h-[340px] w-[340px] rounded-full bg-[rgba(86,169,242,0.16)] blur-[1px]" />
        <div className="pointer-events-none absolute bottom-[-150px] left-[-100px] z-[-1] h-[280px] w-[280px] rounded-full bg-[rgba(103,181,247,0.13)] blur-[1px]" />

        <section className="surface relative w-[min(460px,100%)] rounded-[23px] p-[30px] shadow-[0_24px_60px_rgba(44,93,135,0.11),inset_0_1px_rgba(255,255,255,0.86)] max-[520px]:rounded-[19px] max-[520px]:px-5 max-[520px]:py-[23px]">
          <div className="flex items-center gap-[11px]">
            <span className={brandMarkClass} aria-hidden="true">
              <span className={brandMarkLetterClass}>W</span>
            </span>

            <div className="grid gap-0.5">
              <strong className="text-[15px] font-bold tracking-[-0.02em] text-[#173653]">
                WinCapture
              </strong>

              <small className="text-[9px] font-medium text-[#8498aa]">
                WinWire
              </small>
            </div>
          </div>

          <div className="mt-[42px] flex items-center gap-[14px] max-[520px]:mt-[34px]">
            <span className="h-[42px] w-[42px] flex-none animate-[auth-spin_850ms_linear_infinite] rounded-full border-[3px] border-[#dce8f1] border-t-[#2c8bea] motion-reduce:animate-none" />

            <div>
              <h1 className="m-0 text-[16px] leading-[1.3] font-[650] tracking-[-0.02em] text-[#183a57]">
                Redirecting to Microsoft
              </h1>

              <p className="mt-[5px] text-[10px] leading-[1.55] text-[#8195a6]">
                Taking you to secure
                Microsoft sign-in.
              </p>
            </div>
          </div>

          <div className="mt-[30px] h-[5px] overflow-hidden rounded-full bg-[#e6eef4]">
            <span className="block h-full w-[42%] animate-[auth-progress_1.6s_ease-in-out_infinite] rounded-[inherit] bg-[linear-gradient(90deg,#61b4ff,#1777ed)] motion-reduce:animate-none" />
          </div>

          <span className="mt-[14px] block text-center text-[8px] font-medium text-[#98a8b5]">
            Microsoft Entra ID authentication
          </span>
        </section>
      </main>
    );
  }

  return null;
}

export default function App() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading && !user) {
    return <AuthGate />;
  }

  if (!user) {
    return <AuthGate />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/albums"
          element={<AlbumsPage />}
        />

        <Route
          path="/albums/:albumId"
          element={
            <AlbumDetailPage />
          }
        />

        <Route
          path="/files"
          element={<FilesPage />}
        />

        {/* Only users with the Admin role can reach the admin page route. */}
        {user.role === "Admin" && (
          <Route
            path="/admin"
            element={<AdminPage />}
          />
        )}
      </Route>

      {/* Send unknown paths back to the main dashboard. */}
      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}