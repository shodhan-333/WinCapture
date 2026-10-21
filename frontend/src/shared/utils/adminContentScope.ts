export type AdminContentScope = "mine" | "all";

const ADMIN_CONTENT_SCOPE_KEY = "wincapture.admin-content-scope";

// Read the selected admin content scope and fall back safely when storage is unavailable.
export function getAdminContentScope(): AdminContentScope {
  try {
    return sessionStorage.getItem(ADMIN_CONTENT_SCOPE_KEY) === "all" ? "all" : "mine";
  } catch {
    return "mine";
  }
}

// Persist the admin scope so dashboard and file views use the same selection.
export function setAdminContentScope(scope: AdminContentScope): void {
  try {
    sessionStorage.setItem(ADMIN_CONTENT_SCOPE_KEY, scope);
  } catch {
    // Keep the dashboard usable if browser storage is unavailable.
  }
}
