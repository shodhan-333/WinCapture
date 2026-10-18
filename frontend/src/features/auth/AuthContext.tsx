import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { AccountInfo } from "@azure/msal-browser";

import { InteractionStatus } from "@azure/msal-browser";

import { useMsal } from "@azure/msal-react";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();

  const [user, setUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const logoutStarted = useRef(false);
  const profileAccountId = useRef<string | null>(null);
  const refreshUserRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    if (!instance.getActiveAccount() && accounts.length > 0) {
      const firstAccount = accounts[0];
      if (firstAccount) instance.setActiveAccount(firstAccount);
    }
  }, [instance, accounts]);

  const account = instance.getActiveAccount() ?? accounts[0] ?? null;

  const refreshUser = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!account) {
      profileAccountId.current = null;
      setUser(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (profileAccountId.current !== account.homeAccountId) {
      profileAccountId.current = null;
      setUser(null);
    }
    setLoading(true);
    setError(null);

    let profileTimeout: number | undefined;
    try {
      const currentUser = await Promise.race([
        getCurrentUser(instance, account),
        new Promise<never>((_, reject) => {
          profileTimeout = window.setTimeout(
            () =>
              reject(
                new Error(
                  "WinCapture sign-in took too long. Check that the backend is running, then retry.",
                ),
              ),
            15_000,
          );
        }),
      ]);

      if (requestVersion.current === version) {
        profileAccountId.current = account.homeAccountId;
        setUser(currentUser);
      }
    } catch (caughtError) {
      if (requestVersion.current === version) {
        profileAccountId.current = null;
        setUser(null);
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : "Microsoft authentication succeeded, but WinCapture could not load your profile. Retry the request.",
        );
      }
    } finally {
      if (profileTimeout !== undefined) window.clearTimeout(profileTimeout);
      if (requestVersion.current === version) setLoading(false);
    }
  }, [account, instance]);

  refreshUserRef.current = refreshUser;

  useEffect(() => {
    if (inProgress !== InteractionStatus.None || logoutStarted.current) return;

    if (accountPickerPending()) {
      setAccountPickerPending(false);
      setError(null);
      setLoading(true);
      void instance.loginRedirect({ ...loginRequest, prompt: "select_account" }).catch(() => {
        setError("Microsoft account selection could not be started.");
        setLoading(false);
      });
      return;
    }

    void refreshUserRef.current();
  }, [account?.homeAccountId, inProgress, instance]);

  const login = useCallback(async () => {
    setAccountPickerPending(false);
    setError(null);

    try {
      await instance.loginRedirect(loginRequest);
    } catch {
      setError("Microsoft sign-in could not be started. Check your connection and retry.");
    }
  }, [instance]);

  const logout = useCallback(async () => {
    setAccountPickerPending(true);
    logoutStarted.current = true;
    requestVersion.current += 1;
    profileAccountId.current = null;
    setUser(null);
    setError(null);

    try {
      await instance.logoutRedirect({
        account: account ?? undefined,
        postLogoutRedirectUri: msalPostLogoutRedirectUri,
      });
    } catch {
      setAccountPickerPending(false);
      logoutStarted.current = false;
      setError("Microsoft logout could not be completed.");
    }
  }, [account, instance]);

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      user,
      loading: loading || inProgress !== InteractionStatus.None,
      error,
      login,
      logout,
      refreshUser,
    }),
    [account, user, loading, inProgress, error, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
