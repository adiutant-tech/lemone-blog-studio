// === Materiały źródłowe (v4.20): pliki i linki do budowy scenariusza ===
// PDF idzie do modelu jako dokument (model czyta go sam, także tabele i wykresy). DOCX, XLSX, CSV i TXT
// zamieniamy na tekst w przeglądarce, bez dodatkowych bibliotek (DOCX i XLSX to archiwa ZIP z XML).
// Linki pobiera Worker (/page z external: true): strona -> tekst, link do PDF -> dokument.

import { apiFetch } from "./auth.jsx";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const MAT_LIMITS = { pdf: 15 * 1024 * 1024, text: 5 * 1024 * 1024, total: 28 * 1024 * 1024, textChars: 60000, links: 8 };
export const MAT_ACCEPT = ".pdf,.docx,.xlsx,.csv,.txt,.md";

// ---------- ZIP (DOCX, XLSX): katalog centralny + rozpakowanie deflate przez DecompressionStream
export async function unzip(buf, wanted) {
  const dv = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("to nie jest poprawny plik (brak struktury ZIP)");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  const out = {};
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), commLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
    p += 46 + nameLen + extraLen + commLen;
    if (!wanted(name)) continue;
    const lNameLen = dv.getUint16(local + 26, true), lExtraLen = dv.getUint16(local + 28, true);
    const data = new Uint8Array(buf, local + 30 + lNameLen + lExtraLen, csize);
    if (method === 0) out[name] = dec.decode(data);
    else if (method === 8) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      out[name] = await new Response(stream).text();
    }
  }
  return out;
}

const xmlText = (s) => s.replace(/<[^>]+>/g, "")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d))).replace(/&amp;/g, "&");

