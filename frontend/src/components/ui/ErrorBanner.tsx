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
    <div
      role="alert"
      className="flex min-h-[48px] items-center gap-[10px] rounded-[12px] border border-[#f1d0d3] bg-[rgba(255,243,244,0.88)] px-[14px] py-[10px] text-[11px] leading-[1.5] text-[#a63e46] shadow-[0_7px_18px_rgba(173,66,76,0.05),inset_0_1px_rgba(255,255,255,0.6)]"
    >
      <span className="grid h-[25px] w-[25px] flex-none place-items-center rounded-[8px] bg-[#ffe3e6] text-[12px] font-extrabold text-[#c74851]">
        {icon}
      </span>

      <span className="min-w-0">{message}</span>
    </div>
  );
}
