import { fireEvent, renderHook, screen, waitFor } from "@testing-library/react";
import type { AccountInfo } from "@azure/msal-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "../../../frontend/src/features/auth/api/authApi";
import { AuthProvider, useAuth } from "../../../frontend/src/features/auth/AuthContext";
import type { CurrentUser } from "../../../frontend/src/features/auth/types/auth";
import { renderWithQueryClient as render } from "../utils/queryTestUtils";

const msalState = vi.hoisted(() => ({
  instance: {
    getActiveAccount: vi.fn(),
    setActiveAccount: vi.fn(),
    loginRedirect: vi.fn(),
    logoutRedirect: vi.fn(),
  },
  accounts: [] as AccountInfo[],
  inProgress: "none",
  logoutRedirectError: null as unknown,
}));

vi.mock("@azure/msal-react", () => ({ useMsal: () => msalState }));
vi.mock("../../../frontend/src/features/auth/api/authApi", () => ({
  getCurrentUser: vi.fn(),
}));

const account = {
  homeAccountId: "home-1",
  username: "user@example.com",
} as AccountInfo;
const user: CurrentUser = {
  userId: 4,
  name: "Test User",
  email: "user@example.com",
  role: "User",
  authenticationType: "Microsoft Entra ID",
};

function AuthStatus() {
  const auth = useAuth();
  return (
    <div>
      <span>{auth.loading ? "Loading" : (auth.user?.name ?? "Signed out")}</span>
      {auth.error && <p role="alert">{auth.error}</p>}
      <button onClick={() => void auth.login()}>Login</button>
      <button onClick={() => void auth.logout()}>Logout</button>
      <button onClick={() => void auth.refreshUser()}>Refresh</button>
    </div>
  );
}

describe("AuthContext", () => {
  afterEach(() => vi.restoreAllMocks());

  it("requires consumers to be rendered inside the auth provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used inside AuthProvider.");
  });

  beforeEach(() => {
    sessionStorage.clear();
    msalState.instance.getActiveAccount.mockReturnValue(account);
    msalState.instance.setActiveAccount.mockClear();
    msalState.instance.loginRedirect.mockResolvedValue(undefined);
    msalState.instance.logoutRedirect.mockImplementation(() =>
      msalState.logoutRedirectError
        ? Promise.reject(msalState.logoutRedirectError)
        : Promise.resolve(undefined),
    );
    msalState.accounts = [account];
    msalState.inProgress = "none";
    msalState.logoutRedirectError = null;
    vi.mocked(getCurrentUser).mockResolvedValue(user);
  });

  it("loads the backend user for the active Microsoft account", async () => {
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    expect(await screen.findByText("Test User")).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalledWith(msalState.instance, account, expect.any(AbortSignal));
  });

  it("does not reload the profile when MSAL refreshes the account object for the same account", async () => {
    const { rerender } = render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    expect(await screen.findByText("Test User")).toBeInTheDocument();

    const refreshedAccount = { ...account } as AccountInfo;
    msalState.instance.getActiveAccount.mockReturnValue(refreshedAccount);
    msalState.accounts = [refreshedAccount];
    rerender(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("sets the first MSAL account active when no active account is selected", async () => {
    msalState.instance.getActiveAccount.mockReturnValue(null);
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    expect(await screen.findByText("Test User")).toBeInTheDocument();
    expect(msalState.instance.setActiveAccount).toHaveBeenCalledWith(account);
  });

  it("keeps signed-out state without requesting the backend", async () => {
    msalState.instance.getActiveAccount.mockReturnValue(null);
    msalState.accounts = [];
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    expect(await screen.findByText("Signed out")).toBeInTheDocument();
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("continues authentication when session storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    expect(await screen.findByText("Test User")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await waitFor(() => expect(msalState.instance.logoutRedirect).toHaveBeenCalledOnce());
  });

  it("clears the user and surfaces current-user API errors", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Access denied"));
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Microsoft authentication succeeded, but WinCapture could not load your profile.",
    );
    expect(screen.getByText("Signed out")).toBeInTheDocument();
  });

  it("starts login and logout through MSAL redirect methods", async () => {
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    await screen.findByText("Test User");

    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await waitFor(() => expect(msalState.instance.loginRedirect).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await waitFor(() => expect(msalState.instance.logoutRedirect).toHaveBeenCalledOnce());
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("shows a safe sign-in message when the redirect fails", async () => {
    msalState.instance.loginRedirect.mockRejectedValueOnce(new Error("Login failed"));
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    await screen.findByText("Test User");

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Microsoft sign-in could not be started. Check your connection and retry.",
    );
  });

  it("waits for MSAL interactions before loading the profile", async () => {
    msalState.inProgress = "login";
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("prompts for account selection after logout and reports redirect failures", async () => {
    sessionStorage.setItem("wincapture.pick-account-after-logout", "true");
    msalState.instance.loginRedirect.mockRejectedValueOnce("cannot redirect");
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Microsoft account selection could not be started.",
    );
    expect(msalState.instance.loginRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "select_account" }),
    );
    expect(sessionStorage.getItem("wincapture.pick-account-after-logout")).toBeNull();
  });

  it("clears the account-picker request when login starts and surfaces logout failures", async () => {
    sessionStorage.setItem("wincapture.pick-account-after-logout", "true");
    msalState.logoutRedirectError = "logout failed";
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    await waitFor(() => expect(msalState.instance.loginRedirect).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await waitFor(() =>
      expect(sessionStorage.getItem("wincapture.pick-account-after-logout")).toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Microsoft logout could not be completed.",
    );
    expect(sessionStorage.getItem("wincapture.pick-account-after-logout")).toBeNull();
  });

  it("refreshes the profile for the active account", async () => {
    vi.mocked(getCurrentUser)
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({ ...user, name: "Latest User" });
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    expect(await screen.findByText("Test User")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("Latest User")).toBeInTheDocument();
    expect(screen.getByText("Latest User")).toBeInTheDocument();
  });
});
