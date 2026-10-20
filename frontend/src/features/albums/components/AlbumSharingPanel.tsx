import { Check, ChevronDown, Download, Link2, Share2, Trash2, UserPlus, Users } from "lucide-react";
import { ErrorBanner } from "@/shared/components/ui/ErrorBanner";
import type { AlbumMemberResponse } from "@/features/albums/types/album";
import { formatDate } from "@/shared/utils/formatters";

interface AlbumSharingPanelProps {
  members: AlbumMemberResponse[];
  memberEmail: string;
  canView: boolean;
  canDownload: boolean;
  memberAccessError: string | null;
  onMemberEmailChange: (email: string) => void;
  onCanViewChange: (canView: boolean) => void;
  onCanDownloadChange: (canDownload: boolean) => void;
  onAddMember: () => Promise<void>;
  onUpdateMember: (userId: number, canView: boolean, canDownload: boolean) => Promise<void>;
  onRemoveMember: (userId: number) => Promise<void>;
}

const sharePanelClass = "min-w-0 p-5 max-[760px]:p-[17px] max-[520px]:p-[14px]";
const permissionToggleClass =
  "inline-flex h-6 min-w-[46px] cursor-pointer items-center justify-center gap-[4px] rounded-full border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.45)] px-[7px] text-[9px] font-bold text-[#648096] shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-md transition-[color,background,border-color] duration-[180ms] disabled:opacity-[0.56]";
const memberPermissionClass =
  "inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1 rounded-[8px] border px-[11px] !text-[11px] !font-semibold transition-[color,background,border-color,box-shadow] duration-[160ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3787d4] disabled:cursor-not-allowed disabled:opacity-[0.68]";

