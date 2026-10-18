// === Lemoné Blog Studio v4.11 - moduł Scenariusz (wszystkie formaty wideo) ===
// Rodzaje pogrupowane według kanału: YouTube (filmy długie 16:9), YouTube Shorts, rolki Instagram
// i TikTok, Stories, reklama wideo, współprace z influencerami. Format (long, short, shorts,
// stories, ad) wyznacza sekcje wyniku i tabelę scenariusza. Każdy rodzaj ma własny prompt matkę z historią wersji widoczną
// dla wszystkich (Worker /prompts/<nazwa>; domyślne w src/prompts/).
// Generacja w częściach (pełny scenariusz z tabelą nie mieści się w jednej odpowiedzi).
// Tekst do promptera/lektora składamy z kolumny wypowiedzi tabeli scenariusza: zawsze zgodny,
// odświeżany przy każdym zapisie. Scenariusze (Worker /scripts) widzą i edytują wszyscy.

import { useState, useEffect, useRef } from "react";
import { Clapperboard, Loader2, AlertCircle, RefreshCw, Save, ArrowLeft, Code2, Eye, History, RotateCcw, Download, Sparkles, CheckCircle2, Circle, XCircle, Plus, X, Users } from "lucide-react";
import theme, { ui } from "./theme.js";
import { apiFetch } from "./auth.jsx";
import { sanitizeHtml, CopyButton, useRegistry, RegistryToolbar, RegistryRow } from "./shared.jsx";
import { callModel, CostMeter, MODELS, DEFAULT_MODEL, SEARCH_DEPTH, stripFences } from "./generator.jsx";
import { SCENARIUSZ_PROMPT_DEFAULT, SCENARIUSZ_FIELDS } from "./prompts/scenariusz.js";
import { ROLKI, rolkaFields } from "./prompts/rolki.js";
import { FORMATY, formatFields } from "./prompts/formaty.js";
import { humanizeHtml, loadAntiSlopRules, ANTI_SLOP_PROMPT } from "./humanize.js";
import { ANTI_SLOP_DEFAULT } from "./prompts/antiSlop.js";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const fmt = (iso) => iso ? new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : "";
const today = () => new Date().toISOString().slice(0, 10);
const usdFmt = (n) => (Number(n) || 0).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Sekcje wyniku per format; tabela scenariusza -> sekcja tekstu do promptera
const FORMATS = {
  long: {
    data: "DANE DO FILMU",
    sections: {
      A: "A. KRÓTKI BRIEF", B: "B. TYTUŁY I MINIATURY", C: "C. DWA WARIANTY OTWARCIA", D: "D. PEŁNY SCENARIUSZ",
      E: "E. TEKST DO PROMPTERA", F: "F. PAKIET PUBLIKACYJNY", G: "G. KONTROLA JAKOŚCI", H: "H. PLAN OCENY PO PUBLIKACJI",
    },
    table: "D", prompter: "E", publish: null,
    tableHead: "<th>Czas (orientacyjny)</th><th>Tekst lekarza</th><th>Obraz, plansza lub napis</th><th>Źródło lub uwaga do weryfikacji</th>",
  },
  short: {
    data: "DANE DO ROLKI",
    sections: {
      A: "A. BRIEF", B: "B. TRZY WARIANTY HOOKA", C: "C. SCENARIUSZ", D: "D. TEKST DO PROMPTERA LUB LEKTORA",
      E: "E. OPIS I HASHTAGI", F: "F. KONTROLA ZGODNOŚCI", G: "G. PLAN OCENY",
    },
    table: "C", prompter: "D", publish: "E",
    tableHead: "<th>Czas</th><th>Tekst mówiony lub lektor</th><th>Ujęcie i obraz</th><th>Napis na ekranie</th>",
  },
  shorts: {
    data: "DANE DO SHORTA",
    sections: {
      A: "A. BRIEF", B: "B. TRZY WARIANTY HOOKA", C: "C. SCENARIUSZ", D: "D. TEKST DO PROMPTERA LUB LEKTORA",
      E: "E. TYTUŁ, OPIS I POWIĄZANY FILM", F: "F. KONTROLA ZGODNOŚCI", G: "G. PLAN OCENY",
    },
    table: "C", prompter: "D", publish: "E",
    tableHead: "<th>Czas</th><th>Tekst mówiony lub lektor</th><th>Ujęcie i obraz</th><th>Napis na ekranie</th>",
  },
  stories: {
    data: "DANE DO STORIES",
    sections: {
      A: "A. BRIEF", B: "B. TRZY POMYSŁY NA PIERWSZĄ PLANSZĘ", C: "C. SEKWENCJA PLANSZ", D: "D. TEKST DO NAGRANIA",
      E: "E. NAKLEJKI, LINK I WYRÓŻNIONE", F: "F. KONTROLA ZGODNOŚCI", G: "G. PLAN OCENY",
    },
    table: "C", prompter: "D", publish: "E",
    tableHead: "<th>Plansza i czas</th><th>Tekst mówiony lub lektor</th><th>Obraz</th><th>Napis i naklejka</th>",
  },
  ad: {
    data: "DANE DO REKLAMY",
    sections: {
      A: "A. BRIEF KAMPANII", B: "B. TRZY HOOKI DO TESTU A/B", C: "C. SCENARIUSZ", D: "D. TEKST LEKTORA",
      E: "E. TEKSTY REKLAMY I WERSJE FORMATÓW", F: "F. KONTROLA ZGODNOŚCI I ZASAD PLATFORM", G: "G. PLAN TESTU",
    },
    table: "C", prompter: "D", publish: "E",
    tableHead: "<th>Czas</th><th>Tekst lektora</th><th>Ujęcie i obraz</th><th>Napis na ekranie</th>",
  },
};
const isLong = (format) => format === "long";

// Kanały (kolejność w liście rodzajów)
const GROUPS = {
  youtube: "YouTube: filmy długie 16:9",
  shorts: "YouTube Shorts 9:16",
  rolki: "Rolki Instagram i TikTok 9:16",
  stories: "Stories Instagram i Facebook",
  reklama: "Reklama wideo (kampanie płatne)",
  influencer: "Współprace z influencerami",
};

const ROLKA_SPEC = { proporcje: "9:16", dlugosc: "30-45 s", platformy: "Instagram Reels, TikTok, YouTube Shorts" };

