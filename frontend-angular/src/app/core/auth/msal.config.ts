import type { Configuration } from "@azure/msal-browser";
import { environment } from "../../../environments/environment";

export const msalConfig: Configuration = {
  auth: {
    clientId: environment.msalClientId,
    authority: `${environment.msalAuthority.replace(/\/$/, "")}/${environment.msalTenantId}`,
    redirectUri: environment.redirectUri,
    postLogoutRedirectUri: environment.redirectUri,
  },
  cache: { cacheLocation: "sessionStorage" },
};

export const apiScopes = [environment.msalApiScope];
