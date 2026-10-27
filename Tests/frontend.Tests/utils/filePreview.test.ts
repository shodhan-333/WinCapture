import JSZip from "jszip";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseDelimitedText,
  readFilePreview,
} from "../../../frontend/src/features/files/utils/filePreview";

const serve = (buffer: ArrayBuffer) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, arrayBuffer: async () => buffer })),
  );
};

async function zipBuffer(entries: Record<string, string>): Promise<ArrayBuffer> {
  const zip = new JSZip();
  Object.entries(entries).forEach(([name, content]) => zip.file(name, content));
  return zip.generateAsync({ type: "arraybuffer" });
}

afterEach(() => vi.unstubAllGlobals());

describe("file preview parsing", () => {
  it("parses quoted CSV cells and line breaks", () => {
    expect(parseDelimitedText('Name,Notes\r\nAda,"first line\nsecond line"')).toEqual([
      ["Name", "Notes"],
      ["Ada", "first line\nsecond line"],
    ]);
  });

  it("handles escaped quotes, CR-only rows, empty input, and ignored blank rows", () => {
    expect(parseDelimitedText('a,"b""c"\r\n\r"x,y",z')).toEqual([
      ["a", 'b"c'],
      ["x,y", "z"],
    ]);
    expect(parseDelimitedText("")).toEqual([]);
    expect(parseDelimitedText("\n,,x\n")).toEqual([["", "", "x"]]);
    expect(parseDelimitedText("a;b", ";")).toEqual([["a", "b"]]);
  });

  it("reports unreadable network responses and unsupported preview formats", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        arrayBuffer: async () => new ArrayBuffer(0),
      })),
    );
    await expect(readFilePreview("/missing", ".txt")).rejects.toThrow(
      "The preview content could not be read.",
    );
    serve(new ArrayBuffer(0));
    await expect(readFilePreview("/file", ".bin")).rejects.toThrow(
      "This file type does not have a readable preview.",
    );
  });

  it("reads text files as their actual contents", async () => {
    serve(new TextEncoder().encode("Authentic file text").buffer);
    await expect(readFilePreview("blob:text", ".txt")).resolves.toEqual({
      kind: "text",
      text: "Authentic file text",
    });
  });

  it("reads CSV data as rows", async () => {
    serve(new TextEncoder().encode("key,value\na,1").buffer);
    await expect(readFilePreview("blob:csv", ".csv")).resolves.toEqual({
      kind: "table",
      rows: [
        ["key", "value"],
        ["a", "1"],
      ],
    });
  });

  it("extracts readable text from DOCX", async () => {
    serve(
      await zipBuffer({
        "word/document.xml":
          '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Document preview text</w:t></w:r></w:p></w:body></w:document>',
      }),
    );
    const result = await readFilePreview("blob:docx", ".docx");
    expect(result.kind).toBe("text");
    if (result.kind === "text") expect(result.text).toContain("Document preview text");
  }, 15000);

  it("reads the first worksheet from XLSX", async () => {
    serve(
      await zipBuffer({
        "xl/workbook.xml":
          '<workbook xmlns="urn:sheet" xmlns:r="urn:rel"><sheets><sheet name="Overview" sheetId="1" r:id="rId1"/></sheets></workbook>',
        "xl/_rels/workbook.xml.rels":
          '<Relationships xmlns="urn:package"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
        "xl/sharedStrings.xml":
          '<sst xmlns="urn:sheet"><si><t>City</t></si><si><t>Count</t></si><si><t>Pune</t></si></sst>',
        "xl/worksheets/sheet1.xml":
          '<worksheet xmlns="urn:sheet"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>3</v></c></row></sheetData></worksheet>',
      }),
    );
    const result = await readFilePreview("blob:xlsx", ".xlsx");
    expect(result).toEqual({
      kind: "table",
      sheetName: "Overview",
      rows: [
        ["City", "Count"],
        ["Pune", "3"],
      ],
    });
  });

  it("reads inline and boolean XLSX cells when optional workbook metadata is absent", async () => {
    serve(
      await zipBuffer({
        "xl/workbook.xml":
          '<workbook xmlns="urn:sheet"><sheets><sheet sheetId="1"/></sheets></workbook>',
        "xl/worksheets/sheet1.xml":
          '<worksheet xmlns="urn:sheet"><sheetData><row><c r="A1" t="inlineStr"><is><t>Label</t></is></c><c r="B1" t="b"><v>1</v></c><c r="C1" t="b"><v>0</v></c><c r="AE1"><v>ignored</v></c></row></sheetData></worksheet>',
      }),
    );
    await expect(readFilePreview("blob:xlsx", ".xlsx")).resolves.toEqual({
      kind: "table",
      sheetName: "Sheet 1",
      rows: [["Label", "TRUE", "FALSE"]],
    });
  });

  it("extracts first-slide text and positions from PPTX", async () => {
    serve(
      await zipBuffer({
        "ppt/presentation.xml":
          '<p:presentation xmlns:p="urn:p"><p:sldSz cx="1000" cy="500"/></p:presentation>',
        "ppt/slides/slide1.xml":
          '<p:sld xmlns:p="urn:p" xmlns:a="urn:a"><p:sp><p:spPr><a:xfrm><a:off x="100" y="50"/><a:ext cx="600" cy="100"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:t>Quarterly results</a:t></a:r></a:p></p:txBody></p:sp></p:sld>',
      }),
    );
    const result = await readFilePreview("blob:pptx", ".pptx");
    expect(result).toEqual({
      kind: "slide",
      width: 1000,
      height: 500,
      shapes: [{ text: "Quarterly results", x: 100, y: 50, width: 600, height: 100 }],
    });
  });

  it("uses safe PowerPoint defaults, drops empty shapes, and reports missing slides", async () => {
    serve(await zipBuffer({
      "ppt/slides/slide1.xml": '<p:sld xmlns:p="urn:p" xmlns:a="urn:a"><p:sp><p:txBody><a:t> Fallback shape </a:t></p:txBody></p:sp><p:sp><p:txBody><a:t> </a:t></p:txBody></p:sp></p:sld>',
    }));
    await expect(readFilePreview("blob:pptx", ".pptx")).resolves.toEqual({
      kind: "slide",
      width: 9144000,
      height: 5143500,
      shapes: [{ text: "Fallback shape", x: 0, y: 0, width: 9144000, height: 5143500 }],
    });

    serve(await zipBuffer({ "ppt/presentation.xml": "<presentation/>" }));
    await expect(readFilePreview("blob:missing-slide", ".pptx")).rejects.toThrow(
      "The first slide could not be found.",
    );
  });

  it("rejects workbooks without worksheets or worksheet content and resolves relative targets", async () => {
    serve(await zipBuffer({ "xl/workbook.xml": '<workbook xmlns="urn:sheet"><sheets/></workbook>' }));
    await expect(readFilePreview("blob:no-sheets", ".xlsx")).rejects.toThrow(
      "This workbook contains no worksheets.",
    );

    serve(await zipBuffer({
      "xl/workbook.xml": '<workbook xmlns="urn:sheet" xmlns:r="urn:rel"><sheets><sheet r:id="r1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels": '<Relationships xmlns="urn:package"><Relationship Id="r1" Target="../worksheets/absent.xml"/></Relationships>',
    }));
    await expect(readFilePreview("blob:no-sheet-file", ".xlsx")).rejects.toThrow(
      "The first worksheet could not be found.",
    );

    serve(await zipBuffer({
      "xl/workbook.xml": '<workbook xmlns="urn:sheet" xmlns:r="urn:rel"><sheets><sheet name="Data" r:id="r1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels": '<Relationships xmlns="urn:package"><Relationship Id="r1" Target="../worksheets/sheet1.xml"/></Relationships>',
      "worksheets/sheet1.xml": '<worksheet xmlns="urn:sheet"><sheetData><row><c r="1"><v>row-only</v></c><c r="AD1"><v>edge-column</v></c></row></sheetData></worksheet>',
    }));
    await expect(readFilePreview("blob:relative-sheet", ".xlsx")).resolves.toMatchObject({
      kind: "table",
      sheetName: "Data",
      rows: [["row-only", ...Array(28).fill(""), "edge-column"]],
    });
  });

  it("rejects missing or empty DOCX content and oversized compressed documents", async () => {
    serve(await zipBuffer({ "word/styles.xml": "<styles/>" }));
    await expect(readFilePreview("blob:no-document", ".docx")).rejects.toThrow(
      "The main document content could not be found.",
    );

    serve(await zipBuffer({
      "word/document.xml": '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>',
    }));
    await expect(readFilePreview("blob:empty-document", ".docx")).rejects.toThrow(
      "This document contains no readable text.",
    );

    const oversized = new JSZip();
    oversized.file("word/document.xml", "x".repeat(32 * 1024 * 1024 + 1));
    serve(await oversized.generateAsync({ type: "arraybuffer", compression: "DEFLATE" }));
    await expect(readFilePreview("blob:large-document", ".docx")).rejects.toThrow(
      "This document expands beyond the safe preview limit.",
    );
  }, 30000);

  it("rejects oversized preview XML and limits archive entry listings", async () => {
    const largeWorkbook = new JSZip();
    largeWorkbook.file("xl/workbook.xml", "x".repeat(1024 * 1024 + 1));
    serve(await largeWorkbook.generateAsync({ type: "arraybuffer", compression: "DEFLATE" }));
    await expect(readFilePreview("blob:large-workbook", ".xlsx")).rejects.toThrow(
      "This file contains an oversized preview section.",
    );

    const manyEntries = new JSZip();
    for (let index = 0; index < 2001; index += 1) manyEntries.file(`entry-${index}.txt`, "x");
    serve(await manyEntries.generateAsync({ type: "arraybuffer", compression: "DEFLATE" }));
    const result = await readFilePreview("blob:many-entries", ".zip");
    expect(result.kind).toBe("archive");
    if (result.kind === "archive") expect(result.entries).toHaveLength(2000);
  }, 30000);

  it("lists archive paths and uncompressed sizes without extracting entries", async () => {
    serve(await zipBuffer({ "docs/readme.txt": "hello", "images/": "" }));
    const result = await readFilePreview("blob:zip", ".zip");
    expect(result.kind).toBe("archive");
    if (result.kind === "archive") {
      expect(result.entries.map(({ name, directory }) => [name, directory])).toEqual([
        ["docs/", true],
        ["docs/readme.txt", false],
        ["images/", true],
      ]);
      expect(result.entries.find(({ name }) => name.endsWith("readme.txt"))?.size).toBe(5);
    }
  });
});
