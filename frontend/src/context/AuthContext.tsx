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

import type {
  AccountInfo,
} from "@azure/msal-browser";

import {
  InteractionStatus,
} from "@azure/msal-browser";

import {
  useMsal,
} from "@azure/msal-react";

import {
  getCurrentUser,
} from "../api/apiClient";
import type { CurrentUser } from "../types/auth";

import {
  loginRequest,
  msalPostLogoutRedirectUri,
} from "../authConfig";

interface AuthContextValue {
  account: AccountInfo | null;
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    instance,
    accounts,
    inProgress,
  } = useMsal();

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);
  const requestVersion = useRef(0);
  const profileAccountId = useRef<string | null>(null);
  const refreshUserRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    if (
      !instance.getActiveAccount() &&
      accounts.length > 0
    ) {
      instance.setActiveAccount(
        accounts[0],
      );
    }
  }, [instance, accounts]);

  const account =
    instance.getActiveAccount() ??
    accounts[0] ??
    null;

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

      try {
        const currentUser =
          await getCurrentUser(
            instance,
            account,
          );

        if (requestVersion.current === version) {
          profileAccountId.current = account.homeAccountId;
          setUser(currentUser);
        }
      } catch (caughtError) {
        if (requestVersion.current === version) {
          profileAccountId.current = null;
          setUser(null);
          setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Microsoft authentication succeeded, but the WinCapture API rejected the request.",
          );
        }
      } finally {
        if (requestVersion.current === version) setLoading(false);
      }
    }, [account, instance]);

  refreshUserRef.current = refreshUser;

  useEffect(() => {
    if (
      inProgress ===
      InteractionStatus.None
    ) {
      void refreshUserRef.current();
    }
  }, [
    account?.homeAccountId,
    inProgress,
  ]);

  const login = useCallback(async () => {
      setError(null);

      try {
        await instance.loginRedirect(
          loginRequest,
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Microsoft authentication could not be started.",
        );
      }
    }, [instance]);

  const logout = useCallback(async () => {
      requestVersion.current += 1;
      profileAccountId.current = null;
      setUser(null);
      setError(null);

      try {
        await instance.logoutRedirect({
          account:
            account ?? undefined,
          postLogoutRedirectUri:
            msalPostLogoutRedirectUri,
        });
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Microsoft logout could not be completed.",
        );
      }
    }, [account, instance]);

  const value =
    useMemo<AuthContextValue>(
      () => ({
        account,
        user,
        loading:
          loading ||
          inProgress !==
            InteractionStatus.None,
        error,
        login,
        logout,
        refreshUser,
      }),
      [
        account,
        user,
        loading,
        inProgress,
        error,
        login,
        logout,
        refreshUser,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}

