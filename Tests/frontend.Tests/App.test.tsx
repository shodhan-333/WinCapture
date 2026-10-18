import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../frontend/src/App";

const auth = vi.hoisted(() => ({
  account: { username: "user@example.com" },
  user: {
    userId: 1,
    name: "Test User",
    email: "test@example.com",
    role: "User",
    authenticationType: "Entra",
  },
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  error: null as string | null,
}));

vi.mock("../../frontend/src/features/auth/AuthContext", () => ({
  useAuth: () => auth,
}));
vi.mock("@/features/dashboard", () => ({
  Dashboard: () => <p>Dashboard page</p>,
}));
vi.mock("@/features/albums", () => ({
  AlbumsPage: () => <p>Albums page</p>,
  AlbumDetailPage: () => <p>Album detail page</p>,
}));
vi.mock("@/features/files", () => ({ FilesPage: () => <p>Files page</p> }));

describe("application route authorization", () => {
  beforeEach(() => {
    auth.account = { username: "user@example.com" };
    auth.user = {
      userId: 1,
      name: "Test User",
      email: "test@example.com",
      role: "User",
      authenticationType: "Entra",
    };
    auth.loading = false;
    auth.error = null;
    auth.login.mockReset().mockResolvedValue(undefined);
    auth.logout.mockReset().mockResolvedValue(undefined);
    auth.refreshUser.mockReset().mockResolvedValue(undefined);
  });

  it("routes regular users to the shared dashboard from the former admin URL", async () => {
    auth.user = { ...auth.user, role: "User" };
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
    expect(screen.queryByText("Admin management page")).not.toBeInTheDocument();
  });

  it("routes administrators to the shared dashboard", async () => {
    auth.user = { ...auth.user, role: "Admin" };
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  });

  it("waits silently while authentication is loading", () => {
    auth.user = null as never;
    auth.loading = true;
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("starts sign-in once when the session is signed out", async () => {
    auth.account = null as never;
    auth.user = null as never;
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Redirecting to Microsoft" })).toBeInTheDocument();
    await waitFor(() => expect(auth.login).toHaveBeenCalledOnce());
  });

  it("shows authentication errors and routes retry to the session-aware action", async () => {
    auth.loading = true;
    auth.user = null as never;
    auth.error = "API unavailable";
    const { rerender } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    auth.loading = false;
    rerender(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("API unavailable");
    auth.account = null as never;
    rerender(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(auth.login).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.logout).toHaveBeenCalledOnce();

    auth.account = { username: "user@example.com" } as never;
    rerender(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(auth.refreshUser).toHaveBeenCalledOnce();
  });

  it("shows a 404 for unknown routes", async () => {
    render(
      <MemoryRouter initialEntries={["/not-a-route"]}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});
