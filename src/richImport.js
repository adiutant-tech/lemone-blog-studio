// === Import z formatowaniem (v4.23): DOCX i wklejanie z Worda / Google Docs ===
// Zachowujemy strukturę treści: nagłówki, akapity, pogrubienia, kursywy, listy (punktowane
// i numerowane), tabele (pierwszy wiersz jako nagłówek) i linki. Usuwamy wygląd: style, czcionki,
// kolory, klasy i znaczniki biurowe. Wynik trafia jeszcze przez sanitizeHtml przed zapisem.

import { unzip } from "./materials.js";

const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s) => escapeHtml(s).replace(/"/g, "&quot;");

// ---------- DOCX -> HTML
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const kids = (el, name) => el ? [...el.childNodes].filter(n => n.nodeType === 1 && (!name || n.localName === name)) : [];
const kid = (el, name) => kids(el, name)[0] || null;
const wAttr = (el, name) => el ? (el.getAttributeNS(W, name) ?? el.getAttribute("w:" + name)) : null;
const isOn = (el) => el && !["0", "false", "none"].includes(String(wAttr(el, "val") ?? "").toLowerCase());

export async function docxToHtml(buf) {
  const files = await unzip(buf, n => ["word/document.xml", "word/styles.xml", "word/numbering.xml", "word/_rels/document.xml.rels"].includes(n));
  if (!files["word/document.xml"]) throw new Error("brak treści dokumentu (word/document.xml)");
  const xml = (s) => new DOMParser().parseFromString(s, "application/xml");
  const doc = xml(files["word/document.xml"]);

  // Style akapitów: identyfikator -> poziom nagłówka (Heading 1-6, Nagłówek 1-6, Title/Tytuł)
  const headingOf = {};
  if (files["word/styles.xml"]) {
    for (const st of xml(files["word/styles.xml"]).getElementsByTagNameNS(W, "style")) {
      const id = wAttr(st, "styleId");
      const name = String(wAttr(kid(st, "name"), "val") || "").toLowerCase();
      const m = name.match(/^(?:heading|nagłówek|naglowek)\s*(\d)$/);
      if (m) headingOf[id] = Math.min(4, Number(m[1]) + 1); // nagłówek 1 -> h2 (h1 to tytuł strony)
      else if (/^(title|tytuł|tytul)$/.test(name)) headingOf[id] = 2;
    }
  }
  // Numeracja: numId -> czy lista numerowana (decimal, litery, rzymskie)
  const ordered = {};
  if (files["word/numbering.xml"]) {
    const nx = xml(files["word/numbering.xml"]);
    const abstractFmt = {};
    for (const an of nx.getElementsByTagNameNS(W, "abstractNum")) {
      const lvl = kids(an, "lvl").find(l => wAttr(l, "ilvl") === "0") || kid(an, "lvl");
      abstractFmt[wAttr(an, "abstractNumId")] = wAttr(kid(lvl, "numFmt"), "val") || "bullet";
    }
    for (const num of nx.getElementsByTagNameNS(W, "num")) {
      const fmt = abstractFmt[wAttr(kid(num, "abstractNumId"), "val")] || "bullet";
      ordered[wAttr(num, "numId")] = fmt !== "bullet" && fmt !== "none";
    }
  }
  // Linki
  const rels = {};
  if (files["word/_rels/document.xml.rels"]) {
    for (const r of xml(files["word/_rels/document.xml.rels"]).getElementsByTagName("Relationship")) rels[r.getAttribute("Id")] = r.getAttribute("Target");
  }

  const runHtml = (r) => {
    const rPr = kid(r, "rPr");
    let t = "";
    for (const n of kids(r)) {
      if (n.localName === "t") t += escapeHtml(n.textContent);
      else if (n.localName === "tab") t += " ";
      else if (n.localName === "br" || n.localName === "cr") t += "<br>";
    }
    if (!t) return "";
    if (isOn(kid(rPr, "i"))) t = `<em>${t}</em>`;
    if (isOn(kid(rPr, "b"))) t = `<strong>${t}</strong>`;
    return t;
  };
  const inlineHtml = (p) => kids(p).map(n => {
    if (n.localName === "r") return runHtml(n);
    if (n.localName === "hyperlink") {
      const inner = kids(n, "r").map(runHtml).join("");
      const href = rels[n.getAttributeNS(R, "id") || n.getAttribute("r:id")];
      return href && /^https?:\/\//i.test(href) ? `<a href="${escapeAttr(href)}">${inner}</a>` : inner;
    }
    if (n.localName === "ins" || n.localName === "smartTag" || n.localName === "sdt") return kids(n.localName === "sdt" ? kid(n, "sdtContent") : n, "r").map(runHtml).join("");
    return "";
  }).join("").replace(/(<\/strong>)(<strong>)/g, "").replace(/(<\/em>)(<em>)/g, "");

  const out = [];
  let list = null; // {tag, items[]}
  const flush = () => { if (list) { out.push(`<${list.tag}>${list.items.map(i => `<li>${i}</li>`).join("")}</${list.tag}>`); list = null; } };

  const paragraph = (p) => {
    const pPr = kid(p, "pPr");
    const html = inlineHtml(p).trim();
    const numPr = kid(pPr, "numPr");
    if (numPr && html) {
      const tag = ordered[wAttr(kid(numPr, "numId"), "val")] ? "ol" : "ul";
      if (!list || list.tag !== tag) { flush(); list = { tag, items: [] }; }
      list.items.push(html);
      return;
    }
    flush();
    if (!html) return;
    const level = headingOf[wAttr(kid(pPr, "pStyle"), "val")];
    out.push(level ? `<h${level}>${html.replace(/<\/?strong>/g, "")}</h${level}>` : `<p>${html}</p>`);
  };
  const table = (tbl) => {
    flush();
    const rows = kids(tbl, "tr").map(tr => kids(tr, "tc").map(tc => {
      const span = Number(wAttr(kid(kid(tc, "tcPr"), "gridSpan"), "val")) || 1;
      const cell = kids(tc, "p").map(inlineHtml).map(s => s.trim()).filter(Boolean).join("<br>");
      return { cell, span };
    }));
    if (!rows.length) return;
    const cellTag = (tag, c) => `<${tag}${c.span > 1 ? ` colspan="${c.span}"` : ""}>${tag === "th" ? c.cell.replace(/<\/?strong>/g, "") : c.cell}</${tag}>`;
    out.push(`<table><thead><tr>${rows[0].map(c => cellTag("th", c)).join("")}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => cellTag("td", c)).join("")}</tr>`).join("")}</tbody></table>`);
  };

  const body = doc.getElementsByTagNameNS(W, "body")[0];
  for (const n of kids(body)) {
    if (n.localName === "p") paragraph(n);
    else if (n.localName === "tbl") table(n);
    else if (n.localName === "sdt") kids(kid(n, "sdtContent")).forEach(x => x.localName === "p" ? paragraph(x) : x.localName === "tbl" ? table(x) : null);
  }
  flush();
  const html = out.join("\n");
  if (!html.trim()) throw new Error("dokument nie zawiera treści");
  return html;
}

// ---------- Wklejanie z Worda / Google Docs -> czysty HTML
const KEEP = new Set(["H1", "H2", "H3", "H4", "P", "BR", "STRONG", "EM", "UL", "OL", "LI", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "A", "BLOCKQUOTE"]);
const RENAME = { B: "STRONG", I: "EM", H1: "H2", H5: "H4", H6: "H4" };

export function cleanPastedHtml(html) {
  const d = new DOMParser().parseFromString(html, "text/html");
  const root = d.body;
  root.querySelectorAll("style, script, meta, link, title, o\\:p, xml").forEach(n => n.remove());
  // komentarze warunkowe Worda
  const walker = d.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
  const comments = []; while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach(c => c.remove());
  // Word: znaczniki punktów list (mso-list:Ignore) i akapity listowe -> <ul>/<ol>
  root.querySelectorAll("[style*='mso-list:Ignore'], [style*='mso-list: Ignore']").forEach(n => n.remove());
  let group = null;
  [...root.querySelectorAll("p")].forEach(p => {
    const cls = p.getAttribute("class") || "", st = p.getAttribute("style") || "";
    if (/MsoListParagraph/i.test(cls) || /mso-list:\s*l\d/i.test(st)) {
      const prev = p.previousElementSibling;
      if (!group || prev !== group) { group = d.createElement(/^\s*\d+[.)]/.test(p.textContent) ? "ol" : "ul"); p.before(group); }
      const li = d.createElement("li");
      li.innerHTML = p.innerHTML.replace(/^\s*(\d+[.)]|[·•o§-])\s*/, "");
      group.append(li); p.remove();
    } else group = null;
  });
  // Google Docs owija cały fragment w <b style="font-weight:normal">: to nie jest pogrubienie
  root.querySelectorAll("b, strong").forEach(b => { if (/font-weight:s*(normal|400)/i.test(b.getAttribute("style") || "") || /^docs-internal-guid/.test(b.id || "")) b.replaceWith(...b.childNodes); });
  // Google Docs: pogrubienia i kursywy w stylach <span>
  root.querySelectorAll("span").forEach(s => {
    const st = (s.getAttribute("style") || "").toLowerCase();
    let inner = s.innerHTML;
    if (/font-style:\s*italic/.test(st)) inner = `<em>${inner}</em>`;
    if (/font-weight:\s*(700|bold|[6-9]00)/.test(st)) inner = `<strong>${inner}</strong>`;
    s.insertAdjacentHTML("beforebegin", inner); s.remove();
  });
  // Rekurencyjnie: zostają tylko znaczniki treści, bez atrybutów (poza href, colspan, rowspan)
  const clean = (el) => {
    for (const n of [...el.childNodes]) {
      if (n.nodeType === 3) continue;
      if (n.nodeType !== 1) { n.remove(); continue; }
      clean(n);
      let tag = RENAME[n.tagName] || n.tagName;
      if (!KEEP.has(tag)) { n.replaceWith(...n.childNodes); continue; }
      const keep = {};
      if (tag === "A" && /^https?:\/\//i.test(n.getAttribute("href") || "")) keep.href = n.getAttribute("href");
      if ((tag === "TD" || tag === "TH") && Number(n.getAttribute("colspan")) > 1) keep.colspan = n.getAttribute("colspan");
      if ((tag === "TD" || tag === "TH") && Number(n.getAttribute("rowspan")) > 1) keep.rowspan = n.getAttribute("rowspan");
      if (tag === "A" && !keep.href) { n.replaceWith(...n.childNodes); continue; }
      const fresh = d.createElement(tag);
      Object.entries(keep).forEach(([k, v]) => fresh.setAttribute(k, v));
      fresh.append(...n.childNodes);
      n.replaceWith(fresh);
    }
  };
  clean(root);
  // Komórki i punkty list: pojedynczy akapit w środku zbędny
  root.querySelectorAll("td, th, li").forEach(c => {
    const ps = [...c.children].filter(x => x.tagName === "P");
    if (ps.length && ps.length === c.children.length) c.innerHTML = ps.map(p => p.innerHTML.trim()).filter(Boolean).join("<br>");
  });
  // Tabela bez nagłówka: pierwszy wiersz jako nagłówek
  root.querySelectorAll("table").forEach(t => {
    if (t.querySelector("th")) return;
    const first = t.querySelector("tr");
    if (!first) return;
    const head = d.createElement("thead"), tr = d.createElement("tr");
    [...first.children].forEach(td => { const th = d.createElement("th"); th.innerHTML = td.innerHTML; if (td.getAttribute("colspan")) th.setAttribute("colspan", td.getAttribute("colspan")); tr.append(th); });
    head.append(tr); first.remove(); t.prepend(head);
  });
  // Puste akapity i zbędne odstępy
  root.querySelectorAll("p, li, h2, h3, h4, strong, em").forEach(n => { if (!n.textContent.replace(/ /g, " ").trim()) n.remove(); });
  // nagłówki tabeli i śródtytuły są już wyróżnione: pogrubienie w środku zbędne
  root.querySelectorAll("th strong, h2 strong, h3 strong, h4 strong").forEach(b => b.replaceWith(...b.childNodes));
  // odstępy usuwamy tylko między blokami (spacja między </strong> a <em> to odstęp między słowami)
  return root.innerHTML.replace(/ /g, " ").replace(/(<br>\s*){3,}/g, "<br><br>")
    .replace(/(<\/?(?:p|h[2-4]|ul|ol|li|table|thead|tbody|tr|th|td|blockquote)[^>]*>)\s+(?=<)/g, "$1")
    .replace(/<\/(p|h2|h3|h4|ul|ol|table|blockquote)>/g, "</$1>\n").trim();
}
