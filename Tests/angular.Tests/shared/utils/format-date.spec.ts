import { describe, expect, it } from "vitest";
import { formatDate } from "../../../../frontend-angular/src/app/shared/utils/format-date";

describe("formatDate", () => {
  it("formats a date using the browser locale", () => {
    expect(formatDate("2024-02-03T12:00:00Z")).toBe(
      new Date("2024-02-03T12:00:00Z").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );
  });
});