export const KINDS = {
  "lekarz-yt": {
    label: "Klinika: film edukacyjny z lekarzem", cel: "klinika", group: "youtube", format: "long", promptName: "scenariusz",
    defaultPrompt: SCENARIUSZ_PROMPT_DEFAULT, fields: SCENARIUSZ_FIELDS, webSearch: true, source: "src/prompts/scenariusz.js",
    opis: "Lekarz odpowiada na jedno pytanie widza: rzetelna edukacja zdrowotna z weryfikacją w źródłach, tytułami, miniaturami i tekstem do promptera.",
    spec: { proporcje: "16:9", dlugosc: "8-15 min", platformy: "YouTube" },
  },
  ...Object.fromEntries(Object.entries(FORMATY).map(([k, v]) => [k, {
    ...v, promptName: k, defaultPrompt: v.prompt, fields: formatFields(k), webSearch: !!v.webSearch, source: "src/prompts/formaty.js",
  }])),
  ...Object.fromEntries(Object.entries(ROLKI).map(([k, v]) => [k, {
    label: v.label, cel: v.cel, group: v.group || "rolki", format: "short", promptName: k, defaultPrompt: v.prompt, fields: rolkaFields(k),
    webSearch: !!v.webSearch, source: "src/prompts/rolki.js", spec: ROLKA_SPEC,
    opis: v.group === "influencer"
      ? "Brief dla twórcy i propozycja scenariusza rolki na jego profilu: przekazy obowiązkowe, zakazy, oznaczenie współpracy."
      : "Rolka pionowa nagrywana telefonem przez zespół: hook w pierwszych sekundach, jeden przekaz, napisy na każdej scenie.",
  }])),
};
const kindOf = (k) => KINDS[k] || KINDS["lekarz-yt"];

