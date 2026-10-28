import { TestBed } from "@angular/core/testing";
import { MsalService } from "@azure/msal-angular";
import { afterEach, describe, expect, it, vi } from "vitest";
import { of, throwError } from "rxjs";
import { AuthService } from "../../../src/app/core/auth/auth.service";
import { ApiService } from "../../../src/app/core/api/api.service";

describe("AuthService", () => {
  const account = { homeAccountId: "home", localAccountId: "local", tenantId: "tenant", environment: "login.microsoftonline.com", username: "ada@example.com" };
  const user = { userId: 1, name: "Ada", email: "ada@example.com", role: "Admin" as const };
  let msal: ReturnType<typeof createMsal>;
  let api: { getCurrentUser: ReturnType<typeof vi.fn> };

  function createMsal() {
    return {
      handleRedirectObservable: vi.fn(() => of(null)),
      logoutPopup: vi.fn(() => of(undefined)),
      instance: {
        getActiveAccount: vi.fn<() => typeof account | null>(() => account),
        getAllAccounts: vi.fn<() => typeof account[]>(() => []),
        setActiveAccount: vi.fn(),
        getConfiguration: vi.fn(() => ({ auth: { redirectUri: "https://localhost/redirect.html" } })),
      },
    };
  }

  function setup() {
    TestBed.resetTestingModule();
    msal = createMsal();
    api = { getCurrentUser: vi.fn().mockResolvedValue(user) };
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: MsalService, useValue: msal }, { provide: ApiService, useValue: api }],
    });
    return TestBed.inject(AuthService);
  }

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it("loads the redirect account and backend profile only once", async () => {
    const auth = setup();
    await auth.initialize();
    expect(auth.account()).toBe(account);
    expect(auth.user()).toBe(user);
    expect(auth.loading()).toBe(false);
    expect(msal.instance.setActiveAccount).toHaveBeenCalledWith(account);
    await auth.initialize();
    expect(msal.handleRedirectObservable).toHaveBeenCalledTimes(1);
  });

  it("prefers redirect accounts, then active accounts, then the account cache", async () => {
    msal = createMsal();
    const redirected = { ...account, username: "redirect@example.com" };
    msal.handleRedirectObservable.mockReturnValue(of({ account: redirected } as never));
    api = { getCurrentUser: vi.fn().mockResolvedValue(user) };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [AuthService, { provide: MsalService, useValue: msal }, { provide: ApiService, useValue: api }] });
    const auth = TestBed.inject(AuthService);
    await auth.initialize();
    expect(auth.account()).toBe(redirected);

    const noActiveMsal = createMsal();
    noActiveMsal.instance.getActiveAccount.mockReturnValue(null);
    noActiveMsal.instance.getAllAccounts.mockReturnValue([account]);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [AuthService, { provide: MsalService, useValue: noActiveMsal }, { provide: ApiService, useValue: api }] });
    const cachedAuth = TestBed.inject(AuthService);
    await cachedAuth.initialize();
    expect(cachedAuth.account()).toBe(account);
  });

  it("reports missing accounts, profile failures, and redirect observable failures", async () => {
    const auth = setup();
    msal.instance.getActiveAccount.mockReturnValue(null);
    msal.instance.getAllAccounts.mockReturnValue([]);
    await auth.initialize();
    expect(auth.error()).toContain("No signed-in React session");
    expect(auth.loading()).toBe(false);
    expect(api.getCurrentUser).not.toHaveBeenCalled();

    TestBed.resetTestingModule();
    msal = createMsal();
    api = { getCurrentUser: vi.fn().mockRejectedValue(new Error("profile unavailable")) };
    TestBed.configureTestingModule({ providers: [AuthService, { provide: MsalService, useValue: msal }, { provide: ApiService, useValue: api }] });
    const profileAuth = TestBed.inject(AuthService);
    await profileAuth.initialize();
    expect(profileAuth.error()).toBe("profile unavailable");

    TestBed.resetTestingModule();
    msal = createMsal();
    msal.handleRedirectObservable.mockReturnValue(throwError(() => Object.assign(new Error("busy"), { errorCode: "interaction_in_progress" })));
    TestBed.configureTestingModule({ providers: [AuthService, { provide: MsalService, useValue: msal }, { provide: ApiService, useValue: api }] });
    const redirectAuth = TestBed.inject(AuthService);
    await redirectAuth.initialize();
    expect(redirectAuth.error()).toContain("already in progress");
  });

  it("clears identity and returns to React after successful sign-out", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { ...window, location: { assign }, setTimeout, clearTimeout });
    const auth = setup();
    await auth.initialize();
    await auth.signOut();
    expect(auth.account()).toBeNull();
    expect(auth.user()).toBeNull();
    expect(msal.logoutPopup).toHaveBeenCalledWith({ account, postLogoutRedirectUri: "https://localhost/redirect.html" });
    expect(sessionStorage.getItem("wincapture.pick-account-after-logout")).toBe("true");
    expect(assign).toHaveBeenCalledOnce();
  });

  it("reports sign-out errors and tolerates unavailable session storage", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { ...window, location: { assign }, setTimeout, clearTimeout });
    const auth = setup();
    msal.logoutPopup.mockReturnValue(throwError(() => new Error("logout failed")));
    await auth.signOut();
    expect(auth.error()).toBe("logout failed");
    expect(assign).not.toHaveBeenCalled();

    TestBed.resetTestingModule();
    msal = createMsal();
    api = { getCurrentUser: vi.fn().mockResolvedValue(user) };
    TestBed.configureTestingModule({ providers: [AuthService, { provide: MsalService, useValue: msal }, { provide: ApiService, useValue: api }] });
    const secondAuth = TestBed.inject(AuthService);
    await secondAuth.initialize();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage disabled"); });
    await secondAuth.signOut();
    expect(assign).toHaveBeenCalledOnce();
    expect(secondAuth.error()).toBeNull();
  });
});
