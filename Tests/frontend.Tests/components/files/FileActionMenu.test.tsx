import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FileActionMenu from "../../../../frontend/src/components/files/FileActionMenu";

describe("FileActionMenu", () => {
  it("limits shared viewers to read actions", () => {
    render(<FileActionMenu
      fileName="shared.png"
      canManage={false}
      onReplace={vi.fn()}
      onDetails={vi.fn()}
      onDownload={vi.fn()}
      onDelete={vi.fn()}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Actions for shared.png" }));

    expect(screen.getByRole("menuitem", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Download" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Preview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Replace" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("runs management actions and closes on Escape", () => {
    const onReplace = vi.fn();
    const onDelete = vi.fn();
    render(<FileActionMenu
      fileName="owned.png"
      canManage
      onReplace={onReplace}
      onDetails={vi.fn()}
      onDownload={vi.fn()}
      onDelete={onDelete}
    />);

    const trigger = screen.getByRole("button", { name: "Actions for owned.png" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Replace" }));
    expect(onReplace).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
