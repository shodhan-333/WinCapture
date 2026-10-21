import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { callApi } from "@/shared/api/request";
// Shared helper for uploading and replacing files in personal and album endpoints.
// Reuse the same multipart handling for personal-file and album-file uploads.
// Send a file as multipart data without setting a boundary-breaking content type.
export async function uploadMultipartFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  method: "POST" | "PUT",
  file: File,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);

  // Do not set Content-Type manually; fetch adds the required multipart boundary.
  const response = await callApi(instance, account, path, {
    method,
    body: formData,
  });

  const payload: unknown = await response.json();
  return payload;
}

// Fetch an authenticated file response and trigger a browser download.
export async function downloadResponse(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  fallbackFileName: string,
): Promise<void> {
  // Convert the response to a blob and trigger a browser download using its server filename when present.
  const response = await callApi(instance, account, path);

  const blob = await response.blob();
  const fileName = extractFileNameFromHeaders(response, fallbackFileName);

  triggerBrowserDownload(blob, fileName);
}

// Binary Download Utilities
// Prefer the server's content-disposition filename, falling back to the supplied name.
function extractFileNameFromHeaders(response: Response, fallback: string): string {
  const disposition = response.headers.get("content-disposition");

  if (!disposition) {
    return fallback;
  }

  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);

  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

// Use a temporary object URL and anchor to start the browser's download flow.
function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Release the temporary URL created for this download.
  window.URL.revokeObjectURL(url);
}
