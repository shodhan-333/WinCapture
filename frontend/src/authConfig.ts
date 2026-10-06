import type { Configuration, RedirectRequest } from "@azure/msal-browser";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
export const msalClientId = import.meta.env.VITE_MSAL_CLIENT_ID?.trim() ?? "";
export const msalTenantId = import.meta.env.VITE_MSAL_TENANT_ID?.trim() ?? "";
export const msalRedirectUri =
  import.meta.env.VITE_MSAL_REDIRECT_URI?.trim() || "https://localhost:5173/";
export const msalPostLogoutRedirectUri =
  import.meta.env.VITE_MSAL_POST_LOGOUT_REDIRECT_URI?.trim() || "https://localhost:5173/";
export const apiScope = import.meta.env.VITE_MSAL_API_SCOPE?.trim() ?? "";

export function validateEnvironment(): string[] {
  const missing: string[] = [];

  if (!apiBaseUrl) {
    missing.push("VITE_API_BASE_URL");
  }

  if (!msalClientId) {
    missing.push("VITE_MSAL_CLIENT_ID");
  }

  if (!msalTenantId) {
    missing.push("VITE_MSAL_TENANT_ID");
  }

  if (!msalRedirectUri) {
    missing.push("VITE_MSAL_REDIRECT_URI");
  }

  if (!apiScope) {
    missing.push("VITE_MSAL_API_SCOPE");
  }

  return missing;
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


