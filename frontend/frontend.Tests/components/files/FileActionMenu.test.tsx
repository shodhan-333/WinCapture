import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileActionMenu } from "../../../src/features/files/components/files/FileActionMenu";

describe("FileActionMenu", () => {
  it("limits shared viewers to read actions", () => {
    render(
      <FileActionMenu
        fileName="shared.png"
        canManage={false}
        canDownload
        onReplace={vi.fn()}
        onDetails={vi.fn()}
        onDownload={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

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
    render(
      <FileActionMenu
        fileName="owned.png"
        canManage
        canDownload
        onReplace={onReplace}
        onDetails={vi.fn()}
        onDownload={vi.fn()}
        onDelete={onDelete}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Actions for owned.png",
    });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Replace" }));
    expect(onReplace).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("positions the menu above its trigger and clamps it within the viewport", () => {
    const { container } = render(
      <FileActionMenu
        fileName="edge.pdf"
        canManage={false}
        canDownload={false}
        onReplace={vi.fn()}
        onDetails={vi.fn()}
        onDownload={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("button", {
      name: "Actions for edge.pdf",
    });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      top: 750,
      bottom: 770,
      left: 1000,
      right: 1020,
      width: 20,
      height: 20,
      x: 1000,
      y: 750,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.getAttribute("role") === "menu"
        ? {
            top: 0,
            bottom: 100,
            left: 0,
            right: 2000,
            width: 2000,
            height: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          }
        : {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          };
    });

    fireEvent.click(trigger);
    const menu = screen.getByRole("menu");
    expect(menu).toHaveStyle({ top: "644px", left: "8px" });
    fireEvent.pointerDown(menu);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.pointerDown(container);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
