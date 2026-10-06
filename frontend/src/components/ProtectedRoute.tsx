import type {
  ReactNode,
} from "react";

import {
  useIsAuthenticated,
} from "@azure/msal-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const isAuthenticated =
    useIsAuthenticated();

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}