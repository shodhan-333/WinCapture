import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatFileSize,
  formatFileType,
  getInitials,
} from "../../../frontend/src/shared/utils/formatters";

describe("formatters", () => {
  it("formats file sizes across byte, kilobyte, and megabyte ranges", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1023)).toBe("1023 B");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("2 KB");
    expect(formatFileSize(1572864)).toBe("1.5 MB");
  });

  it("formats content types and user initials", () => {
    expect(formatFileType("image/jpeg")).toBe("JPEG");
    expect(formatFileType(" application/vnd.openxmlformats-officedocument.wordprocessingml.document; charset=utf-8 ")).toBe("Word document");
    expect(formatFileType("application/json; charset=utf-8")).toBe("JSON; CHARSET=UTF-8");
    expect(formatFileType("unknown")).toBe("UNKNOWN");
    expect(formatFileType("")).toBe("");
    expect(getInitials(" Ada  Lovelace ")).toBe("AL");
    expect(getInitials("Ada")).toBe("AD");
    expect(getInitials(" ")).toBe("U");
    expect(getInitials()).toBe("U");
  });

  it("formats valid dates using the current locale", () => {
    expect(formatDate("2025-01-02T00:00:00.000Z")).toBe(
      new Date("2025-01-02T00:00:00.000Z").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );
  });
});
