import { z } from "zod";
import { ApiError } from "@/shared/types/api";

export const CurrentUserSchema = z.object({
  userId: z.number().int().safe().positive(),
  name: z.string().refine((value) => value.trim().length > 0),
  email: z.string().refine((value) => value.trim().length > 0),
  role: z.enum(["User", "Admin"]),
  authenticationType: z.string().refine((value) => value.trim().length > 0),
});

export type CurrentUser = z.infer<typeof CurrentUserSchema>;

// Validate the current-user profile returned by the authenticated API.
export function parseCurrentUser(value: unknown, correlationId?: string): CurrentUser {
  const result = CurrentUserSchema.safeParse(value);
  if (!result.success) {
    throw new ApiError(
      "WinCapture received an invalid account profile. Retry, or contact support if the problem continues.",
      502,
      undefined,
      correlationId,
      "INVALID_PROFILE_RESPONSE",
    );
  }
  return result.data;
}
