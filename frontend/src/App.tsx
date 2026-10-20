import { useEffect, useRef } from "react";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { useAuth } from "@/features/auth";

function AuthGate() {
  const { account, user, loading, login, logout, error, refreshUser } =
    useAuth();

  const redirectStarted = useRef(false);

  useEffect(() => {
    // Reset the guard when an account or user becomes available.
    if (account || user) {
      redirectStarted.current = false;
      return;
    }

    // Wait until authentication state is ready and error-free.
    if (loading || error || redirectStarted.current) {
      return;
    }

    // Start Microsoft sign-in only once.
    redirectStarted.current = true;
    void login();
  }, [account, user, loading, error, login]);

  if (error) {
    return (
      <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.98),transparent_28%),radial-gradient(circle_at_82%_75%,rgba(117,190,255,0.22),transparent_31%),linear-gradient(145deg,#f6faff_0%,#e5f1fc_49%,#f6f7fb_100%)] p-6 max-[520px]:p-[17px]">
        <div className="pointer-events-none absolute right-[-90px] top-[-170px] z-[-1] h-[340px] w-[340px] rounded-full bg-[rgba(86,169,242,0.16)] blur-[1px]" />
        <div className="pointer-events-none absolute bottom-[-150px] left-[-100px] z-[-1] h-[280px] w-[280px] rounded-full bg-[rgba(103,181,247,0.13)] blur-[1px]" />

        <section className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] relative w-[min(460px,100%)] rounded-[22px] p-7 shadow-[0_24px_60px_rgba(44,93,135,0.11),inset_0_1px_rgba(255,255,255,0.86)]">
          <h1 className="text-lg font-semibold text-[#183a57]">
            Unable to connect to WinCapture
          </h1>

          <p role="alert" className="mt-3 text-sm text-[#60798e]">
            {error}
          </p>

          <div className="mt-5 flex gap-3">
            <button
              className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)]"
              type="button"
              onClick={() => {
                if (account) {
                  void refreshUser();
                } else {
                  void login();
                }
              }}
            >
              Retry
            </button>

            <button
              className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#245277] [border:1px_solid_rgba(255,_255,_255,_0.58)] [background:rgba(255,_255,_255,_0.48)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.9),_0_3px_12px_rgba(24,_52,_78,_0.03)] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[color:#164063] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.68)] [&:hover:not(:disabled)]:[border-color:rgba(255,_255,_255,_0.88)] [&:hover:not(:disabled)]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.95),_0_5px_16px_rgba(24,_52,_78,_0.05)]"
              type="button"
              onClick={() => void logout()}
            >
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (loading || (!account && !user)) {
    const statusTitle =
      account || user
        ? "Loading your WinCapture account"
        : "Redirecting to Microsoft";

    const statusDescription =
      account || user
        ? "Checking your account and preparing your workspace."
        : "Taking you to secure Microsoft sign-in.";

    return (
      <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.98),transparent_28%),radial-gradient(circle_at_82%_75%,rgba(117,190,255,0.22),transparent_31%),linear-gradient(145deg,#f6faff_0%,#e5f1fc_49%,#f6f7fb_100%)] p-6 max-[520px]:p-[17px]">
        <div className="pointer-events-none absolute right-[-90px] top-[-170px] z-[-1] h-[340px] w-[340px] rounded-full bg-[rgba(86,169,242,0.16)] blur-[1px]" />
        <div className="pointer-events-none absolute bottom-[-150px] left-[-100px] z-[-1] h-[280px] w-[280px] rounded-full bg-[rgba(103,181,247,0.13)] blur-[1px]" />

        <section className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] relative w-[min(460px,100%)] rounded-[23px] p-[30px] shadow-[0_24px_60px_rgba(44,93,135,0.11),inset_0_1px_rgba(255,255,255,0.86)] max-[520px]:rounded-[19px] max-[520px]:px-5 max-[520px]:py-[23px]">
          <div className="flex items-center gap-[11px]">
            <img
              src="/wincapture-logo.png"
              alt="WinCapture"
              className="block h-auto w-[180px] max-w-full object-contain object-left"
            />
          </div>

          <div className="mt-[42px] flex items-center gap-[14px] max-[520px]:mt-[34px]">
            <span className="h-[42px] w-[42px] flex-none animate-[auth-spin_850ms_linear_infinite] rounded-full border-[3px] border-[#dce8f1] border-t-[#2c8bea] motion-reduce:animate-none" />

            <div>
              <h1 className="m-0 text-[16px] leading-[1.3] font-[650] tracking-[-0.02em] text-[#183a57]">
                {statusTitle}
              </h1>

              <p className="mt-[5px] text-[10px] leading-[1.55] text-[#8195a6]">
                {statusDescription}
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

export function App() {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return <AuthGate />;
  }

  if (!user) {
    return <AuthGate />;
  }

  return <AppRoutes />;
}
