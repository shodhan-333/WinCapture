import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RouteErrorBoundary } from "../../../frontend/src/app/routes/RouteErrorBoundary";

describe("route error boundary", () => {
  it("shows a recovery action after a render error and retries the page", () => {
    let shouldThrow = true;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    function UnstablePage() {
      if (shouldThrow) throw new Error("Unexpected page error");
      return <p>Recovered page</p>;
    }

    try {
      render(
        <RouteErrorBoundary>
          <UnstablePage />
        </RouteErrorBoundary>,
      );

      expect(screen.getByRole("alert")).toHaveTextContent("This page could not be displayed");
      shouldThrow = false;
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(screen.getByText("Recovered page")).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});
