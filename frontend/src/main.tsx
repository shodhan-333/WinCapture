import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { msalConfig, validateEnvironment } from "./authConfig";

import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find the root element.");
}

const root = ReactDOM.createRoot(rootElement);

function showStartupError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  root.render(
    <main className="grid min-h-screen place-items-center bg-[#020617] px-6 text-slate-100">
      <section className="w-full max-w-xl rounded-3xl border border-red-500/40 bg-slate-900 p-8 shadow-2xl shadow-red-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-300">WinCapture</p>
        <h1 className="mt-3 text-2xl font-semibold">Could not start the app</h1>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-red-200">{message}</p>
      </section>
    </main>,
  );
}

async function startApp() {
  try {
    const missingEnvironment = validateEnvironment();

    if (missingEnvironment.length > 0) {
      throw new Error(`Missing environment variables: ${missingEnvironment.join(", ")}`);
    }

    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <MsalProvider instance={msalInstance}>
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