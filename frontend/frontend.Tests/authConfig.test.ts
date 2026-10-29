import { afterEach, describe, expect, it, vi } from "vitest";

import {
  loginRequest,
  msalConfig,
  msalPostLogoutRedirectUri,
  msalRedirectUri,
} from "../src/config/auth";

describe("MSAL configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses redirect login and session storage without local credentials", () => {
    expect(loginRequest.scopes).toEqual([expect.any(String)]);
    expect(msalConfig.cache?.cacheLocation).toBe("sessionStorage");
    expect(msalConfig.auth.redirectUri).toBe(msalRedirectUri);
    expect(msalConfig.auth.postLogoutRedirectUri).toBe(
      msalPostLogoutRedirectUri,
    );
  });

  it("reports missing required public environment settings", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.stubEnv("VITE_MSAL_CLIENT_ID", "");
    vi.stubEnv("VITE_MSAL_TENANT_ID", "");
    vi.stubEnv("VITE_MSAL_AUTHORITY", "");
    vi.stubEnv("VITE_MSAL_API_SCOPE", "");
    vi.resetModules();
    const { validateEnvironment: validate } =
      await import("../src/config/auth");
    const missing = validate();

    expect(missing).not.toContain("VITE_MSAL_REDIRECT_URI");
    expect(missing).toEqual(
      expect.arrayContaining([
        "VITE_API_BASE_URL",
        "VITE_MSAL_CLIENT_ID",
        "VITE_MSAL_TENANT_ID",
        "VITE_MSAL_AUTHORITY",
        "VITE_MSAL_API_SCOPE",
      ]),
    );
  });

  it("trims configured values, applies redirect defaults, and validates complete configuration", async () => {
    vi.stubEnv("VITE_API_BASE_URL", " https://api.example.test ");
    vi.stubEnv("VITE_MSAL_CLIENT_ID", " client-id ");
    vi.stubEnv("VITE_MSAL_TENANT_ID", " tenant-id ");
    vi.stubEnv("VITE_MSAL_AUTHORITY", " https://login.microsoftonline.com/ ");
    vi.stubEnv("VITE_MSAL_REDIRECT_URI", " ");
    vi.stubEnv("VITE_MSAL_POST_LOGOUT_REDIRECT_URI", " ");
    vi.stubEnv("VITE_MSAL_API_SCOPE", " api://client/access ");
    vi.stubEnv("VITE_ANGULAR_ALBUMS_URL", " ");
    vi.resetModules();
    const config = await import("../src/config/auth");

    expect(config.apiBaseUrl).toBe("https://api.example.test");
    expect(config.msalConfig.auth.clientId).toBe("client-id");
    expect(config.msalConfig.auth.authority).toBe(
      "https://login.microsoftonline.com/tenant-id",
    );
    expect(config.validateEnvironment()).toEqual([]);
    expect(config.msalRedirectUri).toBe(`${window.location.origin}/`);
    expect(config.msalPostLogoutRedirectUri).toBe(`${window.location.origin}/`);
    expect(config.getAngularAlbumsUrl()).toBe(
      `${window.location.origin}/angular/albums`,
    );
  });

  it("resolves an explicitly configured absolute Angular Albums URL", async () => {
    vi.stubEnv(
      "VITE_ANGULAR_ALBUMS_URL",
      "https://albums.example.test/angular/albums",
    );
    vi.resetModules();
    const config = await import("../src/config/auth");
    expect(config.getAngularAlbumsUrl()).toBe(
      "https://albums.example.test/angular/albums",
    );
  });
});
