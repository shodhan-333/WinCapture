import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Edit3,
  Images,
  Link2,
  Save,
  Share2,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  addAlbumMember,
  deleteAlbumFile,
  downloadAlbumFile,
  getAlbum,
  getAlbumFiles,
  getAlbumMembers,
  getFilePreviewUrl,
  removeAlbumMember,
  replaceAlbumFile,
  updateAlbum,
  updateAlbumMember,
  uploadAlbumFile,
} from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import FileCardGrid from "../components/files/FileCardGrid";
import useFileFavorites from "../hooks/useFileFavorites";
import useFilePreviews from "../hooks/useFilePreviews";
import { useAuth } from "../context/AuthContext";

import type {
  AlbumMemberResponse,
  AlbumResponse,
} from "../types/album";
import type { FileResponse } from "../types/file";
import { formatDate } from "../utils/formatters";

export default function AlbumDetailPage() {
  const { instance } = useMsal();

  const {
    account,
    user,
  } = useAuth();

  const { albumId } =
    useParams();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const replaceInputRef =
    useRef<HTMLInputElement | null>(null);

  const replaceTargetIdRef =
    useRef<number | null>(null);

  const [album, setAlbum] =
    useState<AlbumResponse | null>(null);

  const [files, setFiles] =
    useState<FileResponse[]>([]);

  const [members, setMembers] =
    useState<AlbumMemberResponse[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [memberEmail, setMemberEmail] =
    useState("");

  const [canView, setCanView] =
    useState(true);

  const [canDownload, setCanDownload] =
    useState(true);

  const [albumNameDraft, setAlbumNameDraft] =
    useState("");

  const [editingName, setEditingName] =
    useState(false);

  const numericAlbumId =
    Number(
      albumId ?? "0",
    );

  const canManageAlbum = Boolean(
    album &&
      user &&
      (user.role === "Admin" ||
        album.ownerId === user.userId),
  );

  const loadPreview = useCallback(
    async (file: FileResponse) => {
      if (!account) {
        throw new Error(
          "An authenticated account is required.",
        );
      }

      return getFilePreviewUrl(
        instance,
        account,
        file.id,
        numericAlbumId,
        canManageAlbum,
      );
    },
    [
      account,
      canManageAlbum,
      instance,
      numericAlbumId,
    ],
  );

  const {
    previewUrls,
    loading: previewsLoading,
  } = useFilePreviews(
    files,
    loadPreview,
  );

  const loadAlbumData = async () => {
    if (
      !account ||
      !Number.isFinite(numericAlbumId)
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const albumResult = await getAlbum(
        instance,
        account,
        numericAlbumId,
      );

      setAlbum(albumResult);
      setAlbumNameDraft(
        albumResult.albumName,
      );

      const nextCanManageAlbum =
        user?.role === "Admin" ||
        albumResult.ownerId === user?.userId;

      const fileResult =
        await getAlbumFiles(
          instance,
          account,
          numericAlbumId,
        );

      setFiles(fileResult);

      if (nextCanManageAlbum) {
        try {
          setMembers(
            await getAlbumMembers(
              instance,
              account,
              numericAlbumId,
            ),
          );
        } catch {
          setMembers([]);
          setError(
            "Album opened, but sharing settings could not be loaded.",
          );
        }
      } else {
        setMembers([]);
      }
    } catch (caughtError) {
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

  const handleFavoriteSuccess =
    useCallback(
      (
        file: FileResponse,
        nextFavorite: boolean,
      ) => {
        setFiles((previous) =>
          previous.map(
            (currentFile) =>
              currentFile.id === file.id
                ? {
                    ...currentFile,
                    isFavorite:
                      nextFavorite,
                  }
                : currentFile,
          ),
        );
      },
      [],
    );

  const handleFavoriteError =
    useCallback(
      (message: string) => {
        setError(message);
      },
      [],
    );

  const {
    pendingIds:
      favoritePendingIds,
    toggleFavorite,
  } = useFileFavorites({
    instance,
    account,
    onSuccess:
      handleFavoriteSuccess,
    onError:
      handleFavoriteError,
  });

  const handleUpload =
    async (
      event: ChangeEvent<HTMLInputElement>,
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

        event.target.value = "";

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
      event: ChangeEvent<HTMLInputElement>,
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

        await replaceAlbumFile(
          instance,
          account,
          numericAlbumId,
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

        event.target.value = "";
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

        setAlbum(updated);

        setAlbumNameDraft(
          updated.albumName,
        );

        setEditingName(false);
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

  if (
    loading ||
    previewsLoading
  ) {
    return (
      <div className="app-page">
        <section className="album-detail-hero skeleton-panel">
          <div className="skeleton-square" />

          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>
        </section>

        <section className="album-detail-loading-files">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="surface album-file-skeleton"
              />
            ),
          )}
        </section>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="app-page">
        <section
          role="alert"
          className="surface album-not-found"
        >
          <span className="album-not-found-icon">
            <Images
              aria-hidden="true"
              size={28}
              strokeWidth={1.5}
            />
          </span>

          <h1>
            Album not found
          </h1>

          <p>
            {error ??
              "The requested album could not be loaded."}
          </p>

          <Link
            to="/albums"
            className="primary-action"
          >
            <ArrowLeft
              aria-hidden="true"
              size={16}
              strokeWidth={1.8}
            />
            Back to albums
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="app-page album-detail-page">
      <div className="album-back-row">
        <Link
          to="/albums"
          className="album-back-link"
        >
          <ArrowLeft
            aria-hidden="true"
            size={16}
            strokeWidth={1.8}
          />
          Albums
        </Link>
      </div>

      <section className="album-detail-hero surface">
        <div className="album-detail-cover">
          <span className="album-detail-cover-orb album-cover-orb-one" />
          <span className="album-detail-cover-orb album-cover-orb-two" />

          <span className="album-detail-cover-icon">
            <Images
              aria-hidden="true"
              size={31}
              strokeWidth={1.45}
            />
          </span>
        </div>

        <div className="album-detail-heading">
          <div className="page-kicker">
            <span className="page-kicker-dot" />
            Album collection
          </div>

          {editingName &&
          canManageAlbum ? (
            <div className="album-title-edit">
              <label
                htmlFor="album-name"
                className="sr-only"
              >
                Album name
              </label>

              <input
                id="album-name"
                value={
                  albumNameDraft
                }
                onChange={(
                  event,
                ) =>
                  setAlbumNameDraft(
                    event.target.value,
                  )
                }
                className="field album-title-input"
                maxLength={200}
                autoFocus
              />

              <button
                type="button"
                onClick={() =>
                  void handleUpdateAlbum()
                }
                className="primary-action compact-action"
              >
                <Save
                  aria-hidden="true"
                  size={15}
                  strokeWidth={1.8}
                />
                Save
              </button>

              <button
                type="button"
                onClick={() => {
                  setAlbumNameDraft(
                    album.albumName,
                  );
                  setEditingName(false);
                }}
                className="secondary-action compact-action"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="album-title-view">
              <h1 className="album-detail-title">
                {album.albumName}
              </h1>

              {canManageAlbum && (
                <button
                  type="button"
                  className="album-title-edit-button"
                  onClick={() =>
                    setEditingName(true)
                  }
                  aria-label="Edit album name"
                  title="Edit album name"
                >
                  <Edit3
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.8}
                  />
                </button>
              )}
            </div>
          )}

          <p className="album-detail-subtitle">
            {files.length}{" "}
            {files.length === 1
              ? "file"
              : "files"}{" "}
          </p>

          <div className="album-detail-meta">
            <span>
              <UserPlus
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />
              {album.ownerName}
            </span>

            <span>
              <CalendarDays
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />
              {formatDate(
                album.createdAt,
              )}
            </span>

            {album.updatedAt && (
              <span>
                Updated{" "}
                {formatDate(
                  album.updatedAt,
                )}
              </span>
            )}
          </div>
        </div>

        {canManageAlbum && (
          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={uploading}
            className="primary-action album-upload-button disabled:opacity-60 disabled:cursor-wait"
          >
            <Upload
              aria-hidden="true"
              size={16}
              strokeWidth={1.8}
            />

            <span>
              {uploading
                ? "Adding..."
                : "Add files"}
            </span>
          </button>
        )}

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
        <ErrorBanner
          message={error}
        />
      )}

      <section className="album-files-section">
        <div className="section-heading-row album-files-heading">
          <div>
            <p className="dashboard-panel-kicker">
              Collection content
            </p>

            <h2 className="section-title">
              Files
            </h2>
          </div>
        </div>

        <FileCardGrid
          files={files}
          previewUrls={previewUrls}
          favoritePendingIds={
            favoritePendingIds
          }
          canManage={
            canManageAlbum
          }
          onFavoriteToggle={(
            file,
          ) =>
            void toggleFavorite(
              file,
            )
          }
          onReplace={(file) => {
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
          onDownload={(file) =>
            void handleDownload(
              file,
            )
          }
          onDelete={(file) =>
            void handleDelete(
              file.id,
            )
          }
          empty={
            <section className="surface album-files-empty">
              <span className="album-files-empty-icon">
                <Upload
                  aria-hidden="true"
                  size={25}
                  strokeWidth={1.5}
                />
              </span>

              <h3>
                No files in this album
              </h3>

              <p>
                Add images or PDF documents
                to start building this
                collection.
              </p>

              {canManageAlbum && (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="primary-action"
                >
                  <Upload
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.8}
                  />
                  Add your first file
                </button>
              )}
            </section>
          }
        />
      </section>

      {canManageAlbum && (
        <details className="share-details surface">
          <summary className="share-summary">
            <span className="share-summary-icon">
              <Share2
                aria-hidden="true"
                size={18}
                strokeWidth={1.8}
              />
            </span>

            <span className="share-summary-copy">
              <strong>
                Share access
              </strong>

              <small>
                Manage who can view and
                download this album
              </small>
            </span>

            <span className="share-member-count">
              <Users
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
              />
              {members.length}
            </span>

            <ChevronDown
              aria-hidden="true"
              className="share-chevron"
              size={18}
              strokeWidth={1.8}
            />
          </summary>

          <div className="share-content">
            <div className="share-invite">
              <div className="share-section-heading">
                <div>
                  <p className="dashboard-panel-kicker">
                    Album permissions
                  </p>

                  <h3 className="section-title">
                    Invite a WinWire user
                  </h3>
                </div>

                <span className="share-section-icon">
                  <UserPlus
                    aria-hidden="true"
                    size={17}
                    strokeWidth={1.8}
                  />
                </span>
              </div>

              <label
                htmlFor="share-email"
                className="field-label"
              >
                Email address
              </label>

              <input
                id="share-email"
                type="email"
                value={memberEmail}
                onChange={(
                  event,
                ) =>
                  setMemberEmail(
                    event.target.value,
                  )
                }
                placeholder="name@winwire.com"
                className="field w-full"
              />

              <div className="permission-panel">
                <div className="permission-row">
                  <div>
                    <strong>
                      Can view
                    </strong>

                    <span>
                      Allow this person to
                      open the album.
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-pressed={
                      canView
                    }
                    onClick={() => {
                      setCanView(
                        (
                          previous,
                        ) =>
                          !previous,
                      );

                      if (
                        canView
                      ) {
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

                    {canView
                      ? "On"
                      : "Off"}
                  </button>
                </div>

                <div className="permission-row">
                  <div>
                    <strong>
                      Can download
                    </strong>

                    <span>
                      Allow files to be
                      downloaded.
                    </span>
                  </div>

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
                        (
                          previous,
                        ) =>
                          !previous,
                      )
                    }
                    className={`permission-toggle ${
                      canDownload
                        ? "is-enabled"
                        : ""
                    } ${
                      !canView
                        ? "is-disabled"
                        : ""
                    }`}
                  >
                    <span
                      aria-hidden="true"
                    />

                    {canDownload
                      ? "On"
                      : "Off"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleAddMember()
                }
                className="primary-action mt-4 w-full"
              >
                <Link2
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.8}
                />
                Share album
              </button>
            </div>

            <div className="share-members">
              <div className="share-section-heading">
                <div>
                  <p className="dashboard-panel-kicker">
                    Current members
                  </p>

                  <h3 className="section-title">
                    People with access
                  </h3>
                </div>

                <span className="share-section-count">
                  {members.length}
                </span>
              </div>

              {members.length === 0 ? (
                <div className="share-members-empty">
                  <span>
                    <Users
                      aria-hidden="true"
                      size={23}
                      strokeWidth={1.5}
                    />
                  </span>

                  <p>
                    No one else has
                    access yet.
                  </p>

                  <small>
                    Invite a WinWire user
                    using the form.
                  </small>
                </div>
              ) : (
                <div className="share-member-list">
                  {members.map(
                    (
                      member,
                    ) => (
                      <div
                        key={
                          member.userId
                        }
                        className="member-row"
                      >
                        <div className="member-avatar">
                          {member.name
                            ?.charAt(
                              0,
                            )
                            .toUpperCase() ??
                            member.email
                              .charAt(
                                0,
                              )
                              .toUpperCase()}
                        </div>

                        <div className="member-copy">
                          <strong>
                            {member.name ||
                              member.email}
                          </strong>

                          <span>
                            {
                              member.email
                            }
                          </span>

                          <small>
                            Granted{" "}
                            {formatDate(
                              member.grantedAt,
                            )}
                          </small>
                        </div>

                        <div className="member-actions">
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
                            {member.canView && (
                              <Check
                                aria-hidden="true"
                                size={12}
                                strokeWidth={2}
                              />
                            )}
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
                            } ${
                              !member.canView
                                ? "is-disabled"
                                : ""
                            }`}
                          >
                            {member.canDownload && (
                              <Download
                                aria-hidden="true"
                                size={12}
                                strokeWidth={1.9}
                              />
                            )}
                            Download
                          </button>

                          <button
                            type="button"
                            aria-label={`Revoke access for ${member.email}`}
                            title="Revoke access"
                            onClick={() =>
                              void handleRemoveMember(
                                member.userId,
                              )
                            }
                            className="member-revoke"
                          >
                            <Trash2
                              aria-hidden="true"
                              size={15}
                              strokeWidth={1.8}
                            />
                            <span>
                              Revoke
                            </span>
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </details>
      )}

      {!canManageAlbum && (
        <section className="album-permission-note surface">
          <span className="album-permission-note-icon">
            <Users
              aria-hidden="true"
              size={17}
              strokeWidth={1.8}
            />
          </span>

          <div>
            <strong>
              Shared album
            </strong>

            <p>
              You have access to this
              collection based on the
              permissions assigned to your
              account.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}