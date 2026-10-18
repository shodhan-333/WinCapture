import { Component, type ReactNode } from "react";

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  override state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

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
            className="primary-action justify-self-center"
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
