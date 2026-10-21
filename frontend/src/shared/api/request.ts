import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type IPublicClientApplication,
} from "@azure/msal-browser";
import { apiBaseUrl, apiScope } from "@/config/auth";
import { ApiError } from "@/shared/types/api";

const interactiveTokenRequests = new WeakMap<IPublicClientApplication, Promise<void>>();

// Deduplicate interactive token prompts so concurrent failed requests share one redirect.
function beginInteractiveTokenAcquisition(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<void> {
  const existingRequest = interactiveTokenRequests.get(instance);
  if (existingRequest) return existingRequest;

  const request = instance.acquireTokenRedirect({
    account,
    scopes: [apiScope],
    redirectStartPage: window.location.href,
  });
  interactiveTokenRequests.set(instance, request);
  void request.catch(() => {
    if (interactiveTokenRequests.get(instance) === request) {
      interactiveTokenRequests.delete(instance);
    }
  });
  return request;
}

// Try silent MSAL token acquisition first and redirect only when interaction is required.
async function acquireAccessToken(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<string> {
  try {
    const result = await instance.acquireTokenSilent({ account, scopes: [apiScope] });
    if (!result.accessToken) {
      throw new ApiError(
        "Microsoft Entra did not return an access token for the WinCapture API.",
        401,
      );
    }
    return result.accessToken;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof InteractionRequiredAuthError) {
      try {
        await beginInteractiveTokenAcquisition(instance, account);
      } catch (interactionError) {
        throw new ApiError(
          interactionError instanceof Error
            ? `Microsoft sign-in could not be completed: ${interactionError.message}`
            : "Microsoft sign-in could not be completed. Please try signing in again.",
          401,
        );
      }
      interactiveTokenRequests.delete(instance);
      throw new ApiError(
        "Microsoft sign-in or consent is required. Complete the sign-in prompt and retry.",
        401,
      );
    }
    throw new ApiError("Unable to acquire the Microsoft access token for the WinCapture API.", 401);
  }
}

// Map common HTTP failures to concise messages suitable for frontend views.
function getUserErrorMessage(status: number): string {
  if (status === 400)
    return "Some of the submitted information is invalid. Review it and try again.";
  if (status === 401) return "Your Microsoft session has expired. Sign in again and retry.";
  if (status === 403) return "You do not have permission to complete this action.";
  if (status === 404) return "The requested item could not be found.";
  if (status === 409) return "This change conflicts with the current data. Refresh and try again.";
  if (status === 413) return "The selected file is too large to upload.";
  if (status >= 500) return "The service encountered a problem. Please try again later.";
  return "The request could not be completed. Please try again.";
}

// Add the bearer token, send the request, and map transport/API failures to a safe AppError.
export async function callApi(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const accessToken = await acquireAccessToken(instance, account);
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      "The WinCapture API could not be reached. Ensure the backend is running and reachable.",
      0,
    );
  }

  if (!response.ok) {
    const correlationId =
      response.headers.get("x-correlation-id") ?? response.headers.get("request-id") ?? undefined;
    throw new ApiError(
      getUserErrorMessage(response.status),
      response.status,
      undefined,
      correlationId,
    );
  }
  return response;
}
