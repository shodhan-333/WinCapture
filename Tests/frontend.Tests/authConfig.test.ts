import { afterEach, describe, expect, it, vi } from "vitest";

import { loginRequest, msalConfig, msalPostLogoutRedirectUri, msalRedirectUri } from "../../frontend/src/authConfig";

describe("MSAL configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses redirect login and session storage without local credentials", () => {
    expect(loginRequest.scopes).toEqual([expect.any(String)]);
    expect(msalConfig.cache.cacheLocation).toBe("sessionStorage");
    expect(msalConfig.auth.redirectUri).toBe(msalRedirectUri);
    expect(msalConfig.auth.postLogoutRedirectUri).toBe(msalPostLogoutRedirectUri);
  });

  it("reports missing required public environment settings", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.stubEnv("VITE_MSAL_CLIENT_ID", "");
    vi.stubEnv("VITE_MSAL_TENANT_ID", "");
    vi.stubEnv("VITE_MSAL_API_SCOPE", "");
    vi.resetModules();
    const { validateEnvironment: validate } = await import("../../frontend/src/authConfig");
    const missing = validate();

    expect(missing).not.toContain("VITE_MSAL_REDIRECT_URI");
    expect(missing).toEqual(expect.arrayContaining([
      "VITE_API_BASE_URL",
      "VITE_MSAL_CLIENT_ID",
      "VITE_MSAL_TENANT_ID",
      "VITE_MSAL_API_SCOPE",
    ]));
  });
});
