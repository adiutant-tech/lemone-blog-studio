// === Dokument zewnętrzny do Rejestru (v4.22) ===
// Rejestr to baza artykułów i scenariuszy; tu dodajemy materiał spoza Writera (agencja, stary blog,
// Google Docs, Word): wklejony HTML albo zwykły tekst, z tytułem i źródłem. Zapis trafia do Workera
// (/articles albo /scripts) z flagą external i w Rejestrze ma adnotację "Dokument zewnętrzny".

import { useState, useMemo } from "react";
import { FilePlus2, Loader2, Upload, Eye, Code2, X, Save } from "lucide-react";
import theme, { ui } from "./theme.js";
import { apiFetch } from "./auth.jsx";
import { sanitizeHtml } from "./shared.jsx";
import { KINDS } from "./scenario.jsx";
import { docxToHtml, cleanPastedHtml } from "./richImport.js";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const EXTERNAL_KIND = "zewnetrzny";
export const ARTICLE_TYPES = { [EXTERNAL_KIND]: "Inny / nieokreślony", edukacyjny: "Edukacyjny", lifestylowy: "Lifestylowy", ranking: "Ranking", klinika: "Strona kliniki" };

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

// Zwykły tekst -> HTML: akapity, listy, nagłówki (#, "A. NAZWA", WIELKIE LITERY), tabele (tabulatory lub " | ")
export function textToHtml(text) {
  const blocks = String(text || "").replace(/\r\n?/g, "\n").split(/\n\s*\n/).map(b => b.replace(/^\n+|\n+$/g, "")).filter(b => b.trim());
  const out = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter(l => l.trim());
    const isList = lines.every(l => /^\s*([-*•]|\d+[.)])\s+/.test(l));
    const isTable = lines.length > 1 && lines.every(l => l.includes("\t") || l.includes(" | "));
    const one = lines.length === 1 ? lines[0].trim() : null;
    if (isTable) {
      const rows = lines.map(l => l.split(l.includes("\t") ? "\t" : " | ").map(c => c.trim()));
      out.push(`<table><thead><tr>${rows[0].map(c => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
    } else if (isList) {
      const ordered = /^\s*\d+[.)]\s+/.test(lines[0]);
      const items = lines.map(l => `<li>${inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</li>`).join("");
      out.push(ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`);
    } else if (one && /^#{1,3}\s+/.test(one)) {
      const level = one.match(/^#+/)[0].length === 1 ? 2 : one.match(/^#+/)[0].length;
      out.push(`<h${level}>${inline(one.replace(/^#+\s+/, ""))}</h${level}>`);
    } else if (one && one.length <= 90 && !/[.,;:!?]$/.test(one) && (/^[A-H]\.\s+\S/.test(one) || (one === one.toUpperCase() && /[A-ZĄĆĘŁŃÓŚŹŻ]/.test(one)))) {
      out.push(`<h2>${inline(one)}</h2>`);
    } else {
      out.push(`<p>${lines.map(inline).join("<br>")}</p>`);
    }
  }
  return out.join("\n");
}

const KIND_GROUPS = [["youtube", "YouTube"], ["shorts", "Shorts"], ["rolki", "Rolki"], ["stories", "Stories"], ["reklama", "Reklama"], ["influencer", "Influencerzy"]];

