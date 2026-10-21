import {
  ApplicationConfig,
  importProvidersFrom,
  provideAppInitializer,
  inject,
} from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { MsalModule, MsalService } from "@azure/msal-angular";
import { InteractionType, PublicClientApplication } from "@azure/msal-browser";
import { routes } from "./app.routes";
import { msalConfig, apiScopes } from "./core/auth/msal.config";

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL before routed components read the account shared with the React application.
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      MsalModule.forRoot(
        msalInstance,
        { interactionType: InteractionType.Popup, authRequest: { scopes: apiScopes } },
        { interactionType: InteractionType.Popup, protectedResourceMap: new Map() },
      ),
    ),
    provideAppInitializer(() => {
      const msal = inject(MsalService);
      return msal.instance.initialize();
    }),
  ],
};
