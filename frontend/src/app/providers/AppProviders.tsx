import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import type { IPublicClientApplication } from "@azure/msal-browser";
import { AuthProvider } from "@/features/auth";

interface AppProvidersProps {
  children: ReactNode;
  msalInstance: IPublicClientApplication;
}

export function AppProviders({ children, msalInstance }: AppProvidersProps) {
  return (
    <BrowserRouter>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>{children}</AuthProvider>
      </MsalProvider>
    </BrowserRouter>
  );
}
