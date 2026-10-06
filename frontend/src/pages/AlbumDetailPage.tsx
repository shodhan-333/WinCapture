import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Share2,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  addAlbumMember,
  addFavorite,
  deleteAlbumFile,
  downloadAlbumFile,
  getAlbum,
  getAlbumFiles,
  getAlbumMembers,
  getFilePreviewUrl,
  removeAlbumMember,
  removeFavorite,
  replaceFile,
  updateAlbum,
  updateAlbumMember,
  uploadAlbumFile,
} from "../api/apiClient";

import FileCard from "../components/FileCard";
import { useAuth } from "../context/AuthContext";

import type {
  AlbumMemberResponse,
  AlbumResponse,
} from "../types/album";

import type {
  FileResponse,
} from "../types/file";

export default function AlbumDetailPage() {
  const { instance } = useMsal();

  const {
    account,
    user,
  } = useAuth();

  const { albumId } =
    useParams();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const replaceInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const replaceTargetIdRef =
    useRef<number | null>(
      null,
    );

  const [album, setAlbum] =
    useState<AlbumResponse | null>(
      null,
    );

  const [files, setFiles] =
    useState<FileResponse[]>(
      [],
    );

  const [members, setMembers] =
    useState<AlbumMemberResponse[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [uploading, setUploading] =
    useState(false);

  const [memberEmail, setMemberEmail] =
    useState("");

  const [canView, setCanView] =
    useState(true);

  const [canDownload, setCanDownload] =
    useState(true);

  const [previewUrls, setPreviewUrls] =
    useState<Record<number, string>>(
      {},
    );

  const [
    favoritePendingIds,
    setFavoritePendingIds,
  ] = useState<Set<number>>(
    new Set(),
  );

  const [albumNameDraft, setAlbumNameDraft] =
    useState("");

  const numericAlbumId =
    Number(
      albumId ?? "0",
    );

  useEffect(
    () => () => {
      Object.values(
        previewUrls,
      ).forEach(
        (url) =>
          URL.revokeObjectURL(
            url,
          ),
      );
    },
    [previewUrls],
  );

  const loadAlbumData =
    async () => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const albumResult =
          await getAlbum(
            instance,
            account,
            numericAlbumId,
          );

        setAlbum(
          albumResult,
        );

        setAlbumNameDraft(
          albumResult.albumName,
        );

        const canManageAlbum =
          user?.role === "Admin" ||
          albumResult.ownerId ===
            user?.userId;

        const fileResult =
          await getAlbumFiles(
            instance,
            account,
            numericAlbumId,
          );

        setFiles(
          fileResult,
        );

        if (canManageAlbum) {
          try {
            setMembers(
              await getAlbumMembers(
                instance,
                account,
                numericAlbumId,
              ),
            );
          } catch {
            setMembers(
              [],
            );

            setError(
              "Album opened, but sharing settings could not be loaded.",
            );
          }
        } else {
          setMembers(
            [],
          );
        }

        const urls =
          await Promise.all(
            fileResult
              .filter(
                (file) =>
                  file.contentType.startsWith(
                    "image/",
                  ),
              )
              .map(
                async (file) => {
                  try {
                    return [
                      file.id,
                      await getFilePreviewUrl(
                        instance,
                        account,
                        file.id,
                        numericAlbumId,
                        canManageAlbum,
                      ),
                    ] as const;
                  } catch {
                    return null;
                  }
                },
              ),
          );

        setPreviewUrls(
          Object.fromEntries(
            urls.filter(
              (
                entry,
              ): entry is readonly [
                number,
                string,
              ] =>
                entry !== null,
            ),
          ),
        );
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load album details.",
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(
    () => {
      void loadAlbumData();
    },
    [
      account,
      instance,
      numericAlbumId,
      user?.role,
      user?.userId,
    ],
  );

  const canManageAlbum =
    Boolean(
      album &&
        user &&
        (
          user.role === "Admin" ||
          album.ownerId ===
            user.userId
        ),
    );

  const handleFavoriteToggle =
    async (
      file: FileResponse,
    ) => {
      if (!account) {
        return;
      }

      setFavoritePendingIds(
        (previous) => {
          const next =
            new Set(
              previous,
            );

          next.add(
            file.id,
          );

          return next;
        },
      );

      try {
        setError(null);

        if (file.isFavorite) {
          await removeFavorite(
            instance,
            account,
            file.id,
          );
        } else {
          await addFavorite(
            instance,
            account,
            file.id,
          );
        }

        setFiles(
          (previous) =>
            previous.map(
              (currentFile) =>
                currentFile.id ===
                file.id
                  ? {
                      ...currentFile,
                      isFavorite:
                        !file.isFavorite,
                    }
                  : currentFile,
            ),
        );
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to update favorite.",
        );
      } finally {
        setFavoritePendingIds(
          (previous) => {
            const next =
              new Set(
                previous,
              );

            next.delete(
              file.id,
            );

            return next;
          },
        );
      }
    };

  const handleUpload =
    async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const selectedFile =
        event.target.files?.[0];

      if (
        !selectedFile ||
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setUploading(true);
        setError(null);

        await uploadAlbumFile(
          instance,
          account,
          numericAlbumId,
          selectedFile,
        );

        event.target.value =
          "";

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Upload failed.",
        );
      } finally {
        setUploading(false);
      }
    };

  const handleDownload =
    async (
      file: FileResponse,
    ) => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setError(null);

        await downloadAlbumFile(
          instance,
          account,
          numericAlbumId,
          file.id,
          file.originalFileName,
        );
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Download failed.",
        );
      }
    };

  const handleDelete =
    async (
      fileId: number,
    ) => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setError(null);

        await deleteAlbumFile(
          instance,
          account,
          numericAlbumId,
          fileId,
        );

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Delete failed.",
        );
      }
    };

  const handleReplace =
    async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const selectedFile =
        event.target.files?.[0];

      const fileId =
        replaceTargetIdRef.current;

      if (
        !selectedFile ||
        !account ||
        !Number.isFinite(
          numericAlbumId,
        ) ||
        fileId === null
      ) {
        return;
      }

      try {
        setError(null);

        await replaceFile(
          instance,
          account,
          fileId,
          selectedFile,
        );

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Replace failed.",
        );
      } finally {
        replaceTargetIdRef.current =
          null;

        event.target.value =
          "";
      }
    };

  const handleUpdateAlbum =
    async () => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        ) ||
        !albumNameDraft.trim()
      ) {
        setError(
          "Album name is required.",
        );

        return;
      }

      try {
        setError(null);

        const updated =
          await updateAlbum(
            instance,
            account,
            numericAlbumId,
            {
              albumName:
                albumNameDraft.trim(),
            },
          );

        setAlbum(
          updated,
        );

        setAlbumNameDraft(
          updated.albumName,
        );
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to update album.",
        );
      }
    };

  const handleAddMember =
    async () => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        ) ||
        !memberEmail.trim()
      ) {
        setError(
          "An email address is required to share the album.",
        );

        return;
      }

      try {
        setError(null);

        await addAlbumMember(
          instance,
          account,
          numericAlbumId,
          {
            email:
              memberEmail.trim(),
            canView,
            canDownload,
          },
        );

        setMemberEmail("");
        setCanView(true);
        setCanDownload(true);

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to share album.",
        );
      }
    };

  const handleUpdateMember =
    async (
      userId: number,
      nextView: boolean,
      nextDownload: boolean,
    ) => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setError(null);

        await updateAlbumMember(
          instance,
          account,
          numericAlbumId,
          userId,
          {
            canView:
              nextView,
            canDownload:
              nextDownload,
          },
        );

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to update member access.",
        );
      }
    };

  const handleRemoveMember =
    async (
      userId: number,
    ) => {
      if (
        !account ||
        !Number.isFinite(
          numericAlbumId,
        )
      ) {
        return;
      }

      try {
        setError(null);

        await removeAlbumMember(
          instance,
          account,
          numericAlbumId,
          userId,
        );

        await loadAlbumData();
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to revoke access.",
        );
      }
    };

  if (loading) {
    return (
      <div className="h-40 animate-pulse rounded-[26px] border border-slate-200 bg-white" />
    );
  }

  if (!album) {
    return (
      <div
        role="alert"
        className="surface p-6 text-slate-700"
      >
        {
          error ??
          "Album not found."
        }
      </div>
    );
  }

  return (
    <div className="app-page">
      <section className="surface p-5 sm:p-6">
        <Link
          to="/albums"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft
            aria-hidden="true"
            size={16}
          />
          Albums
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="page-heading">
              {album.albumName}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {files.length}{" "}
              {
                files.length === 1
                  ? "file"
                  : "files"
              }
            </p>
          </div>

          {canManageAlbum && (
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={uploading}
              className="primary-action"
            >
              {
                uploading
                  ? "Adding files..."
                  : "Add files"
              }
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
        />

        <input
          ref={replaceInputRef}
          type="file"
          className="hidden"
          onChange={handleReplace}
        />
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="surface p-5 sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="section-title">
            Album info
          </h3>

          <span className="text-xs text-slate-400">
            #{album.id}
          </span>
        </div>

        <div className="album-info-grid">
          <div className="settings-row">
            <span className="text-sm text-slate-500">
              Owner
            </span>

            <span className="text-sm font-medium text-slate-900">
              {album.ownerName}
            </span>
          </div>

          <div className="settings-row">
            <span className="text-sm text-slate-500">
              Created
            </span>

            <span className="text-sm text-slate-700">
              {
                new Date(
                  album.createdAt,
                ).toLocaleDateString()
              }
            </span>
          </div>

          <div className="settings-row">
            <span className="text-sm text-slate-500">
              Updated
            </span>

            <span className="text-sm text-slate-700">
              {
                album.updatedAt
                  ? new Date(
                      album.updatedAt,
                    ).toLocaleDateString()
                  : "Never"
              }
            </span>
          </div>

          {canManageAlbum && (
            <div className="settings-row album-name-row">
              <label
                htmlFor="album-name"
                className="text-sm text-slate-500"
              >
                Name
              </label>

              <div className="flex min-w-0 gap-2">
                <input
                  id="album-name"
                  value={
                    albumNameDraft
                  }
                  onChange={(event) =>
                    setAlbumNameDraft(
                      event.target
                        .value,
                    )
                  }
                  className="field min-w-0 flex-1"
                />

                <button
                  type="button"
                  onClick={() =>
                    void handleUpdateAlbum()
                  }
                  className="secondary-action"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="app-page-section">
        <div className="section-heading-row">
          <div>
            <h3 className="section-title">
              Files
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Images and documents in this collection
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {files.length}
          </span>
        </div>

        {files.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-slate-500">
            No files in this album yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {files.map(
              (file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  previewUrl={
                    previewUrls[
                      file.id
                    ]
                  }
                  canManage={
                    canManageAlbum
                  }
                  favoritePending={
                    favoritePendingIds.has(
                      file.id,
                    )
                  }
                  onFavoriteToggle={() =>
                    void handleFavoriteToggle(
                      file,
                    )
                  }
                  onReplace={() => {
                    replaceTargetIdRef.current =
                      file.id;

                    if (
                      replaceInputRef.current
                    ) {
                      replaceInputRef.current.value =
                        "";

                      replaceInputRef.current.click();
                    }
                  }}
                  onDownload={() =>
                    void handleDownload(
                      file,
                    )
                  }
                  onDelete={() =>
                    void handleDelete(
                      file.id,
                    )
                  }
                />
              ),
            )}
          </div>
        )}
      </section>

      {canManageAlbum && (
        <details className="surface share-details">
          <summary className="share-summary">
            <span className="share-summary-icon">
              <Share2
                aria-hidden="true"
                size={19}
              />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-900">
                Share access
              </span>

              <span className="mt-1 block text-sm text-slate-500">
                Manage who can view and download
              </span>
            </span>

            <span className="mr-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {members.length}
            </span>

            <ChevronDown
              aria-hidden="true"
              className="share-chevron text-slate-400"
              size={18}
            />
          </summary>

          <div className="share-content">
            <div className="share-invite">
              <label
                htmlFor="share-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Invite a WinWire user
              </label>

              <input
                id="share-email"
                type="email"
                value={memberEmail}
                onChange={(event) =>
                  setMemberEmail(
                    event.target.value,
                  )
                }
                placeholder="name@winwire.com"
                className="field w-full"
              />

              <div className="permission-row">
                <span className="text-sm text-slate-700">
                  Can view
                </span>

                <button
                  type="button"
                  aria-pressed={
                    canView
                  }
                  onClick={() => {
                    setCanView(
                      (previous) =>
                        !previous,
                    );

                    if (canView) {
                      setCanDownload(
                        false,
                      );
                    }
                  }}
                  className={`permission-toggle ${
                    canView
                      ? "is-enabled"
                      : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                  />

                  {
                    canView
                      ? "On"
                      : "Off"
                  }
                </button>
              </div>

              <div className="permission-row">
                <span className="text-sm text-slate-700">
                  Can download
                </span>

                <button
                  type="button"
                  aria-pressed={
                    canDownload
                  }
                  disabled={
                    !canView
                  }
                  onClick={() =>
                    setCanDownload(
                      (previous) =>
                        !previous,
                    )
                  }
                  className={`permission-toggle ${
                    canDownload
                      ? "is-enabled"
                      : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                  />

                  {
                    canDownload
                      ? "On"
                      : "Off"
                  }
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleAddMember()
                }
                className="primary-action mt-3 w-full"
              >
                Share album
              </button>
            </div>

            <div className="share-members">
              <h4 className="section-title mb-1">
                People with access
              </h4>

              {members.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">
                  No one else has access yet.
                </p>
              ) : (
                members.map(
                  (member) => (
                    <div
                      key={
                        member.userId
                      }
                      className="member-row"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {
                            member.name ||
                            member.email
                          }
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {member.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        aria-label={`Revoke access for ${member.email}`}
                        onClick={() =>
                          void handleRemoveMember(
                            member.userId,
                          )
                        }
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Revoke
                      </button>

                      <button
                        type="button"
                        aria-pressed={
                          member.canView
                        }
                        onClick={() =>
                          void handleUpdateMember(
                            member.userId,
                            !member.canView,
                            !member.canView &&
                              member.canDownload
                              ? false
                              : member.canDownload,
                          )
                        }
                        className={`member-permission ${
                          member.canView
                            ? "is-enabled"
                            : ""
                        }`}
                      >
                        View
                      </button>

                      <button
                        type="button"
                        aria-pressed={
                          member.canDownload
                        }
                        disabled={
                          !member.canView
                        }
                        onClick={() =>
                          void handleUpdateMember(
                            member.userId,
                            member.canView,
                            !member.canDownload,
                          )
                        }
                        className={`member-permission ${
                          member.canDownload
                            ? "is-enabled"
                            : ""
                        }`}
                      >
                        Download
                      </button>
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}