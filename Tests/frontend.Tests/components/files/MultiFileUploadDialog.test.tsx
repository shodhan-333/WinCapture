import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MultiFileUploadDialog from "../../../../frontend/src/components/files/MultiFileUploadDialog";

function file(name: string, size = 128) {
  return new File([new Uint8Array(size)], name, { type: "application/pdf", lastModified: 10 });
}

describe("MultiFileUploadDialog", () => {
  it("lists selected files with sizes and removes a file before uploading", () => {
    render(<MultiFileUploadDialog title="Upload" description="Choose files" onUpload={vi.fn()} onComplete={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Choose files to upload"), { target: { files: [file("first.pdf"), file("second.pdf")] } });

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
    render(<MultiFileUploadDialog title="Upload" description="Choose files" onUpload={onUpload} onComplete={onComplete} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Choose files to upload"), { target: { files: [file("good.pdf"), file("bad.pdf")] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload 2 files" }));

    expect(await screen.findByText("Uploads finished: 1 successful, 1 failed.")).toBeInTheDocument();
    expect(onUpload).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledWith(1, 1);
    expect(screen.getByText(/Upload failed\. Check your connection and try again\./)).toBeInTheDocument();
  });

  it("marks unsupported and oversized files invalid without sending them", async () => {
    const onUpload = vi.fn();
    render(<MultiFileUploadDialog title="Upload" description="Choose files" onUpload={onUpload} onComplete={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Choose files to upload"), { target: { files: [file("unsafe.exe"), file("large.pdf", 10 * 1024 * 1024 + 1)] } });

    expect(screen.getByText(/Unsupported file format/)).toBeInTheDocument();
    expect(screen.getByText(/Files must be 10 MB or smaller/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload 0 files" })).toBeDisabled();
    expect(onUpload).not.toHaveBeenCalled();
  });
});
