import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("environment configuration", () => {
  it("lists missing required settings and applies redirect defaults", async () => {
    vi.stubEnv("VITE_API_BASE_URL", undefined);
    vi.stubEnv("VITE_MSAL_CLIENT_ID", undefined);
    vi.stubEnv("VITE_MSAL_TENANT_ID", undefined);
    vi.stubEnv("VITE_MSAL_AUTHORITY", undefined);
    vi.stubEnv("VITE_MSAL_API_SCOPE", undefined);
    vi.stubEnv("VITE_MSAL_REDIRECT_URI", " ");
    vi.stubEnv("VITE_MSAL_POST_LOGOUT_REDIRECT_URI", "");
    vi.stubEnv("VITE_ANGULAR_ALBUMS_URL", " ");

    const { environment, validateEnvironment } =
      await import("../../src/config/env");

    expect(validateEnvironment()).toEqual([
      "VITE_API_BASE_URL",
      "VITE_MSAL_CLIENT_ID",
      "VITE_MSAL_TENANT_ID",
      "VITE_MSAL_AUTHORITY",
      "VITE_MSAL_API_SCOPE",
    ]);
    expect(environment.msalRedirectUri).toBe(`${window.location.origin}/`);
    expect(environment.msalPostLogoutRedirectUri).toBe(
      `${window.location.origin}/`,
    );
    expect(environment.angularAlbumsBaseUrl).toBe("/angular/albums");
  });

  it("trims configured values and reports no missing settings", async () => {
    vi.stubEnv("VITE_API_BASE_URL", " https://api.example.test ");
    vi.stubEnv("VITE_MSAL_CLIENT_ID", " client-id ");
    vi.stubEnv("VITE_MSAL_TENANT_ID", " tenant-id ");
    vi.stubEnv("VITE_MSAL_AUTHORITY", " https://identity.example.test/ ");
    vi.stubEnv("VITE_MSAL_API_SCOPE", " api://scope ");
    vi.stubEnv("VITE_MSAL_REDIRECT_URI", " https://app.example.test/login ");
    vi.stubEnv(
      "VITE_MSAL_POST_LOGOUT_REDIRECT_URI",
      " https://app.example.test/logout ",
    );
    vi.stubEnv("VITE_ANGULAR_ALBUMS_URL", " https://app.example.test/albums ");

    const { environment, validateEnvironment } =
      await import("../../src/config/env");

    expect(validateEnvironment()).toEqual([]);
    expect(environment).toMatchObject({
      apiBaseUrl: "https://api.example.test",
      msalClientId: "client-id",
      msalTenantId: "tenant-id",
      msalAuthority: "https://identity.example.test/",
      apiScope: "api://scope",
      msalRedirectUri: "https://app.example.test/login",
      msalPostLogoutRedirectUri: "https://app.example.test/logout",
      angularAlbumsBaseUrl: "https://app.example.test/albums",
    });
  });
});
