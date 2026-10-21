// === Lemoné Writer - Rejestr artykułów i scenariuszy (tylko admin) ===
// v4.18: jedna lista dla artykułów (Worker /articles, po akceptacji autora) i scenariuszy (/scripts),
// z filtrem rodzaju; scenariusz otwiera się w tym samym edytorze, co w zakładce Scenariusz.
// Admin widzi wszystkie artykuły, edytuje je w podglądzie albo w kodzie HTML
// (każdy zapis = nowa wersja z jego podpisem), kopiuje i pobiera .html.
// Rola admin jest sprawdzana w Workerze; edytor nie dostanie danych nawet z pominięciem UI.

import { useState, useEffect, useRef } from "react";
import { Archive as ArchiveIcon, ArrowLeft, Loader2, AlertCircle, RefreshCw, Save, Download, Code2, Eye } from "lucide-react";
import theme, { ui } from "./theme.js";
import { apiFetch } from "./auth.jsx";
import { sanitizeHtml, CopyButton, useRegistry, RegistryToolbar, RegistryRow } from "./shared.jsx";
import { ScriptEditor, kindOf, KINDS } from "./scenario.jsx";
import { ExternalDocForm, EXTERNAL_KIND } from "./externalDoc.jsx";
import { FilePlus2 } from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const TYP_LABEL = { edukacyjny: "Edukacyjny", lifestylowy: "Lifestylowy", ranking: "Ranking (szkic)", klinika: "Klinika", formatowanie: "Formatowanie", [EXTERNAL_KIND]: "Artykuł zewnętrzny" };
const fmt = (iso) => iso ? new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : "";
const usd = (n) => (Number(n) || 0).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function api(path, body) {
  const res = await apiFetch(API + path, body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : undefined);
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error === "admin-only" ? "Rejestr jest dostępny tylko dla admina." : (j.error || `HTTP ${res.status}`));
  return j;
}

const RODZAJ = { artykul: "Artykuł", scenariusz: "Scenariusz" };
// Odmiana liczebników: 1 artykuł, 2-4 artykuły, 5+ artykułów (12-14 zawsze trzecia forma)
const plural = (n, one, few, many) => n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? few : many;
const ile = (n, forms) => `${n} ${plural(n, ...forms)}`;
const typeLabel = (it) => it.rodzaj === "scenariusz"
  ? (KINDS[it.kind] ? KINDS[it.kind].label : "Scenariusz zewnętrzny")
  : (TYP_LABEL[it.typ] || it.typ);
const externalPill = <span style={ui.pill(theme.color.bg, theme.color.textSecondary)}>Dokument zewnętrzny</span>;

export default function ArchiveModule({ shared, session }) {
  const [open, setOpen] = useState(null); // {rodzaj, id}
  const [filter, setFilter] = useState(""); // filtr rodzaju zostaje po powrocie z podglądu
  if (open?.rodzaj === "scenariusz") {
    return <ScriptEditor key={open.id} id={open.id} shared={shared} author={session?.email || ""} onBack={() => setOpen(null)} />;
  }
  return open
    ? <ArticleDetail key={open.id} id={open.id} shared={shared} onBack={() => setOpen(null)} />
    : <RegistryList onOpen={setOpen} filter={filter} setFilter={setFilter} shared={shared} author={session?.email || ""} />;
}

