type Environment = {
  apiBaseUrl: string;
  msalClientId: string;
  msalTenantId: string;
  msalRedirectUri: string;
  msalPostLogoutRedirectUri: string;
  apiScope: string;
  angularAlbumsBaseUrl: string;
};

const rawEnvironment = import.meta.env;

export const environment: Environment = {
  apiBaseUrl: rawEnvironment.VITE_API_BASE_URL?.trim() ?? "",
  msalClientId: rawEnvironment.VITE_MSAL_CLIENT_ID?.trim() ?? "",
  msalTenantId: rawEnvironment.VITE_MSAL_TENANT_ID?.trim() ?? "",
  msalRedirectUri: rawEnvironment.VITE_MSAL_REDIRECT_URI?.trim() || "https://localhost:5173/",
  msalPostLogoutRedirectUri:
    rawEnvironment.VITE_MSAL_POST_LOGOUT_REDIRECT_URI?.trim() || "https://localhost:5173/",
  apiScope: rawEnvironment.VITE_MSAL_API_SCOPE?.trim() ?? "",
  angularAlbumsBaseUrl:
    rawEnvironment.VITE_ANGULAR_ALBUMS_URL?.trim() || "https://localhost:5173/angular/albums",
};

const REQUIRED_ENVIRONMENT_KEYS = [
  ["VITE_API_BASE_URL", environment.apiBaseUrl],
  ["VITE_MSAL_CLIENT_ID", environment.msalClientId],
  ["VITE_MSAL_TENANT_ID", environment.msalTenantId],
  ["VITE_MSAL_API_SCOPE", environment.apiScope],
] as const;

export function validateEnvironment(): string[] {
  return REQUIRED_ENVIRONMENT_KEYS.filter(([, value]) => !value).map(([key]) => key);
}
