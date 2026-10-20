import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Download, Info, MoreHorizontal, Replace, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";

interface FileActionMenuProps {
  fileName: string;
  canManage: boolean;
  canDownload: boolean;
  onReplace: () => void;
  onDetails: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

interface MenuPosition {
  top: number;
  left: number;
}

const MENU_GAP = 6;
const VIEWPORT_MARGIN = 8;

export function FileActionMenu({
  fileName,
  canManage,
  canDownload,
  onReplace,
  onDetails,
  onDownload,
  onDelete,
}: FileActionMenuProps) {
  const [open, setOpen] = useState(false);

  const [position, setPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const positionMenu = useCallback(() => {
    if (!triggerRef.current || !menuRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();

    const menuRect = menuRef.current.getBoundingClientRect();

    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - menuRect.width - VIEWPORT_MARGIN);
    const maxTop = Math.max(
      VIEWPORT_MARGIN,
      window.innerHeight - menuRect.height - VIEWPORT_MARGIN,
    );
    const belowTop = triggerRect.bottom + MENU_GAP;
    const aboveTop = triggerRect.top - menuRect.height - MENU_GAP;
    const fitsBelow = belowTop <= maxTop;
    const top = fitsBelow ? belowTop : Math.max(VIEWPORT_MARGIN, Math.min(aboveTop, maxTop));
    const left = Math.max(VIEWPORT_MARGIN, Math.min(triggerRect.right - menuRect.width, maxLeft));

    setPosition({
      top,
      left,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();

    positionMenu();
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleReposition = () => {
      positionMenu();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("resize", handleReposition);

    window.addEventListener("scroll", handleReposition, true);

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleReposition);

      window.removeEventListener("scroll", handleReposition, true);

      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, positionMenu]);

  const runAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border border-transparent bg-transparent p-0 font-[inherit] text-[#71879c] transition-all duration-[180ms] ease-out hover:border-white/70 hover:bg-white/60 hover:text-[#185fa6] hover:shadow-[0_2px_8px_rgba(20,54,84,0.06),inset_0_1px_rgba(255,255,255,0.85)] aria-expanded:border-white/80 aria-expanded:bg-white/75 aria-expanded:text-[#145a99] aria-expanded:shadow-[0_2px_10px_rgba(20,54,84,0.08),inset_0_1px_rgba(255,255,255,0.95)]"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Actions for ${fileName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="File actions"
      >
        <MoreHorizontal aria-hidden="true" size={19} strokeWidth={1.8} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="[border:1px_solid_rgba(255,_255,_255,_0.88)] [background:rgba(255,_255,_255,_0.72)] [box-shadow:0_16px_40px_rgba(20,_48,_72,_0.09),_inset_0_1px_1.5px_0_rgba(255,_255,_255,_0.92),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.25)] [backdrop-filter:blur(24px)_saturate(180%)] [-webkit-backdrop-filter:blur(24px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] z-[1000] w-[148px] max-h-[calc(100dvh-16px)] overflow-y-auto rounded-[12px] p-[6px]"
            role="menu"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
            }}
          >
            <button
              type="button"
              className="flex min-h-[34px] w-full items-center gap-2 rounded-lg border-0 bg-transparent px-[9px] text-left text-[10px] font-medium text-[#4d667c] transition-all duration-[160ms] ease-out hover:bg-white/60 hover:text-[#15599c] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a9bd4]"
              role="menuitem"
              onClick={() => runAction(onDetails)}
            >
              <Info aria-hidden="true" size={16} strokeWidth={1.8} />
              <span>Details</span>
            </button>

            {canManage && (
              <button
                type="button"
                className="flex min-h-[34px] w-full items-center gap-2 rounded-lg border-0 bg-transparent px-[9px] text-left text-[10px] font-medium text-[#4d667c] transition-all duration-[160ms] ease-out hover:bg-white/60 hover:text-[#15599c] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a9bd4]"
                role="menuitem"
                onClick={() => runAction(onReplace)}
              >
                <Replace aria-hidden="true" size={16} strokeWidth={1.8} />

                <span>Replace</span>
              </button>
            )}

            {canDownload && (
              <button
                type="button"
                title="Download file"
                className="flex min-h-[34px] w-full items-center gap-2 rounded-lg border-0 bg-transparent px-[9px] text-left text-[10px] font-medium text-[#4d667c] transition-all duration-[160ms] ease-out hover:bg-white/60 hover:text-[#15599c] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a9bd4]"
                role="menuitem"
                onClick={() => runAction(onDownload)}
              >
                <Download aria-hidden="true" size={16} strokeWidth={1.8} />

                <span>Download</span>
              </button>
            )}

            {canManage && (
              <button
                type="button"
                className="flex min-h-[34px] w-full items-center gap-2 rounded-lg border-0 bg-transparent px-[9px] text-left text-[10px] font-medium text-[#c9454f] transition-all duration-[160ms] ease-out hover:bg-[rgba(255,235,238,0.7)] hover:text-[#b52a35] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d85059]"
                role="menuitem"
                onClick={() => runAction(onDelete)}
              >
                <Trash2 aria-hidden="true" size={16} strokeWidth={1.8} />

                <span>Delete</span>
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
