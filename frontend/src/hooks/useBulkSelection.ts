import { useCallback, useState } from "react";

export default function useBulkSelection<T extends string | number>() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<T>>(() => new Set());
  const startSelection = useCallback(() => setSelectionMode(true), []);
  const cancelSelection = useCallback(() => { setSelectionMode(false); setSelectedIds(new Set()); }, []);
  const toggle = useCallback((id: T) => setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }), []);
  const selectAll = useCallback((ids: readonly T[]) => setSelectedIds(new Set(ids)), []);
  const remove = useCallback((ids: readonly T[]) => setSelectedIds((current) => { const next = new Set(current); ids.forEach((id) => next.delete(id)); return next; }), []);
  const retain = useCallback(
    (ids: readonly T[]) => setSelectedIds((current) => new Set([...current].filter((id) => ids.includes(id)))),
    [],
  );
  return { selectionMode, selectedIds, startSelection, cancelSelection, toggle, selectAll, remove, retain };
}
