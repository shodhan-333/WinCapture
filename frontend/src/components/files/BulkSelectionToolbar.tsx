import { Trash2 } from "lucide-react";

interface BulkSelectionToolbarProps {
  selectedCount: number;
  visibleCount: number;
  disabled?: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onDelete: () => void;
}

export default function BulkSelectionToolbar({ selectedCount, visibleCount, disabled = false, onSelectAll, onClear, onDelete }: BulkSelectionToolbarProps) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-[13px] border border-[#dceaf5] bg-white/80 px-4 py-3 shadow-[0_5px_15px_rgba(45,94,136,0.04)]" aria-label="Bulk file actions">
    <div className="flex items-center gap-3 text-[11px] text-[#526d83]"><strong className="font-semibold text-[#24445d]">{selectedCount} selected</strong>
      <button type="button" disabled={disabled || visibleCount === 0} onClick={onSelectAll} className="font-semibold text-[#2878ba] hover:underline disabled:opacity-50">Select All</button>
      <button type="button" disabled={disabled || selectedCount === 0} onClick={onClear} className="font-semibold text-[#74899a] hover:underline disabled:opacity-50">Clear Selection</button>
    </div>
    <button type="button" disabled={disabled || selectedCount === 0} onClick={onDelete} className="inline-flex min-h-[36px] items-center gap-2 rounded-[9px] bg-[#c84444] px-3 text-[10px] font-semibold text-white shadow-sm transition hover:enabled:bg-[#b53636] disabled:cursor-not-allowed disabled:opacity-50"><Trash2 aria-hidden="true" size={15} />Delete Selected</button>
  </div>;
}
