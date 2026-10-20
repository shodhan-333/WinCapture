import { AlertTriangle } from "lucide-react";

interface BulkDeleteDialogProps {
  count: number;
  description: string;
  title?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  destructive?: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BulkDeleteDialog({
  count,
  description,
  title,
  confirmLabel = "Confirm",
  pendingLabel = "Workingâ€¦",
  destructive = true,
  pending,
  onCancel,
  onConfirm,
}: BulkDeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(15,35,55,0.30)] px-4 backdrop-blur-[12px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bulk-delete-title"
        aria-describedby="bulk-delete-description"
        className="[border:1px_solid_rgba(255,_255,_255,_0.88)] [background:rgba(255,_255,_255,_0.76)] [box-shadow:0_24px_64px_rgba(16,_40,_64,_0.14),_inset_0_1px_2px_0_rgba(255,_255,_255,_0.95)] [backdrop-filter:blur(28px)_saturate(180%)] [-webkit-backdrop-filter:blur(28px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] w-full max-w-[420px] rounded-[20px] p-6 shadow-[0_24px_64px_rgba(16,40,64,0.16)]"
      >
        <span className="grid h-10 w-10 place-items-center rounded-[12px] border border-white/80 bg-[rgba(255,235,238,0.7)] text-[#c83545] shadow-sm backdrop-blur-sm">
          <AlertTriangle aria-hidden="true" size={20} />
        </span>
        <h2 id="bulk-delete-title" className="mt-4 mb-0 text-[16px] font-semibold text-[#163855]">
          {title ?? `Delete ${count} ${count === 1 ? "file" : "files"}?`}
        </h2>
        <p
          id="bulk-delete-description"
          className="mt-2 mb-0 text-[11px] leading-[1.6] text-[#5b758b]"
        >
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#245277] [border:1px_solid_rgba(255,_255,_255,_0.58)] [background:rgba(255,_255,_255,_0.48)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.9),_0_3px_12px_rgba(24,_52,_78,_0.03)] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[color:#164063] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.68)] [&:hover:not(:disabled)]:[border-color:rgba(255,_255,_255,_0.88)] [&:hover:not(:disabled)]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.95),_0_5px_16px_rgba(24,_52,_78,_0.05)] min-h-[38px] px-4"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`${destructive ? "[color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.32)] [background:linear-gradient(135deg,_rgba(230,_58,_72,_0.88)_0%,_rgba(198,_28,_42,_0.95)_100%)] [box-shadow:0_8px_20px_rgba(200,_32,_48,_0.18),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.38)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(200,_32,_48,_0.24),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.48)] text-white" : "[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)]"} inline-flex min-h-[38px] min-w-[100px] items-center justify-center rounded-[10px] px-4 text-[10px] font-semibold disabled:cursor-wait disabled:opacity-60`}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
