import { AlertTriangle } from "lucide-react";

interface BulkDeleteDialogProps {
  count: number;
  description: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function BulkDeleteDialog({ count, description, pending, onCancel, onConfirm }: BulkDeleteDialogProps) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#102c43]/45 px-4 backdrop-blur-[3px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onCancel(); }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="bulk-delete-title" aria-describedby="bulk-delete-description" className="surface w-full max-w-[420px] rounded-[18px] p-5 shadow-[0_24px_70px_rgba(15,43,66,0.25)]">
      <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#fff0f0] text-[#c84444]"><AlertTriangle aria-hidden="true" size={20} /></span>
      <h2 id="bulk-delete-title" className="mt-4 mb-0 text-[16px] font-semibold text-[#193c59]">Delete {count} {count === 1 ? "file" : "files"}?</h2>
      <p id="bulk-delete-description" className="mt-2 mb-0 text-[11px] leading-[1.6] text-[#71879a]">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" disabled={pending} onClick={onCancel} className="secondary-action min-h-[37px] px-4">Cancel</button>
        <button type="button" disabled={pending} onClick={onConfirm} className="inline-flex min-h-[37px] min-w-[100px] items-center justify-center rounded-[9px] bg-[#c84444] px-4 text-[10px] font-semibold text-white hover:enabled:bg-[#b53636] disabled:cursor-wait disabled:opacity-60">{pending ? "Deleting…" : "Confirm"}</button>
      </div>
    </section>
  </div>;
}
