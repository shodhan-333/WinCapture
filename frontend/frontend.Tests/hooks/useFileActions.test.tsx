import { act } from "@testing-library/react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { describe, expect, it, vi } from "vitest";

import { useFileActions } from "../../src/features/files/hooks/useFileActions";
import type { FileResponse } from "../../src/features/files/types/file";
import { renderHookWithQueryClient } from "../utils/queryTestUtils";

vi.mock("../../src/features/files/api/filesApi", () => ({
  deleteFile: vi.fn(),
  downloadFileByPath: vi.fn(),
  replaceFile: vi.fn(),
}));

import { deleteFile, downloadFileByPath, replaceFile } from "../../src/features/files/api/filesApi";

const account = { homeAccountId: "account" } as AccountInfo;
const instance = {} as IPublicClientApplication;
const file: FileResponse = {
  id: 8,
  originalFileName: "report.pdf",
  contentType: "application/pdf",
  fileSize: 10,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: "",
  downloadUrl: "/download/8",
  isFavorite: false,
  canManage: true,
  canDownload: true,
};

function setup(accountValue: AccountInfo | null = account, input: HTMLInputElement | null = null, targetId: number | null = 8) {
  const loadFiles = vi.fn().mockResolvedValue(undefined);
  const removeSelected = vi.fn();
  const setError = vi.fn();
  const setSuccessMessage = vi.fn();
  const setFileDetails = vi.fn();
  const inputRef = { current: input };
  const targetRef = { current: targetId };
  const hook = renderHookWithQueryClient(() => useFileActions({
    instance, account: accountValue, view: "all", loadFiles, removeSelected,
    replaceInputRef: inputRef, replaceTargetIdRef: targetRef,
    setError, setSuccessMessage, setFileDetails,
  }));
  return { ...hook, inputRef, targetRef, loadFiles, removeSelected, setError, setSuccessMessage, setFileDetails };
}

const changeEvent = (selected: File[] | null, target = { value: "selected" }) => ({
  target: { files: selected, ...target },
}) as unknown as React.ChangeEvent<HTMLInputElement>;

describe("useFileActions", () => {
  it("ignores replacement events without a file, account, or target id", async () => {
    const noFile = setup();
    await act(async () => noFile.result.current.handleReplace(changeEvent([])));
    expect(replaceFile).not.toHaveBeenCalled();

    const noAccount = setup(null);
    await act(async () => noAccount.result.current.handleReplace(changeEvent([new File(["x"], "a.pdf")] )));
    expect(replaceFile).not.toHaveBeenCalled();

    const noTarget = setup(account, null, null);
    await act(async () => noTarget.result.current.handleReplace(changeEvent([new File(["x"], "a.pdf")] )));
    expect(replaceFile).not.toHaveBeenCalled();
  });

  it("rejects invalid replacements and clears the native picker value", async () => {
    const { result, setError, setSuccessMessage, targetRef } = setup();
    const unsupported = new File(["bad"], "script.exe", { type: "application/octet-stream" });
    const event = changeEvent([unsupported]);
    await act(async () => result.current.handleReplace(event));
    expect(setError).toHaveBeenCalledWith(expect.stringMatching(/unsupported/i));
    expect((event.target as HTMLInputElement).value).toBe("");
    expect(setSuccessMessage).not.toHaveBeenCalled();
    expect(targetRef.current).toBe(8);
  });

  it("replaces valid files, refreshes the selected view, and resets refs and input", async () => {
    vi.mocked(replaceFile).mockResolvedValue(file);
    const { result, loadFiles, targetRef } = setup();
    const replacement = new File(["new"], "new.pdf", { type: "application/pdf" });
    const event = changeEvent([replacement]);
    await act(async () => result.current.handleReplace(event));
    expect(replaceFile).toHaveBeenCalledWith(instance, account, 8, replacement);
    expect(loadFiles).toHaveBeenCalledWith("all");
    expect(targetRef.current).toBeNull();
    expect((event.target as HTMLInputElement).value).toBe("");
  });

  it("reports replacement failures from Error objects and non-Error values", async () => {
    vi.mocked(replaceFile).mockRejectedValueOnce(new Error("replace unavailable"));
    const first = setup();
    await act(async () => first.result.current.handleReplace(changeEvent([new File(["x"], "a.pdf")])));
    expect(first.setError).toHaveBeenCalledWith("replace unavailable");

    vi.mocked(replaceFile).mockRejectedValueOnce("offline");
    const second = setup();
    await act(async () => second.result.current.handleReplace(changeEvent([new File(["x"], "a.pdf")])));
    expect(second.setError).toHaveBeenCalledWith("Replace failed.");
  });

  it("downloads files only for an account and reports both failure shapes", async () => {
    const noAccount = setup(null);
    await act(async () => noAccount.result.current.handleDownload(file));
    expect(downloadFileByPath).not.toHaveBeenCalled();

    vi.mocked(downloadFileByPath).mockRejectedValueOnce(new Error("denied"));
    const first = setup();
    await act(async () => first.result.current.handleDownload(file));
    expect(downloadFileByPath).toHaveBeenCalledWith(instance, account, file.downloadUrl, file.originalFileName);
    expect(first.setError).toHaveBeenCalledWith("denied");

    vi.mocked(downloadFileByPath).mockRejectedValueOnce("offline");
    const second = setup();
    await act(async () => second.result.current.handleDownload(file));
    expect(second.setError).toHaveBeenCalledWith("Download failed.");
  });

  it("deletes files, reports cleanup warnings, and retains failed files", async () => {
    vi.mocked(deleteFile).mockResolvedValueOnce({ storageCleanupComplete: false });
    const success = setup();
    await act(async () => success.result.current.handleDelete(file.id));
    expect(success.removeSelected).toHaveBeenCalledWith([file.id]);
    expect(success.setSuccessMessage).toHaveBeenCalledWith(expect.stringMatching(/cleanup reconciliation/));
    expect(success.loadFiles).toHaveBeenCalledWith("all");

    vi.mocked(deleteFile).mockRejectedValueOnce(new Error("delete denied"));
    const error = setup();
    await act(async () => error.result.current.handleDelete(file.id));
    expect(error.setError).toHaveBeenCalledWith(expect.stringMatching(/file remains listed/));
    expect(error.removeSelected).not.toHaveBeenCalled();

    vi.mocked(deleteFile).mockRejectedValueOnce("offline");
    const rejected = setup();
    await act(async () => rejected.result.current.handleDelete(file.id));
    expect(rejected.setError).toHaveBeenCalledWith("Delete failed. You can safely retry.");
  });

  it("skips unauthenticated deletes, exposes details, and opens the replacement picker", async () => {
    const noAccount = setup(null);
    await act(async () => noAccount.result.current.handleDelete(file.id));
    expect(deleteFile).not.toHaveBeenCalled();

    const click = vi.fn();
    const input = { value: "old", click } as unknown as HTMLInputElement;
    const ready = setup(account, input, null);
    await act(async () => ready.result.current.handleShowFileDetails(file));
    expect(ready.setFileDetails).toHaveBeenCalledWith(file);
    act(() => ready.result.current.openReplace(file));
    expect(ready.targetRef.current).toBe(file.id);
    expect(input.value).toBe("");
    expect(click).toHaveBeenCalledOnce();
  });
});
