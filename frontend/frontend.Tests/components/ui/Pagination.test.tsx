import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "../../../src/shared/components/ui/Pagination";

describe("Pagination", () => {
  it("shows the current page and disables navigation at the boundaries", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination currentPage={1} pageCount={3} onPageChange={onPageChange} />);

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    rerender(<Pagination currentPage={3} pageCount={3} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    rerender(<Pagination currentPage={2} pageCount={3} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });
});
