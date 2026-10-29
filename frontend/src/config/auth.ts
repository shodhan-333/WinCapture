import type { Configuration, RedirectRequest } from "@azure/msal-browser";
import { environment, validateEnvironment } from "@/config/env";

export const apiBaseUrl = environment.apiBaseUrl;
export const msalClientId = environment.msalClientId;
export const msalTenantId = environment.msalTenantId;
export const msalRedirectUri = environment.msalRedirectUri;
export const msalPostLogoutRedirectUri = environment.msalPostLogoutRedirectUri;
export const apiScope = environment.apiScope;
export { validateEnvironment };

// Resolve the configured Angular Albums destination against the current application origin.
// Build the Angular albums destination from its configured URL.
export function getAngularAlbumsUrl(): string {
  return new URL(environment.angularAlbumsBaseUrl, window.location.origin).toString();
}

// Keep both frontends on the same Entra client and session-storage cache.
export const msalConfig: Configuration = {
  auth: {
    clientId: msalClientId,
    authority: `${environment.msalAuthority.replace(/\/$/, "")}/${msalTenantId}`,
    redirectUri: msalRedirectUri,
    postLogoutRedirectUri: msalPostLogoutRedirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

export const loginRequest: RedirectRequest = {
  scopes: [apiScope],
  redirectStartPage: "/",
};
