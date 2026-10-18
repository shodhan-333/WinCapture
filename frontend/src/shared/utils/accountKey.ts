import type { AccountInfo } from "@azure/msal-browser";

// MSAL may provide a new AccountInfo object for the same signed-in identity.
// Effects that fetch account-scoped data should depend on this stable key.
export function getAccountKey(account: AccountInfo | null): string | null {
  if (!account) return null;
  return `${account.homeAccountId}|${account.tenantId}|${account.localAccountId}`;
}