// DOCX: akapity, tabulatory i tabele (komórki rozdzielone " | ")
async function docxText(buf) {
  const files = await unzip(buf, n => n === "word/document.xml" || /^word\/(footnotes|endnotes)\.xml$/.test(n));
  const doc = files["word/document.xml"];
  if (!doc) throw new Error("brak treści dokumentu (word/document.xml)");
  // Tabele najpierw: wiersz = jedna linia, komórki rozdzielone " | ", akapity w komórce spacją
  const tables = (xml) => xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, (tbl) =>
    [...tbl.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map(tr =>
      [...tr[0].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)].map(tc => xmlText(tc[1].replace(/<\/w:p>/g, " ")).replace(/\s+/g, " ").trim()).join(" | ")
    ).join("\n") + "\n");
  const conv = (xml) => xmlText(tables(xml)
    .replace(/<w:tab\/>/g, "\t").replace(/<w:br[^>]*\/>/g, "\n").replace(/<\/w:p>/g, "\n"));
  let text = conv(doc);
  for (const k of ["word/footnotes.xml", "word/endnotes.xml"]) if (files[k]) text += "\n\nPRZYPISY:\n" + conv(files[k]);
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// XLSX: każdy arkusz jako tabela z tabulatorami (wartości wyliczone, bez formuł)
async function xlsxText(buf) {
  const files = await unzip(buf, n => n === "xl/workbook.xml" || n === "xl/sharedStrings.xml" || n === "xl/_rels/workbook.xml.rels" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  const shared = [...(files["xl/sharedStrings.xml"] || "").matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map(m => xmlText([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join("")));
  const rels = Object.fromEntries([...(files["xl/_rels/workbook.xml.rels"] || "").matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map(m => [m[1], m[2].replace(/^\/?xl\//, "")]));
  const sheets = [...(files["xl/workbook.xml"] || "").matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)]
    .map(m => ({ name: xmlText(m[1]), file: "xl/" + (rels[m[2]] || "") }));
  const list = sheets.length ? sheets : Object.keys(files).filter(k => k.startsWith("xl/worksheets/")).sort().map((file, i) => ({ name: `Arkusz ${i + 1}`, file }));
  const out = [];
  for (const sh of list) {
    const xml = files[sh.file];
    if (!xml) continue;
    const rows = [];
    for (const r of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [];
      for (const c of r[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = c[1], inner = c[2] || "";
        const col = (attrs.match(/r="([A-Z]+)\d+"/) || [])[1];
        const idx = col ? [...col].reduce((s, ch) => s * 26 + ch.charCodeAt(0) - 64, 0) - 1 : cells.length;
        const t = (attrs.match(/t="([^"]+)"/) || [])[1];
        const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        let val = "";
        if (t === "s") val = shared[Number(v)] ?? "";
        else if (t === "inlineStr") val = xmlText((inner.match(/<is>([\s\S]*?)<\/is>/) || ["", ""])[1]);
        else if (t === "b") val = v === "1" ? "TAK" : "NIE";
        else val = v != null ? xmlText(v) : "";
        while (cells.length < idx) cells.push("");
        cells[idx] = val.replace(/\s+/g, " ").trim();
      }
      if (cells.some(Boolean)) rows.push(cells.join("\t"));
      if (rows.length >= 3000) { rows.push("(dalsze wiersze pominięte)"); break; }
    }
    if (rows.length) out.push(`ARKUSZ: ${sh.name}\n${rows.join("\n")}`);
  }
  if (!out.length) throw new Error("arkusz nie zawiera danych");
  return out.join("\n\n");
}

// CSV i TXT: UTF-8, a gdy pojawią się znaki zastępcze, kodowanie Windows-1250 (eksport z polskiego Excela)
function plainText(buf) {
  let t = new TextDecoder("utf-8").decode(buf);
  if (t.includes("�")) { try { t = new TextDecoder("windows-1250").decode(buf); } catch (e) { /* zostaje UTF-8 */ } }
  return t.replace(/^﻿/, "");
}

const b64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const clip = (t) => t.length > MAT_LIMITS.textChars ? t.slice(0, MAT_LIMITS.textChars) + `\n(... tekst skrócony do ${MAT_LIMITS.textChars} znaków)` : t;

// Plik -> pozycja materiałów {id, name, kind: "pdf"|"text", size, data|text, chars}
export async function readMaterialFile(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (["doc", "xls", "ppt"].includes(ext)) throw new Error(`${file.name}: stary format .${ext}; zapisz plik jako .${ext}x albo PDF`);
  if (!["pdf", "docx", "xlsx", "csv", "txt", "md"].includes(ext)) throw new Error(`${file.name}: obsługiwane są PDF, DOCX, XLSX, CSV i TXT`);
  const limit = ext === "pdf" ? MAT_LIMITS.pdf : MAT_LIMITS.text;
  if (file.size > limit) throw new Error(`${file.name}: za duży (limit ${limit / 1024 / 1024} MB)`);
  const buf = await file.arrayBuffer();
  const base = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: file.name, size: file.size, source: "plik" };
  if (ext === "pdf") return { ...base, kind: "pdf", data: b64(buf) };
  const text = ext === "docx" ? await docxText(buf) : ext === "xlsx" ? await xlsxText(buf) : plainText(buf);
  if (!text.trim()) throw new Error(`${file.name}: plik nie zawiera tekstu`);
  return { ...base, kind: "text", text: clip(text), chars: text.length, format: ext.toUpperCase() };
}

// Link -> pozycja materiałów (Worker pobiera stronę albo PDF)
export async function fetchMaterialLink(url) {
  const res = await apiFetch(`${API}/page`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, external: true }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const why = { "url-not-allowed": "niedozwolony adres", "redirect-outside": "przekierowanie na niedozwolony adres", "no-content": "nie znaleziono treści na stronie", "pdf-too-large": "PDF większy niż 15 MB", "unsupported-type": "to nie strona ani PDF", "fetch-failed": "strona nie odpowiada" }[j.error] || j.error || `HTTP ${res.status}`;
    throw new Error(`${url}: ${why}`);
  }
  const base = { id: `link-${url}`, name: j.title || url, url: j.url || url, source: "link" };
  return j.kind === "pdf" ? { ...base, kind: "pdf", data: j.data } : { ...base, kind: "text", text: j.text, format: "STRONA" };
}

export const parseLinks = (text) => [...new Set(String(text || "").split(/\s+/).map(s => s.trim()).filter(s => /^https?:\/\/\S+\.\S+/i.test(s)))].slice(0, MAT_LIMITS.links);
export const sizeMB = (n) => `${(n / 1024 / 1024).toFixed(n > 1024 * 1024 ? 1 : 2)} MB`;

// Bloki treści dla modelu: dokumenty PDF i teksty z oznaczeniem źródła
export function materialBlocks(items) {
  const blocks = [];
  for (const m of items) {
    const label = m.source === "link" ? `[Link: ${m.name} (${m.url})]` : `[Plik ${m.format || "PDF"}: ${m.name}]`;
    if (m.kind === "pdf") {
      blocks.push({ type: "text", text: label });
      blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: m.data }, title: m.name.slice(0, 200) });
    } else {
      blocks.push({ type: "text", text: `${label}\n${m.text}` });
    }
  }
  return blocks;
}
