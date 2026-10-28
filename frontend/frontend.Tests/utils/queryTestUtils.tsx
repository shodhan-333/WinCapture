import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render as testingLibraryRender,
  renderHook as testingLibraryRenderHook,
} from "@testing-library/react";
import type { RenderHookOptions, RenderOptions } from "@testing-library/react";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithQueryClient(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  const client = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return testingLibraryRender(ui, { ...options, wrapper: Wrapper });
}

export function renderHookWithQueryClient<TResult, TProps = undefined>(
  callback: (initialProps: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, "wrapper">,
) {
  const client = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return testingLibraryRenderHook(callback, { ...options, wrapper: Wrapper });
}
