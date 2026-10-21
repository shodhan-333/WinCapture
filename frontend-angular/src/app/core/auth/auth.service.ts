import { Injectable, inject, signal } from "@angular/core";
import { MsalService } from "@azure/msal-angular";
import type { AccountInfo } from "@azure/msal-browser";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../api/api.service";
import type { CurrentUser } from "../models";
import { apiErrorMessage } from "../../shared/api/api-error-message";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
// Reuses the React MSAL session and loads the backend profile for the active account.
export class AuthService {
  private readonly msal = inject(MsalService);
  private readonly api = inject(ApiService);
  readonly account = signal<AccountInfo | null>(null);
  readonly user = signal<CurrentUser | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private initialized = false;

  // Resolve the cached account once, then map it to the WinCapture user profile.
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const redirectResult = await firstValueFrom(this.msal.handleRedirectObservable());
      const account =
        redirectResult?.account ??
        this.msal.instance.getActiveAccount() ??
        this.msal.instance.getAllAccounts()[0] ??
        null;

      if (!account) {
        this.error.set(
          "No signed-in React session was found in this browser tab. Sign in through React, then open Albums again.",
        );
        return;
      }

      this.msal.instance.setActiveAccount(account);
      this.account.set(account);
      await this.loadProfile(account);
    } catch (error: unknown) {
      this.error.set(
        apiErrorMessage(
          error,
          "The shared Microsoft session could not be read. Return to React and sign in again.",
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }

  // Clear local identity state, sign out through MSAL, and return to the React entry point.
  async signOut(): Promise<void> {
    const account = this.account();
    this.user.set(null);
    this.account.set(null);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.msal.logoutPopup({
          account: account ?? undefined,
          postLogoutRedirectUri: this.msal.instance.getConfiguration().auth?.redirectUri,
        }),
      );
      try {
        sessionStorage.setItem("wincapture.pick-account-after-logout", "true");
      } catch {
        // The React app will still open if session storage is unavailable.
      }
      window.location.assign(environment.reactBaseUrl);
    } catch (error: unknown) {
      this.error.set(apiErrorMessage(error, "Microsoft sign-out could not be completed."));
    }
  }

  // Keep backend profile errors separate from the MSAL account lookup so the UI can report them.
  private async loadProfile(account: AccountInfo): Promise<void> {
    try {
      const user = await this.api.getCurrentUser(account);
      this.user.set(user);
      this.error.set(null);
    } catch (error: unknown) {
      this.error.set(
        apiErrorMessage(
          error,
          "Microsoft sign-in succeeded, but the WinCapture API could not load your account.",
        ),
      );
    }
  }
}
