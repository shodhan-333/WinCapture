import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type IPublicClientApplication,
} from "@azure/msal-browser";

import {
  apiBaseUrl,
  apiScope,
} from "../authConfig";

export interface CurrentUser {
  userId: number;
  name: string;
  email: string;
  role: string;
  authenticationType: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function acquireAccessToken(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<string> {
  try {
    const result =
      await instance.acquireTokenSilent({
        account,
        scopes: [apiScope],
      });

    if (!result.accessToken) {
      throw new ApiError(
        "Microsoft Entra did not return an access token for the WinCapture API.",
        401,
      );
    }

    return result.accessToken;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (
      error instanceof InteractionRequiredAuthError
    ) {
      throw new ApiError(
        "Microsoft sign-in is required again before a WinCapture API access token can be acquired.",
        401,
      );
    }

    throw new ApiError(
      "Unable to acquire the Microsoft access token for the WinCapture API.",
      401,
    );
  }
}

async function getErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const data =
      (await response.json()) as {
        message?: string;
        error?: string;
      };

    return (
      data.message ||
      data.error ||
      `Backend returned HTTP ${response.status}.`
    );
  } catch {
    return `Backend returned HTTP ${response.status}.`;
  }
}

export async function callApi(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const accessToken =
    await acquireAccessToken(
      instance,
      account,
    );

  const headers =
    new Headers(options.headers);

  headers.set(
    "Authorization",
    `Bearer ${accessToken}`,
  );

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  let response: Response;

  try {
    response =
      await fetch(
        `${apiBaseUrl}${path}`,
        {
          ...options,
          headers,
        },
      );
  } catch {
    throw new ApiError(
      "The WinCapture API could not be reached. Check that https://localhost:7106 is running and trusted by the browser.",
      0,
    );
  }

  if (!response.ok) {
    let message =
      await getErrorMessage(response);

    if (response.status === 401) {
      message =
        `WinCapture API authentication failed (401). ${message}`;
    } else if (response.status === 403) {
      message =
        `WinCapture API authorization failed (403). ${message}`;
    } else if (response.status >= 500) {
      message =
        `WinCapture API server error (${response.status}). ${message}`;
    }

    throw new ApiError(
      message,
      response.status,
    );
  }

  return response;
}

export async function getCurrentUser(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<CurrentUser> {
  const response =
    await callApi(
      instance,
      account,
      "/api/auth/me",
    );

  return (
    (await response.json()) as CurrentUser
  );
}

export async function getApiBlob(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
): Promise<Blob> {
  const response =
    await callApi(
      instance,
      account,
      path,
    );

  return response.blob();
}