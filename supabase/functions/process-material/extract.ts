// Text extraction for uploaded documents, done locally (no AI call) wherever the format allows.
//
// Why this exists: PDFs, Word and PowerPoint files used to be sent to the chat model as an
// "image". The model rejects non-image data URLs, the error was swallowed, and study content was
// then generated from the title alone ("Title: … Subject: General Topic: Not specified").

import { unzipSync, strFromU8 } from "npm:fflate@0.8.3";

/** Below this many letters/digits we treat a document as having no readable text. */
export const MIN_TEXT_CHARS = 80;

/** Thrown when a file genuinely has no text we can read (e.g. a scanned PDF the AI also can't read). */
export class NoReadableTextError extends Error {
  constructor(message = "NO_READABLE_TEXT") {
    super(message);
    this.name = "NoReadableTextError";
  }
}

const XML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export function decodeXml(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (whole, ent: string) => {
    if (ent[0] === "#") {
      const code = ent[1].toLowerCase() === "x" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return XML_ENTITIES[ent.toLowerCase()] ?? whole;
  });
}

/** Count of letters and digits in any script; used to decide whether extraction found real text. */
export function meaningfulLength(text: string): number {
  return (text.match(/[\p{L}\p{N}]/gu) ?? []).length;
}

export function tidy(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Pull the visible text out of an Office Open XML part. `ns` is "w" for Word, "a" for
 * PowerPoint (DrawingML). Paragraph ends become newlines, tabs/breaks are kept.
 */
export function textFromOoxml(xml: string, ns: "w" | "a"): string {
  const re = new RegExp(
    `<${ns}:t(?:\\s[^>]*)?>([^<]*)</${ns}:t>|</${ns}:p>|<${ns}:p\\s*/>|<${ns}:tab\\s*/>|<${ns}:br\\b[^>]*/?>`,
    "g",
  );
  let out = "";
  for (const m of xml.matchAll(re)) {
    if (m[1] !== undefined) out += decodeXml(m[1]);
    else if (m[0].includes(":tab")) out += "\t";
    else out += "\n";
  }
  return tidy(out);
}

function unzip(bytes: Uint8Array): Record<string, Uint8Array> {
  try {
    return unzipSync(bytes);
  } catch {
    throw new NoReadableTextError("This file isn't a valid Word or PowerPoint document.");
  }
}

export function extractDocx(bytes: Uint8Array): string {
  const files = unzip(bytes);
  const body = files["word/document.xml"];
  if (!body) throw new NoReadableTextError("This Word file has no document body.");
  const parts = [textFromOoxml(strFromU8(body), "w")];
  // Footnotes and endnotes often hold real content in academic documents.
  for (const name of ["word/footnotes.xml", "word/endnotes.xml"]) {
    if (files[name]) {
      const t = textFromOoxml(strFromU8(files[name]), "w");
      if (meaningfulLength(t) > 0) parts.push(t);
    }
  }
  return tidy(parts.join("\n\n"));
}

const slideNumber = (name: string) => Number(name.match(/(\d+)\.xml$/)?.[1] ?? 0);

export function extractPptx(bytes: Uint8Array): string {
  const files = unzip(bytes);
  const slides = Object.keys(files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => slideNumber(a) - slideNumber(b));
  if (slides.length === 0) throw new NoReadableTextError("This PowerPoint file has no slides.");

  const sections: string[] = [];
  for (const name of slides) {
    const n = slideNumber(name);
    const body = textFromOoxml(strFromU8(files[name]), "a");
    const notesFile = files[`ppt/notesSlides/notesSlide${n}.xml`];
    // Speaker notes carry the slide number as text; drop a lone number.
    const notes = notesFile ? textFromOoxml(strFromU8(notesFile), "a").replace(/^\d+$/m, "").trim() : "";
    if (meaningfulLength(body) === 0 && meaningfulLength(notes) === 0) continue;
    sections.push([`Slide ${n}`, body, notes ? `Speaker notes: ${notes}` : ""].filter(Boolean).join("\n"));
  }
  return tidy(sections.join("\n\n"));
}

/** Text layer of a PDF. Returns "" for scanned/image-only PDFs so the caller can fall back to AI. */
export async function extractPdfText(bytes: Uint8Array, maxPages = 150): Promise<{ text: string; pages: number }> {
  const { getDocumentProxy } = await import("npm:unpdf@1.9.1");
  const pdf = await getDocumentProxy(bytes);
  const pages = pdf.numPages;
  const out: string[] = [];
  for (let i = 1; i <= Math.min(pages, maxPages); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let pageText = "";
    for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
      if (typeof item.str !== "string") continue;
      pageText += item.str + (item.hasEOL ? "\n" : " ");
    }
    out.push(pageText);
  }
  return { text: tidy(out.join("\n\n")), pages };
}