function RegistryList({ onOpen, filter, setFilter, shared, author }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const byKind = (items || []).filter(it => !filter || (filter === "zewnetrzne" ? it.external : it.rodzaj === filter));
  const reg = useRegistry(byKind, it => [typeLabel(it), RODZAJ[it.rodzaj], it.acceptedBy, it.external ? "zewnętrzny dokument zewnętrzny" : ""]);

  const load = async () => {
    setError(null);
    try {
      const [a, s] = await Promise.all([api("/articles"), api("/scripts")]);
      setItems([
        ...a.items.map(x => ({ ...x, rodzaj: "artykul" })),
        ...s.items.map(x => ({ ...x, rodzaj: "scenariusz" })),
      ]);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  // usunięcie do kosza; z listy znika od razu (lista KV odświeża się z opóźnieniem)
  const remove = async (it) => {
    await api(`/${it.rodzaj === "scenariusz" ? "scripts" : "articles"}/${it.id}`, { action: "delete" });
    setItems(prev => prev.filter(x => !(x.id === it.id && x.rodzaj === it.rodzaj)));
  };

  const shown = reg.shown;
  const total = shown.reduce((s, it) => s + (Number(it.usd) || 0), 0);
  const count = (r) => (items || []).filter(it => (r === "zewnetrzne" ? it.external : it.rodzaj === r)).length;

  return (
    <div className="fade-in" style={ui.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: theme.space(2) }}>
        <ArchiveIcon size={16} color={theme.color.accentHover} />
        <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Rejestr</h2>
        <div style={{ flex: 1 }} />
        {!adding && <button onClick={() => setAdding(true)} style={ui.btnPrimary()}><FilePlus2 size={14} /> Dodaj dokument zewnętrzny</button>}
        <button onClick={load} style={ui.btnSecondary}><RefreshCw size={13} /> Odśwież</button>
      </div>
      {adding && (
        <ExternalDocForm shared={shared} author={author} onClose={() => setAdding(false)}
          onSaved={(doc) => { setAdding(false); onOpen(doc); }} />
      )}
      <RegistryToolbar reg={reg} placeholder="Szukaj: tytuł, autor, typ">
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...ui.input, width: "auto" }} aria-label="Rodzaj">
          <option value="">Artykuły i scenariusze</option>
          <option value="artykul">Tylko artykuły ({count("artykul")})</option>
          <option value="scenariusz">Tylko scenariusze ({count("scenariusz")})</option>
          <option value="zewnetrzne">Tylko dokumenty zewnętrzne ({count("zewnetrzne")})</option>
        </select>
      </RegistryToolbar>
      {error && <div style={ui.banner("danger")}><AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}</div>}
      {!items && !error && <p style={ui.help}><Loader2 size={13} className="spin" style={{ verticalAlign: "-2px" }} /> Wczytuję...</p>}
      {items && (
        <p style={{ ...ui.help, marginTop: 0 }}>
          {shown.length} z {ile(items.length, ["pozycji", "pozycji", "pozycji"])} ({ile(count("artykul"), ["artykuł", "artykuły", "artykułów"])}, {ile(count("scenariusz"), ["scenariusz", "scenariusze", "scenariuszy"])}){reg.filtered || filter ? " (filtr)" : ""} · łączny koszt generacji widocznych: {usd(total)} USD
        </p>
      )}
      {items && shown.length === 0 && <p style={ui.help}>{reg.filtered || filter ? "Nic nie pasuje do filtra." : "Rejestr jest pusty. Artykuły trafiają tu po akceptacji, scenariusze po zapisie."}</p>}
      {shown.map(it => (
        <RegistryRow key={`${it.rodzaj}:${it.id}`} onOpen={() => onOpen({ rodzaj: it.rodzaj, id: it.id })} onDelete={() => remove(it)}
          deleteLabel={it.title || (it.rodzaj === "scenariusz" ? "scenariusz bez tematu" : "artykuł bez tytułu")} right={`${usd(it.usd)} USD`}>
          <div style={{ fontWeight: 600, fontSize: theme.size.body, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={ui.pill(it.rodzaj === "scenariusz" ? theme.color.warningSoft : theme.color.accentSoft, theme.color.text)}>{RODZAJ[it.rodzaj]}</span>
            {it.external && externalPill}
            {it.title || "(bez tytułu)"}
          </div>
          <div style={{ ...ui.help, margin: "3px 0 0" }}>
            {typeLabel(it)} · {it.author} · {fmt(it.createdAt)}
            {it.rodzaj === "artykul" && !it.external ? (it.accepted ? ` · zaakceptował(a): ${it.acceptedBy}` : " · bez akceptacji") : ""}
            {it.v > 1 ? ` · wersja ${it.v} (edytowany ${fmt(it.updatedAt)})` : ""}
          </div>
        </RegistryRow>
      ))}
    </div>
  );
}

