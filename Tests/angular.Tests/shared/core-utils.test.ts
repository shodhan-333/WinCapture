import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "../../../frontend-angular/src/app/shared/api/api-error-message";
import { formatDate } from "../../../frontend-angular/src/app/shared/utils/format-date";

describe("Angular core utilities", () => {
  it("formats dates and resolves API error bodies in priority order", () => {
    expect(formatDate("2024-01-02T12:00:00Z")).toContain("Jan");
    expect(apiErrorMessage({ error: { message: "primary", Message: "upper" } }, "fallback")).toBe(
      "primary",
    );
    expect(apiErrorMessage({ error: { Message: "upper" } }, "fallback")).toBe("upper");
    expect(apiErrorMessage({ error: { error: "nested" } }, "fallback")).toBe("nested");
    expect(apiErrorMessage(new Error("ordinary"), "fallback")).toBe("ordinary");
    const interaction = Object.assign(new Error("ignored"), {
      errorCode: "interaction_in_progress",
    });
    expect(apiErrorMessage(interaction, "fallback")).toContain("already in progress");
    expect(apiErrorMessage(null, "fallback")).toBe("fallback");
  });

  it("ignores non-string API error fields and falls back for malformed bodies", () => {
    expect(apiErrorMessage({ error: { message: 42, Message: null } }, "fallback")).toBe("fallback");
    expect(apiErrorMessage({ error: "server unavailable" }, "fallback")).toBe("fallback");
    expect(apiErrorMessage({ error: { error: "nested message" } }, "fallback")).toBe(
      "nested message",
    );
  });
});
