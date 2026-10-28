import { describe, expect, it } from "vitest";
import { routes } from "../../src/app/app.routes";

describe("Angular routes", () => {
  it("defines the albums, default redirect, and fallback routes", async () => {
    const children = routes[0]?.children ?? [];
    expect(routes[0]?.path).toBe("");
    expect(children.find((route) => route.path === "")?.redirectTo).toBe("albums");
    expect(children.find((route) => route.path === "albums")?.title).toBe("Albums | WinCapture");
    expect(children.find((route) => route.path === "**")?.title).toBe("Page not found | WinCapture");
    const albums = await children.find((route) => route.path === "albums")?.loadComponent?.();
    const fallback = await children.find((route) => route.path === "**")?.loadComponent?.();
    expect(albums).toEqual(expect.any(Function));
    expect(fallback).toEqual(expect.any(Function));
  });
});
