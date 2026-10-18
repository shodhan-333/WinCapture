import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { describe, expect, it, vi } from "vitest";

const { callApiMock } = vi.hoisted(() => ({ callApiMock: vi.fn() }));

vi.mock("../../../frontend/src/shared/api/request", () => ({ callApi: callApiMock }));

import { getCurrentUser } from "../../../frontend/src/features/auth/api/authApi";

const instance = {} as IPublicClientApplication;
const account = { homeAccountId: "account-1" } as AccountInfo;

describe("getCurrentUser", () => {
  it("returns a validated Entra profile", async () => {
    const profile = {
      userId: 17,
      name: "Avery Morgan",
      email: "avery@example.com",
      role: "Admin",
      authenticationType: "MicrosoftEntraId",
    };
    callApiMock.mockResolvedValueOnce(
      new Response(JSON.stringify(profile), {
        headers: { "x-correlation-id": "correlation-17" },
      }),
    );

    await expect(getCurrentUser(instance, account)).resolves.toEqual(profile);
    expect(callApiMock).toHaveBeenCalledWith(instance, account, "/api/auth/me");
  });

  it("rejects malformed profiles without accepting an unknown role", async () => {
    callApiMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          userId: 17,
          name: "Avery Morgan",
          email: "avery@example.com",
          role: "SuperAdmin",
          authenticationType: "MicrosoftEntraId",
        }),
        { headers: { "request-id": "correlation-invalid" } },
      ),
    );

    await expect(getCurrentUser(instance, account)).rejects.toMatchObject({
      name: "ApiError",
      status: 502,
      code: "INVALID_PROFILE_RESPONSE",
      correlationId: "correlation-invalid",
    });
  });
});
