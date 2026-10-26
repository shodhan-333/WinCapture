import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type * as ReactDOMClient from "react-dom/client";

const startup = vi.hoisted(() => ({
  validate: vi.fn(),
  initialize: vi.fn(),
  roots: [] as Array<{ unmount: () => void }>,
}));

vi.mock("react-dom/client", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactDOMClient>();
  return {
    ...actual,
    createRoot: (element: HTMLElement) => {
      const root = actual.createRoot(element);
      startup.roots.push(root);
      return root;
    },
  };
});

vi.mock("@azure/msal-browser", () => ({
  PublicClientApplication: class {
    initialize = startup.initialize;
    constructor() {}
  },
}));
vi.mock("@azure/msal-react", () => ({
  MsalProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../../frontend/src/config/auth", () => ({
  msalConfig: { auth: {} },
  validateEnvironment: startup.validate,
}));
vi.mock("../../frontend/src/App", () => ({ App: () => <p>Application mounted</p> }));
vi.mock("../../frontend/src/app/providers/AppProviders", () => ({
  AppProviders: ({ children }: { children: ReactNode }) => children,
}));

describe("React application startup", () => {
  beforeEach(() => {
    vi.resetModules();
    startup.roots = [];
    startup.validate.mockReset().mockReturnValue([]);
    startup.initialize.mockReset().mockResolvedValue(undefined);
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    cleanup();
    startup.roots.forEach((root) => root.unmount());
    startup.roots = [];
  });

  it("initializes MSAL before rendering the application", async () => {
    await import("../../frontend/src/main");

    await waitFor(() => expect(screen.getByText("Application mounted")).toBeInTheDocument());
    expect(startup.validate).toHaveBeenCalledOnce();
    expect(startup.initialize).toHaveBeenCalledOnce();
  });

  it("shows the list of missing environment values without starting MSAL", async () => {
    startup.validate.mockReturnValue(["VITE_ENTRA_CLIENT_ID", "VITE_API_URL"]);
    await import("../../frontend/src/main");

    expect(await screen.findByRole("heading", { name: "Could not start the app" })).toBeInTheDocument();
    expect(screen.getByText("Missing environment variables: VITE_ENTRA_CLIENT_ID, VITE_API_URL")).toBeInTheDocument();
    expect(startup.initialize).not.toHaveBeenCalled();
  });

  it("shows a safe initialization message for Error and non-Error failures", async () => {
    startup.initialize.mockRejectedValueOnce(new Error("MSAL unavailable"));
    await import("../../frontend/src/main");
    expect(await screen.findByText("WinCapture could not initialize Microsoft sign-in. Check the app configuration and retry.")).toBeInTheDocument();

    cleanup();
    startup.roots.forEach((root) => root.unmount());
    startup.roots = [];
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules();
    startup.initialize.mockRejectedValueOnce("unexpected failure");
    await import("../../frontend/src/main");
    expect(await screen.findByText("WinCapture could not initialize Microsoft sign-in. Check the app configuration and retry.")).toBeInTheDocument();
  });

  it("reports a missing root element", async () => {
    document.body.innerHTML = "";
    await expect(import("../../frontend/src/main")).rejects.toThrow("Could not find the root element.");
  });
});
