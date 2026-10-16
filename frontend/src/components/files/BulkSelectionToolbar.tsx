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
  return <div className="glass-toolbar flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-4 py-3 shadow-[0_6px_20px_rgba(24,52,78,0.04)]" aria-label="Bulk file actions">
    <div className="flex items-center gap-3 text-[11px] text-[#4d6b82]"><strong className="font-semibold text-[#163855]">{selectedCount} selected</strong>
      <button type="button" disabled={disabled || visibleCount === 0} onClick={onSelectAll} className="font-semibold text-[#1b74d3] hover:underline disabled:opacity-50">Select All</button>
      <button type="button" disabled={disabled || selectedCount === 0} onClick={onClear} className="font-semibold text-[#688297] hover:underline disabled:opacity-50">Clear Selection</button>
    </div>
    <button type="button" disabled={disabled || selectedCount === 0} onClick={onDelete} className="danger-gradient-action inline-flex min-h-[36px] items-center gap-2 rounded-[10px] px-3 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Trash2 aria-hidden="true" size={15} />Delete Selected</button>
  </div>;
}
