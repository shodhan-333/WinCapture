import type { ReactNode } from "react";

interface BulkSelectionToolbarProps {
  selectedCount: number;
  visibleCount: number;
  disabled?: boolean;
  onSelectAll: () => void;
  onCancel: () => void;
  actions?: ReactNode;
}

export function BulkSelectionToolbar({
  selectedCount,
  visibleCount,
  disabled = false,
  onSelectAll,
  onCancel,
  actions,
}: BulkSelectionToolbarProps) {
  return (
    <div
      className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:rgba(255,_255,_255,_0.28)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_4px_16px_rgba(24,_52,_78,_0.03)] [backdrop-filter:blur(16px)_saturate(160%)] [-webkit-backdrop-filter:blur(16px)_saturate(160%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-4 py-3 shadow-[0_6px_20px_rgba(24,52,78,0.04)]"
      aria-label="Bulk file actions"
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#4d6b82]">
        <strong
          aria-live="polite"
          className="inline-flex min-h-[34px] items-center rounded-[9px] border border-white/80 bg-[rgba(227,241,253,0.72)] px-3 font-semibold text-[#163855] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]"
        >
          {selectedCount} selected
        </strong>
        <button
          type="button"
          disabled={disabled || visibleCount === 0}
          onClick={onSelectAll}
          className="inline-flex min-h-[34px] items-center justify-center rounded-[9px] border border-white/80 bg-white/55 px-3 text-[10px] font-semibold text-[#1b67ad] shadow-sm transition-colors hover:enabled:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3787d4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Select all shown
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onCancel}
          className="inline-flex min-h-[34px] items-center justify-center rounded-[9px] border border-[rgba(102,130,151,0.22)] bg-[rgba(240,246,251,0.6)] px-3 text-[10px] font-semibold text-[#5d7589] shadow-sm transition-colors hover:enabled:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3787d4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel selection
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}
