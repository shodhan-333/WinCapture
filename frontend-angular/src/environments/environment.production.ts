type WinCaptureRuntimeConfig = {
  apiBaseUrl?: string;
  msalClientId?: string;
  msalTenantId?: string;
  msalApiScope?: string;
  redirectUri?: string;
  reactBaseUrl?: string;
};

const runtime = (window as Window & { __WINCAPTURE_CONFIG__?: WinCaptureRuntimeConfig })
  .__WINCAPTURE_CONFIG__;

export const environment = {
  production: true,
  apiBaseUrl: runtime?.apiBaseUrl ?? "",
  msalClientId: runtime?.msalClientId ?? "",
  msalTenantId: runtime?.msalTenantId ?? "",
  msalApiScope: runtime?.msalApiScope ?? "",
  redirectUri: runtime?.redirectUri ?? `${window.location.origin}/redirect.html`,
  reactBaseUrl: runtime?.reactBaseUrl ?? window.location.origin,
};
