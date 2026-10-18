import type { AdminFileResponse, FileResponse } from "@/features/files/types/file";

export type DashboardFile = FileResponse &
  Partial<Pick<AdminFileResponse, "uploadedBy" | "uploaderName" | "albumId" | "albumName">>;
