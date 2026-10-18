import { ApiError } from "@/shared/types/api";
import type { CurrentUser } from "@/features/auth/types/auth";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidCurrentUser(correlationId?: string): never {
  throw new ApiError(
    "WinCapture received an invalid account profile. Retry, or contact support if the problem continues.",
    502,
    undefined,
    correlationId,
    "INVALID_PROFILE_RESPONSE",
  );
}

export function parseCurrentUser(value: unknown, correlationId?: string): CurrentUser {
  if (!isRecord(value)) invalidCurrentUser(correlationId);

  const userId = value.userId;
  const name = value.name;
  const email = value.email;
  const role = value.role;
  const authenticationType = value.authenticationType;

  if (typeof userId !== "number" || !Number.isSafeInteger(userId) || userId <= 0) {
    invalidCurrentUser(correlationId);
  }
  if (typeof name !== "string" || !name.trim()) invalidCurrentUser(correlationId);
  if (typeof email !== "string" || !email.trim()) invalidCurrentUser(correlationId);
  if (role !== "User" && role !== "Admin") invalidCurrentUser(correlationId);
  if (typeof authenticationType !== "string" || !authenticationType.trim()) {
    invalidCurrentUser(correlationId);
  }

  return {
    userId,
    name,
    email,
    role,
    authenticationType,
  };
}
