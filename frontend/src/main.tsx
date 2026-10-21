import React from "react";
import ReactDOM from "react-dom/client";
import { PublicClientApplication } from "@azure/msal-browser";

import { App } from "./App";
import { AppProviders } from "@/app/providers/AppProviders";
import { appShellClass } from "@/shared/components/ui/uiClasses";
import { msalConfig, validateEnvironment } from "@/config/auth";

import "@/styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find the root element.");
}

const root = ReactDOM.createRoot(rootElement);

// Display startup failures in the page when configuration or MSAL initialization fails.
function showStartupError(error: unknown) {
  const missingConfiguration =
    error instanceof Error &&
    /^Missing environment variables: VITE_[A-Z0-9_, ]+$/.test(error.message)
      ? error.message
      : null;
  const message =
    missingConfiguration ??
    "WinCapture could not initialize Microsoft sign-in. Check the app configuration and retry.";

  // Show a readable error screen if environment validation or MSAL startup fails.
  root.render(
    <main className={`${appShellClass} min-h-screen px-5 py-8 sm:px-8 sm:py-12`}>
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center justify-center">
        <div className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] w-full overflow-hidden rounded-[24px] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-red-200 bg-red-50 text-red-600 shadow-sm">
              <span aria-hidden="true" className="text-lg font-bold">
                !
              </span>
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                WinCapture
              </p>

              <h1 className="mt-2 text-xl font-bold tracking-[-0.025em] text-slate-800 sm:text-2xl">
                Could not start the app
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                WinCapture could not complete itsstartup configuration. Check themessage below and
                correct the environment configuration before starting the application again.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[15px] border border-red-100 bg-red-50/75 p-4">
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-red-700">
              {message}
            </p>
          </div>
        </div>
      </section>
    </main>,
  );
}

// Validate public configuration and initialize MSAL before mounting providers and routes.
async function startApp() {
  try {
    const missingEnvironment = validateEnvironment();

    if (missingEnvironment.length > 0) {
      throw new Error(`Missing environment variables: ${missingEnvironment.join(", ")}`);
    }

    const msalInstance = new PublicClientApplication(msalConfig);

    // Initialize MSAL before rendering components that use its context.
    await msalInstance.initialize();

    root.render(
      <React.StrictMode>
        <AppProviders msalInstance={msalInstance}>
          <App />
        </AppProviders>
      </React.StrictMode>,
    );
  } catch (error) {
    showStartupError(error);
  }
}

void startApp();
