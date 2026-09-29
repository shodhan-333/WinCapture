import React from "react";
import ReactDOM from "react-dom/client";

import {
  PublicClientApplication,
} from "@azure/msal-browser";

import {
  MsalProvider,
} from "@azure/msal-react";

import App from "./App";

import {
  AuthProvider,
} from "./context/AuthContext";

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
  ReactDOM.createRoot(rootElement);

function showStartupError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  root.render(
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#020617",
        color: "#e2e8f0",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "680px",
          border: "1px solid #7f1d1d",
          borderRadius: "16px",
          padding: "24px",
          background: "#0f172a",
        }}
      >
        <h1>WinCapture could not start</h1>

        <p
          style={{
            color: "#fca5a5",
            wordBreak: "break-word",
          }}
        >
          {message}
        </p>
      </section>
    </main>,
  );
}

async function startApp() {
  try {
    const missingEnvironment =
      validateEnvironment();

    if (missingEnvironment.length > 0) {
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
        <MsalProvider
          instance={msalInstance}
        >
          <AuthProvider>
            <App />
          </AuthProvider>
        </MsalProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    showStartupError(error);
  }
}

void startApp();