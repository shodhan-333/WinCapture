import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { callApi } from "@/shared/api/request";

// Fetch an authenticated preview and return a browser-managed object URL.
export async function getFilePreviewUrlByPath(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  contentType?: string,
): Promise<string> {
  const response = await callApi(instance, account, path);

  const responseBlob = await response.blob();

  // Preserve the known MIME type so the browser can render the preview correctly.
  const previewBlob = contentType ? new Blob([responseBlob], { type: contentType }) : responseBlob;

  return URL.createObjectURL(previewBlob);
}
