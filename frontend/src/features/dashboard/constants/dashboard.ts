import { Archive, FileText, Film, Images, Music } from "lucide-react";

export const DASHBOARD_FILE_CATEGORIES = [
  { label: "Images", icon: Images },
  { label: "Documents", icon: FileText },
  { label: "Videos", icon: Film },
  { label: "Audio", icon: Music },
  { label: "Archives", icon: Archive },
] as const;

export const ALL_CONTENT_PAGE_SIZE = 10;