export function ExternalDocForm({ shared, author, onSaved, onClose }) {
  const [rodzaj, setRodzaj] = useState("artykul");
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("html");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [cel, setCel] = useState("sklep");
  const [typ, setTyp] = useState(EXTERNAL_KIND);
  const [kind, setKind] = useState(EXTERNAL_KIND);
  const [fixDashes, setFixDashes] = useState(true);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);

  const html = useMemo(() => {
    const raw = format === "html" ? content : textToHtml(content);
    const clean = sanitizeHtml(raw);
    return fixDashes && shared?.normalizeDashes ? shared.normalizeDashes(clean) : clean;
  }, [content, format, fixDashes, shared]);
  const ready = title.trim() && content.trim() && !busy;

  const loadFile = async (file) => {
    if (!file) return;
    setError(null);
    try {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (["html", "htm"].includes(ext)) {
        const txt = await file.text();
        const body = (txt.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [null, txt])[1];
        const t = (txt.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
        setContent(body.trim()); setFormat("html");
        if (!title.trim() && t) setTitle(t.trim());
      } else if (["txt", "md"].includes(ext)) {
        setContent(await file.text()); setFormat("text");
      } else if (ext === "docx") {
        // v4.23: DOCX z formatowaniem (nagłówki, pogrubienia, listy, tabele, linki)
        setContent(await docxToHtml(await file.arrayBuffer())); setFormat("html");
        setNote("Wczytano DOCX z formatowaniem: nagłówki, pogrubienia, listy, tabele i linki. Sprawdź w podglądzie.");
      } else {
        throw new Error("obsługiwane pliki: HTML, TXT, MD, DOCX (PDF wklej jako tekst)");
      }
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    } catch (e) { setError(`${file.name}: ${e.message}`); }
  };

  // v4.23: wklejanie z Worda / Google Docs zachowuje strukturę (HTML ze schowka, oczyszczony)
  const onPaste = (e) => {
    const rich = e.clipboardData?.getData("text/html");
    if (!rich || !/<(p|h\d|table|ul|ol|li|strong|b|span|div)\b/i.test(rich)) return; // zwykły tekst: domyślne wklejanie
    e.preventDefault();
    const clean = cleanPastedHtml(rich);
    const ta = e.target;
    const start = ta.selectionStart ?? content.length, end = ta.selectionEnd ?? content.length;
    const base = format === "html" ? content : "";
    const next = format === "html" ? base.slice(0, start) + clean + base.slice(end) : clean;
    if (format !== "html" && content.trim() && !window.confirm("Wklejany tekst ma formatowanie, więc pole przełączy się na HTML i zastąpi obecną treść. Kontynuować?")) return;
    setFormat("html"); setContent(next);
    setNote("Wklejono z formatowaniem (nagłówki, pogrubienia, listy, tabele, linki); style i kolory usunięte. Sprawdź w podglądzie.");
  };

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const common = { title: title.trim(), html, external: true, externalSource: source.trim(), by: author };
      const path = rodzaj === "artykul" ? "/articles" : "/scripts";
      const body = rodzaj === "artykul"
        ? { ...common, typ: cel === "klinika" && typ !== EXTERNAL_KIND ? "klinika" : typ, kind: cel, model: "", usd: 0 }
        : { ...common, kind, inputs: {}, model: "", usd: 0, promptVersion: 0 };
      const res = await apiFetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      onSaved({ rodzaj: rodzaj === "artykul" ? "artykul" : "scenariusz", id: j.id });
    } catch (e) { setError(`Nie zapisano: ${e.message}`); setBusy(false); }
  };

  const seg = (value, cur, set, label) => (
    <button type="button" onClick={() => set(value)} disabled={busy}
      style={{ border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600, background: cur === value ? theme.color.surface : "transparent", color: theme.color.text }}>{label}</button>
  );

  return (
    <div style={{ ...ui.card, borderColor: theme.color.accent, marginBottom: theme.space(2) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <FilePlus2 size={16} color={theme.color.accentHover} />
        <h3 style={{ margin: 0, fontFamily: theme.font.heading, fontSize: theme.size.h3 + 1 }}>Dodaj dokument zewnętrzny</h3>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} disabled={busy} style={{ ...ui.btnSecondary, padding: "4px 10px" }}><X size={13} /> Zamknij</button>
      </div>
      <p style={{ ...ui.help, marginTop: 0 }}>Artykuł albo scenariusz spoza Writera (agencja, stary blog, Google Docs, Word). Trafi do Rejestru z adnotacją „Dokument zewnętrzny”; potem można go edytować jak każdy inny.</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", background: theme.color.border, borderRadius: 8, padding: 2, gap: 2 }}>
          {seg("artykul", rodzaj, setRodzaj, "Artykuł")}
          {seg("scenariusz", rodzaj, setRodzaj, "Scenariusz")}
        </div>
        {rodzaj === "artykul" ? (
          <>
            <select value={cel} onChange={e => setCel(e.target.value)} style={{ ...ui.input, width: "auto" }} disabled={busy} aria-label="Cel">
              <option value="sklep">Sklep</option>
              <option value="klinika">Klinika</option>
            </select>
            <select value={typ} onChange={e => setTyp(e.target.value)} style={{ ...ui.input, width: "auto" }} disabled={busy} aria-label="Typ artykułu">
              {Object.entries(ARTICLE_TYPES).map(([k, v]) => <option key={k} value={k}>Typ: {v}</option>)}
            </select>
          </>
        ) : (
          <select value={kind} onChange={e => setKind(e.target.value)} style={{ ...ui.input, width: "auto" }} disabled={busy} aria-label="Rodzaj scenariusza">
            <option value={EXTERNAL_KIND}>Rodzaj: inny / nieokreślony</option>
            {KIND_GROUPS.map(([g, gl]) => (
              <optgroup key={g} label={gl}>
                {Object.entries(KINDS).filter(([, v]) => v.group === g).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </optgroup>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <div>
          <label style={ui.label}>Tytuł *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={ui.input} disabled={busy} placeholder="np. Łysienie androgenowe u kobiet: scenariusz odcinka 3" />
        </div>
        <div>
          <label style={ui.label}>Źródło (opcjonalnie)</label>
          <input value={source} onChange={e => setSource(e.target.value)} style={ui.input} disabled={busy} placeholder="np. agencja X, stary blog, Google Docs od Pani doktor, link" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "12px 0 6px" }}>
        <label style={{ ...ui.label, margin: 0 }}>Treść *</label>
        <div style={{ display: "flex", background: theme.color.border, borderRadius: 8, padding: 2, gap: 2 }}>
          {seg("html", format, setFormat, "HTML")}
          {seg("text", format, setFormat, "Tekst")}
        </div>
        <label style={{ ...ui.btnSecondary, padding: "5px 10px", cursor: busy ? "not-allowed" : "pointer" }}>
          <Upload size={13} /> Wczytaj z pliku
          <input type="file" accept=".html,.htm,.txt,.md,.docx" style={{ display: "none" }} disabled={busy} onChange={e => { loadFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => setPreview(!preview)} disabled={!content.trim()} style={{ ...ui.btnSecondary, padding: "5px 10px", ...(content.trim() ? {} : ui.btnDisabled) }}>
          {preview ? <Code2 size={13} /> : <Eye size={13} />} {preview ? "Edycja" : "Podgląd"}
        </button>
      </div>
      {preview ? (
        <div className="scenario-doc scroll-thin" style={{ border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.control, padding: "10px 12px", maxHeight: 480, overflow: "auto", fontSize: 14, lineHeight: 1.65, background: theme.color.surface }}
          dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <textarea value={content} onChange={e => setContent(e.target.value)} onPaste={onPaste} rows={14} disabled={busy} spellCheck={false}
          style={{ ...ui.input, resize: "vertical", fontFamily: format === "html" ? theme.font.mono : theme.font.body, fontSize: format === "html" ? 12.5 : 13.5, lineHeight: 1.5 }}
          placeholder={format === "html"
            ? "<h2>Śródtytuł</h2>\n<p>Akapit...</p>"
            : "Wklej tekst. Pusta linia = nowy akapit; linie od „-” albo „1.” = lista; „# Tytuł” albo „A. BRIEF” = śródtytuł; kolumny rozdzielone tabulatorem = tabela."} />
      )}
      {note && <div style={{ ...ui.banner("info"), marginTop: 8 }}>{note}</div>}
      <p style={{ ...ui.help }}>
        Najprościej: skopiuj dokument w Wordzie lub Google Docs i wklej tutaj; formatowanie i tabele zostaną. {format === "html" ? "HTML zostanie oczyszczony ze skryptów i ramek." : "Zwykły tekst zostanie zamieniony na HTML (akapity, listy, śródtytuły, tabele z tabulatorów)."} Podgląd pokazuje dokładnie to, co trafi do Rejestru.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: theme.size.small + 1, cursor: "pointer" }}>
          <input type="checkbox" checked={fixDashes} onChange={e => setFixDashes(e.target.checked)} disabled={busy} />
          Zamień myślniki i półpauzy na dywiz (zasada Lemoné)
        </label>
        <div style={{ flex: 1 }} />
        <button onClick={save} disabled={!ready} style={{ ...ui.btnPrimary(), ...(ready ? {} : ui.btnDisabled) }}>
          {busy ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Dodaj do Rejestru
        </button>
      </div>
      {error && <div style={{ ...ui.banner("danger"), marginTop: 10 }}>{error}</div>}
    </div>
  );
}
