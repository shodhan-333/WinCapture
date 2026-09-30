interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  label = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "size-4 border-2",
    md: "size-8 border-3",
    lg: "size-12 border-4",
  }[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 p-4 ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-slate-700 border-t-cyan-500 ${sizeClasses}`}
      />
      {label && <span className="text-sm font-medium text-slate-400">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
}
