import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ErrorBanner } from "../../../src/shared/components/ui/ErrorBanner";

describe("ErrorBanner", () => {
  it("exposes the message as an alert and accepts a custom icon", () => {
    render(<ErrorBanner message="Upload failed" icon={<span>!</span>} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
  });

  it("uses its default icon when one is not supplied", () => {
    render(<ErrorBanner message="Try again" />);
    expect(screen.getByRole("alert")).toHaveTextContent("!");
  });
});
