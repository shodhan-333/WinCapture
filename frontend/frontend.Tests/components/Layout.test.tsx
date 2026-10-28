import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAngularAlbumsUrl } from "../../src/config/auth";

import { Layout } from "../../src/app/components/Layout";

const auth = vi.hoisted(() => ({
  user: {
    userId: 1,
    name: "Test User",
    email: "test@example.com",
    role: "User",
    authenticationType: "Entra",
  },
  logout: vi.fn(),
}));

vi.mock("../../src/features/auth/AuthContext", () => ({
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
    expect(
      screen.queryByRole("link", { name: "Admin" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Files" })).toBeInTheDocument();

    auth.user = { ...auth.user, role: "Admin" };
    rerender(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="*" element={<p>Page content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("link", { name: "Admin" }),
    ).not.toBeInTheDocument();
  });

  it("opens Sign out from the profile menu", () => {
    auth.user = { ...auth.user, role: "User" };
    renderLayout("/dashboard");
    expect(
      screen.queryByRole("menuitem", { name: "Sign out" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Profile menu for Test User" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it("uses fallback profile details when signed out and closes mobile links after selection", () => {
    auth.user = null as never;
    renderLayout("/dashboard");
    const profile = screen.getByRole("button", {
      name: "Profile menu for WinCapture User",
    });
    expect(profile).toBeInTheDocument();
    expect(profile).toHaveTextContent("WinCapture User");
    expect(profile).toHaveTextContent("User");
    expect(screen.getByRole("link", { name: "Albums" })).toHaveAttribute(
      "href",
      getAngularAlbumsUrl(),
    );

    fireEvent.click(profile);
    fireEvent.keyDown(document, { key: "Enter" });
    expect(
      screen.getByRole("menu", { name: "Profile options" }),
    ).toBeInTheDocument();
    fireEvent.pointerDown(
      screen.getByRole("menu", { name: "Profile options" }),
    );
    expect(
      screen.getByRole("menu", { name: "Profile options" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const albumLink = within(
      screen.getByRole("navigation", { name: "Mobile navigation" }),
    ).getByRole("link", { name: "Albums" });
    albumLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(albumLink);
    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeInTheDocument();
  });
});
