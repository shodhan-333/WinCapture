type Environment = {
  apiBaseUrl: string;
  msalClientId: string;
  msalTenantId: string;
  msalRedirectUri: string;
  msalPostLogoutRedirectUri: string;
  apiScope: string;
  angularAlbumsBaseUrl: string;
};

// Read Vite's public values once so application code uses a typed configuration object.
const rawEnvironment = import.meta.env;

export const environment: Environment = {
  apiBaseUrl: rawEnvironment.VITE_API_BASE_URL?.trim() ?? "",
  msalClientId: rawEnvironment.VITE_MSAL_CLIENT_ID?.trim() ?? "",
  msalTenantId: rawEnvironment.VITE_MSAL_TENANT_ID?.trim() ?? "",
  msalRedirectUri: rawEnvironment.VITE_MSAL_REDIRECT_URI?.trim() || `${window.location.origin}/`,
  msalPostLogoutRedirectUri:
    rawEnvironment.VITE_MSAL_POST_LOGOUT_REDIRECT_URI?.trim() || `${window.location.origin}/`,
  apiScope: rawEnvironment.VITE_MSAL_API_SCOPE?.trim() ?? "",
  angularAlbumsBaseUrl: rawEnvironment.VITE_ANGULAR_ALBUMS_URL?.trim() || "/angular/albums",
};

const REQUIRED_ENVIRONMENT_KEYS = [
  ["VITE_MSAL_CLIENT_ID", environment.msalClientId],
  ["VITE_MSAL_TENANT_ID", environment.msalTenantId],
  ["VITE_MSAL_API_SCOPE", environment.apiScope],
] as const;

// Return missing required settings for the startup screen instead of failing later in a request.
// Return missing required public settings so startup can explain configuration problems.
export function validateEnvironment(): string[] {
  return REQUIRED_ENVIRONMENT_KEYS.filter(([, value]) => !value).map(([key]) => key);
}
