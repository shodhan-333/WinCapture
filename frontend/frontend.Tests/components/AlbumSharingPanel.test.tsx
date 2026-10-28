import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlbumSharingPanel } from "../../src/features/albums/components/AlbumSharingPanel";
import type { AlbumMemberResponse } from "../../src/features/albums/types/album";

const member = (overrides: Partial<AlbumMemberResponse>): AlbumMemberResponse => ({
  userId: 1,
  name: "Alex Member",
  email: "alex@example.test",
  canView: true,
  canDownload: true,
  grantedAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

function renderPanel(members: AlbumMemberResponse[] = []) {
  const onMemberEmailChange = vi.fn();
  const onCanViewChange = vi.fn();
  const onCanDownloadChange = vi.fn();
  const onAddMember = vi.fn().mockResolvedValue(undefined);
  const onUpdateMember = vi.fn().mockResolvedValue(undefined);
  const onRemoveMember = vi.fn().mockResolvedValue(undefined);
  render(
    <AlbumSharingPanel
      members={members}
      memberEmail="new@example.test"
      canView
      canDownload
      memberAccessError="Sharing unavailable"
      onMemberEmailChange={onMemberEmailChange}
      onCanViewChange={onCanViewChange}
      onCanDownloadChange={onCanDownloadChange}
      onAddMember={onAddMember}
      onUpdateMember={onUpdateMember}
      onRemoveMember={onRemoveMember}
    />,
  );
  fireEvent.click(screen.getByText("Share access"));
  return { onMemberEmailChange, onCanViewChange, onCanDownloadChange, onAddMember, onUpdateMember, onRemoveMember };
}

describe("AlbumSharingPanel", () => {
  it("renders the empty state and wires invite and permission controls", () => {
    const callbacks = renderPanel();
    expect(screen.getByText("No one else has access yet.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Sharing unavailable");
    expect(screen.getAllByText("0")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "invite@example.test" } });
    fireEvent.click(screen.getAllByRole("button", { name: "On" })[0]!);
    fireEvent.click(screen.getAllByRole("button", { name: "On" })[1]!);
    fireEvent.click(screen.getByRole("button", { name: "Share album" }));
    expect(callbacks.onMemberEmailChange).toHaveBeenCalledWith("invite@example.test");
    expect(callbacks.onCanViewChange).toHaveBeenCalledWith(false);
    expect(callbacks.onCanDownloadChange).toHaveBeenNthCalledWith(1, false);
    expect(callbacks.onCanDownloadChange).toHaveBeenNthCalledWith(2, false);
    expect(callbacks.onAddMember).toHaveBeenCalledOnce();
  });

  it("shows all permission states and emits update and revoke requests for members", () => {
    const members = [
      member({ userId: 1, canView: true, canDownload: true }),
      member({ userId: 2, name: "", email: "viewer@example.test", canView: true, canDownload: false }),
      member({ userId: 3, name: undefined as never, email: "pending@example.test", canView: false, canDownload: false }),
    ];
    const callbacks = renderPanel(members);
    expect(screen.getByText("View and download")).toBeInTheDocument();
    expect(screen.getByText("View only")).toBeInTheDocument();
    expect(screen.getByText("No access")).toBeInTheDocument();
    expect(screen.getByText("pending@example.test", { selector: "strong" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View allowed for alex@example.test" }));
    expect(callbacks.onUpdateMember).toHaveBeenCalledWith(1, false, false);
    fireEvent.click(screen.getByRole("button", { name: "Download off for viewer@example.test" }));
    expect(callbacks.onUpdateMember).toHaveBeenCalledWith(2, true, true);
    expect(screen.getByRole("button", { name: "Download off for pending@example.test" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "View off for pending@example.test" }));
    expect(callbacks.onUpdateMember).toHaveBeenCalledWith(3, true, false);
    fireEvent.click(screen.getByRole("button", { name: "Revoke access for alex@example.test" }));
    expect(callbacks.onRemoveMember).toHaveBeenCalledWith(1);
    expect(screen.getAllByText("3")).toHaveLength(2);
  });
});
