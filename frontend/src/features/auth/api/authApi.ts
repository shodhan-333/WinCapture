import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { callApi } from "@/shared/api/request";
import type { CurrentUser } from "@/features/auth/types/auth";
import { parseCurrentUser } from "@/features/auth/schemas/currentUser";

// Fetch and validate the signed-in user's backend profile at the API boundary.
export async function getCurrentUser(
  instance: IPublicClientApplication,
  account: AccountInfo,
  signal?: AbortSignal,
): Promise<CurrentUser> {
  const response = await callApi(instance, account, "/api/auth/me", { signal });

  const correlationId =
    response.headers.get("x-correlation-id") ?? response.headers.get("request-id") ?? undefined;
  return parseCurrentUser(await response.json(), correlationId);
}
