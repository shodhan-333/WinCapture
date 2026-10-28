import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "../../../src/app/shared/api/api-error-message";

describe("apiErrorMessage", () => {
  it("reads supported lower and upper case backend messages", () => {
    expect(apiErrorMessage({ error: { message: "lower" } }, "fallback")).toBe("lower");
    expect(apiErrorMessage({ error: { Message: "upper" } }, "fallback")).toBe("upper");
    expect(apiErrorMessage({ error: { error: "error" } }, "fallback")).toBe("error");
  });

  it("ignores non-string and malformed response values", () => {
    expect(apiErrorMessage({ error: { message: 7, Message: null } }, "fallback")).toBe("fallback");
    expect(apiErrorMessage({ error: "no body object" }, "fallback")).toBe("fallback");
    expect(apiErrorMessage(null, "fallback")).toBe("fallback");
  });

  it("returns regular errors and recognizes an ongoing MSAL interaction", () => {
    expect(apiErrorMessage(new Error("request failed"), "fallback")).toBe("request failed");
    const interaction = Object.assign(new Error("ignored"), { errorCode: "interaction_in_progress" });
    expect(apiErrorMessage(interaction, "fallback")).toContain("already in progress");
  });
});
