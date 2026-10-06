import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import {
  msalConfig,
  validateEnvironment,
} from "./authConfig";

import "./index.css";

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Could not find the root element.",
  );
}

const root =
  ReactDOM.createRoot(
    rootElement,
  );

function showStartupError(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  root.render(
    <main className="app-shell min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center justify-center">
        <div className="surface w-full overflow-hidden rounded-[24px] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-red-200 bg-red-50 text-red-600 shadow-sm">
              <span
                aria-hidden="true"
                className="text-lg font-bold"
              >
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
                WinCapture could not complete its
                startup configuration. Check the
                message below and correct the
                environment configuration before
                starting the application again.
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

async function startApp() {
  try {
    const missingEnvironment =
      validateEnvironment();

    if (
      missingEnvironment.length > 0
    ) {
      throw new Error(
        `Missing environment variables: ${missingEnvironment.join(
          ", ",
        )}`,
      );
    }

    const msalInstance =
      new PublicClientApplication(
        msalConfig,
      );

    await msalInstance.initialize();

    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <MsalProvider
            instance={msalInstance}
          >
            <AuthProvider>
              <App />
            </AuthProvider>
          </MsalProvider>
        </BrowserRouter>
      </React.StrictMode>,
    );
  } catch (error) {
    showStartupError(error);
  }
}

void startApp();


