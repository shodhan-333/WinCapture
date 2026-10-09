import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { IPublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "../../../frontend/src/api/apiClient";
import { AuthProvider, useAuth } from "../../../frontend/src/context/AuthContext";
import type { CurrentUser } from "../../../frontend/src/types/auth";

const msalState = vi.hoisted(() => ({
  instance: {
    getActiveAccount: vi.fn(),
    setActiveAccount: vi.fn(),
    loginRedirect: vi.fn(),
    logoutRedirect: vi.fn(),
  },
  accounts: [] as AccountInfo[],
  inProgress: "none",
}));

vi.mock("@azure/msal-react", () => ({ useMsal: () => msalState }));
vi.mock("../../../frontend/src/api/apiClient", () => ({ getCurrentUser: vi.fn() }));

const account = { homeAccountId: "home-1", username: "user@example.com" } as AccountInfo;
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
      <span>{auth.loading ? "Loading" : auth.user?.name ?? "Signed out"}</span>
      {auth.error && <p role="alert">{auth.error}</p>}
      <button onClick={() => void auth.login()}>Login</button>
      <button onClick={() => void auth.logout()}>Logout</button>
      <button onClick={() => void auth.refreshUser()}>Refresh</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    msalState.instance.getActiveAccount.mockReturnValue(account);
    msalState.instance.setActiveAccount.mockClear();
    msalState.instance.loginRedirect.mockResolvedValue(undefined);
    msalState.instance.logoutRedirect.mockResolvedValue(undefined);
    msalState.accounts = [account];
    msalState.inProgress = "none";
    vi.mocked(getCurrentUser).mockResolvedValue(user);
  });

  it("loads the backend user for the active Microsoft account", async () => {
    render(<AuthProvider><AuthStatus /></AuthProvider>);

    expect(await screen.findByText("Test User")).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalledWith(msalState.instance, account);
  });

  it("does not reload the profile when MSAL refreshes the account object for the same account", async () => {
    const { rerender } = render(<AuthProvider><AuthStatus /></AuthProvider>);
    expect(await screen.findByText("Test User")).toBeInTheDocument();

    const refreshedAccount = { ...account } as AccountInfo;
    msalState.instance.getActiveAccount.mockReturnValue(refreshedAccount);
    msalState.accounts = [refreshedAccount];
    rerender(<AuthProvider><AuthStatus /></AuthProvider>);

    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("sets the first MSAL account active when no active account is selected", async () => {
    msalState.instance.getActiveAccount.mockReturnValue(null);
    render(<AuthProvider><AuthStatus /></AuthProvider>);

    expect(await screen.findByText("Test User")).toBeInTheDocument();
    expect(msalState.instance.setActiveAccount).toHaveBeenCalledWith(account);
  });

  it("keeps signed-out state without requesting the backend", async () => {
    msalState.instance.getActiveAccount.mockReturnValue(null);
    msalState.accounts = [];
    render(<AuthProvider><AuthStatus /></AuthProvider>);

    expect(await screen.findByText("Signed out")).toBeInTheDocument();
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("clears the user and surfaces current-user API errors", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Access denied"));
    render(<AuthProvider><AuthStatus /></AuthProvider>);

    expect(await screen.findByRole("alert")).toHaveTextContent("Access denied");
    expect(screen.getByText("Signed out")).toBeInTheDocument();
  });

  it("starts login and logout through MSAL redirect methods", async () => {
    render(<AuthProvider><AuthStatus /></AuthProvider>);
    await screen.findByText("Test User");

    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await waitFor(() => expect(msalState.instance.loginRedirect).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await waitFor(() => expect(msalState.instance.logoutRedirect).toHaveBeenCalledOnce());
    expect(screen.getByText("Signed out")).toBeInTheDocument();
  });

  it("surfaces redirect errors to the user", async () => {
    msalState.instance.loginRedirect.mockRejectedValueOnce(new Error("Login failed"));
    render(<AuthProvider><AuthStatus /></AuthProvider>);
    await screen.findByText("Test User");

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Login failed");
  });
});
