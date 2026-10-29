import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { environment } from "./environments/environment";

// Start Angular with the shared MSAL and router providers; show a plain fallback if startup fails.
const requiredEnvironment = [
  ["VITE_API_BASE_URL", environment.apiBaseUrl],
  ["VITE_MSAL_AUTHORITY", environment.msalAuthority],
  ["VITE_MSAL_CLIENT_ID", environment.msalClientId],
  ["VITE_MSAL_TENANT_ID", environment.msalTenantId],
  ["VITE_MSAL_API_SCOPE", environment.msalApiScope],
  ["VITE_ANGULAR_MSAL_REDIRECT_URI", environment.redirectUri],
  ["VITE_ANGULAR_REACT_BASE_URL", environment.reactBaseUrl],
  ["VITE_GOOGLE_FONTS_URL", environment.googleFontsUrl],
] as const;
const missingEnvironment = requiredEnvironment
  .filter(([, value]) => !value.trim())
  .map(([key]) => key);

if (missingEnvironment.length > 0) {
  document.body.textContent =
    `Missing environment variables: ${missingEnvironment.join(", ")}`;
} else {
  const fontStylesheet = document.createElement("link");
  fontStylesheet.rel = "stylesheet";
  fontStylesheet.href = environment.googleFontsUrl;
  document.head.append(fontStylesheet);

void bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  document.body.textContent =
    error instanceof Error ? error.message : "WinCapture could not start.";
});
}