function lsGet(key, fallback = "") {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

async function api(path, body) {
  const res = await apiFetch(API + path, body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : undefined);
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
  return j;
}

// Zasady pracy w aplikacji: dokładane do promptu matki (który edytuje redakcja), nie zastępują go
function appRules(format) {
  const S = FORMATS[format].sections;
  return `TRYB PRACY APLIKACJI (obowiązuje obok promptu powyżej):
- To nie jest rozmowa: NIE zadawaj pytań. Braki uzupełnij rozsądnymi założeniami i wypisz je w briefie (A); kwestie do rozstrzygnięcia przed nagraniem wypisz w sekcji kontroli.
- Wynik generujesz w częściach; w każdej odpowiedzi zwracaj WYŁĄCZNIE część, o którą proszę.
- Format: czysty HTML (h2, h3, p, ul, ol, li, strong, em, table, thead, tbody, tr, th, td, a), bez markdown i bez komentarzy.
- Nagłówki sekcji dokładnie w tej postaci: ${Object.values(S).map(s => `<h2>${s}</h2>`).join(", ")}.
- Nigdy nie używaj myślnika ani półpauzy; wyłącznie zwykły dywiz "-". Zakresy liczbowe bez spacji: "20-30 sekund".
- Dzisiejsza data: ${today()}.`;
}

function inputsBlock(kind, inputs, ownPages) {
  const K = kindOf(kind);
  const own = ownPages?.length
    ? `\n\nTREŚĆ NASZYCH STRON (z podanych linków; fakty o produkcie lub usłudze bierz stąd):\n${ownPages.map((p, i) => `[${i + 1}] ${p.title} (${p.url})\n${p.text.slice(0, 6000)}`).join("\n\n")}`
    : "";
  return `WYPEŁNIONE ${FORMATS[K.format].data} (puste pole = wartość domyślna z promptu albo Twoja propozycja):\n`
    + K.fields.map(f => `• ${f.label}: ${(inputs[f.key] || "").trim() || "(brak)"}`).join("\n") + own;
}

// Druga połowa scenariusza to same wiersze <tr>; dokładamy je przed zamknięciem tabeli z pierwszej połowy
export function joinTableHalves(half1, half2) {
  const rows = (String(half2).match(/<tr[\s\S]*?<\/tr>/gi) || []).filter(r => !/<th[\s>]/i.test(r)).join("\n");
  if (!rows) throw new Error("druga połowa scenariusza nie zawiera wierszy tabeli");
  const end = half1.lastIndexOf("</table>");
  if (end < 0) return `${half1}\n<table><tbody>${rows}</tbody></table>`;
  const tb = half1.lastIndexOf("</tbody>", end);
  const at = tb >= 0 && !/<tr/i.test(half1.slice(tb, end)) ? tb : end;
  return half1.slice(0, at) + rows + "\n" + half1.slice(at);
}

// Tekst do promptera z kolumny wypowiedzi tabeli scenariusza; zastępuje albo wstawia jego sekcję
export function rebuildPrompter(html, format = "long") {
  const F = FORMATS[format];
  const d = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = d.getElementById("root");
  const h2s = [...root.querySelectorAll("h2")];
  const find = (key) => h2s.find(h => h.textContent.trim().toUpperCase().startsWith(key + "."));
  const hT = find(F.table);
  if (!hT) return html;
  let table = null;
  for (let el = hT.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) {
    table = el.tagName === "TABLE" ? el : el.querySelector?.("table");
    if (table) break;
  }
  if (!table) return html;
  const lines = [...table.querySelectorAll("tr")]
    .filter(tr => tr.querySelectorAll("td").length >= 2)
    .map(tr => tr.querySelectorAll("td")[1].textContent.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const block = d.createElement("div");
  block.innerHTML = `<h2>${F.sections[F.prompter]}</h2>` + lines.map(l => `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("");
  const hP = find(F.prompter);
  if (hP) {
    for (let el = hP.nextElementSibling; el && el.tagName !== "H2";) { const next = el.nextElementSibling; el.remove(); el = next; }
    hP.replaceWith(...block.childNodes);
  } else {
    // wstaw przed kolejną sekcją (litera po sekcji promptera)
    const next = String.fromCharCode(F.prompter.charCodeAt(0) + 1);
    const hN = find(next);
    if (hN) hN.before(...block.childNodes); else root.append(...block.childNodes);
  }
  return root.innerHTML;
}

const prompterText = (html, format = "long") => {
  const key = FORMATS[format].prompter;
  const d = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const h = [...d.querySelectorAll("h2")].find(x => x.textContent.trim().toUpperCase().startsWith(key + "."));
  const out = [];
  for (let el = h?.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) out.push(el.textContent.trim());
  return out.filter(Boolean).join("\n\n");
};

// Nasze strony z pola "linki": tylko lemone.pl i sklep.lemone.pl (Worker /page)
async function fetchOwnPages(text) {
  const urls = [...new Set(String(text || "").split(/\s+/).map(s => s.trim()).filter(s => /^https:\/\/(www\.)?(sklep\.)?lemone\.pl\//i.test(s)))].slice(0, 3);
  const pages = [];
  for (const url of urls) {
    const res = await apiFetch(`${API}/page`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Nie pobrano ${url}: ${j.error || res.status}`);
    pages.push({ url: j.url, title: j.title, text: j.text });
  }
  return pages;
}

// === Prompt matka danego rodzaju: wersje z serwera, domyślny z pliku ===
function usePromptNamed(name, defaultText) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = async () => {
    setData(null); setError(null);
    try { setData(await api(`/prompts/${name}`)); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, [name]); // eslint-disable-line react-hooks/exhaustive-deps
  const versions = data?.versions || [];
  const current = versions[versions.length - 1];
  return { name, defaultText, versions, current, text: current ? current.text : defaultText, version: current ? current.v : 0, setData, error, loaded: !!data };
}
const usePrompt = (kind) => { const K = kindOf(kind); return usePromptNamed(K.promptName, K.defaultPrompt); };

function KindSelect({ value, onChange, withAll = false, disabled = false }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ ...ui.input, width: "auto" }} aria-label="Rodzaj scenariusza"
      title={disabled ? "Rodzaj można zmienić po zakończeniu generacji" : ""}>
      {withAll && <option value="">Wszystkie rodzaje</option>}
      {Object.entries(GROUPS).map(([g, gl]) => (
        <optgroup key={g} label={gl}>
          {Object.entries(KINDS).filter(([, v]) => v.group === g).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export default function ScenarioModule({ shared, session }) {
  const [tab, setTab] = useState("nowy"); // nowy | lista | prompt
  const [openId, setOpenId] = useState(null);
  const [kind, setKind] = useState(() => { const k = lsGet("lemone_scen_kind", "lekarz-yt"); return KINDS[k] ? k : "lekarz-yt"; });
  const prompt = usePrompt(kind);
  const antiSlop = usePromptNamed(ANTI_SLOP_PROMPT, ANTI_SLOP_DEFAULT);
  const [promptView, setPromptView] = useState("rodzaj"); // rodzaj | humanizacja
  // v4.16: stan generacji z formularza; chroni przed utratą pracy przy zmianie rodzaju
  const [gen, setGen] = useState({ busy: false, progress: false });
  const changeKind = (k) => {
    if (k === kind) return;
    if (gen.progress && !window.confirm("Zmiana rodzaju porzuci rozpoczętą generację scenariusza (gotowe części i formularz). Kontynuować?")) return;
    setKind(k); lsSet("lemone_scen_kind", k);
  };
  const [who, setWho] = useState(() => lsGet("lemone_review_name"));
  const author = session?.email || who.trim();
  const P = theme.profile[kindOf(kind).cel];

  const tabs = [["nowy", "Nowy scenariusz"], ["lista", "Scenariusze"], ["prompt", "Prompt"]];
  return (
    <div className="fade-in" style={{ display: "grid", gap: theme.space(2) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Clapperboard size={16} color={P.accentHover} />
        <div style={{ display: "flex", background: theme.color.border, borderRadius: 8, padding: 2, gap: 2 }}>
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => { setTab(k); if (k !== "lista") setOpenId(null); }}
              style={{ border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600,
                background: tab === k ? theme.color.surface : "transparent", color: theme.color.text }}>
              {label}
            </button>
          ))}
        </div>
        {tab === "prompt" && (
          <select value={promptView} onChange={e => setPromptView(e.target.value)} style={{ ...ui.input, width: "auto" }} aria-label="Który prompt">
            <option value="rodzaj">Prompt matka rodzaju</option>
            <option value="humanizacja">Zasady humanizacji (no-ai-slop)</option>
          </select>
        )}
        {tab !== "lista" && !(tab === "prompt" && promptView === "humanizacja") && <KindSelect value={kind} onChange={changeKind} disabled={gen.busy} />}
        {gen.busy && tab !== "nowy" && (
          <button onClick={() => setTab("nowy")} style={{ ...ui.btnSecondary, padding: "5px 10px" }}><Loader2 size={13} className="spin" /> Trwa generacja: pokaż</button>
        )}
        <div style={{ flex: 1 }} />
        {!session && (
          <input value={who} onChange={e => { setWho(e.target.value); lsSet("lemone_review_name", e.target.value); }}
            style={{ ...ui.input, width: 200 }} placeholder="Twoje imię (podpis wersji)" />
        )}
        {tab !== "lista" && <span style={ui.help}>Prompt: {prompt.version ? `wersja ${prompt.version}` : "domyślny"}</span>}
      </div>

      {/* v4.16: formularz zostaje zamontowany (tylko ukryty), żeby przejście na inną zakładkę nie przerywało generacji */}
      <div style={{ display: tab === "nowy" ? "block" : "none" }}>
        <NewScenario key={kind} kind={kind} shared={shared} prompt={prompt} author={author} onActivity={setGen}
          onSaved={(id) => { setOpenId(id); setTab("lista"); }} />
      </div>
      {tab === "lista" && (openId
        ? <ScriptEditor id={openId} shared={shared} author={author} onBack={() => setOpenId(null)} />
        : <ScriptList onOpen={setOpenId} session={session} />)}
      {tab === "prompt" && (promptView === "humanizacja"
        ? <PromptEditor key="anti-slop" prompt={antiSlop} author={author} profile={P}
            title="Zasady humanizacji (no-ai-slop)" source="src/prompts/antiSlop.js"
            intro="Wspólne dla przycisku Humanizacja w artykułach i scenariuszach. Każdy zapis tworzy nową wersję w historii." />
        : <PromptEditor key={kind} prompt={prompt} author={author} profile={P}
            title={`Prompt matka: ${kindOf(kind).label}`} source={kindOf(kind).source}
            intro="Wspólny dla wszystkich. Każdy zapis tworzy nową wersję w historii; poprzednie zostają i można je przywrócić." />)}
    </div>
  );
}

// === Wybór osób na nagraniu (v4.16) ===
// Gotowe pozycje do kliknięcia + własne osoby zapamiętane w tej przeglądarce. Wartość pola to lista
// rozdzielona średnikami (trafia do promptu jak dotąd). Domyślnie lek. med. Agnieszka Tomala.
export const DEFAULT_PERSON = "lek. med. Agnieszka Tomala";
const PEOPLE = [DEFAULT_PERSON, "Influencer (twórca)", "Pracownik kliniki", "Pracownik sklepu", "Kosmetolog", "Recepcja", "Lektor (głos zza kadru)", "Pacjent (za pisemną zgodą)"];
const PEOPLE_KEY = "lemone_people_custom";
const isPeopleField = (K, f) => (f.key === "lekarz" || f.key === "wystepuje") && K.group !== "influencer";
const splitPeople = (v) => String(v || "").split(";").map(x => x.trim()).filter(Boolean);

function PeoplePicker({ value, onChange, disabled, profile: P }) {
  const [custom, setCustom] = useState(() => { try { return JSON.parse(lsGet(PEOPLE_KEY, "[]")) || []; } catch (e) { return []; } });
  const [draft, setDraft] = useState("");
  const selected = splitPeople(value);
  const all = [...PEOPLE, ...custom.filter(c => !PEOPLE.includes(c)), ...selected.filter(x => !PEOPLE.includes(x) && !custom.includes(x))];
  const toggle = (name) => onChange((selected.includes(name) ? selected.filter(x => x !== name) : [...selected, name]).join("; "));
  const saveCustom = (list) => { setCustom(list); lsSet(PEOPLE_KEY, JSON.stringify(list)); };
  const add = () => {
    const name = draft.replace(/;/g, ",").trim();
    if (!name) return;
    if (!PEOPLE.includes(name) && !custom.includes(name)) saveCustom([...custom, name]);
    if (!selected.includes(name)) onChange([...selected, name].join("; "));
    setDraft("");
  };
  const forget = (name) => { saveCustom(custom.filter(c => c !== name)); if (selected.includes(name)) toggle(name); };
  return (
    <div style={{ border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.control, padding: 10, background: theme.color.surface }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {all.map(name => {
          const on = selected.includes(name);
          const own = custom.includes(name) && !PEOPLE.includes(name);
          return (
            <span key={name} style={{ display: "inline-flex", alignItems: "center", borderRadius: theme.radius.pill, border: `1px solid ${on ? P.accent : theme.color.border}`, background: on ? P.soft : theme.color.surface }}>
              <button type="button" onClick={() => toggle(name)} disabled={disabled} aria-pressed={on}
                style={{ border: "none", background: "transparent", padding: "5px 10px", cursor: disabled ? "default" : "pointer", fontSize: theme.size.small + 0.5, fontFamily: "inherit", fontWeight: on ? 600 : 500, color: theme.color.text, display: "inline-flex", alignItems: "center", gap: 5 }}>
                {on ? <CheckCircle2 size={13} color={P.accentHover} /> : <Circle size={13} color={theme.color.textMuted} />} {name}
              </button>
              {own && !disabled && (
                <button type="button" onClick={() => forget(name)} title="Usuń z zapamiętanych" aria-label={`Usuń ${name}`}
                  style={{ border: "none", background: "transparent", padding: "0 8px 0 0", cursor: "pointer", color: theme.color.textMuted, display: "inline-flex" }}><X size={12} /></button>
              )}
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} disabled={disabled}
          style={{ ...ui.input, padding: "6px 10px" }} placeholder="Dodaj osobę, np. Joanna, pracownik sklepu (zapamiętamy ją)" />
        <button type="button" onClick={add} disabled={disabled || !draft.trim()} style={{ ...ui.btnSecondary, padding: "6px 10px", ...(disabled || !draft.trim() ? ui.btnDisabled : {}) }}><Plus size={13} /> Dodaj</button>
      </div>
      {!selected.length && <p style={{ ...ui.help, color: theme.color.danger }}>Wybierz co najmniej jedną osobę.</p>}
    </div>
  );
}

// === Okno postępu generacji (v4.16): kroki ze stanem, czas od startu, koszt ===
const mmss = (ms) => { const t = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
function ProgressPanel({ steps, stage, busy, failed, detail, startedAt, usd, profile: P }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!busy) return undefined; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [busy]);
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <div style={{ marginTop: theme.space(2), border: `1px solid ${failed ? theme.color.danger : theme.color.border}`, borderRadius: theme.radius.card, padding: "14px 16px", background: theme.color.bg }} role="status" aria-live="polite">
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <strong style={{ fontFamily: theme.font.heading, fontSize: theme.size.h3 }}>{failed ? "Generacja przerwana" : "Trwa generacja scenariusza"}</strong>
        <span style={ui.help}>krok {Math.min(done + 1, steps.length)} z {steps.length}{startedAt ? ` · czas ${mmss((busy ? now : Date.now()) - startedAt)}` : ""} · koszt {usd.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: theme.color.border, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: failed ? theme.color.danger : P.accent, transition: "width .4s ease" }} />
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
        {steps.map(s => {
          const current = s.key === stage && !s.done;
          const icon = s.done ? <CheckCircle2 size={15} color={P.accentHover} />
            : current && failed ? <XCircle size={15} color={theme.color.danger} />
            : current && busy ? <Loader2 size={15} className="spin" color={P.accentHover} />
            : <Circle size={15} color={theme.color.textMuted} />;
          return (
            <li key={s.key} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: theme.size.body, color: s.done || current ? theme.color.text : theme.color.textMuted, fontWeight: current ? 600 : 400 }}>
              <span style={{ marginTop: 2 }}>{icon}</span>
              <span style={{ flex: 1 }}>
                {s.label} <span style={{ ...ui.help, fontWeight: 400 }}>· {s.done ? "gotowe" : s.hint}</span>
                {current && detail && busy && <span style={{ display: "block", ...ui.help, margin: "2px 0 0", fontWeight: 400 }}>{detail}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {busy && <p style={{ ...ui.help, margin: "10px 0 0" }}>Możesz przełączać zakładki; generacja trwa dalej. Nie zamykaj i nie odświeżaj strony.</p>}
    </div>
  );
}

// === Nowy scenariusz: formularz rodzaju + generacja w częściach ===
function NewScenario({ kind, shared, prompt, author, onSaved, onActivity }) {
  const K = kindOf(kind);
  const F = FORMATS[K.format];
  const P = theme.profile[K.cel];
  // pole osób ma od razu wartość domyślną (lek. med. Agnieszka Tomala)
  const [inputs, setInputs] = useState(() => { const pf = K.fields.find(f => isPeopleField(K, f)); return pf ? { [pf.key]: DEFAULT_PERSON } : {}; });
  const [model, setModel] = useState(() => { const m = lsGet("lemone_scen_model", DEFAULT_MODEL); return MODELS[m] ? m : DEFAULT_MODEL; });
  const [webSearch, setWebSearch] = useState(K.webSearch);
  const [depth, setDepth] = useState(isLong(K.format) ? "standard" : "szybkie");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(null);
  const [stage, setStage] = useState(null); // klucz bieżącego kroku (okno postępu)
  const [startedAt, setStartedAt] = useState(null);
  const go = (key, text) => { setStage(key); setStep(text); };
  const [error, setError] = useState(null);
  const [costs, setCosts] = useState([]);
  const parts = useRef({}); // wyniki udanych części (ponowienie nie powtarza ich)
  const costsRef = useRef([]); // aktualna suma kosztu do zapisu (stan w zamknięciu generate jest nieaktualny)

  // Ochrona przed utratą pracy: rodzic wie o generacji (blokada zmiany rodzaju), przeglądarka ostrzega przy zamknięciu
  const hasProgress = busy || !!stage;
  useEffect(() => { onActivity && onActivity({ busy, progress: hasProgress }); }, [busy, hasProgress]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!busy) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const ready = K.fields.filter(f => f.required).every(f => (inputs[f.key] || "").trim()) && prompt.loaded;
  const track = (e) => { costsRef.current = [...costsRef.current, e]; setCosts(costsRef.current); };
  const opts = (o) => ({ model, track, ...o });
  // Ucięcie na limicie tokenów: jedno automatyczne ponowienie z niskim "effort" (myślenie modelu zjada limit),
  // zamiast odsyłać użytkownika do klikania "Generuj" w kółko
  const call = async (content, o, label) => {
    try {
      return await callModel(content, opts(o));
    } catch (e) {
      if (!/limicie tokenów/i.test(e.message) || o.effort === "low") throw e;
      setStep(`${label}: odpowiedź za długa, ponawiam z krótszym przygotowaniem...`);
      return await callModel(content, opts({ ...o, effort: "low" }));
    }
  };
  const norm = (h) => shared.normalizeDashes(stripFences(h));
  const S = F.sections;

  const generate = async () => {
    setBusy(true); setError(null);
    if (!startedAt) setStartedAt(Date.now());
    const p = parts.current;
    try {
      if (p.own === undefined) {
        if ((inputs.linki || "").trim()) go("strony", "Pobieram treść naszych stron...");
        p.own = await fetchOwnPages(inputs.linki);
      }
      const base = `${prompt.text}\n\n${appRules(K.format)}\n\n${inputsBlock(kind, inputs, p.own)}`;
      if (p.research === undefined) {
        if (webSearch) {
          go("weryfikacja", "Szukam i czytam źródła...");
          p.research = await callModel(
            `${base}\n\nCZĘŚĆ 1: tylko weryfikacja. Sprawdź w aktualnych, wiarygodnych źródłach kluczowe fakty potrzebne do tego materiału${K.promptName === "scenariusz" ? " (krok 1 promptu: SPRAWDŹ PODSTAWY)" : ""}. Zwróć zwięzłą notatkę (maks. ok. ${isLong(K.format) ? 800 : 400} słów, zwykły tekst w punktach): datę weryfikacji, ustalenia z URL źródła w nawiasie przy każdym punkcie. Bez scenariusza.`,
            opts({ maxTokens: 8000, search: true, searchUses: SEARCH_DEPTH[depth].uses, stage: "weryfikacja" }));
        } else {
          p.research = null;
        }
      }
      const research = p.research
        ? `\n\nNOTATKA WERYFIKACYJNA (źródła z wyszukiwania):\n${p.research.text}`
        : "\n\nBEZ WERYFIKACJI ONLINE: nie wymyślaj źródeł, statystyk ani badań; fakty tylko z danych i materiałów.";
      const ctx = base + research;

      if (isLong(K.format)) {
        if (!p.plan) {
          go("plan", "Piszę brief, tytuły z miniaturami i dwa warianty otwarcia...");
          p.plan = norm(await call({ cached: ctx, text: `CZĘŚĆ 2 z 4: zwróć wyłącznie sekcje A, B i C (${S.A}, ${S.B}, ${S.C}).` }, { maxTokens: 16000, effort: "medium", stage: "plan" }, "Plan"));
        }
        // Pełny scenariusz w dwóch połowach: cała tabela filmu 8-15 min z "myśleniem" modelu nie mieści się
        // w jednej odpowiedzi (limit 16 tys. tokenów); gotowa pierwsza połowa nie jest powtarzana przy ponowieniu
        if (!p.script) {
          if (!p.half1) {
            go("pol1", "Piszę otwarcie i pierwszą połowę tabeli scenariusza...");
            p.half1 = norm(await call({ cached: ctx, text: `PRZYGOTOWANE JUŻ SEKCJE A-C:\n${p.plan}\n\nCZĘŚĆ 3 z 4, PIERWSZA POŁOWA: zwróć <h2>${S.D}</h2> i tabelę <table> z wierszem nagłówka ${K.tableHead || F.tableHead}, obejmującą pierwszą połowę filmu: otwarcie wybrane w C i rozwinięcie do mniej więcej połowy długości z briefu. Zakończ na pełnym wierszu, bez zakończenia filmu i bez komentarzy.` }, { maxTokens: 16000, effort: "medium", stage: "scenariusz" }, "Scenariusz, połowa 1"));
          }
          go("pol2", "Piszę dalszą część i zakończenie...");
          const half2 = norm(await call({ cached: ctx, text: `PRZYGOTOWANE JUŻ SEKCJE A-C:\n${p.plan}\n\nPIERWSZA POŁOWA SEKCJI D (gotowa):\n${p.half1}\n\nCZĘŚĆ 3 z 4, DRUGA POŁOWA: zwróć WYŁĄCZNIE kolejne wiersze <tr> tej samej tabeli (bez <table>, bez wiersza nagłówka, bez <h2>), od miejsca, w którym kończy się pierwsza połowa, do końca filmu razem z zakończeniem. Kontynuuj czasy, nie powtarzaj wierszy.` }, { maxTokens: 16000, effort: "medium", stage: "scenariusz" }, "Scenariusz, połowa 2"));
          p.script = joinTableHalves(p.half1, half2);
        }
        if (!p.pack) {
          go("pakiet", "Piszę opis, rozdziały, kontrolę jakości i plan oceny...");
          p.pack = norm(await call({ cached: ctx, text: `PRZYGOTOWANE JUŻ SEKCJE A-D:\n${p.plan}\n${p.script}\n\nCZĘŚĆ 4 z 4: zwróć wyłącznie sekcje F, G i H (${S.F}, ${S.G}, ${S.H}). W G sprawdź rzeczywisty scenariusz z sekcji D.` }, { maxTokens: 16000, effort: "low", stage: "pakiet" }, "Pakiet"));
        }
      } else {
        if (!p.script) {
          go("scenariusz", "Piszę brief, warianty hooka i tabelę scenariusza...");
          p.plan = "";
          p.script = norm(await call({ cached: ctx, text: `CZĘŚĆ 2 z 3: zwróć wyłącznie sekcje A, B i C (${S.A}, ${S.B}, ${S.C}). Sekcja C to jedna tabela <table> z wierszem nagłówka ${K.tableHead || F.tableHead}.` }, { maxTokens: 16000, effort: "medium", stage: "scenariusz" }, "Scenariusz"));
        }
        if (!p.pack) {
          go("pakiet", "Piszę opis do publikacji, kontrolę zgodności i plan oceny...");
          p.pack = norm(await call({ cached: ctx, text: `PRZYGOTOWANE JUŻ SEKCJE A-C:\n${p.script}\n\nCZĘŚĆ 3 z 3: zwróć wyłącznie sekcje E, F i G (${S.E}, ${S.F}, ${S.G}). W F sprawdź rzeczywisty scenariusz z sekcji C.` }, { maxTokens: 16000, effort: "low", stage: "pakiet" }, "Publikacja"));
        }
      }

      go("zapis", "Zapisuję i otwieram do edycji...");
      const sourcesHtml = p.research?.sources?.length
        ? `<h2>Źródła z weryfikacji (${today()})</h2><ol>${p.research.sources.slice(0, 30).map(s => `<li><a href="${s.url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener">${(s.title || s.url).replace(/</g, "&lt;")}</a></li>`).join("")}</ol>`
        : "";
      const html = rebuildPrompter(`${p.plan || ""}\n${p.script}\n${p.pack}\n${sourcesHtml}`, K.format);
      const usd = costsRef.current.reduce((s, c) => s + c.usd, 0);
      const saved = await api("/scripts", {
        kind, title: (inputs.temat || "").trim().slice(0, 140), inputs, model, usd, promptVersion: prompt.version,
        research: p.research ? { text: p.research.text, sources: p.research.sources } : null, html, by: author,
      });
      parts.current = {};
      costsRef.current = [];
      setCosts([]); setStage(null); setStartedAt(null);
      onSaved(saved.id);
    } catch (e) {
      setError(`${e.message}. Kliknij ponownie „Generuj scenariusz”: gotowe części nie zostaną powtórzone.`);
    }
    setBusy(false); setStep(null);
  };

  const set = (k, v) => { setInputs({ ...inputs, [k]: v }); parts.current = {}; setStage(null); setStartedAt(null); setError(null); };

  // Lista kroków tego rodzaju; "gotowe" wynika z zapisanych części (ponowienie ich nie powtarza)
  const pc = parts.current;
  const steps = [
    ...((inputs.linki || "").trim() ? [{ key: "strony", label: "Treść naszych stron", hint: "kilka sekund", done: pc.own !== undefined }] : []),
    ...(webSearch ? [{ key: "weryfikacja", label: "Weryfikacja w źródłach", hint: "ok. 1 min", done: !!pc.research }] : []),
    ...(isLong(K.format) ? [
      { key: "plan", label: "Brief, tytuły i otwarcia (A-C)", hint: "ok. 1 min", done: !!pc.plan },
      { key: "pol1", label: "Pełny scenariusz: pierwsza połowa", hint: "1-2 min", done: !!pc.half1 || !!pc.script },
      { key: "pol2", label: "Pełny scenariusz: druga połowa", hint: "1-2 min", done: !!pc.script },
      { key: "pakiet", label: "Pakiet publikacyjny, kontrola, plan oceny (F-H)", hint: "ok. 1 min", done: !!pc.pack },
    ] : [
      { key: "scenariusz", label: "Brief, hooki i scenariusz (A-C)", hint: "ok. 1 min", done: !!pc.script },
      { key: "pakiet", label: "Publikacja, kontrola, plan oceny (E-G)", hint: "kilkadziesiąt sekund", done: !!pc.pack },
    ]),
    { key: "zapis", label: "Zapis i otwarcie do edycji", hint: "kilka sekund", done: false },
  ];

  return (
    <div style={ui.card}>
      <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: "0 0 4px", fontFamily: theme.font.heading }}>{K.label}</h2>
      <p style={{ fontSize: theme.size.body, color: theme.color.textSecondary, margin: "0 0 8px", maxWidth: 760 }}>{K.opis}</p>
      {K.spec && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={ui.pill(P.soft, theme.color.text)}>{GROUPS[K.group]}</span>
          <span style={ui.pill(theme.color.bg, theme.color.text)}>Proporcje: {K.spec.proporcje}</span>
          <span style={ui.pill(theme.color.bg, theme.color.text)}>Długość: {K.spec.dlugosc}</span>
          <span style={ui.pill(theme.color.bg, theme.color.text)}>Gdzie: {K.spec.platformy}</span>
        </div>
      )}
      <p style={{ ...ui.help, marginTop: 0 }}>
        Wynik: {Object.values(F.sections).map(x => x.replace(/^[A-H]\. /, "").toLowerCase()).join(", ")}. Pola wymagane oznaczono gwiazdką, reszta ma wartości domyślne.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: theme.space(2) }}>
        {K.fields.map(f => (
          <div key={f.key} style={f.rows > 2 || isPeopleField(K, f) ? { gridColumn: "1 / -1" } : undefined}>
            <label style={ui.label}>{isPeopleField(K, f) ? <><Users size={12} style={{ verticalAlign: "-1px" }} /> Kto wystąpi w nagraniu</> : f.label}{f.required ? " *" : ""}</label>
            {isPeopleField(K, f) ? (
              <PeoplePicker value={inputs[f.key]} onChange={v => set(f.key, v)} disabled={busy} profile={P} />
            ) : f.rows ? (
              <textarea value={inputs[f.key] || ""} onChange={e => set(f.key, e.target.value)} rows={f.rows} disabled={busy}
                style={{ ...ui.input, resize: "vertical" }} placeholder={f.placeholder || ""} />
            ) : (
              <input value={inputs[f.key] || ""} onChange={e => set(f.key, e.target.value)} disabled={busy}
                style={ui.input} placeholder={f.placeholder || ""} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: theme.space(2) }}>
        <select value={model} onChange={e => { setModel(e.target.value); lsSet("lemone_scen_model", e.target.value); }} style={{ ...ui.input, width: "auto" }} disabled={busy}>
          {Object.entries(MODELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: theme.size.small + 1, cursor: "pointer" }}>
          <input type="checkbox" checked={webSearch} onChange={e => setWebSearch(e.target.checked)} disabled={busy} /> Weryfikacja w źródłach (web search)
        </label>
        {webSearch && (
          <select value={depth} onChange={e => setDepth(e.target.value)} style={{ ...ui.input, width: "auto" }} disabled={busy}>
            {Object.entries(SEARCH_DEPTH).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={generate} disabled={!ready || busy} style={{ ...ui.btnPrimary(P), ...(!ready || busy ? ui.btnDisabled : {}) }}>
          {busy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} Generuj scenariusz
        </button>
      </div>
      {(busy || error) && stage && (
        <ProgressPanel steps={steps} stage={stage} busy={busy} failed={!!error && !busy} detail={step} startedAt={startedAt}
          usd={costs.reduce((sum, c) => sum + c.usd, 0)} profile={P} />
      )}
      {error && <div style={{ ...ui.banner("danger"), marginTop: 10 }}><AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}</div>}
      <CostMeter costs={costs} />
      <p style={ui.help}>{isLong(K.format) ? "Scenariusz filmu powstaje w kilka minut (pełny scenariusz w dwóch połowach)." : "Scenariusz powstaje w 1-2 minuty."} Scenariusz zapisuje się automatycznie i otwiera do edycji.</p>
    </div>
  );
}

// === Lista scenariuszy (wszystkie rodzaje): szukanie, filtr autora i rodzaju, sortowanie, usuwanie ===
function ScriptList({ onOpen, session }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const load = async () => { setError(null); try { setItems((await api("/scripts")).items); } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, []);
  const byKind = (items || []).filter(it => !filter || (it.kind || "lekarz-yt") === filter);
  const reg = useRegistry(byKind, it => [kindOf(it.kind).label]);
  // usuwa autor scenariusza albo admin (Worker sprawdza to samo); trafia do kosza
  const canDelete = (it) => session && (session.role === "admin" || session.email === it.author);
  const remove = async (id) => {
    await api(`/scripts/${id}`, { action: "delete" });
    setItems(prev => prev.filter(x => x.id !== id));
  };
  const shown = reg.shown;
  return (
    <div style={ui.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: theme.space(2), flexWrap: "wrap" }}>
        <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Scenariusze</h2>
        <div style={{ flex: 1 }} />
        <button onClick={load} style={ui.btnSecondary}><RefreshCw size={13} /> Odśwież</button>
      </div>
      <RegistryToolbar reg={reg} placeholder="Szukaj: tytuł, autor, rodzaj">
        <KindSelect value={filter} onChange={setFilter} withAll />
      </RegistryToolbar>
      {error && <div style={ui.banner("danger")}>{error}</div>}
      {!items && !error && <p style={ui.help}><Loader2 size={13} className="spin" style={{ verticalAlign: "-2px" }} /> Wczytuję...</p>}
      {items && <p style={{ ...ui.help, marginTop: 0 }}>{shown.length} z {items.length} scenariuszy{reg.filtered || filter ? " (filtr)" : ""}</p>}
      {items && shown.length === 0 && <p style={ui.help}>{reg.filtered || filter ? "Nic nie pasuje do filtra." : "Brak scenariuszy. Wygeneruj pierwszy w zakładce „Nowy scenariusz”."}</p>}
      {shown.map(it => (
        <RegistryRow key={it.id} onOpen={() => onOpen(it.id)} onDelete={canDelete(it) ? () => remove(it.id) : null}
          deleteLabel={it.title || "scenariusz bez tematu"} right={`${usdFmt(it.usd)} USD`}>
          <div style={{ fontWeight: 600 }}>{it.title || "(bez tematu)"}</div>
          <div style={{ ...ui.help, margin: "3px 0 0" }}>{kindOf(it.kind).label} · {it.author} · {fmt(it.createdAt)}{it.v > 1 ? ` · wersja ${it.v} (${fmt(it.updatedAt)})` : ""}</div>
        </RegistryRow>
      ))}
    </div>
  );
}

// === Edycja scenariusza: podgląd edytowalny albo kod HTML, wersje ===
function ScriptEditor({ id, shared, author, onBack }) {
  const [x, setX] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("preview");
  const [viewV, setViewV] = useState(null);
  const [code, setCode] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null);
  const [humanizeStep, setHumanizeStep] = useState(null);
  const [humanizeErr, setHumanizeErr] = useState(null);
  const editorRef = useRef(null);

  useEffect(() => { (async () => { try { setX(await api(`/scripts/${id}`)); } catch (e) { setError(e.message); } })(); }, [id]);
  const current = x ? x.versions[x.versions.length - 1] : null;
  const shown = x ? (x.versions.find(v => v.v === viewV) || current) : null;
  const isCurrent = shown === current;
  useEffect(() => { if (shown) { setCode(shown.html); setDirty(false); } }, [shown]);
  useEffect(() => { if (mode === "preview" && editorRef.current) editorRef.current.innerHTML = sanitizeHtml(code); }, [mode, code]);

  if (error) return <div style={ui.card}><div style={ui.banner("danger")}>{error}</div><button onClick={onBack} style={{ ...ui.btnSecondary, marginTop: 10 }}><ArrowLeft size={13} /> Lista</button></div>;
  if (!x) return <div style={ui.card}><Loader2 size={16} className="spin" /> Wczytuję scenariusz...</div>;

  const K = kindOf(x.kind);
  const F = FORMATS[K.format];
  const P = theme.profile[K.cel];
  const working = () => mode === "code" ? code : (editorRef.current ? editorRef.current.innerHTML : code);
  const switchMode = (k) => { if (k === mode) return; if (k === "code" && editorRef.current && dirty) setCode(editorRef.current.innerHTML); setMode(k); };
  const save = async () => {
    setBusy(true); setError(null);
    try {
      const html = rebuildPrompter(shared.normalizeDashes(working()), K.format);
      const updated = await api(`/scripts/${id}`, { html, by: author });
      setX(updated); setViewV(null); setDirty(false);
      setSaved(`Zapisano jako wersję ${updated.versions.length}; tekst do promptera odświeżony z tabeli.`);
      setTimeout(() => setSaved(null), 3500);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };
  // Humanizacja (no-ai-slop): tekst mówiony z tabeli i opis do publikacji; wynik = nowa wersja
  const humanize = async () => {
    setHumanizeErr(null);
    setHumanizeStep("Wczytuję zasady humanizacji...");
    try {
      const rules = await loadAntiSlopRules();
      let usd = 0;
      const res = await humanizeHtml(current.html, {
        callModel, rules, mode: "script", format: F, klinika: K.cel === "klinika",
        track: (e) => { usd += e.usd; },
        onProgress: (p) => setHumanizeStep(`Humanizacja: ${p.label} (${p.current}/${p.total})`),
      });
      if (!res.changed) { setSaved("Humanizacja nie znalazła nic do poprawy; wersja bez zmian."); }
      else {
        const html = rebuildPrompter(shared.normalizeDashes(res.html), K.format);
        const updated = await api(`/scripts/${id}`, { html, by: author });
        setX(updated); setViewV(null); setDirty(false);
        setSaved(`Humanizacja zapisana jako wersja ${updated.versions.length} (poprawione fragmenty: ${res.changed}, koszt ${usdFmt(usd)} USD). Poprzednia wersja jest w historii.`);
      }
      setTimeout(() => setSaved(null), 8000);
    } catch (e) { setHumanizeErr(`Humanizacja nie powiodła się: ${e.message}. Scenariusz bez zmian; możesz spróbować ponownie.`); }
    setHumanizeStep(null);
  };

  const download = () => {
    const blob = new Blob([`<!doctype html>\n<html lang="pl"><head><meta charset="utf-8"><title>${(x.title || "scenariusz").replace(/</g, "")}</title></head><body>\n${shown.html}\n</body></html>`], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `scenariusz-${(x.title || "film").toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi, "-").slice(0, 50)}-v${shown.v}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ display: "grid", gap: theme.space(2) }}>
      <div style={ui.card}>
        <button onClick={onBack} style={{ ...ui.btnSecondary, padding: "4px 10px", marginBottom: 10 }}><ArrowLeft size={12} /> Lista</button>
        <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: "0 0 4px", fontFamily: theme.font.heading }}>{x.title || "(bez tematu)"}</h2>
        <p style={{ ...ui.help, margin: 0 }}>
          {K.label} · {x.author} · {fmt(x.createdAt)} · model: {MODELS[x.model] || x.model || "-"} · prompt: {x.promptVersion ? `wersja ${x.promptVersion}` : "domyślny"} · koszt: {usdFmt(x.usd)} USD
          {x.inputs?.lekarz ? ` · ${x.inputs.lekarz}` : x.inputs?.wystepuje ? ` · ${x.inputs.wystepuje}` : ""}
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <CopyButton text={prompterText(shown.html, K.format)} label={`Kopiuj: ${F.sections[F.prompter].replace(/^[A-H]\. /, "").toLowerCase()}`} primary profile={P} />
        <CopyButton text={shown.html} label="Kopiuj całość (HTML)" />
        <button onClick={download} style={ui.btnSecondary}><Download size={13} /> Pobierz .html</button>
        <div style={{ flex: 1 }} />
        {x.versions.length > 1 && (
          <select value={shown.v} onChange={e => setViewV(Number(e.target.value))} style={{ ...ui.input, width: "auto" }}>
            {x.versions.map(v => <option key={v.v} value={v.v}>Wersja {v.v} ({v.by}, {fmt(v.at)}){v === current ? " · bieżąca" : ""}</option>)}
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
        <button onClick={humanize} disabled={!isCurrent || dirty || busy || !!humanizeStep}
          style={{ ...ui.btnSecondary, ...(!isCurrent || dirty || busy || humanizeStep ? ui.btnDisabled : {}) }}
          title={dirty ? "Najpierw zapisz zmiany" : isCurrent ? "Przeredaguj tekst mówiony i opis według zasad no-ai-slop (nowa wersja)" : "Humanizacja działa na bieżącej wersji"}>
          {humanizeStep ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} Humanizacja
        </button>
        <button onClick={save} disabled={!isCurrent || !dirty || busy} style={{ ...ui.btnPrimary(P), ...(!isCurrent || !dirty || busy ? ui.btnDisabled : {}) }}
          title={isCurrent ? (dirty ? "" : "Brak zmian do zapisania") : "Edytować można tylko bieżącą wersję"}>
          {busy ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Zapisz zmiany
        </button>
      </div>
      {humanizeStep && <p style={{ ...ui.help, margin: 0, color: theme.color.text }}><Loader2 size={13} className="spin" style={{ verticalAlign: "-2px" }} /> {humanizeStep}</p>}
      {saved && <div style={ui.banner("info")}>{saved}</div>}
      {humanizeErr && <div style={ui.banner("danger")}>{humanizeErr}</div>}
      {!isCurrent && <p style={{ ...ui.help, margin: 0 }}>Podgląd starszej wersji {shown.v}: tylko do odczytu.</p>}
      <p style={{ ...ui.help, margin: 0 }}>Tekst do promptera ({F.prompter}) składa się z drugiej kolumny tabeli scenariusza ({F.table}) przy każdym zapisie: poprawiaj wypowiedzi w tabeli.</p>
      <div style={{ ...ui.card, maxHeight: 760, overflow: "auto" }} className="scroll-thin scenario-doc">
        <style>{`.scenario-doc table{border-collapse:collapse;width:100%;font-size:13.5px}.scenario-doc th,.scenario-doc td{border:1px solid ${theme.color.border};padding:6px 8px;vertical-align:top;text-align:left}.scenario-doc th{background:${P.soft}}.scenario-doc h2{font-size:17px;margin:22px 0 8px}`}</style>
        {mode === "preview" ? (
          <div ref={editorRef} contentEditable={isCurrent} suppressContentEditableWarning onInput={() => setDirty(true)}
            style={{ fontSize: 14, lineHeight: 1.65, outline: "none" }} />
        ) : (
          <textarea value={code} readOnly={!isCurrent} onChange={e => { setCode(e.target.value); setDirty(true); }} spellCheck={false}
            style={{ ...ui.input, minHeight: 600, fontFamily: theme.font.mono, fontSize: 12.5, lineHeight: 1.5, resize: "vertical" }} />
        )}
      </div>
    </div>
  );
}

// === Prompt matka wybranego rodzaju: edycja, zapis jako nowa wersja, historia dla wszystkich ===
function PromptEditor({ prompt, author, profile: P, title, source, intro }) {
  const [text, setText] = useState(prompt.text);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => { setText(prompt.text); }, [prompt.text]);
  const dirty = text !== prompt.text;

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const res = await api(`/prompts/${prompt.name}`, { text, note, by: author });
      prompt.setData(res);
      setNote("");
      setSaved(`Zapisano jako wersję ${res.versions.length}. Obowiązuje od teraz.`);
      setTimeout(() => setSaved(null), 3500);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const history = [...prompt.versions].reverse();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 340px)", gap: theme.space(2), alignItems: "start" }}>
      <div style={ui.card}>
        <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: "0 0 4px", fontFamily: theme.font.heading }}>{title}</h2>
        <p style={{ ...ui.help, marginTop: 0 }}>{intro}</p>
        {prompt.error && <div style={ui.banner("danger")}>Nie wczytano historii: {prompt.error}</div>}
        {!prompt.loaded && !prompt.error && <p style={ui.help}><Loader2 size={13} className="spin" style={{ verticalAlign: "-2px" }} /> Wczytuję...</p>}
        <textarea value={text} onChange={e => setText(e.target.value)} rows={28} spellCheck={false} disabled={!prompt.loaded}
          style={{ ...ui.input, fontFamily: theme.font.mono, fontSize: 12.5, lineHeight: 1.5, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
          <input value={note} onChange={e => setNote(e.target.value)} style={{ ...ui.input, flex: 1, minWidth: 200 }} placeholder="Co zmieniono (opcjonalnie, widoczne w historii)" />
          {dirty && <button onClick={() => setText(prompt.text)} style={ui.btnSecondary}><RotateCcw size={13} /> Cofnij zmiany</button>}
          <button onClick={save} disabled={!dirty || busy || !text.trim()} style={{ ...ui.btnPrimary(P), ...(!dirty || busy ? ui.btnDisabled : {}) }}>
            {busy ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Zapisz jako nową wersję
          </button>
        </div>
        {saved && <div style={{ ...ui.banner("info"), marginTop: 10 }}>{saved}</div>}
        {error && <div style={{ ...ui.banner("danger"), marginTop: 10 }}>{error}</div>}
      </div>

      <div style={ui.card}>
        <label style={{ ...ui.label, display: "flex", alignItems: "center", gap: 6 }}><History size={13} /> Historia wersji</label>
        {history.map(v => (
          <div key={v.v} style={{ borderTop: `1px solid ${theme.color.border}`, padding: "8px 0" }}>
            <div style={{ fontSize: theme.size.small + 1 }}><strong>Wersja {v.v}</strong>{v === prompt.current ? " · bieżąca" : ""}</div>
            <div style={ui.help}>{v.by} · {fmt(v.at)}</div>
            {v.note && <div style={{ fontSize: theme.size.small + 1 }}>„{v.note}”</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={() => setPreview(preview === v.v ? null : v.v)} style={{ ...ui.btnSecondary, padding: "3px 8px", fontSize: theme.size.small }}>{preview === v.v ? "Ukryj" : "Podgląd"}</button>
              {v !== prompt.current && <button onClick={() => { setText(v.text); setNote(`Przywrócenie wersji ${v.v}`); }} style={{ ...ui.btnSecondary, padding: "3px 8px", fontSize: theme.size.small }}><RotateCcw size={11} /> Przywróć do edycji</button>}
            </div>
            {preview === v.v && <pre style={{ whiteSpace: "pre-wrap", fontSize: 11.5, maxHeight: 260, overflow: "auto", background: theme.color.bg, padding: 8, borderRadius: 6 }}>{v.text}</pre>}
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${theme.color.border}`, padding: "8px 0" }}>
          <div style={{ fontSize: theme.size.small + 1 }}><strong>Wersja domyślna</strong>{!prompt.current ? " · bieżąca" : ""}</div>
          <div style={ui.help}>z aplikacji ({source})</div>
          {prompt.current && <button onClick={() => { setText(prompt.defaultText); setNote("Przywrócenie wersji domyślnej"); }} style={{ ...ui.btnSecondary, padding: "3px 8px", fontSize: theme.size.small, marginTop: 4 }}><RotateCcw size={11} /> Przywróć do edycji</button>}
        </div>
      </div>
    </div>
  );
}
