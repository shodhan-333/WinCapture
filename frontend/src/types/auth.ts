export type UserRole = "User" | "Admin";

export interface CurrentUser {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  authenticationType: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CurrentUser | null;
  error: string | null;
}
