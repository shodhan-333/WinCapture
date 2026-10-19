import "@angular/compiler";
import { createEnvironmentInjector, runInInjectionContext } from "@angular/core";
import { MsalService } from "@azure/msal-angular";
import { of, throwError } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { AuthService } from "../../../frontend-angular/src/app/core/auth/auth.service";
import { ApiService } from "../../../frontend-angular/src/app/core/api/api.service";

describe("Angular authentication service", () => {
  function makeAuth(
    overrides: {
      redirect?: unknown;
      active?: unknown;
      accounts?: unknown[];
      profile?: unknown;
      logout?: unknown;
    } = {},
  ) {
    const selected = { homeAccountId: "home", tenantId: "tenant", localAccountId: "local" };
    const msal = {
      handleRedirectObservable: vi.fn(() => of(overrides.redirect ?? null)),
      logoutPopup: vi.fn(() => overrides.logout ?? of(null)),
      instance: {
        getActiveAccount: vi.fn(() => overrides.active ?? null),
        getAllAccounts: vi.fn(() => overrides.accounts ?? [selected]),
        setActiveAccount: vi.fn(),
        getConfiguration: vi.fn(() => ({ auth: { redirectUri: "https://localhost/redirect" } })),
      },
    };
    const api = {
      getCurrentUser: vi.fn(() => overrides.profile ?? Promise.resolve({ id: 1, name: "Ada" })),
    };
    const injector = createEnvironmentInjector(
      [
        { provide: MsalService, useValue: msal },
        { provide: ApiService, useValue: api },
      ],
      createEnvironmentInjector([]),
    );
    return {
      service: runInInjectionContext(injector, () => new AuthService()),
      msal,
      api,
      injector,
      selected,
    };
  }

  it("uses the redirect account, loads the profile, and initializes only once", async () => {
    const redirected = { account: { homeAccountId: "redirect" } };
    const { service, msal, api, injector } = makeAuth({ redirect: redirected });
    await service.initialize();
    await service.initialize();
    expect(service.account()).toEqual(redirected.account);
    expect(service.user()).toEqual({ id: 1, name: "Ada" });
    expect(service.loading()).toBe(false);
    expect(msal.instance.setActiveAccount).toHaveBeenCalledWith(redirected.account);
    expect(api.getCurrentUser).toHaveBeenCalledTimes(1);
    injector.destroy();
  });

  it("falls back to the active account and handles missing sessions and profile errors", async () => {
    const active = { homeAccountId: "active" };
    const activeCase = makeAuth({ active });
    await activeCase.service.initialize();
    expect(activeCase.service.account()).toEqual(active);
    activeCase.injector.destroy();

    const missing = makeAuth({ accounts: [] });
    await missing.service.initialize();
    expect(missing.service.error()).toContain("No signed-in React session");
    expect(missing.service.loading()).toBe(false);
    missing.injector.destroy();

    const failedProfile = makeAuth({ profile: Promise.reject(new Error("profile unavailable")) });
    await failedProfile.service.initialize();
    expect(failedProfile.service.error()).toBe("profile unavailable");
    expect(failedProfile.service.account()).not.toBeNull();
    failedProfile.injector.destroy();
  });

  it("reports redirect failures and clears local identity when popup sign-out fails", async () => {
    const failedRedirect = makeAuth();
    failedRedirect.msal.handleRedirectObservable.mockReturnValue(
      throwError(() => new Error("redirect failed")) as never,
    );
    await failedRedirect.service.initialize();
    expect(failedRedirect.service.error()).toBe("redirect failed");
    failedRedirect.injector.destroy();

    const failedLogout = makeAuth({ logout: throwError(() => new Error("popup blocked")) });
    failedLogout.service.account.set(failedLogout.selected as never);
    failedLogout.service.user.set({ id: 1, name: "Ada" } as never);
    await failedLogout.service.signOut();
    expect(failedLogout.service.account()).toBeNull();
    expect(failedLogout.service.user()).toBeNull();
    expect(failedLogout.service.error()).toBe("popup blocked");
    failedLogout.injector.destroy();
  });
});
