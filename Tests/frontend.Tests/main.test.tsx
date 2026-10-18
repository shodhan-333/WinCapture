import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const startup = vi.hoisted(() => ({
  validate: vi.fn(),
  initialize: vi.fn(),
  roots: [] as Array<{ unmount: () => void }>,
}));

vi.mock("react-dom/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom/client")>();
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
    constructor(_config: unknown) {}
  },
}));
vi.mock("@azure/msal-react", () => ({
  MsalProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../../frontend/src/authConfig", () => ({
  msalConfig: { auth: {} },
  validateEnvironment: startup.validate,
}));
vi.mock("../../frontend/src/App", () => ({ default: () => <p>Application mounted</p> }));
vi.mock("../../frontend/src/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
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

  it("shows initialization errors and supports non-Error startup failures", async () => {
    startup.initialize.mockRejectedValueOnce(new Error("MSAL unavailable"));
    await import("../../frontend/src/main");
    expect(await screen.findByText("MSAL unavailable")).toBeInTheDocument();

    cleanup();
    startup.roots.forEach((root) => root.unmount());
    startup.roots = [];
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules();
    startup.initialize.mockRejectedValueOnce("unexpected failure");
    await import("../../frontend/src/main");
    expect(await screen.findByText("unexpected failure")).toBeInTheDocument();
  });

  it("reports a missing root element", async () => {
    document.body.innerHTML = "";
    await expect(import("../../frontend/src/main")).rejects.toThrow("Could not find the root element.");
  });
});
