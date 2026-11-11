import { assert, assertEquals, assertRejects, assertStringIncludes, assertThrows } from "jsr:@std/assert@1";
import { strToU8, zipSync } from "npm:fflate@0.8.3";
import {
  decodeXml,
  extractDocx,
  extractPdfText,
  extractPptx,
  meaningfulLength,
  NoReadableTextError,
  textFromOoxml,
} from "./extract.ts";

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const A = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';

function docx(paragraphs: string[]): Uint8Array {
  const body = paragraphs
    .map((p) => `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t xml:space="preserve">${p}</w:t></w:r></w:p>`)
    .join("");
  return zipSync({
    "[Content_Types].xml": strToU8("<Types/>"),
    "word/document.xml": strToU8(`<?xml version="1.0"?><w:document ${W}><w:body>${body}<w:p/></w:body></w:document>`),
  });
}

function pptx(slides: string[][], notes: Record<number, string> = {}): Uint8Array {
  const files: Record<string, Uint8Array> = { "[Content_Types].xml": strToU8("<Types/>") };
  slides.forEach((paras, i) => {
    const sp = paras.map((t) => `<a:p><a:r><a:t>${t}</a:t></a:r></a:p>`).join("");
    files[`ppt/slides/slide${i + 1}.xml`] = strToU8(`<p:sld ${A}><p:cSld><p:spTree>${sp}</p:spTree></p:cSld></p:sld>`);
  });
  for (const [n, text] of Object.entries(notes)) {
    files[`ppt/notesSlides/notesSlide${n}.xml`] = strToU8(
      `<p:notes ${A}><a:p><a:r><a:t>${n}</a:t></a:r></a:p><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:notes>`,
    );
  }
  return zipSync(files);
}

/** A minimal, valid single-page PDF with one line of text (correct xref offsets). */
function pdfWithText(lines: string[]): Uint8Array {
  const ops = lines.map((l, i) => `BT /F1 12 Tf 72 ${720 - i * 18} Td (${l}) Tj ET`).join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${ops.length} >>\nstream\n${ops}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return strToU8(out);
}

Deno.test("decodeXml handles named and numeric entities", () => {
  assertEquals(decodeXml("A &amp; B &lt;x&gt; &quot;q&quot; &#233;t&#xE9;"), 'A & B <x> "q" été');
});

Deno.test("textFromOoxml keeps paragraph breaks and tabs", () => {
  const xml = `<w:p><w:r><w:t>One</w:t></w:r><w:r><w:tab/><w:t>two</w:t></w:r></w:p><w:p><w:r><w:t>Three</w:t></w:r></w:p>`;
  assertEquals(textFromOoxml(xml, "w"), "One two\nThree");
});

Deno.test("extractDocx returns the document's real text, not metadata", () => {
  const text = extractDocx(docx(["Photosynthesis converts light into chemical energy.", "Chlorophyll absorbs red &amp; blue light."]));
  assertStringIncludes(text, "Photosynthesis converts light into chemical energy.");
  assertStringIncludes(text, "Chlorophyll absorbs red & blue light.");
  assert(!text.includes("Title:"));
});

Deno.test("extractPptx orders slides numerically and includes speaker notes", () => {
  const slides = Array.from({ length: 11 }, (_, i) => [`Slide body ${i + 1}`]);
  const text = extractPptx(pptx(slides, { 2: "Remember the Krebs cycle." }));
  const s2 = text.indexOf("Slide 2\n");
  const s10 = text.indexOf("Slide 10\n");
  assert(s2 > -1 && s10 > s2, "slide 2 must come before slide 10");
  assertStringIncludes(text, "Speaker notes: Remember the Krebs cycle.");
});

Deno.test("non-zip bytes are reported as unreadable, not silently accepted", () => {
  assertThrows(() => extractDocx(strToU8("not a zip")), NoReadableTextError);
  assertThrows(() => extractPptx(strToU8("not a zip")), NoReadableTextError);
});

Deno.test("extractPdfText reads the PDF text layer", async () => {
  const { text, pages } = await extractPdfText(pdfWithText(["Mitochondria are the powerhouse of the cell.", "ATP stores energy."]));
  assertEquals(pages, 1);
  assertStringIncludes(text, "Mitochondria are the powerhouse of the cell.");
  assertStringIncludes(text, "ATP stores energy.");
});

Deno.test("extractPdfText returns empty text for a PDF with no text layer", async () => {
  const { text } = await extractPdfText(pdfWithText([]));
  assertEquals(meaningfulLength(text), 0);
});

Deno.test("extractPdfText rejects garbage", async () => {
  await assertRejects(() => extractPdfText(strToU8("garbage")));
});

Deno.test("meaningfulLength counts letters in any script", () => {
  assertEquals(meaningfulLength("  ¿Qué? 光合作用 42 !!"), 9);
});
