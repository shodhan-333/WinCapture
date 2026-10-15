import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Download,
  Info,
  MoreHorizontal,
  Replace,
  Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";

interface FileActionMenuProps {
  fileName: string;
  canManage: boolean;
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

export default function FileActionMenu({
  fileName,
  canManage,
  onReplace,
  onDetails,
  onDownload,
  onDelete,
}: FileActionMenuProps) {
  const [open, setOpen] = useState(false);

  const [position, setPosition] =
    useState<MenuPosition>({
      top: 0,
      left: 0,
    });

  const triggerRef =
    useRef<HTMLButtonElement | null>(null);

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  const positionMenu = useCallback(() => {
    if (
      !triggerRef.current ||
      !menuRef.current
    ) {
      return;
    }

    const triggerRect =
      triggerRef.current.getBoundingClientRect();

    const menuRect =
      menuRef.current.getBoundingClientRect();

    const maxLeft = Math.max(
      VIEWPORT_MARGIN,
      window.innerWidth - menuRect.width - VIEWPORT_MARGIN,
    );
    const maxTop = Math.max(
      VIEWPORT_MARGIN,
      window.innerHeight - menuRect.height - VIEWPORT_MARGIN,
    );
    const belowTop = triggerRect.bottom + MENU_GAP;
    const aboveTop = triggerRect.top - menuRect.height - MENU_GAP;
    const fitsBelow = belowTop <= maxTop;
    const top = fitsBelow
      ? belowTop
      : Math.max(VIEWPORT_MARGIN, Math.min(aboveTop, maxTop));
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(triggerRect.right - menuRect.width, maxLeft),
    );

    setPosition({
      top,
      left,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();

    positionMenu();
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleReposition = () => {
      positionMenu();
    };

    const handlePointerDown = (
      event: PointerEvent,
    ) => {
      const target = event.target;

      if (
        target instanceof Node &&
        !triggerRef.current?.contains(
          target,
        ) &&
        !menuRef.current?.contains(
          target,
        )
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener(
      "resize",
      handleReposition,
    );

    window.addEventListener(
      "scroll",
      handleReposition,
      true,
    );

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleReposition,
      );

      window.removeEventListener(
        "scroll",
        handleReposition,
        true,
      );

      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, positionMenu]);

  const runAction = (
    action: () => void,
  ) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border-0 bg-transparent p-0 font-[inherit] text-[#8297a8] transition-[color,background] duration-[180ms] ease-[ease] hover:bg-[#edf6fd] hover:text-[#2b73bf] aria-expanded:bg-[#eaf4fc] aria-expanded:text-[#2876c7]"
        onClick={() =>
          setOpen(
            (current) => !current,
          )
        }
        aria-label={`Actions for ${fileName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="File actions"
      >
        <MoreHorizontal
          aria-hidden="true"
          size={19}
          strokeWidth={1.8}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="z-[1000] w-[148px] max-h-[calc(100dvh-16px)] overflow-y-auto rounded-[11px] border border-[rgba(199,222,239,0.86)] bg-[rgba(255,255,255,0.92)] p-[5px] shadow-[0_16px_34px_rgba(37,78,111,0.13),inset_0_1px_rgba(255,255,255,0.88)] backdrop-blur-[16px]"
            role="menu"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
            }}
          >
            <button
              type="button"
              className="flex min-h-[34px] w-full items-center gap-2 rounded-lg border-0 bg-transparent px-[9px] text-left text-[10px] font-medium text-[#5d7489] transition-[color,background] duration-[160ms] ease-[ease] hover:bg-[#edf6fd] hover:text-[#1c68b5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a9bd4]"
              role="menuitem"
              onClick={() => runAction(onDetails)}
            >
              <Info aria-hidden="true" size={16} strokeWidth={1.8} />
              <span>Details</span>
            </button>

            {canManage && (
              <button
                type="button"
                className="flex min-h-[34px] w-full items-center gap-2 rounded-lg border-0 bg-transparent px-[9px] text-left text-[10px] font-medium text-[#5d7489] transition-[color,background] duration-[160ms] ease-[ease] hover:bg-[#edf6fd] hover:text-[#1c68b5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a9bd4]"
                role="menuitem"
                onClick={() =>
                  runAction(onReplace)
                }
              >
                <Replace
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.8}
                />

                <span>Replace</span>
              </button>
            )}

            <button
              type="button"
              className="flex min-h-[34px] w-full items-center gap-2 rounded-lg border-0 bg-transparent px-[9px] text-left text-[10px] font-medium text-[#5d7489] transition-[color,background] duration-[160ms] ease-[ease] hover:bg-[#edf6fd] hover:text-[#1c68b5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a9bd4]"
              role="menuitem"
              onClick={() =>
                runAction(onDownload)
              }
            >
              <Download
                aria-hidden="true"
                size={16}
                strokeWidth={1.8}
              />

              <span>Download</span>
            </button>

            {canManage && (
              <button
                type="button"
                className="flex min-h-[34px] w-full items-center gap-2 rounded-lg border-0 bg-transparent px-[9px] text-left text-[10px] font-medium text-[#d85059] transition-[color,background] duration-[160ms] ease-[ease] hover:bg-[#fff0f1] hover:text-[#c33d46] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d85059]"
                role="menuitem"
                onClick={() =>
                  runAction(onDelete)
                }
              >
                <Trash2
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.8}
                />

                <span>Delete</span>
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
