// Format an ISO date using the user's locale and a compact month-day-year display.
export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Convert a byte count to a concise KB or MB label.
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

// Turn a MIME type into the file type label shown in file details.
export function formatFileType(contentType: string): string {
  const normalizedType = contentType.trim().toLowerCase().split(";")[0] ?? "";
  const officeTypeLabels: Record<string, string> = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel spreadsheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint presentation",
    "application/msword": "Word document",
    "application/vnd.ms-excel": "Excel spreadsheet",
    "application/vnd.ms-powerpoint": "PowerPoint presentation",
  };
  const officeLabel = officeTypeLabels[normalizedType];
  if (officeLabel) return officeLabel;

  const [type, subtype] = contentType.split("/");

  return subtype ? subtype.toUpperCase() : (type ?? "Unknown file type").toUpperCase();
}

// Derive up to two uppercase initials for account avatars.
export function getInitials(name?: string): string {
  if (!name?.trim()) {
    return "U";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return (parts[0] ?? "U").slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] ?? "U"}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}
