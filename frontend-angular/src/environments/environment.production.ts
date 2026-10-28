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
  apiBaseUrl: "",
  msalClientId: "fb87005a-2ae7-4cb9-84d5-5f9d3ca2556a",
  msalTenantId: "bdcfaa46-3f69-4dfd-b3f7-c582bdfbb820",
  msalApiScope: "api://fb87005a-2ae7-4cb9-84d5-5f9d3ca2556a/access_as_user",
  redirectUri: `${window.location.origin}/redirect.html`,
  reactBaseUrl: window.location.origin,
};
