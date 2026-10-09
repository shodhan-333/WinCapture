import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import App from "../../frontend/src/App";

const auth = vi.hoisted(() => ({
  account: { username: "user@example.com" },
  user: { userId: 1, name: "Test User", email: "test@example.com", role: "User", authenticationType: "Entra" },
  loading: false,
  login: vi.fn(),
}));

vi.mock("../../frontend/src/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../../frontend/src/pages/Dashboard", () => ({ default: () => <p>Dashboard page</p> }));
vi.mock("../../frontend/src/pages/AlbumsPage", () => ({ default: () => <p>Albums page</p> }));
vi.mock("../../frontend/src/pages/AlbumDetailPage", () => ({ default: () => <p>Album detail page</p> }));
vi.mock("../../frontend/src/pages/FilesPage", () => ({ default: () => <p>Files page</p> }));
vi.mock("../../frontend/src/pages/AdminPage", () => ({ default: () => <p>Admin management page</p> }));

describe("application route authorization", () => {
  it("redirects non-admin users away from the admin management route", async () => {
    auth.user = { ...auth.user, role: "User" };
    render(<MemoryRouter initialEntries={["/admin"]}><App /></MemoryRouter>);

    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
    expect(screen.queryByText("Admin management page")).not.toBeInTheDocument();
  });

  it("renders the admin route for users with the Admin role", () => {
    auth.user = { ...auth.user, role: "Admin" };
    render(<MemoryRouter initialEntries={["/admin"]}><App /></MemoryRouter>);
    expect(screen.getByText("Admin management page")).toBeInTheDocument();
  });
});
