import type JSZip from "jszip";
import { getFileExtension } from "../constants/fileSupport";

export type PreviewContent =
  | { kind: "text"; text: string }
  | { kind: "table"; rows: string[][]; sheetName?: string }
  | { kind: "slide"; width: number; height: number; shapes: { text: string; x: number; y: number; width: number; height: number }[] }
  | { kind: "archive"; entries: { name: string; size?: number; directory: boolean }[] };

const MAX_ARCHIVE_ENTRIES = 2000;
const MAX_PREVIEW_XML_BYTES = 8 * 1024 * 1024;

function uncompressedSize(file: JSZip.JSZipObject): number | undefined {
  return (file as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
}

async function readZipText(zip: JSZip, path: string, maxBytes = MAX_PREVIEW_XML_BYTES): Promise<string | undefined> {
  const file = zip.file(path);
  if (!file) return undefined;
  const size = uncompressedSize(file);
  if (size === undefined || size > maxBytes) throw new Error("This file contains an oversized preview section.");
  return file.async("string");
}

export function parseDelimitedText(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(cell); cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
    } else cell += character;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function getArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("The preview content could not be read.");
  return response.arrayBuffer();
}

function xmlText(element: Element, localName: string): string {
  return Array.from(element.getElementsByTagNameNS("*", localName))
    .map((item) => item.textContent ?? "")
    .join("");
}

async function parsePowerPoint(buffer: ArrayBuffer): Promise<PreviewContent> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: false });
  const slideFile = zip.file("ppt/slides/slide1.xml");
  if (!slideFile) throw new Error("The first slide could not be found.");
  const [slideXml, presentationXml] = await Promise.all([
    readZipText(zip, "ppt/slides/slide1.xml"),
    readZipText(zip, "ppt/presentation.xml", 1024 * 1024),
  ]);
  if (!slideXml) throw new Error("The first slide could not be read.");
  const parser = new DOMParser();
  const slide = parser.parseFromString(slideXml, "application/xml");
  const presentation = parser.parseFromString(presentationXml ?? "", "application/xml");
  const dimensions = presentation.getElementsByTagNameNS("*", "sldSz")[0];
  const width = Number(dimensions?.getAttribute("cx")) || 9144000;
  const height = Number(dimensions?.getAttribute("cy")) || 5143500;
  const shapes = Array.from(slide.getElementsByTagNameNS("*", "sp"))
    .map((shape) => {
      const transform = shape.getElementsByTagNameNS("*", "xfrm")[0];
      const offset = transform?.getElementsByTagNameNS("*", "off")[0];
      const extent = transform?.getElementsByTagNameNS("*", "ext")[0];
      const text = xmlText(shape, "t").trim();
      if (!text) return null;
      return {
        text,
        x: Number(offset?.getAttribute("x")) || 0,
        y: Number(offset?.getAttribute("y")) || 0,
        width: Number(extent?.getAttribute("cx")) || width,
        height: Number(extent?.getAttribute("cy")) || height,
      };
    })
    .filter((shape): shape is NonNullable<typeof shape> => shape !== null);
  return { kind: "slide", width, height, shapes };
}

function resolveZipPath(base: string, target: string): string {
  const parts = (target.startsWith("/") ? target.slice(1) : `${base}/${target}`).split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") resolved.pop();
    else resolved.push(part);
  }
  return resolved.join("/");
}

