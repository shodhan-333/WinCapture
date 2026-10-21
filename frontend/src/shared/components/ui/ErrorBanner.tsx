import type { ReactNode } from "react";

interface ErrorBannerProps {
  message: string;
  icon?: ReactNode;
}

// Expose a message as an accessible alert with an optional leading icon.
export function ErrorBanner({ message, icon = "!" }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="[border:1px_solid_rgba(225,_65,_80,_0.32)] [background:rgba(255,_240,_243,_0.55)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_6px_18px_rgba(100,_30,_38,_0.035)] [backdrop-filter:blur(14px)_saturate(160%)] [-webkit-backdrop-filter:blur(14px)_saturate(160%)] flex min-h-[48px] items-center gap-[10px] rounded-[12px] px-[14px] py-[10px] text-[11px] leading-[1.5] text-[#a63e46]"
    >
      <span className="grid h-[25px] w-[25px] flex-none place-items-center rounded-[8px] bg-[#ffe3e6] text-[12px] font-extrabold text-[#c74851]">
        {icon}
      </span>

      <span className="min-w-0">{message}</span>
    </div>
  );
}