export function AlbumSharingPanel({
  members,
  memberEmail,
  canView,
  canDownload,
  memberAccessError,
  onMemberEmailChange,
  onCanViewChange,
  onCanDownloadChange,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
}: AlbumSharingPanelProps) {
  return (
    <details className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] group overflow-hidden rounded-[18px]">
      <summary className="flex min-h-[76px] cursor-pointer select-none items-center gap-[11px] px-4 py-3 transition-colors duration-[180ms] hover:bg-[rgba(235,244,251,0.5)] group-open:border-b group-open:border-[#e4edf4] max-[520px]:px-3 [&::-webkit-details-marker]:hidden">
        <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[11px] bg-[#e8f3ff] text-[#2d7dd7]">
          <Share2 aria-hidden="true" size={18} strokeWidth={1.8} />
        </span>

        <span className="grid min-w-0 flex-1 gap-[3px]">
          <strong className="text-[14px] font-[650] text-[#35526a]">Share access</strong>

          <small className="text-[12px] text-[#8799a7]">
            Manage who can view and download this album
          </small>
        </span>

        <span className="inline-flex h-[27px] min-w-[34px] items-center justify-center gap-1 rounded-full border border-white/60 bg-[rgba(255,255,255,0.45)] px-2 text-[8px] font-semibold text-[#506c82] shadow-sm backdrop-blur-sm">
          <Users aria-hidden="true" size={14} strokeWidth={1.8} />
          {members.length}
        </span>

        <ChevronDown
          aria-hidden="true"
          className="text-[#8da0af] transition-transform duration-[180ms] group-open:rotate-180"
          size={18}
          strokeWidth={1.8}
        />
      </summary>

      <div className="grid grid-cols-[minmax(280px,0.85fr)_minmax(0,1.45fr)] gap-0 max-[960px]:grid-cols-1 max-[760px]:block max-[520px]:overflow-hidden">
        <div
          className={`${sharePanelClass} border-r border-[rgba(255,255,255,0.45)] max-[960px]:border-r-0 max-[960px]:border-b max-[960px]:border-[rgba(255,255,255,0.45)]`}
        >
          <div className="mb-[15px] flex items-center justify-between gap-[14px]">
            <div>
              <p className="[margin:0] [display:inline-flex] [align-items:center] [gap:7px] [color:#6f8ba3] [font-size:11px] [line-height:1.2] [font-weight:700] [letter-spacing:0.11em] [text-transform:uppercase]">Album permissions</p>

              <h3 className="mt-1 mb-0 text-[16px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
                Invite a WinWire user
              </h3>
            </div>

            <span className="grid h-[33px] w-[33px] flex-none place-items-center rounded-[10px] border border-white/70 bg-[rgba(255,255,255,0.55)] text-[#1b74d3] shadow-sm backdrop-blur-sm">
              <UserPlus aria-hidden="true" size={17} strokeWidth={1.8} />
            </span>
          </div>

          <label htmlFor="share-email" className="[display:block] [margin-bottom:7px] [color:#5d758a] [font-size:11px] [font-weight:600]">
            Email address
          </label>

          <input
            id="share-email"
            type="email"
            value={memberEmail}
            onChange={(event) => onMemberEmailChange(event.target.value)}
            placeholder="name@winwire.com"
            className="[min-height:42px] [padding:0_13px] [color:#193850] [border:1px_solid_rgba(255,_255,_255,_0.58)] [border-radius:12px] [background:rgba(255,_255,_255,_0.45)] [outline:0] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)] [transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background_180ms_ease] [&::placeholder]:[color:#8fa5b7] [&:hover]:[background:rgba(255,_255,_255,_0.6)] [&:hover]:[border-color:rgba(255,_255,_255,_0.82)] [&:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&:focus]:[background:rgba(255,_255,_255,_0.72)] [&:focus]:[box-shadow:0_0_0_3px_rgba(30,_120,_214,_0.16),_inset_0_1px_1px_rgba(255,_255,_255,_0.9)] w-full"
          />

          <div className="mt-[11px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.30)] backdrop-blur-md">
            <div className="flex min-h-[60px] items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.35)] px-3 py-[10px] last:border-0">
              <div className="grid min-w-0 gap-[3px]">
                <strong className="text-[12px] font-[650] text-[#4b647a]">Can view</strong>

                <span className="text-[11px] leading-[1.4] text-[#71879a]">
                  Allow this person to open the album.
                </span>
              </div>

              <button
                type="button"
                aria-pressed={canView}
                onClick={() => {
                  onCanViewChange(!canView);

                  if (canView) {
                    onCanDownloadChange(false);
                  }
                }}
                className={`${permissionToggleClass} ${
                  canView ? "border-[#cfece2] bg-[#edf9f5] text-[#23866f]" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-[6px] w-[6px] flex-none rounded-full ${
                    canView ? "bg-[#1db18a]" : "bg-[#a7b5c0]"
                  }`}
                />
                {canView ? "On" : "Off"}
              </button>
            </div>

            <div className="flex min-h-[60px] items-center justify-between gap-3 border-b border-[#e8eef3] px-3 py-[10px] last:border-0">
              <div className="grid min-w-0 gap-[3px]">
                <strong className="text-[12px] font-[650] text-[#4b647a]">Can download</strong>

                <span className="text-[11px] leading-[1.4] text-[#71879a]">
                  Allow files to be downloaded.
                </span>
              </div>

              <button
                type="button"
                aria-pressed={canDownload}
                disabled={!canView}
                onClick={() => onCanDownloadChange(!canDownload)}
                className={`${permissionToggleClass} ${
                  canDownload ? "border-[#cfece2] bg-[#edf9f5] text-[#23866f]" : ""
                } ${!canView ? "cursor-not-allowed opacity-[0.56]" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className={`h-[6px] w-[6px] flex-none rounded-full ${
                    canDownload ? "bg-[#1db18a]" : "bg-[#a7b5c0]"
                  }`}
                />
                {canDownload ? "On" : "Off"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onAddMember()}
            className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)] mt-4 w-full"
          >
            <Link2 aria-hidden="true" size={16} strokeWidth={1.8} />
            Share album
          </button>
        </div>

        <div className={`${sharePanelClass} min-h-[300px]`}>
          {memberAccessError && (
            <div className="mb-3">
              <ErrorBanner message={memberAccessError} />
            </div>
          )}

          <div className="mb-[15px] flex items-center justify-between gap-[14px]">
            <div>
              <p className="[margin:0] [display:inline-flex] [align-items:center] [gap:7px] [color:#6f8ba3] [font-size:11px] [line-height:1.2] [font-weight:700] [letter-spacing:0.11em] [text-transform:uppercase]">Current members</p>

              <h3 className="mt-1 mb-0 text-[18px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
                People with access
              </h3>
            </div>

            <span className="inline-flex h-[27px] min-w-[29px] items-center justify-center rounded-full border border-white/60 bg-[rgba(255,255,255,0.45)] text-[8px] font-semibold text-[#506c82] shadow-sm backdrop-blur-sm">
              {members.length}
            </span>
          </div>

          {members.length === 0 ? (
            <div className="flex min-h-[205px] flex-col items-center justify-center text-center">
              <span className="grid h-12 w-12 place-items-center rounded-[14px] border border-white/70 bg-[rgba(255,255,255,0.50)] text-[#506c82] shadow-sm backdrop-blur-sm">
                <Users aria-hidden="true" size={23} strokeWidth={1.5} />
              </span>

              <p className="mt-3 mb-0.5 text-[10px] font-semibold text-[#587087]">
                No one else has access yet.
              </p>

              <small className="text-[8px] text-[#95a4af]">
                Invite a WinWire user using the form.
              </small>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.30)] backdrop-blur-md max-[760px]:rounded-[10px]">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex min-w-0 items-center gap-[9px] border-b border-[rgba(255,255,255,0.35)] px-[11px] py-[10px] transition-colors duration-[170ms] hover:bg-[rgba(255,255,255,0.45)] last:border-b-0 max-[760px]:flex-wrap"
                >
                  <div className="grid h-[31px] w-[31px] flex-none place-items-center rounded-full border border-white/60 bg-[rgba(255,255,255,0.55)] text-[9px] font-bold text-[#1b6ecf] shadow-sm">
                    {member.name?.charAt(0).toUpperCase() ?? member.email.charAt(0).toUpperCase()}
                  </div>

                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[650] text-[#3b556b]">
                      {member.name || member.email}
                    </strong>

                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-[#71879a]">
                      {member.email}
                    </span>

                    <small className="text-[10px] text-[#71879a]">
                      Granted {formatDate(member.grantedAt)}
                    </small>

                    <span
                      className={`mt-1 inline-flex w-fit items-center rounded-full px-2 py-1 text-[9px] font-semibold ${
                        member.canDownload
                          ? "bg-[#e8f2ff] text-[#245f9e]"
                          : member.canView
                            ? "bg-[#e8f7ef] text-[#216747]"
                            : "bg-[#f0f3f6] text-[#5f7080]"
                      }`}
                    >
                      {member.canDownload
                        ? "View and download"
                        : member.canView
                          ? "View only"
                          : "No access"}
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-end gap-1 max-[760px]:w-full max-[760px]:justify-start max-[760px]:pl-10 max-[520px]:pl-10">
                    <button
                      type="button"
                      aria-label={`${member.canView ? "View allowed" : "View off"} for ${member.email}`}
                      aria-pressed={member.canView}
                      onClick={() =>
                        void onUpdateMember(
                          member.userId,
                          !member.canView,
                          member.canView && member.canDownload ? false : member.canDownload,
                        )
                      }
                      className={`${memberPermissionClass} ${
                        member.canView
                          ? "[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)]"
                          : "border-[#d4dde5] bg-[#f2f5f8] text-[#647789] hover:bg-[#eaf0f4]"
                      }`}
                    >
                      {member.canView && <Check aria-hidden="true" size={12} strokeWidth={2} />}
                      {member.canView ? "View allowed" : "View off"}
                    </button>

                    <button
                      type="button"
                      aria-label={`${member.canDownload ? "Download allowed" : "Download off"} for ${member.email}`}
                      aria-pressed={member.canDownload}
                      disabled={!member.canView}
                      onClick={() =>
                        void onUpdateMember(member.userId, member.canView, !member.canDownload)
                      }
                      className={`${memberPermissionClass} ${
                        member.canDownload
                          ? "[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)]"
                          : "border-[#d4dde5] bg-[#f2f5f8] text-[#647789] hover:bg-[#eaf0f4]"
                      } ${!member.canView ? "cursor-not-allowed opacity-[0.47]" : ""}`}
                    >
                      {member.canDownload && (
                        <Download aria-hidden="true" size={12} strokeWidth={1.9} />
                      )}
                      {member.canDownload ? "Download allowed" : "Download off"}
                    </button>

                    <button
                      type="button"
                      aria-label={`Revoke access for ${member.email}`}
                      title="Revoke access"
                      onClick={() => void onRemoveMember(member.userId)}
                      className="[color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.32)] [background:linear-gradient(135deg,_rgba(230,_58,_72,_0.88)_0%,_rgba(198,_28,_42,_0.95)_100%)] [box-shadow:0_8px_20px_rgba(200,_32,_48,_0.18),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.38)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(200,_32,_48,_0.24),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.48)] inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1 rounded-[8px] px-[11px] !text-[11px] !font-semibold transition-[transform,box-shadow] duration-[160ms] max-[520px]:w-7 max-[520px]:px-0"
                    >
                      <Trash2 aria-hidden="true" size={15} strokeWidth={1.8} />
                      <span className="max-[520px]:hidden">Revoke</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
