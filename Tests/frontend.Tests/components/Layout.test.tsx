import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Layout from "../../../frontend/src/components/Layout";

const auth = vi.hoisted(() => ({
  user: { userId: 1, name: "Test User", email: "test@example.com", role: "User", authenticationType: "Entra" },
  logout: vi.fn(),
}));

vi.mock("../../../frontend/src/context/AuthContext", () => ({
  useAuth: () => auth,
}));

function renderLayout(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="*" element={<p>Page content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("Layout navigation", () => {
  beforeEach(() => {
    auth.logout.mockClear();
  });

  it("keeps the separate Admin navigation item removed for all roles", () => {
    auth.user = { ...auth.user, role: "User" };
    const { rerender } = renderLayout("/dashboard");
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Files" })).toBeInTheDocument();

    auth.user = { ...auth.user, role: "Admin" };
    rerender(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes><Route element={<Layout />}><Route path="*" element={<p>Page content</p>} /></Route></Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("opens Sign out from the profile menu", () => {
    auth.user = { ...auth.user, role: "User" };
    renderLayout("/dashboard");
    expect(screen.queryByRole("menuitem", { name: "Sign out" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Profile menu for Test User" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(auth.logout).toHaveBeenCalledOnce();
  });
});
