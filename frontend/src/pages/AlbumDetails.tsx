import { useEffect, useState, useCallback, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { useAuth } from "../context/AuthContext";
import {
  getAlbum,
  getAlbumFiles,
  uploadAlbumFile,
  downloadAlbumFile,
  deleteAlbumFile,
  getAlbumMembers,
  addAlbumMember,
  updateAlbumMember,
  removeAlbumMember,
  ApiError,
} from "../api/apiClient";
import type { AlbumResponse, AlbumMemberResponse } from "../types/album";
import {
  type FileResponse,
  ALLOWED_FILE_EXTENSIONS,
  MAXIMUM_FILE_SIZE_BYTES,
} from "../types/file";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";

interface AlbumDetailsProps {
  albumId: number;
  onBack: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function AlbumDetails({ albumId, onBack }: AlbumDetailsProps) {
  const { instance } = useMsal();
  const { account, user } = useAuth();

  const [album, setAlbum] = useState<AlbumResponse | null>(null);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [members, setMembers] = useState<AlbumMemberResponse[]>([]);
  const [activeTab, setActiveTab] = useState<"photos" | "members">("photos");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // File Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // File Download state
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);

  // File Delete state
  const [deletingFile, setDeletingFile] = useState<FileResponse | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Add Member state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberCanView, setMemberCanView] = useState(true);
  const [memberCanDownload, setMemberCanDownload] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);

  // Remove Member state
  const [removingMember, setRemovingMember] = useState<AlbumMemberResponse | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Preview Modal state
  const [previewFile, setPreviewFile] = useState<FileResponse | null>(null);

  const isOwner = album ? album.ownerId === user?.userId : false;
  const isAdmin = user?.role === "Admin";
  const canManage = isOwner || isAdmin;

  const loadData = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      const albumData = await getAlbum(instance, account, albumId);
      setAlbum(albumData);

      const filesData = await getAlbumFiles(instance, account, albumId);
      setFiles(filesData);

      // Only owner or admin can fetch member permissions
      if (albumData.ownerId === user?.userId || user?.role === "Admin") {
        try {
          const membersData = await getAlbumMembers(instance, account, albumId);
          setMembers(membersData);
        } catch {
          // Non-critical if user lacks member management
        }
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Failed to load album details. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [instance, account, albumId, user?.userId, user?.role]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle File Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !account) return;

    setUploadError(null);

    // 1. Client-side size check
    if (selectedFile.size > MAXIMUM_FILE_SIZE_BYTES) {
      setUploadError("The file exceeds the maximum allowed size of 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Client-side extension check
    const extension = "." + selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number])) {
      setUploadError("Only JPG, JPEG, PNG, GIF, and PDF files are supported.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadAlbumFile(instance, account, albumId, selectedFile);
      setFiles((prev) => [uploaded, ...prev]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (caught) {
      setUploadError(caught instanceof ApiError ? caught.message : "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle File Download
  const handleDownload = async (file: FileResponse) => {
    if (!account) return;
    try {
      setDownloadingFileId(file.id);
      await downloadAlbumFile(instance, account, albumId, file.id, file.originalFileName);
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : "Download failed.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Handle File Delete
  const handleDeleteFile = async () => {
    if (!account || !deletingFile) return;

    setIsDeletingFile(true);
    try {
      await deleteAlbumFile(instance, account, albumId, deletingFile.id);
      setFiles((prev) => prev.filter((f) => f.id !== deletingFile.id));
      setDeletingFile(null);
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : "Failed to delete file.");
    } finally {
      setIsDeletingFile(false);
    }
  };

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !memberEmail.trim()) return;

    setIsAddingMember(true);
    setMemberActionError(null);

    try {
      await addAlbumMember(instance, account, albumId, {
        email: memberEmail.trim(),
        canView: memberCanView,
        canDownload: memberCanDownload,
      });

      // Refresh members
      const updatedMembers = await getAlbumMembers(instance, account, albumId);
      setMembers(updatedMembers);
      setMemberEmail("");
      setIsAddMemberOpen(false);
    } catch (caught) {
      setMemberActionError(
        caught instanceof ApiError ? caught.message : "Failed to grant member access.",
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle Update Member Permissions
  const handleTogglePermission = async (
    member: AlbumMemberResponse,
    field: "canView" | "canDownload",
  ) => {
    if (!account) return;

    const newCanView = field === "canView" ? !member.canView : member.canView;
    const newCanDownload = field === "canDownload" ? !member.canDownload : member.canDownload;

    try {
      await updateAlbumMember(instance, account, albumId, member.userId, {
        canView: newCanView,
        canDownload: newCanDownload,
      });

      setMembers((prev) =>
        prev.map((m) =>
          m.userId === member.userId
            ? { ...m, canView: newCanView, canDownload: newCanDownload }
            : m,
        ),
      );
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : "Failed to update permissions.");
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async () => {
    if (!account || !removingMember) return;

    setIsRemovingMember(true);
    try {
      await removeAlbumMember(instance, account, albumId, removingMember.userId);
      setMembers((prev) => prev.filter((m) => m.userId !== removingMember.userId));
      setRemovingMember(null);
    } catch (caught) {
      alert(caught instanceof ApiError ? caught.message : "Failed to remove member.");
    } finally {
      setIsRemovingMember(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoadingSpinner size="lg" label="Loading album contents..." />
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="space-y-4 py-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Albums
        </button>
        <ErrorMessage
          title="Album Access Error"
          message={error || "Album not found or you lack permission to view it."}
          onRetry={() => void loadData()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Albums
        </button>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isOwner
              ? "border border-cyan-800/60 bg-cyan-950/60 text-cyan-300"
              : "border border-slate-700 bg-slate-800 text-slate-300"
          }`}
        >
          {isOwner ? "Album Owner" : "Member View"}
        </span>
      </div>

      {/* Album Header Banner */}
      <section className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {album.albumName}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Created by <span className="font-medium text-slate-200">{album.ownerName}</span> on{" "}
            {formatDate(album.createdAt)}
            {album.updatedAt && ` • Updated ${formatDate(album.updatedAt)}`}
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => void handleFileSelect(e)}
              accept=".jpg,.jpeg,.png,.gif,.pdf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {isUploading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
              <span>{isUploading ? "Uploading..." : "Add Photos"}</span>
            </button>
          </div>
        )}
      </section>

      {uploadError && <ErrorMessage message={uploadError} onDismiss={() => setUploadError(null)} />}

      {/* Tabs: Photos vs Members */}
      <div className="flex border-b border-slate-800 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("photos")}
          className={`border-b-2 px-4 py-2.5 transition ${
            activeTab === "photos"
              ? "border-cyan-400 text-cyan-300 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Photos ({files.length})
        </button>

        {canManage && (
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`border-b-2 px-4 py-2.5 transition ${
              activeTab === "members"
                ? "border-cyan-400 text-cyan-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Members & Access ({members.length})
          </button>
        )}
      </div>

      {/* TAB 1: Photos Gallery */}
      {activeTab === "photos" && (
        <>
          {files.length === 0 ? (
            <EmptyState
              title="Album is Empty"
              description="No photos have been uploaded to this album yet. Add photos to share them with album members."
              actionText={canManage ? "Upload First Photo" : undefined}
              onAction={canManage ? () => fileInputRef.current?.click() : undefined}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {files.map((file) => {
                const isDownloading = downloadingFileId === file.id;
                const isPdf = file.contentType === "application/pdf";

                return (
                  <div
                    key={file.id}
                    className="card-hover glass-panel flex flex-col justify-between overflow-hidden rounded-2xl"
                  >
                    {/* Media Thumbnail / Preview area */}
                    <div
                      onClick={() => setPreviewFile(file)}
                      className="group relative flex h-44 cursor-pointer items-center justify-center bg-slate-950/70 overflow-hidden"
                    >
                      {isPdf ? (
                        <div className="flex flex-col items-center justify-center text-rose-400">
                          <svg className="size-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span className="mt-2 text-xs font-semibold uppercase">PDF Document</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-cyan-400">
                          <svg className="size-12 transition group-hover:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a2.25 2.25 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          <span className="mt-2 text-xs text-slate-400 group-hover:text-cyan-300">Click to view details</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-4">
                      <p className="truncate text-sm font-semibold text-slate-100" title={file.originalFileName}>
                        {file.originalFileName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatBytes(file.fileSize)} • {formatDate(file.uploadedAt)}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                        <button
                          type="button"
                          onClick={() => void handleDownload(file)}
                          disabled={isDownloading}
                          title="Download photo"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <div className="size-3.5 animate-spin rounded-full border border-slate-400 border-t-white" />
                          ) : (
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                          )}
                          <span>Download</span>
                        </button>

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setDeletingFile(file)}
                            title="Delete photo"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Members & Access Management */}
      {activeTab === "members" && canManage && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Album Access Members</h2>
              <p className="text-xs text-slate-400">
                Grant WinWire colleagues permission to view or download photos from this album.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMemberActionError(null);
                setMemberEmail("");
                setIsAddMemberOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-cyan-500"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              <span>Add Member</span>
            </button>
          </div>

          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
              <p className="text-sm text-slate-400">
                No members have been invited yet. Only you and administrators can access this album.
              </p>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">User</th>
                      <th className="px-6 py-3.5 font-semibold text-center">Can View</th>
                      <th className="px-6 py-3.5 font-semibold text-center">Can Download</th>
                      <th className="px-6 py-3.5 font-semibold">Granted Date</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {members.map((member) => (
                      <tr key={member.userId} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.email}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => void handleTogglePermission(member, "canView")}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                              member.canView
                                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {member.canView ? "Allowed" : "Disabled"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => void handleTogglePermission(member, "canDownload")}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                              member.canDownload
                                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {member.canDownload ? "Allowed" : "Disabled"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {formatDate(member.grantedAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setRemovingMember(member)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                            title="Revoke member access"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Share Album</h3>
            <p className="mt-1 text-xs text-slate-400">
              Enter the WinWire email address of the colleague you want to share with.
            </p>

            {memberActionError && (
              <div className="mt-3">
                <ErrorMessage message={memberActionError} />
              </div>
            )}

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div>
                <label htmlFor="member-email" className="block text-xs font-semibold text-slate-300">
                  Colleague Email (@winwire.com)
                </label>
                <input
                  id="member-email"
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="colleague@winwire.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={memberCanView}
                    onChange={(e) => setMemberCanView(e.target.checked)}
                    className="size-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Can view photos</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={memberCanDownload}
                    onChange={(e) => setMemberCanDownload(e.target.checked)}
                    className="size-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Can download photos</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  disabled={isAddingMember}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMember || !memberEmail.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-cyan-500 disabled:opacity-50"
                >
                  {isAddingMember && (
                    <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  )}
                  Share Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Details Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{previewFile.originalFileName}</h3>
                <p className="text-xs text-slate-400">File Details</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">File Size</span>
                <span className="font-medium text-white">{formatBytes(previewFile.fileSize)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Content Type</span>
                <span className="font-mono text-cyan-300">{previewFile.contentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Uploaded At</span>
                <span className="font-medium text-white">{formatDate(previewFile.uploadedAt)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">System File ID</span>
                <span className="font-mono text-slate-300">#{previewFile.id}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDownload(previewFile);
                  setPreviewFile(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-cyan-500"
              >
                Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Photo Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingFile)}
        title="Delete Photo"
        message={`Are you sure you want to delete "${deletingFile?.originalFileName}" from this album? This action cannot be undone.`}
        confirmLabel="Delete Photo"
        isDestructive={true}
        isLoading={isDeletingFile}
        onConfirm={() => void handleDeleteFile()}
        onCancel={() => setDeletingFile(null)}
      />

      {/* Confirm Revoke Member Dialog */}
      <ConfirmDialog
        isOpen={Boolean(removingMember)}
        title="Revoke Member Access"
        message={`Are you sure you want to remove "${removingMember?.name}" (${removingMember?.email}) from this album? They will lose access to view and download photos.`}
        confirmLabel="Revoke Access"
        isDestructive={true}
        isLoading={isRemovingMember}
        onConfirm={() => void handleRemoveMember()}
        onCancel={() => setRemovingMember(null)}
      />
    </div>
  );
}
