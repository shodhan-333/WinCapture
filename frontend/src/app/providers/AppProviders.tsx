import type { ReactNode } from "react";
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
