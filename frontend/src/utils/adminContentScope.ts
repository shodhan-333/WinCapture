export type AdminContentScope = "mine" | "all";

const ADMIN_CONTENT_SCOPE_KEY = "wincapture.admin-content-scope";

export function getAdminContentScope(): AdminContentScope {
  try {
    return sessionStorage.getItem(ADMIN_CONTENT_SCOPE_KEY) === "all"
      ? "all"
      : "mine";
  } catch {
    return "mine";
  }
}

export function setAdminContentScope(scope: AdminContentScope): void {
  try {
    sessionStorage.setItem(ADMIN_CONTENT_SCOPE_KEY, scope);
  } catch {
    // Keep the dashboard usable if browser storage is unavailable.
  }
}
