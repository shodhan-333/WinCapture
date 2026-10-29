export interface Environment {
  apiBaseUrl: string;
  msalAuthority: string;
  msalClientId: string;
  msalTenantId: string;
  msalApiScope: string;
  redirectUri: string;
  reactBaseUrl: string;
  googleFontsUrl: string;
}

declare global {
  interface Window {
    __WINCAPTURE_ENV__?: Environment;
  }
}

export const environment = window.__WINCAPTURE_ENV__ ?? {
  apiBaseUrl: "",
  msalAuthority: "",
  msalClientId: "",
  msalTenantId: "",
  msalApiScope: "",
  redirectUri: "",
  reactBaseUrl: "",
  googleFontsUrl: "",
};
