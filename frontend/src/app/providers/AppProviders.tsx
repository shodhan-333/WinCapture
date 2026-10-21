import { useEffect, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import type { IPublicClientApplication } from "@azure/msal-browser";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/api/queryClient";
import { AuthProvider } from "@/features/auth";

interface AppProvidersProps {
  children: ReactNode;
  msalInstance: IPublicClientApplication;
}

// Supplies the router, MSAL session, auth context, and shared query cache to the application.
export function AppProviders({ children, msalInstance }: AppProvidersProps) {
  useEffect(() => queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== "removed") return;
    const prefix = event.query.queryKey[0];
    const data: unknown = event.query.state.data;
    if ((prefix === "file-preview" || prefix === "album-cover-preview") && typeof data === "string") {
      URL.revokeObjectURL(data);
    }
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MsalProvider instance={msalInstance}>
          <AuthProvider>{children}</AuthProvider>
        </MsalProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
