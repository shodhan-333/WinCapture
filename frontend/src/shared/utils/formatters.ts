export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

export function formatFileType(contentType: string): string {
  const [type, subtype] = contentType.split("/");

  return subtype ? subtype.toUpperCase() : (type ?? "Unknown file type").toUpperCase();
}

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
