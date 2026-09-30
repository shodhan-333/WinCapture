import { useEffect, useRef, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useParams } from "react-router-dom";

import {
  addAlbumMember,
  deleteAlbumFile,
  downloadAlbumFile,
  getAlbum,
  getAlbumFiles,
  getAlbumMembers,
  getFilePreviewUrl,
  removeAlbumMember,
  replaceFile,
  updateAlbum,
  updateAlbumMember,
  uploadAlbumFile,
} from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import type { AlbumMemberResponse, AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";

export default function AlbumDetailPage() {
  const { instance } = useMsal();
  const { account } = useAuth();
  const { albumId } = useParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [album, setAlbum] = useState<AlbumResponse | null>(null);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [members, setMembers] = useState<AlbumMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [canView, setCanView] = useState(true);
  const [canDownload, setCanDownload] = useState(true);
  const [replaceTargetId, setReplaceTargetId] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [albumNameDraft, setAlbumNameDraft] = useState("");

  const numericAlbumId = Number(albumId ?? "0");

  const loadAlbumData = async () => {
    if (!account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [albumResult, fileResult, membersResult] = await Promise.all([
        getAlbum(instance, account, numericAlbumId),
        getAlbumFiles(instance, account, numericAlbumId),
        getAlbumMembers(instance, account, numericAlbumId),
      ]);

      setAlbum(albumResult);
      setAlbumNameDraft(albumResult.albumName);
      setFiles(fileResult);
      setMembers(membersResult);
      const urls = await Promise.all(
        fileResult
          .filter((file) => file.contentType.startsWith("image/"))
          .map(async (file) => ({
            id: file.id,
            url: await getFilePreviewUrl(instance, account, file.id, numericAlbumId),
          })),
      );
      setPreviewUrls((previous) => ({
        ...previous,
        ...Object.fromEntries(urls.map((entry) => [entry.id, entry.url])),
      }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load album details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAlbumData();
  }, [account, instance, numericAlbumId]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await uploadAlbumFile(instance, account, numericAlbumId, selectedFile);
      event.target.value = "";
      await loadAlbumData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: FileResponse) => {
    if (!account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setError(null);
      await downloadAlbumFile(instance, account, numericAlbumId, file.id, file.originalFileName);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Download failed.");
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setError(null);
      await deleteAlbumFile(instance, account, numericAlbumId, fileId);
      await loadAlbumData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Delete failed.");
    }
  };

  const handleReplace = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !account || !Number.isFinite(numericAlbumId) || replaceTargetId === null) {
      return;
    }

    try {
      setError(null);
      await replaceFile(instance, account, replaceTargetId, selectedFile);
      setReplaceTargetId(null);
      event.target.value = "";
      await loadAlbumData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Replace failed.");
    }
  };

  const handleUpdateAlbum = async () => {
    if (!account || !Number.isFinite(numericAlbumId) || !albumNameDraft.trim()) {
      setError("Album name is required.");
      return;
    }

    try {
      setError(null);
      const updated = await updateAlbum(instance, account, numericAlbumId, {
        albumName: albumNameDraft.trim(),
      });

      setAlbum(updated);
      setAlbumNameDraft(updated.albumName);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update album.");
    }
  };

  const handleAddMember = async () => {
    if (!account || !Number.isFinite(numericAlbumId) || !memberEmail.trim()) {
      setError("An email address is required to share the album.");
      return;
    }

    try {
      setError(null);
      await addAlbumMember(instance, account, numericAlbumId, {
        email: memberEmail.trim(),
        canView,
        canDownload,
      });
      setMemberEmail("");
      setCanView(true);
      setCanDownload(true);
      await loadAlbumData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to share album.");
    }
  };

  const handleUpdateMember = async (userId: number, nextView: boolean, nextDownload: boolean) => {
    if (!account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setError(null);
      await updateAlbumMember(instance, account, numericAlbumId, userId, {
        canView: nextView,
        canDownload: nextDownload,
      });
      await loadAlbumData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update member access.");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setError(null);
      await removeAlbumMember(instance, account, numericAlbumId, userId);
      await loadAlbumData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to revoke access.");
    }
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-[26px] border border-slate-200 bg-white" />;
  }

  if (!album) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-slate-700 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
        Album not found.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Album</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{album.albumName}</h2>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
          >
            {uploading ? "Uploading..." : "Add files"}
          </button>
        </div>

        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        <input
          type="file"
          className="hidden"
          onChange={handleReplace}
          key={replaceTargetId ?? "replace-none"}
        />
      </section>

      {error && <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Album details</span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-sky-700"># {album.id}</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</p>
            <div className="mt-2 flex gap-2">
              <input
                value={albumNameDraft}
                onChange={(event) => setAlbumNameDraft(event.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
              />
              <button
                type="button"
                onClick={() => void handleUpdateAlbum()}
                className="rounded-full bg-sky-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-400"
              >
                Save
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Owner</p>
            <p className="mt-2 text-base font-medium text-slate-900">{album.ownerName}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Created</p>
            <p className="mt-2 text-base font-medium text-slate-900">{new Date(album.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Updated</p>
            <p className="mt-2 text-base font-medium text-slate-900">{album.updatedAt ? new Date(album.updatedAt).toLocaleDateString() : "Never"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Files</p>
          </div>

          {files.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No files in this album yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {files.map((file) => (
                <article key={file.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">{file.originalFileName}</p>
                      <p className="text-xs text-slate-500">{file.contentType}</p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
                      {file.fileSize > 1024 * 1024 ? `${(file.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${file.fileSize} B`}
                    </span>
                  </div>

                  {file.contentType.startsWith("image/") ? (
                    <img
                      src={previewUrls[file.id] ?? file.downloadUrl}
                      alt={file.originalFileName}
                      className="mb-3 h-36 w-full rounded-2xl border border-slate-200 bg-white object-cover"
                    />
                  ) : (
                    <div className="mb-3 flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                      {file.originalFileName}
                    </div>
                  )}

                  <div className="mb-3 rounded-2xl bg-white px-3 py-2 text-xs text-slate-500">
                    Uploaded {new Date(file.uploadedAt).toLocaleString()}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceTargetId(file.id);
                        const input = document.querySelectorAll<HTMLInputElement>('input[type="file"]')[1];
                        input?.click();
                      }}
                      className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDownload(file)}
                      className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(file.id)}
                      className="flex-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Share access</p>
          </div>

          <div className="space-y-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3">
            <input
              value={memberEmail}
              onChange={(event) => setMemberEmail(event.target.value)}
              placeholder="Email address"
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
            />

            <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm text-slate-700">Can view</span>
              <button
                type="button"
                onClick={() => setCanView((previous) => !previous)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${canView ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}
              >
                {canView ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm text-slate-700">Can download</span>
              <button
                type="button"
                onClick={() => setCanDownload((previous) => !previous)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${canDownload ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}
              >
                {canDownload ? "Enabled" : "Disabled"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => void handleAddMember()}
              className="w-full rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
            >
              Share album
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Members</p>

            {members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No shared users yet.
              </div>
            ) : (
              members.map((member) => (
                <div key={member.userId} className="rounded-[20px] border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{member.name || member.email}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemoveMember(member.userId)}
                      className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-red-600"
                    >
                      Revoke
                    </button>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleUpdateMember(member.userId, !member.canView, member.canDownload)}
                      className={`flex-1 rounded-full px-3 py-2 text-xs font-medium ${member.canView ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {member.canView ? "View on" : "View off"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateMember(member.userId, member.canView, !member.canDownload)}
                      className={`flex-1 rounded-full px-3 py-2 text-xs font-medium ${member.canDownload ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {member.canDownload ? "Download on" : "Download off"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