function ArticleDetail({ id, shared, onBack }) {
  const [a, setA] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("preview"); // preview | code
  const [viewV, setViewV] = useState(null);
  const [code, setCode] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null);
  const editorRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { setA(await api(`/articles/${id}`)); } catch (e) { setError(e.message); }
    })();
  }, [id]);

  const current = a ? a.versions[a.versions.length - 1] : null;
  const shown = a ? (a.versions.find(v => v.v === viewV) || current) : null;
  const isCurrent = shown === current;

  // `code` to roboczy HTML; podgląd ustawiany przez ref (contentEditable + VDOM gubiłoby kursor)
  useEffect(() => {
    if (!shown) return;
    setCode(shown.html);
    setDirty(false);
  }, [shown]);
  useEffect(() => {
    if (mode === "preview" && editorRef.current) editorRef.current.innerHTML = sanitizeHtml(code);
  }, [mode, code]);
  // Zmiana trybu przenosi niezapisane poprawki z podglądu do kodu
  const switchMode = (k) => {
    if (k === mode) return;
    if (k === "code" && editorRef.current && dirty) setCode(editorRef.current.innerHTML);
    setMode(k);
  };

  if (error) return (
    <div style={ui.card}>
      <div style={ui.banner("danger")}><AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}</div>
      <button onClick={onBack} style={{ ...ui.btnSecondary, marginTop: 12 }}><ArrowLeft size={13} /> Rejestr</button>
    </div>
  );
  if (!a) return <div style={ui.card}><Loader2 size={16} className="spin" /> Wczytuję artykuł...</div>;

  const P = theme.profile[a.kind] || theme.profile.sklep;
  const editedHtml = () => mode === "code" ? code : (editorRef.current ? editorRef.current.innerHTML : shown.html);
  const save = async () => {
    setBusy(true); setError(null);
    try {
      const updated = await api(`/articles/${id}`, { html: shared.normalizeDashes(editedHtml()) });
      setA(updated); setViewV(null); setDirty(false);
      setSaved(`Zapisano jako wersję ${updated.versions.length}.`);
      setTimeout(() => setSaved(null), 3000);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const download = () => {
    const blob = new Blob([`<!doctype html>\n<html lang="pl"><head><meta charset="utf-8"><title>${(a.title || "artykul").replace(/</g, "")}</title></head><body>\n${shown.html}\n</body></html>`], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${(a.title || "artykul").toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi, "-").slice(0, 60)}-v${shown.v}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="fade-in" style={{ display: "grid", gap: theme.space(2) }}>
      <div style={ui.card}>
        <button onClick={onBack} style={{ ...ui.btnSecondary, padding: "4px 10px", marginBottom: 12 }}><ArrowLeft size={12} /> Rejestr</button>
        <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: "0 0 6px", fontFamily: theme.font.heading }}>{a.title || "(bez tytułu)"}</h2>
        <p style={{ ...ui.help, margin: 0 }}>
          {TYP_LABEL[a.typ] || a.typ} · {a.external ? "dodał(a)" : "autor"}: {a.author} · {fmt(a.createdAt)}{a.external ? "" : ` · model: ${a.model || "-"} · koszt: ${usd(a.usd)} USD`}
          {a.keyword ? ` · fraza: ${a.keyword}` : ""}
        </p>
        {a.external && <p style={{ ...ui.help, color: theme.color.text, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{externalPill}{a.externalSource ? `źródło: ${a.externalSource}` : "źródło nie podane"}</p>}
        {a.accepted && (
          <p style={{ ...ui.help, color: theme.color.text }}>
            <strong>Zaakceptował(a):</strong> {a.accepted.by}, {fmt(a.accepted.at)} · checklista: {a.accepted.checks?.length || 0} pkt · piśmiennictwo: {a.accepted.sources?.length || 0}
            {a.accepted.signature ? ` · podpis: ${a.accepted.signature}` : ""}{a.accepted.via ? ` · ${a.accepted.via}` : ""}
          </p>
        )}
        {a.topic && <p style={{ ...ui.help, whiteSpace: "pre-wrap" }}><strong>Temat:</strong> {a.topic}</p>}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <CopyButton text={shown.html} label="Kopiuj HTML" primary profile={P} />
        <button onClick={download} style={ui.btnSecondary}><Download size={13} /> Pobierz .html</button>
        {a.kind !== "klinika" && a.faqItems?.length > 0 && <CopyButton text={shared.buildFaqCmsJson(a.faqItems)} label="Kopiuj JSON FAQ" />}
        {a.note && <CopyButton text={a.note} label="Kopiuj notatkę dla lekarza" />}
        <div style={{ flex: 1 }} />
        {a.versions.length > 1 && (
          <select value={shown.v} onChange={e => setViewV(Number(e.target.value))} style={{ ...ui.input, width: "auto" }}>
            {a.versions.map(v => <option key={v.v} value={v.v}>Wersja {v.v} ({v.by}, {fmt(v.at)}){v === current ? " · bieżąca" : ""}</option>)}
          </select>
        )}
        <div style={{ display: "flex", background: theme.color.border, borderRadius: 8, padding: 2, gap: 2 }}>
          {[["preview", "Podgląd", Eye], ["code", "Kod HTML", Code2]].map(([k, label, Icon]) => (
            <button key={k} onClick={() => switchMode(k)}
              style={{ border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12.5, fontFamily: "inherit",
                background: mode === k ? theme.color.surface : "transparent", display: "flex", alignItems: "center", gap: 5 }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        <button onClick={save} disabled={!isCurrent || !dirty || busy}
          style={{ ...ui.btnPrimary(P), ...(!isCurrent || !dirty || busy ? ui.btnDisabled : {}) }}
          title={isCurrent ? (dirty ? "" : "Brak zmian do zapisania") : "Edytować można tylko bieżącą wersję"}>
          {busy ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Zapisz zmiany
        </button>
      </div>
      {saved && <div style={ui.banner("info")}>{saved}</div>}
      {!isCurrent && <p style={{ ...ui.help, margin: 0 }}>Podgląd starszej wersji {shown.v}: tylko do odczytu.</p>}

      <div style={{ ...ui.card, maxHeight: 680, overflow: "auto" }} className="scroll-thin">
        {mode === "preview" ? (
          <div ref={editorRef} contentEditable={isCurrent} suppressContentEditableWarning onInput={() => setDirty(true)}
            style={{ fontSize: 14, lineHeight: 1.65, outline: "none" }} />
        ) : (
          <textarea value={code} readOnly={!isCurrent} onChange={e => { setCode(e.target.value); setDirty(true); }}
            spellCheck={false} style={{ ...ui.input, minHeight: 560, fontFamily: theme.font.mono, fontSize: 12.5, lineHeight: 1.5, resize: "vertical" }} />
        )}
      </div>

      {a.note && (
        <div style={{ ...ui.card, maxHeight: 520, overflow: "auto", background: P.soft }} className="scroll-thin">
          <p style={{ ...ui.help, margin: "0 0 10px" }}><strong>Notatka merytoryczna dla lekarza</strong></p>
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.note) }} />
        </div>
      )}
    </div>
  );
}
