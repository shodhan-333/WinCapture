import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useBulkSelection } from "../../../frontend/src/shared/hooks/useBulkSelection";
import { renderHookWithQueryClient } from "../utils/queryTestUtils";

describe("useBulkSelection", () => {
  it("starts, toggles, selects, removes, retains, and resets immutable selections", () => {
    const { result } = renderHookWithQueryClient(() => useBulkSelection<number>());
    expect(result.current.selectionMode).toBe(false);
    expect(result.current.selectedIds).toEqual(new Set());

    act(() => result.current.startSelection());
    act(() => result.current.toggle(1));
    expect(result.current.selectedIds).toEqual(new Set([1]));
    act(() => result.current.toggle(1));
    expect(result.current.selectedIds).toEqual(new Set());
    act(() => result.current.selectAll([1, 2, 3]));
    act(() => result.current.remove([2]));
    expect(result.current.selectedIds).toEqual(new Set([1, 3]));
    act(() => result.current.retain([3, 4]));
    expect(result.current.selectedIds).toEqual(new Set([3]));
    act(() => result.current.cancelSelection());
    expect(result.current.selectionMode).toBe(false);
    expect(result.current.selectedIds).toEqual(new Set());
  });

  it("supports string identifiers and empty selection updates", () => {
    const { result } = renderHookWithQueryClient(() => useBulkSelection<string>());
    act(() => result.current.selectAll(["a", "b"]));
    act(() => result.current.retain([]));
    expect(result.current.selectedIds.size).toBe(0);
    act(() => result.current.toggle("one"));
    expect(result.current.selectedIds.has("one")).toBe(true);
  });
});
