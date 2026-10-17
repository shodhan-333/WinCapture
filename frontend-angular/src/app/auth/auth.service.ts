import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { catchError, map, of, shareReplay, switchMap, tap, type Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { CurrentUser } from '../models/album.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService);
  private readonly http = inject(HttpClient);
  private initialization?: Observable<CurrentUser | null>;
  readonly user = signal<CurrentUser | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly configurationReady = Boolean(
    environment.msalClientId && environment.msalTenantId && environment.msalApiScope,
  );

  initialize(): Observable<CurrentUser | null> {
    if (this.initialization) return this.initialization;
    if (!this.configurationReady) {
      this.loading.set(false);
      this.error.set('Add the Entra client ID, tenant ID, and WinCapture API scope in src/environments/environment.ts.');
      return of(null);
    }

    this.loading.set(true);
    this.error.set(null);

    // The redirect bridge handles the callback on /redirect. MSAL must not process
    // the callback hash again on that intermediate page.
    const redirectHandling = window.location.pathname.endsWith('/redirect')
      ? of(null)
      : this.msal.handleRedirectObservable();

    this.initialization = redirectHandling.pipe(
      tap((result) => {
        if (result?.account) this.msal.instance.setActiveAccount(result.account);
        if (!this.msal.instance.getActiveAccount()) {
          const account = this.msal.instance.getAllAccounts()[0];
          if (account) this.msal.instance.setActiveAccount(account);
        }
      }),
      map(() => this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0] ?? null),
      switchMap((account) => {
        if (account) return of(account);

        // React and Angular run on different origins, so Angular cannot read the
        // React MSAL cache. Ask Entra to reuse its existing browser session silently.
        return this.msal.ssoSilent({
          scopes: [environment.msalApiScope],
          redirectUri: environment.silentRedirectUri,
        }).pipe(
          map((result) => result.account),
          // Silent SSO can fail when the browser blocks Entra's session cookie.
          // Keep the page usable and offer explicit sign-in only as a fallback.
          catchError((error: unknown) => {
            this.error.set(silentSsoError(error));
            return of(null);
          }),
        );
      }),
      switchMap((account) => {
        if (!account) return of(null);
        this.msal.instance.setActiveAccount(account);
        return this.http.get<CurrentUser>(`${environment.apiBaseUrl}/api/auth/me`).pipe(
          catchError((error: unknown) => {
            this.error.set(toErrorMessage(error, 'Unable to load your WinCapture account.'));
            return of(null);
          }),
        );
      }),
      catchError((error: unknown) => {
        this.error.set(toErrorMessage(error, 'Microsoft sign-in could not be completed.'));
        return of(null);
      }),
      tap((user) => {
        this.user.set(user);
        this.loading.set(false);
        if (user) this.error.set(null);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.initialization;
  }

  signIn(): void {
    if (!this.configurationReady) {
      this.error.set('Complete the Entra settings in src/environments/environment.ts before signing in.');
      return;
    }
    this.error.set(null);
    this.msal.loginRedirect({
      scopes: [environment.msalApiScope],
      redirectStartPage: '/albums',
    }).subscribe({
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(error instanceof Error ? error.message : 'Microsoft sign-in could not be started.');
      },
    });
  }

  signOut(): void {
    const account = this.msal.instance.getActiveAccount() ?? undefined;
    this.user.set(null);
    this.loading.set(true);
    this.initialization = undefined;
    this.msal.logoutRedirect({
      account,
      postLogoutRedirectUri: environment.postLogoutRedirectUri,
    }).subscribe({
      error: (error: unknown) => this.error.set(error instanceof Error ? error.message : 'Microsoft sign-out could not be completed.'),
    });
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const response = (error as { error?: { message?: string; Message?: string; error?: string } }).error;
    return response?.message ?? response?.Message ?? response?.error ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function silentSsoError(error: unknown): string {
  const detail = error instanceof Error ? error.message : '';
  const code = typeof error === 'object' && error !== null && 'errorCode' in error
    ? String((error as { errorCode?: unknown }).errorCode ?? '')
    : '';
  const reason = [code, detail].filter(Boolean).join(': ');

  return [
    'Angular could not reuse the existing Microsoft session silently.',
    'Check that http://localhost:4200/silent-redirect.html is registered as an SPA redirect URI and that this browser allows Microsoft sign-in cookies.',
    reason ? `Microsoft detail: ${reason}` : '',
  ].filter(Boolean).join(' ');
}