async function parseWorkbook(buffer: ArrayBuffer): Promise<PreviewContent> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: false });
  const [workbookXml, relationshipsXml, sharedXml] = await Promise.all([
    readZipText(zip, "xl/workbook.xml", 1024 * 1024),
    readZipText(zip, "xl/_rels/workbook.xml.rels", 1024 * 1024),
    readZipText(zip, "xl/sharedStrings.xml", 8 * 1024 * 1024),
  ]);
  if (!workbookXml) throw new Error("This workbook could not be read.");
  const parser = new DOMParser();
  const workbook = parser.parseFromString(workbookXml, "application/xml");
  const firstSheet = workbook.getElementsByTagNameNS("*", "sheet")[0];
  if (!firstSheet) throw new Error("This workbook contains no worksheets.");
  const relationshipId = firstSheet.getAttribute("r:id") ?? firstSheet.getAttributeNS("*", "id");
  const relationships = parser.parseFromString(relationshipsXml ?? "", "application/xml");
  const relationship = Array.from(relationships.getElementsByTagNameNS("*", "Relationship"))
    .find((item) => item.getAttribute("Id") === relationshipId);
  const sheetPath = resolveZipPath("xl", relationship?.getAttribute("Target") ?? "worksheets/sheet1.xml");
  const sheetXml = await readZipText(zip, sheetPath);
  if (!sheetXml) throw new Error("The first worksheet could not be found.");
  const sheet = parser.parseFromString(sheetXml, "application/xml");
  const shared = sharedXml ? parser.parseFromString(sharedXml, "application/xml") : undefined;
  const sharedStrings = shared ? Array.from(shared.getElementsByTagNameNS("*", "si"), (item) => xmlText(item, "t")) : [];
  const columnIndex = (reference: string) => {
    let value = 0;
    for (const character of reference.match(/^[A-Z]+/i)?.[0]?.toUpperCase() ?? "") value = value * 26 + character.charCodeAt(0) - 64;
    return Math.max(0, value - 1);
  };
  const rows = Array.from(sheet.getElementsByTagNameNS("*", "row")).slice(0, 500).map((row) => {
    const cells = Array.from(row.getElementsByTagNameNS("*", "c"))
      .map((cell) => {
        const reference = cell.getAttribute("r") ?? "A1";
        const type = cell.getAttribute("t");
        const value = cell.getElementsByTagNameNS("*", "v")[0]?.textContent ?? "";
        const inlineText = cell.getElementsByTagNameNS("*", "is")[0];
        const text = type === "s" ? sharedStrings[Number(value)] ?? ""
          : type === "inlineStr" && inlineText ? xmlText(inlineText, "t")
            : type === "b" ? (value === "1" ? "TRUE" : "FALSE") : value;
        return { column: columnIndex(reference), text };
      }).filter((cell) => cell.column < 30);
    const maxColumn = Math.max(-1, ...cells.map((cell) => cell.column));
    const values = Array.from({ length: maxColumn + 1 }, () => "");
    for (const cell of cells) values[cell.column] = cell.text;
    return values;
  });
  return { kind: "table", sheetName: firstSheet.getAttribute("name") ?? "Sheet 1", rows };
}

export async function readFilePreview(url: string, extension: string): Promise<PreviewContent> {
  const buffer = await getArrayBuffer(url);
  if (extension === ".txt") return { kind: "text", text: new TextDecoder().decode(buffer) };
  if (extension === ".csv") return { kind: "table", rows: parseDelimitedText(new TextDecoder().decode(buffer)) };
  if (extension === ".docx") {
    const JSZip = (await import("jszip")).default;
    const docx = await JSZip.loadAsync(buffer, { checkCRC32: false });
    const totalExpandedSize = Object.values(docx.files).reduce((sum, entry) => sum + (uncompressedSize(entry) ?? 0), 0);
    if (totalExpandedSize > 32 * 1024 * 1024) throw new Error("This document expands beyond the safe preview limit.");
    if (!await readZipText(docx, "word/document.xml")) throw new Error("The main document content could not be found.");
    const mammoth = (await import("mammoth")).default;
    const mammothInput = { arrayBuffer: buffer, buffer: new Uint8Array(buffer) };
    const result = await mammoth.extractRawText(mammothInput as Parameters<typeof mammoth.extractRawText>[0]);
    if (!result.value.trim()) throw new Error("This document contains no readable text.");
    return { kind: "text", text: result.value };
  }
  if (extension === ".xlsx") {
    return parseWorkbook(buffer);
  }
  if (extension === ".pptx") return parsePowerPoint(buffer);
  if (extension === ".zip") {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer, { checkCRC32: false });
    const entries = Object.values(zip.files).slice(0, MAX_ARCHIVE_ENTRIES).map((entry) => ({
      name: entry.name,
      directory: entry.dir,
      size: (entry as typeof entry & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize,
    }));
    return { kind: "archive", entries };
  }
  throw new Error("This file type does not have a readable preview.");
}

export function getPreviewExtension(fileName: string): string {
  return getFileExtension(fileName);
}

