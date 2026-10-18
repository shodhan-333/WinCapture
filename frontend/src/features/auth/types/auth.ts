export type UserRole = "User" | "Admin";

export interface CurrentUser {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  authenticationType: string;
}
