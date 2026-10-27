import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BulkDeleteDialog } from "../../../frontend/src/features/files/components/files/BulkDeleteDialog";

describe("BulkDeleteDialog", () => {
  it("uses singular and plural fallback titles and handles safe confirmation", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = render(
      <BulkDeleteDialog count={1} description="Remove one file?" pending={false} onCancel={onCancel} onConfirm={onConfirm} />,
    );
    expect(screen.getByRole("alertdialog")).toHaveAccessibleName("Delete 1 file?");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledOnce();

    rerender(
      <BulkDeleteDialog count={4} description="Remove files?" destructive={false} pending={false} onCancel={onCancel} onConfirm={onConfirm} />,
    );
    expect(screen.getByRole("alertdialog")).toHaveAccessibleName("Delete 4 files?");
    fireEvent.mouseDown(screen.getByRole("presentation"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("prevents cancel and backdrop dismissal while work is pending", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <BulkDeleteDialog count={2} title="Working" description="Please wait" confirmLabel="Delete" pendingLabel="Deleting" pending onCancel={onCancel} onConfirm={onConfirm} />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deleting" })).toBeDisabled();
    fireEvent.mouseDown(screen.getByRole("presentation"));
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
