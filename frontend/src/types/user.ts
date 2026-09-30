import type { UserRole } from "./auth";

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}
