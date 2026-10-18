import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MultiFileUploadDialog } from "../../../../frontend/src/features/files/components/files/MultiFileUploadDialog";
import { ApiError } from "../../../../frontend/src/shared/types/api";

function file(name: string, size = 128) {
  return new File([new Uint8Array(size)], name, {
    type: "application/pdf",
    lastModified: 10,
  });
}

describe("MultiFileUploadDialog", () => {
  it("lists selected files with sizes and removes a file before uploading", () => {
    render(
      <MultiFileUploadDialog
        title="Upload"
        description="Choose files"
        onUpload={vi.fn()}
        onComplete={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Choose files to upload"), {
      target: { files: [file("first.pdf"), file("second.pdf")] },
    });

    expect(screen.getByText("Selected files (2)")).toBeInTheDocument();
    expect(screen.getByText("first.pdf")).toBeInTheDocument();
    expect(screen.getAllByText("128 B")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Remove first.pdf" }));
    expect(screen.queryByText("first.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("Selected files (1)")).toBeInTheDocument();
  });

  it("continues after individual failures and reports successful and failed uploads", async () => {
    const onUpload = vi.fn().mockImplementation(async (selectedFile: File) => {
      if (selectedFile.name === "bad.pdf") throw new Error("network failure");
    });
    const onComplete = vi.fn();
    render(
      <MultiFileUploadDialog
        title="Upload"
        description="Choose files"
        onUpload={onUpload}
        onComplete={onComplete}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Choose files to upload"), {
      target: { files: [file("good.pdf"), file("bad.pdf")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload 2 files" }));

    expect(
      await screen.findByText("Uploads finished: 1 successful, 1 failed."),
    ).toBeInTheDocument();
    expect(onUpload).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledWith(1, 1);
    expect(
      screen.getByText(/Upload failed\. Check your connection and try again\./),
    ).toBeInTheDocument();
  });

  it("marks unsupported and oversized files invalid without sending them", async () => {
    const onUpload = vi.fn();
    render(
      <MultiFileUploadDialog
        title="Upload"
        description="Choose files"
        onUpload={onUpload}
        onComplete={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Choose files to upload"), {
      target: {
        files: [file("unsafe.exe"), file("large.pdf", 10 * 1024 * 1024 + 1)],
      },
    });

    expect(screen.getByText(/Unsupported file format/)).toBeInTheDocument();
    expect(screen.getByText(/Files must be 10 MB or smaller/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload 0 files" })).toBeDisabled();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("maps authentication, permission, validation, and server upload failures", async () => {
    const onUpload = vi.fn().mockImplementation(async (selectedFile: File) => {
      if (selectedFile.name === "expired.pdf") throw new ApiError("expired", 401);
      if (selectedFile.name === "denied.pdf") throw new ApiError("denied", 403);
      if (selectedFile.name === "invalid.pdf") throw new ApiError("Invalid metadata", 422);
      if (selectedFile.name === "server.pdf") throw new ApiError("failure", 503);
      throw new Error("offline");
    });
    const onUploadingChange = vi.fn();
    const onComplete = vi.fn();
    render(
      <MultiFileUploadDialog
        title="Upload"
        description="Choose files"
        onUpload={onUpload}
        onComplete={onComplete}
        onUploadingChange={onUploadingChange}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Choose files to upload"), {
      target: {
        files: [
          file("expired.pdf"),
          file("denied.pdf"),
          file("invalid.pdf"),
          file("server.pdf"),
          file("offline.pdf"),
        ],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload 5 files" }));

    expect(
      await screen.findByText("Uploads finished: 0 successful, 5 failed."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Your session expired/)).toBeInTheDocument();
    expect(screen.getByText(/You do not have permission to upload/)).toBeInTheDocument();
    expect(screen.getByText(/Invalid metadata/)).toBeInTheDocument();
    expect(screen.getByText(/The server could not upload this file/)).toBeInTheDocument();
    expect(screen.getAllByText(/Upload failed\. Check your connection/)).toHaveLength(1);
    expect(onComplete).toHaveBeenCalledWith(0, 5);
    expect(onUploadingChange.mock.calls).toEqual([[true], [false]]);
  });

  it("deduplicates dropped files and tracks drag enter, leave, and drop states", () => {
    const onUpload = vi.fn();
    render(
      <MultiFileUploadDialog
        title="Upload"
        description="Choose files"
        onUpload={onUpload}
        onComplete={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const dropZone = screen.getByText("Drop files here, or choose files").parentElement!;
    const selected = file("dropped.pdf");
    fireEvent.dragEnter(dropZone);
    expect(dropZone.className).toContain("border-[#4a9be2]");
    fireEvent.dragLeave(dropZone, { relatedTarget: document.body });
    expect(dropZone.className).not.toContain("border-[#4a9be2]");
    fireEvent.drop(dropZone, { dataTransfer: { files: [selected, selected] } });
    expect(screen.getByText("Selected files (1)")).toBeInTheDocument();
    expect(screen.getByText("dropped.pdf")).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });
});
