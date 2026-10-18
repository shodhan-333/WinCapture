import type { Configuration, RedirectRequest } from "@azure/msal-browser";
import { environment, validateEnvironment } from "@/config/env";

export const apiBaseUrl = environment.apiBaseUrl;
export const msalClientId = environment.msalClientId;
export const msalTenantId = environment.msalTenantId;
export const msalRedirectUri = environment.msalRedirectUri;
export const msalPostLogoutRedirectUri = environment.msalPostLogoutRedirectUri;
export const apiScope = environment.apiScope;
export { validateEnvironment };

export function getAngularAlbumsUrl(): string {
  return new URL(environment.angularAlbumsBaseUrl, window.location.origin).toString();
}

export const msalConfig: Configuration = {
  auth: {
    clientId: msalClientId,
    authority: `https://login.microsoftonline.com/${msalTenantId}`,
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
