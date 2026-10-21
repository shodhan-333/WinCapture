import { createContext, useContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AccountInfo } from "@azure/msal-browser";
import { InteractionStatus } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "./api/authApi";
import { ApiError } from "@/shared/types/api";
import type { CurrentUser } from "@/features/auth/types/auth";
import { loginRequest, msalPostLogoutRedirectUri } from "@/config/auth";

interface AuthContextValue {
  account: AccountInfo | null;
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const PICK_ACCOUNT_AFTER_LOGOUT_KEY = "wincapture.pick-account-after-logout";

function accountPickerPending(): boolean {
  try {
    return sessionStorage.getItem(PICK_ACCOUNT_AFTER_LOGOUT_KEY) === "true";
  } catch {
    return false;
  }
}

function setAccountPickerPending(pending: boolean): void {
  try {
    if (pending) sessionStorage.setItem(PICK_ACCOUNT_AFTER_LOGOUT_KEY, "true");
    else sessionStorage.removeItem(PICK_ACCOUNT_AFTER_LOGOUT_KEY);
  } catch {
    // Auth can continue if browser storage is unavailable.
  }
}

// Keep Entra interaction state local and let TanStack Query own the backend profile request.
export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const queryClient = useQueryClient();
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [logoutStarted, setLogoutStarted] = useState(false);

  useEffect(() => {
    if (!instance.getActiveAccount() && accounts.length > 0 && accounts[0]) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [instance, accounts]);

  const account = instance.getActiveAccount() ?? accounts[0] ?? null;
  const profileKey = useMemo(() => ["auth", "profile", account?.homeAccountId ?? null] as const, [account?.homeAccountId]);
  const profileQuery = useQuery({
    queryKey: profileKey,
    enabled: !!account && inProgress === InteractionStatus.None && !logoutStarted,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!account) throw new Error("An authenticated account is required.");
      let timeoutId: number | undefined;
      try {
        return await Promise.race([
          getCurrentUser(instance, account, signal),
          new Promise<never>((_, reject) => {
            timeoutId = window.setTimeout(
              () => reject(new Error("WinCapture sign-in took too long. Check that the backend is running, then retry.")),
              15_000,
            );
          }),
        ]);
      } finally {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      }
    },
  });

  useEffect(() => {
    if (inProgress !== InteractionStatus.None || logoutStarted) return;
    if (!accountPickerPending()) return;
    setAccountPickerPending(false);
    setInteractionError(null);
    void instance.loginRedirect({ ...loginRequest, prompt: "select_account" }).catch(() => {
      setInteractionError("Microsoft account selection could not be started.");
    });
  }, [account?.homeAccountId, inProgress, instance, logoutStarted]);

  const refreshUser = useCallback(async () => {
    if (!account) return;
    await queryClient.invalidateQueries({ queryKey: profileKey, exact: true });
  }, [account, profileKey, queryClient]);

  const login = useCallback(async () => {
    setAccountPickerPending(false);
    setInteractionError(null);
    try {
      await instance.loginRedirect(loginRequest);
    } catch {
      setInteractionError("Microsoft sign-in could not be started. Check your connection and retry.");
    }
  }, [instance]);

  const logout = useCallback(async () => {
    setAccountPickerPending(true);
    setLogoutStarted(true);
    setInteractionError(null);
    if (account) queryClient.removeQueries({ queryKey: ["auth", "profile", account.homeAccountId] });
    try {
      await instance.logoutRedirect({
        account: account ?? undefined,
        postLogoutRedirectUri: msalPostLogoutRedirectUri,
      });
    } catch {
      setAccountPickerPending(false);
      setLogoutStarted(false);
      setInteractionError("Microsoft logout could not be completed.");
    }
  }, [account, instance, queryClient]);

  const queryError = profileQuery.error instanceof ApiError
    ? profileQuery.error.message
    : profileQuery.error
      ? "Microsoft authentication succeeded, but WinCapture could not load your profile. Retry the request."
      : null;
  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      user: profileQuery.data ?? null,
      loading: inProgress !== InteractionStatus.None || (!!account && profileQuery.isPending),
      error: interactionError ?? queryError,
      login,
      logout,
      refreshUser,
    }),
    [account, inProgress, interactionError, login, logout, profileQuery.data, profileQuery.isPending, queryError, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
