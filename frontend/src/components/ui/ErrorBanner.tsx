import type { ReactNode } from "react";

interface ErrorBannerProps {
  message: string;
  icon?: ReactNode;
}

export default function ErrorBanner({
  message,
  icon = "!",
}: ErrorBannerProps) {
  return (
    <div role="alert" className="error-banner">
      <span className="error-banner-icon">
        {icon}
      </span>

      <span>{message}</span>
    </div>
  );
}
