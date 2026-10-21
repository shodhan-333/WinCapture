import { Component, type ReactNode } from "react";

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

// Prevent a route render error from blanking the application and offer an in-place retry.
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  override state: RouteErrorBoundaryState = { hasError: false };

  // Switch to the fallback view when a routed component throws during rendering.
  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  // Render a retryable error message or the child route content.
  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main
          className="mx-auto grid min-h-[50vh] max-w-xl place-content-center gap-4 p-6 text-center"
          role="alert"
        >
          <h1 className="text-2xl font-semibold">This page could not be displayed</h1>
          <p>Try again. If the problem continues, return to the dashboard.</p>
          <button
            className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)] justify-self-center"
            onClick={this.handleRetry}
            type="button"
          >
            Try again
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
