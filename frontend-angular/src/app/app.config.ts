import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  InteractionType,
  PublicClientApplication,
  type IPublicClientApplication,
} from '@azure/msal-browser';
import {
  MsalGuardConfiguration,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalModule,
} from '@azure/msal-angular';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

function createMsalInstance(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msalClientId || '00000000-0000-0000-0000-000000000000',
      authority: `https://login.microsoftonline.com/${environment.msalTenantId || 'common'}`,
      redirectUri: environment.redirectUri,
      postLogoutRedirectUri: environment.postLogoutRedirectUri,
    },
    cache: { cacheLocation: 'sessionStorage' },
  });
}

function createMsalGuardConfig(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: { scopes: environment.msalApiScope ? [environment.msalApiScope] : [] },
  };
}

function createMsalInterceptorConfig(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, string[]>();
  const apiUrl = environment.apiBaseUrl.replace(/\/$/, '');
  if (apiUrl && environment.msalApiScope) {
    protectedResourceMap.set(`${apiUrl}/*`, [environment.msalApiScope]);
  }

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(MsalModule.forRoot(
      createMsalInstance(),
      createMsalGuardConfig(),
      createMsalInterceptorConfig(),
    )),
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
  ],
};
