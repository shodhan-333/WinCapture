import { AlertTriangle } from "lucide-react";

interface BulkDeleteDialogProps {
  count: number;
  description: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function BulkDeleteDialog({ count, description, pending, onCancel, onConfirm }: BulkDeleteDialogProps) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(15,35,55,0.30)] px-4 backdrop-blur-[12px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onCancel(); }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="bulk-delete-title" aria-describedby="bulk-delete-description" className="glass-dialog w-full max-w-[420px] rounded-[20px] p-6 shadow-[0_24px_64px_rgba(16,40,64,0.16)]">
      <span className="grid h-10 w-10 place-items-center rounded-[12px] border border-white/80 bg-[rgba(255,235,238,0.7)] text-[#c83545] shadow-sm backdrop-blur-sm"><AlertTriangle aria-hidden="true" size={20} /></span>
      <h2 id="bulk-delete-title" className="mt-4 mb-0 text-[16px] font-semibold text-[#163855]">Delete {count} {count === 1 ? "file" : "files"}?</h2>
      <p id="bulk-delete-description" className="mt-2 mb-0 text-[11px] leading-[1.6] text-[#5b758b]">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" disabled={pending} onClick={onCancel} className="secondary-action min-h-[38px] px-4">Cancel</button>
        <button type="button" disabled={pending} onClick={onConfirm} className="danger-gradient-action inline-flex min-h-[38px] min-w-[100px] items-center justify-center rounded-[10px] px-4 text-[10px] font-semibold text-white disabled:cursor-wait disabled:opacity-60">{pending ? "Deleting…" : "Confirm"}</button>
      </div>
    </section>
  </div>;
}
