import { Injectable, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { BrowserAuthError, InteractionRequiredAuthError, type AccountInfo } from '@azure/msal-browser';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';
import type { CurrentUser } from '../models';
import { apiErrorMessage } from '../utils';
import { apiScopes } from './msal.config';

const ANGULAR_SESSION_KEY = 'wincapture.angular.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService);
  private readonly api = inject(ApiService);
  readonly account = signal<AccountInfo | null>(null);
  readonly user = signal<CurrentUser | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private initialized = false;
  private interactionPending = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    try {
      const redirectResult = await firstValueFrom(this.msal.handleRedirectObservable());
      if (redirectResult?.account) {
        this.msal.instance.setActiveAccount(redirectResult.account);
        this.account.set(redirectResult.account);
        if (await this.loadProfile(redirectResult.account)) {
          this.rememberAngularSession();
        } else {
          this.clearAngularSession();
        }
        this.loading.set(false);
        return;
      }
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Microsoft could not complete silent sign-in.';
      this.error.set(`Microsoft could not reuse your session without a prompt. Return to React and open Albums again. Details: ${details}`);
    }

    const launchUrl = new URL(window.location.href);
    const loginHint = launchUrl.searchParams.get('login_hint');
    if (loginHint) {
      launchUrl.searchParams.delete('login_hint');
      window.history.replaceState(window.history.state, '', `${launchUrl.pathname}${launchUrl.search}${launchUrl.hash}`);
    }

    try {
      if (loginHint) {
        await this.resumeReactSession(loginHint);
      } else if (this.hasAngularSession()) {
        const account = this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0] ?? null;
        if (account) {
          this.msal.instance.setActiveAccount(account);
          this.account.set(account);
          if (!await this.loadProfile(account)) this.clearAngularSession();
        } else {
          this.clearAngularSession();
        }
      } else {
        this.clearAngularSession();
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async resumeReactSession(loginHint: string): Promise<void> {
    try {
      const result = await this.msal.instance.ssoSilent({
        loginHint,
        scopes: apiScopes,
        redirectUri: this.msal.instance.getConfiguration().auth?.redirectUri,
      });
      if (!result.account) throw new Error('Microsoft did not return an account.');
      this.msal.instance.setActiveAccount(result.account);
      this.account.set(result.account);
      if (await this.loadProfile(result.account)) {
        this.rememberAngularSession();
      } else {
        this.clearAngularSession();
      }
    } catch (error: unknown) {
      if (this.isSilentRedirectFallback(error)) {
        try {
          await firstValueFrom(this.msal.loginRedirect({
            loginHint,
            scopes: apiScopes,
            prompt: 'none',
            redirectUri: this.msal.instance.getConfiguration().auth?.redirectUri,
          }));
          return;
        } catch (redirectError: unknown) {
          error = redirectError;
        }
      }
      this.clearAngularSession();
      const details = error instanceof Error ? error.message : 'Microsoft did not complete the silent authentication request.';
      if (details.includes('AADSTS50058') || details.includes('login_required')) {
        this.error.set(`Microsoft reports no active browser SSO session (AADSTS50058). React may still be signed in from its own cached MSAL token, which Angular cannot share across these origins. In React, sign out from the profile menu, complete a fresh Microsoft sign-in, then open Albums again. Details: ${details}`);
      } else {
        this.error.set(`Your React sign-in could not be reused by Angular. The silent Microsoft redirect also failed. Details: ${details}`);
      }
    }
  }

  private isSilentRedirectFallback(error: unknown): boolean {
    return error instanceof InteractionRequiredAuthError ||
      (error instanceof BrowserAuthError && error.errorCode === 'timed_out');
  }

  async signOut(): Promise<void> {
    if (this.interactionPending) return;
    this.interactionPending = true;
    const account = this.account();
    this.user.set(null);
    this.account.set(null);
    this.error.set(null);
    this.clearAngularSession();
    try {
      await firstValueFrom(this.msal.logoutPopup({ account: account ?? undefined, postLogoutRedirectUri: this.msal.instance.getConfiguration().auth?.redirectUri }));
    } catch (error: unknown) {
      this.error.set(apiErrorMessage(error, 'Microsoft sign-out could not be completed.'));
    } finally {
      this.interactionPending = false;
    }
  }

  private async loadProfile(account: AccountInfo): Promise<boolean> {
    try {
      const user = await this.api.getCurrentUser<CurrentUser>(account);
      this.user.set(user);
      this.error.set(null);
      return true;
    } catch (error: unknown) {
      this.error.set(apiErrorMessage(error, 'Microsoft sign-in succeeded, but the WinCapture API could not load your account.'));
      return false;
    }
  }

  private hasAngularSession(): boolean {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const isExistingPageSession = navigation?.type === 'reload' || navigation?.type === 'back_forward';
      return isExistingPageSession && sessionStorage.getItem(ANGULAR_SESSION_KEY) === 'active';
    } catch {
      return false;
    }
  }

  private rememberAngularSession(): void {
    try {
      sessionStorage.setItem(ANGULAR_SESSION_KEY, 'active');
    } catch {
      // The current authenticated page remains usable if browser storage is unavailable.
    }
  }

  private clearAngularSession(): void {
    this.account.set(null);
    this.user.set(null);
    try {
      sessionStorage.removeItem(ANGULAR_SESSION_KEY);
    } catch {
      // There is no persistent session marker to clear when storage is unavailable.
    }
  }
}
