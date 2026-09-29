import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
  type CurrentUser,
} from "../api/apiClient";

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

  const refreshUser =
    async () => {
      if (!account) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const currentUser =
          await getCurrentUser(
            instance,
            account,
          );

        setUser(currentUser);
      } catch (caughtError) {
        setUser(null);

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Microsoft authentication succeeded, but the WinCapture API rejected the request.",
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (
      inProgress ===
      InteractionStatus.None
    ) {
      void refreshUser();
    }
  }, [
    account?.homeAccountId,
    inProgress,
  ]);

  const login =
    async () => {
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
    };

  const logout =
    async () => {
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
    };

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