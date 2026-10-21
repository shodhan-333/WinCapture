import type { AccountInfo } from "@azure/msal-browser";

// Create a stable identity key for caches and effects across MSAL account refreshes.
export function getAccountKey(account: AccountInfo | null): string | null {
  if (!account) return null;
  return `${account.homeAccountId}|${account.tenantId}|${account.localAccountId}`;
}
