import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { callApi } from "@/shared/api/request";
// Shared helper for uploading and replacing files in personal and album endpoints.
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

export async function downloadResponse(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  fallbackFileName: string,
): Promise<void> {
  const response = await callApi(instance, account, path);

  const blob = await response.blob();
  const fileName = extractFileNameFromHeaders(response, fallbackFileName);

  triggerBrowserDownload(blob, fileName);
}

// Binary Download Utilities
function extractFileNameFromHeaders(response: Response, fallback: string): string {
  const disposition = response.headers.get("content-disposition");

  if (!disposition) {
    return fallback;
  }

  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);

  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

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
