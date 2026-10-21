// === Lemoné Blog Studio v4.11 - moduł Scenariusz (wszystkie formaty wideo) ===
// Rodzaje pogrupowane według kanału: YouTube (filmy długie 16:9), YouTube Shorts, rolki Instagram
// i TikTok, Stories, reklama wideo, współprace z influencerami. Format (long, short, shorts,
// stories, ad) wyznacza sekcje wyniku i tabelę scenariusza. Każdy rodzaj ma własny prompt matkę z historią wersji widoczną
// dla wszystkich (Worker /prompts/<nazwa>; domyślne w src/prompts/).
// Generacja w częściach (pełny scenariusz z tabelą nie mieści się w jednej odpowiedzi).
// Tekst do promptera/lektora składamy z kolumny wypowiedzi tabeli scenariusza: zawsze zgodny,
// odświeżany przy każdym zapisie. Scenariusze (Worker /scripts) widzą i edytują wszyscy.

import { useState, useEffect, useRef } from "react";
import { Clapperboard, Loader2, AlertCircle, RefreshCw, Save, ArrowLeft, Code2, Eye, History, RotateCcw, Download, Sparkles, CheckCircle2, Circle, XCircle, Plus, X, Users, Paperclip, Upload, Link2, FileText, Trash2 } from "lucide-react";
import theme, { ui } from "./theme.js";
import { apiFetch } from "./auth.jsx";
import { sanitizeHtml, CopyButton, useRegistry, RegistryToolbar, RegistryRow } from "./shared.jsx";
import { callModel, CostMeter, MODELS, DEFAULT_MODEL, SEARCH_DEPTH, stripFences, EFFORTS, DEFAULT_EFFORT } from "./generator.jsx";
import { SCENARIUSZ_PROMPT_DEFAULT, SCENARIUSZ_FIELDS } from "./prompts/scenariusz.js";
import { ROLKI, rolkaFields } from "./prompts/rolki.js";
import { FORMATY, formatFields } from "./prompts/formaty.js";
import { humanizeHtml, loadAntiSlopRules, ANTI_SLOP_PROMPT } from "./humanize.js";
import { loadVoice, voiceBlock, VOICE } from "./brandVoice.js";
import { readMaterialFile, fetchMaterialLink, parseLinks, materialBlocks, sizeMB, MAT_LIMITS, MAT_ACCEPT } from "./materials.js";
import { StageStepper, StageCard, DraftStatus, useDraftSaver, listDrafts, getDraft, deleteDraft, stageStatus, curVersion, pushVersion, pickVersion, approveStage, regenNote } from "./stages.jsx";
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
export const kindOf = (k) => KINDS[k] || KINDS["lekarz-yt"];

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

// Wypowiedzi z tabeli scenariusza (druga kolumna), do sprawdzenia, czy zapis zmienia tabelę
const tableSpoken = (html, format = "long") => {
  const F = FORMATS[format];
  const d = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const h = [...d.querySelectorAll("h2")].find(x => x.textContent.trim().toUpperCase().startsWith(F.table + "."));
  for (let el = h?.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) {
    const t = el.tagName === "TABLE" ? el : el.querySelector?.("table");
    if (t) return [...t.querySelectorAll("tr")].filter(tr => tr.querySelectorAll("td").length >= 2).map(tr => tr.querySelectorAll("td")[1].textContent.replace(/\s+/g, " ").trim()).join("\n");
  }
  return "";
};

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
  const glosKlinika = usePromptNamed(VOICE.klinika.prompt, VOICE.klinika.defaultText);
  const glosSklep = usePromptNamed(VOICE.sklep.prompt, VOICE.sklep.defaultText);
  const [promptView, setPromptView] = useState("rodzaj"); // rodzaj | humanizacja
  // v4.16: stan generacji z formularza; chroni przed utratą pracy przy zmianie rodzaju
  const [gen, setGen] = useState({ busy: false, progress: false });
  // v4.17: szkic do wznowienia (z listy "W toku") i licznik nowego startu
  const [resume, setResume] = useState(null);
  const [resetN, setResetN] = useState(0);
  const changeKind = (k) => {
    if (k === kind) return;
    if (gen.progress && !window.confirm("Rozpoczęty scenariusz zostanie zapisany jako szkic na liście „W toku” (Scenariusze), a formularz przełączy się na nowy rodzaj. Kontynuować?")) return;
    setResume(null); setResetN(n => n + 1);
    setKind(k); lsSet("lemone_scen_kind", k);
  };
  const openDraft = async (id) => {
    if (gen.busy) { window.alert("Trwa generacja etapu; poczekaj na jej koniec."); return; }
    if (gen.progress && !window.confirm("Otworzyć szkic? Bieżąca praca zostaje jako osobny szkic na liście „W toku”.")) return;
    const d = await getDraft(id);
    if (!KINDS[d.kind]) { window.alert("Nieznany rodzaj scenariusza w szkicu."); return; }
    setKind(d.kind); setResume(d); setResetN(n => n + 1); setTab("nowy"); setOpenId(null);
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
            <option value="glos-klinika">Głos marki: klinika</option>
            <option value="glos-sklep">Głos marki: sklep</option>
            <option value="humanizacja">Zasady humanizacji (no-ai-slop)</option>
          </select>
        )}
        {tab !== "lista" && !(tab === "prompt" && promptView !== "rodzaj") && <KindSelect value={kind} onChange={changeKind} disabled={gen.busy} />}
        {gen.busy && tab !== "nowy" && (
          <button onClick={() => setTab("nowy")} style={{ ...ui.btnSecondary, padding: "5px 10px" }}><Loader2 size={13} className="spin" /> Trwa generacja etapu: pokaż</button>
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
        <NewScenario key={`${kind}|${resume?.id || "nowy"}|${resetN}`} kind={kind} shared={shared} prompt={prompt} author={author} session={session}
          onActivity={setGen} resume={resume} onReset={() => { setResume(null); setResetN(n => n + 1); }}
          onSaved={(id) => { setResume(null); setResetN(n => n + 1); setOpenId(id); setTab("lista"); }} />
      </div>
      {tab === "lista" && (openId
        ? <ScriptEditor id={openId} shared={shared} author={author} onBack={() => setOpenId(null)} />
        : <ScriptList onOpen={setOpenId} session={session} onResume={openDraft} />)}
      {tab === "prompt" && (promptView === "glos-klinika" || promptView === "glos-sklep"
        ? <PromptEditor key={promptView} prompt={promptView === "glos-klinika" ? glosKlinika : glosSklep} author={author} profile={theme.profile[promptView === "glos-klinika" ? "klinika" : "sklep"]}
            title={VOICE[promptView === "glos-klinika" ? "klinika" : "sklep"].label} source="src/prompts/glosMarki.js"
            intro="Ton komunikacji marki. Trafia automatycznie do wszystkich scenariuszy i artykułów tego celu oraz do humanizacji. Każdy zapis tworzy nową wersję w historii; rozpoczęte szkice zachowują wersję z chwili startu." />
        : promptView === "humanizacja"
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

// === Nowy scenariusz etapami (v4.17) ===
// Po każdym etapie generacja się zatrzymuje: zatwierdzasz, poprawiasz ręcznie albo generujesz ponownie
// z uwagami. Film: weryfikacja, plan (Ty wybierasz tytuł i otwarcie), dwie połowy scenariusza, pakiet.
// Krótkie formy: weryfikacja, brief z hookami (Ty wybierasz hook), scenariusz, publikacja.
// Szkic zapisuje się na serwerze po każdym kroku (lista "W toku" w zakładce Scenariusze).
// Opcja "bez zatwierdzania" przechodzi wszystkie etapy od razu, jak przed v4.17.
const STAGE_META = {
  materialy: { label: "Materiały źródłowe: wyciąg", hint: "ok. 1 min" },
  weryfikacja: { label: "Weryfikacja w źródłach", hint: "ok. 1 min" },
  plan: { label: "Brief, tytuły i otwarcia (A-C)", hint: "ok. 1 min" },
  pol1: { label: "Pełny scenariusz: pierwsza połowa", hint: "1-2 min" },
  pol2: { label: "Pełny scenariusz: druga połowa i zakończenie", hint: "1-2 min" },
  brief: { label: "Brief i warianty hooka (A-B)", hint: "ok. 1 min" },
  scenariusz: { label: "Scenariusz (C)", hint: "ok. 1 min" },
  pakiet: { label: "Pakiet, kontrola i plan oceny", hint: "ok. 1 min" },
};
const CHOICE_OPTS = {
  tytul: ["rekomendacja modelu", "Zestaw 1", "Zestaw 2", "Zestaw 3"],
  otwarcie: ["rekomendacja modelu", "Wariant 1", "Wariant 2"],
  hook: ["rekomendacja modelu", "Wariant 1", "Wariant 2", "Wariant 3"],
};

function ChoiceSelect({ label, value, options, onChange, disabled }) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: theme.size.small + 1, fontWeight: 600 }}>
      {label}
      <select value={value || options[0]} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ ...ui.input, width: "auto", minWidth: 200 }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function NewScenario({ kind, shared, prompt, author, session, onSaved, onActivity, resume, onReset }) {
  const K = kindOf(kind);
  const F = FORMATS[K.format];
  const P = theme.profile[K.cel];
  const long = isLong(K.format);
  const S = F.sections;
  const d0 = resume?.data || null;

  // --- dane formularza i ustawienia
  const [inputs, setInputs] = useState(() => {
    if (d0?.inputs) return d0.inputs;
    const pf = K.fields.find(f => isPeopleField(K, f));
    return pf ? { [pf.key]: DEFAULT_PERSON } : {};
  });
  const [model, setModel] = useState(() => { const m = d0?.model || lsGet("lemone_scen_model", DEFAULT_MODEL); return MODELS[m] ? m : DEFAULT_MODEL; });
  const [webSearch, setWebSearch] = useState(d0 ? !!d0.webSearch : K.webSearch);
  const [depth, setDepth] = useState(d0?.depth || (long ? "standard" : "szybkie"));
  const [auto, setAuto] = useState(!!d0?.auto);
  // v4.21: staranność etapów pisania (plan, scenariusz, brief); pakiet i wyciąg zostają na niskiej
  const [effort, setEffort] = useState(() => { const e = d0?.effort || lsGet("lemone_scen_effort", DEFAULT_EFFORT); return EFFORTS[e] ? e : DEFAULT_EFFORT; });
  const [showForm, setShowForm] = useState(!d0);
  // v4.20: materiały źródłowe (pliki i linki); pliki żyją w tej karcie, szkic pamięta ich nazwy i linki
  const [mats, setMats] = useState([]);
  const [matLinks, setMatLinks] = useState(d0?.matLinks || "");
  const [matBusy, setMatBusy] = useState(false);
  const [matError, setMatError] = useState(null);
  const matMeta = d0?.matMeta || [];

  // --- przebieg etapami
  const [stages, setStages] = useState(d0?.stages || {});
  const [choices, setChoices] = useState(d0?.choices || {});
  const [excluded, setExcluded] = useState(d0?.excluded || []);
  const [started, setStarted] = useState(!!d0);
  const [busyKey, setBusyKey] = useState(null);
  const [failedKey, setFailedKey] = useState(null);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [selected, setSelected] = useState(null);
  const [stepStart, setStepStart] = useState(null);
  const [costs, setCosts] = useState([]);
  const [finishing, setFinishing] = useState(false);
  const saver = useDraftSaver("scenariusz", resume?.id || null);

  // Aktualny stan dla asynchronicznych kroków (stan Reacta w zamknięciu bywa nieaktualny)
  const R = useRef({});
  // Aktualizacja w miejscu (nie nowy obiekt): zapis po await, np. R.current.voice = await ..., trafia do bieżącego obiektu
  Object.assign(R.current, { inputs, model, effort, webSearch, depth, auto, choices, excluded, mats, matLinks });
  if (R.current.stages === undefined) R.current.stages = stages;
  if (R.current.own === undefined) R.current.own = d0?.own ?? null;
  if (R.current.promptSnap === undefined) R.current.promptSnap = d0?.promptText ? { text: d0.promptText, version: d0.promptVersion || 0 } : null;
  if (R.current.usd === undefined) R.current.usd = Number(d0?.usd) || 0;
  if (R.current.voice === undefined) R.current.voice = d0?.voiceText ?? null; // głos marki zapisany w szkicu (spójny w całym scenariuszu)

  const hasMaterials = mats.length > 0 || parseLinks(matLinks).length > 0 || !!stages.materialy?.versions?.length;
  const ORDER = [...(hasMaterials ? ["materialy"] : []), ...(webSearch ? ["weryfikacja"] : []), ...(long ? ["plan", "pol1", "pol2", "pakiet"] : ["brief", "scenariusz", "pakiet"])];
  const stageList = ORDER.map(k => ({ key: k, ...STAGE_META[k], ...(stages[k] || { versions: [] }) }));
  const statusOf = (s) => stageStatus(s, { runningKey: busyKey, failedKey });
  const busy = !!busyKey || finishing;
  const allApproved = started && ORDER.every(k => stages[k]?.approved);
  const nextKey = ORDER.find(k => !stages[k]?.approved);

  // Ochrona przed utratą pracy (zakładki, zmiana rodzaju, zamknięcie strony)
  useEffect(() => { onActivity && onActivity({ busy, progress: started }); }, [busy, started]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!busy) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const track = (e) => { R.current.usd += e.usd; setCosts(c => [...c, e]); };
  const callOpts = (o) => ({ model: R.current.model, track, ...o });
  // Ponowienie po ucięciu (niska staranność) robi callModel; label zostaje dla czytelności wywołań
  const call = (content, o) => callModel(content, callOpts(o));
  const norm = (h) => shared.normalizeDashes(stripFences(h));
  const cur = (k, st = R.current.stages) => curVersion(st[k])?.content;

  const stageLabel = (st) => {
    const order = ORDER;
    const n = order.find(k => !st[k]?.approved);
    if (!n) return `Wszystkie etapy zatwierdzone (${order.length}), do zapisu`;
    const i = order.indexOf(n);
    return `Etap ${i + 1} z ${order.length}: ${STAGE_META[n].label}${st[n]?.versions?.length ? (st[n].stale ? " (nieaktualny)" : " (do zatwierdzenia)") : ""}`;
  };
  const persist = (st = R.current.stages) => {
    const c = R.current;
    saver.save({
      kind, title: (c.inputs.temat || "").trim().slice(0, 140) || "(bez tematu)", stage: stageLabel(st),
      data: { kind, inputs: c.inputs, model: c.model, effort: c.effort, webSearch: c.webSearch, depth: c.depth, auto: c.auto, stages: st, choices: c.choices, excluded: c.excluded,
        own: c.own, promptText: c.promptSnap?.text, promptVersion: c.promptSnap?.version, voiceText: c.voice, usd: c.usd,
        matLinks: c.matLinks, matMeta: (c.mats || []).length ? c.mats.map(m => ({ name: m.name, size: m.size, format: m.format || "PDF" })) : matMeta },
    });
  };
  const commit = (st) => { R.current.stages = st; setStages(st); };

  // --- treść promptów
  const choicesBlock = () => {
    const c = R.current.choices;
    return long
      ? `\n\nWYBÓR REDAKCJI (obowiązuje): tytuł i miniatura: ${c.tytul || "rekomendacja z sekcji B"}; otwarcie: ${c.otwarcie || "rekomendacja z sekcji C"}${c.wlasnyTytul ? `; tytuł roboczy wpisany przez redakcję: "${c.wlasnyTytul}"` : ""}.`
      : `\n\nWYBÓR REDAKCJI (obowiązuje): hook: ${c.hook || "rekomendacja z sekcji B"}.`;
  };
  const context = () => {
    const c = R.current;
    const voice = voiceBlock(c.voice, { influencer: K.group === "influencer" });
    const base = `${c.promptSnap.text}\n\n${voice ? voice + "\n\n" : ""}${appRules(K.format)}\n\n${inputsBlock(kind, c.inputs, c.own || [])}`;
    const res = ORDER.includes("weryfikacja") ? cur("weryfikacja") : null;
    const exc = c.excluded.length ? `\nNIE KORZYSTAJ z tych źródeł (odrzucone przez redakcję): ${c.excluded.join(", ")}` : "";
    const mat = ORDER.includes("materialy") ? cur("materialy") : null;
    const matBlock = mat ? `\n\nMATERIAŁY REDAKCJI (zatwierdzony wyciąg z plików i stron; mają pierwszeństwo przed ogólną wiedzą modelu, ale twierdzenia medyczne weryfikuj):\n${mat.text}` : "";
    const research = matBlock + (res
      ? `\n\nNOTATKA WERYFIKACYJNA (zatwierdzona przez redakcję):\n${res.text}${exc}`
      : "\n\nBEZ WERYFIKACJI ONLINE: nie wymyślaj źródeł, statystyk ani badań; fakty tylko z danych i materiałów.");
    return { base: base + matBlock, ctx: base + research };
  };
  const tableHead = K.tableHead || F.tableHead;

  const generators = {
    materialy: async (r, prev) => {
      const c = R.current;
      const items = [...(c.mats || [])];
      const failed = [];
      const links = parseLinks(c.matLinks);
      for (let i = 0; i < links.length; i++) {
        setDetail(`Pobieram link ${i + 1} z ${links.length}...`);
        try { items.push(await fetchMaterialLink(links[i])); } catch (e) { failed.push(e.message); }
      }
      if (!items.length) throw new Error(failed.length ? `Nie pobrano żadnego materiału: ${failed.join("; ")}` : "brak materiałów: pliki trzeba dodać ponownie (szkic pamięta tylko ich nazwy)");
      const pdfBytes = items.filter(m => m.kind === "pdf").reduce((sum, m) => sum + m.data.length * 0.75, 0);
      if (pdfBytes > MAT_LIMITS.total) throw new Error(`PDF-y łącznie ${sizeMB(pdfBytes)}; limit ${sizeMB(MAT_LIMITS.total)}. Usuń część plików.`);
      setDetail(`Czytam materiały (${items.length})...`);
      const ask = `Przygotowujesz materiał do scenariusza: ${K.label}.
TEMAT: ${(c.inputs.temat || "").trim()}

Powyżej są materiały redakcji (pliki i strony). Zrób z nich wyciąg do pracy nad scenariuszem:
- fakty, definicje, mechanizmy, zalecenia, przeciwwskazania i cytaty warte użycia;
- dane liczbowe zawsze z kontekstem (jakiej grupy dotyczą, z jakiego okresu, z jakiego badania lub dokumentu); z arkuszy najważniejsze wartości i trendy;
- przy każdym punkcie źródło w nawiasie kwadratowym: nazwa pliku albo adres strony;
- na końcu osobno: sprzeczności między materiałami oraz rzeczy do sprawdzenia (np. stare dane, brak źródła, wnioski z jednego badania);
- nic spoza materiałów; nie oceniaj i nie dopowiadaj.
Maks. ok. 1500 słów, zwykły tekst w punktach, bez markdown. Nie używaj myślników ani półpauz, tylko dywizu "-".${regenNote(r, prev?.text)}`;
      const out = await call([...materialBlocks(items), { type: "text", text: ask }], { model: "claude-sonnet-5-5", maxTokens: 12000, effort: "low", stage: "materiały" }, "Materiały");
      return {
        text: shared.normalizeDashes(stripFences(out)),
        sources: items.map(m => ({ name: m.name, url: m.url || "", kind: m.source, format: m.format || "PDF" })),
        failed,
      };
    },
    weryfikacja: async (r, prev) => {
      const { base } = context();
      const out = await callModel(
        `${base}\n\nCZĘŚĆ 1: tylko weryfikacja. Sprawdź w aktualnych, wiarygodnych źródłach kluczowe fakty potrzebne do tego materiału${K.promptName === "scenariusz" ? " (krok 1 promptu: SPRAWDŹ PODSTAWY)" : ""}. Zwróć zwięzłą notatkę (maks. ok. ${long ? 800 : 400} słów, zwykły tekst w punktach): datę weryfikacji, ustalenia z URL źródła w nawiasie przy każdym punkcie.${ORDER.includes("materialy") ? " Sprawdź też kluczowe twierdzenia z MATERIAŁÓW REDAKCJI i oznacz te, których aktualne źródła nie potwierdzają albo które są nieaktualne." : ""} Bez scenariusza.${regenNote(r, prev?.text)}`,
        callOpts({ maxTokens: 8000, search: true, searchUses: SEARCH_DEPTH[R.current.depth].uses, stage: "weryfikacja" }));
      return { text: shared.normalizeDashes(out.text), sources: out.sources || [] };
    },
    plan: async (r, prev) => norm(await call({ cached: context().ctx, text: `CZĘŚĆ: zwróć wyłącznie sekcje A, B i C (${S.A}, ${S.B}, ${S.C}). W sekcji B ponumeruj zestawy jako "Zestaw 1", "Zestaw 2", "Zestaw 3"; w sekcji C warianty jako "Wariant 1" i "Wariant 2"; przy każdej sekcji wskaż rekomendację.${regenNote(r, prev)}` }, { maxTokens: 16000, effort: R.current.effort, stage: "plan" }, "Plan")),
    pol1: async (r, prev) => norm(await call({ cached: context().ctx, text: `ZATWIERDZONE SEKCJE A-C:\n${cur("plan")}${choicesBlock()}\n\nCZĘŚĆ: PIERWSZA POŁOWA SCENARIUSZA. Zwróć <h2>${S.D}</h2> i tabelę <table> z wierszem nagłówka ${tableHead}, obejmującą pierwszą połowę filmu: wybrane otwarcie i rozwinięcie do mniej więcej połowy długości z briefu. Zakończ na pełnym wierszu, bez zakończenia filmu i bez komentarzy.${regenNote(r, prev)}` }, { maxTokens: 16000, effort: R.current.effort, stage: "scenariusz" }, "Pierwsza połowa")),
    pol2: async (r, prev) => {
      const rows = norm(await call({ cached: context().ctx, text: `ZATWIERDZONE SEKCJE A-C:\n${cur("plan")}${choicesBlock()}\n\nZATWIERDZONA PIERWSZA POŁOWA SEKCJI D:\n${cur("pol1")}\n\nCZĘŚĆ: DRUGA POŁOWA. Zwróć WYŁĄCZNIE kolejne wiersze <tr> tej samej tabeli (bez <table>, bez wiersza nagłówka, bez <h2>), od miejsca, w którym kończy się pierwsza połowa, do końca filmu razem z zakończeniem. Kontynuuj czasy, nie powtarzaj wierszy.${regenNote(r, prev)}` }, { maxTokens: 16000, effort: R.current.effort, stage: "scenariusz" }, "Druga połowa"));
      const trs = (rows.match(/<tr[\s\S]*?<\/tr>/gi) || []).filter(x => !/<th[\s>]/i.test(x)).join("\n");
      if (!trs) throw new Error("druga połowa nie zawiera wierszy tabeli");
      return `<table><thead><tr>${tableHead}</tr></thead><tbody>${trs}</tbody></table>`;
    },
    brief: async (r, prev) => norm(await call({ cached: context().ctx, text: `CZĘŚĆ: zwróć wyłącznie sekcje A i B (${S.A}, ${S.B}). W sekcji B ponumeruj warianty jako "Wariant 1", "Wariant 2", "Wariant 3" i wskaż rekomendację.${regenNote(r, prev)}` }, { maxTokens: 12000, effort: R.current.effort, stage: "plan" }, "Brief")),
    scenariusz: async (r, prev) => norm(await call({ cached: context().ctx, text: `ZATWIERDZONE SEKCJE A-B:\n${cur("brief")}${choicesBlock()}\n\nCZĘŚĆ: zwróć wyłącznie sekcję C: <h2>${S.C}</h2> i jedną tabelę <table> z wierszem nagłówka ${tableHead}. Zrealizuj wybrany hook.${regenNote(r, prev)}` }, { maxTokens: 16000, effort: R.current.effort, stage: "scenariusz" }, "Scenariusz")),
    pakiet: async (r, prev) => {
      const body = long
        ? `ZATWIERDZONE SEKCJE A-D:\n${cur("plan")}\n${joinTableHalves(cur("pol1"), cur("pol2"))}`
        : `ZATWIERDZONE SEKCJE A-C:\n${cur("brief")}\n${cur("scenariusz")}`;
      const ask = long
        ? `CZĘŚĆ: zwróć wyłącznie sekcje F, G i H (${S.F}, ${S.G}, ${S.H}). W G sprawdź rzeczywisty scenariusz z sekcji D.`
        : `CZĘŚĆ: zwróć wyłącznie sekcje E, F i G (${S.E}, ${S.F}, ${S.G}). W F sprawdź rzeczywisty scenariusz z sekcji C.`;
      return norm(await call({ cached: context().ctx, text: `${body}${choicesBlock()}\n\n${ask}${regenNote(r, prev)}` }, { maxTokens: 16000, effort: "low", stage: "pakiet" }, "Pakiet"));
    },
  };

  // --- jeden etap: generacja (pierwsza albo ponowna z uwagami)
  const runStage = async (key, regen) => {
    setBusyKey(key); setFailedKey(null); setError(null); setDetail(null); setStepStart(Date.now()); setSelected(key);
    const usdBefore = R.current.usd;
    try {
      if (R.current.voice == null) R.current.voice = await loadVoice(K.cel);
      const prev = regen?.mode === "popraw" ? cur(key) : null;
      const content = await generators[key](regen, prev);
      const st = pushVersion(R.current.stages, key, { content, at: new Date().toISOString(), by: author, usd: R.current.usd - usdBefore, uwagi: regen?.uwagi || "", source: "model" }, ORDER);
      commit(st);
      persist(st);
      setBusyKey(null);
      return true;
    } catch (e) {
      setBusyKey(null); setFailedKey(key);
      setError(`${STAGE_META[key].label}: ${e.message}`);
      persist();
      return false;
    }
  };

  // Po zatwierdzeniu: następny etap bez wyniku generuje się sam; w trybie bez zatwierdzania idzie dalej do końca
  const advance = async () => {
    for (;;) {
      const st = R.current.stages;
      const n = ORDER.find(k => !st[k]?.approved);
      if (!n) { if (R.current.auto) await finish(); else setSelected(null); return; }
      if (!st[n]?.versions?.length) {
        const ok = await runStage(n);
        if (!ok) return;
      } else {
        setSelected(n);
        if (!R.current.auto || st[n].stale) return;
      }
      if (!R.current.auto) return;
      const a = approveStage(R.current.stages, n);
      commit(a); persist(a);
    }
  };

  const start = async () => {
    setError(null);
    R.current.promptSnap = { text: prompt.text, version: prompt.version };
    setStarted(true); setShowForm(false);
    if (R.current.own == null) {
      if ((inputs.linki || "").trim()) { setBusyKey(ORDER[0]); setDetail("Pobieram treść naszych stron..."); }
      try { R.current.own = await fetchOwnPages(inputs.linki); }
      catch (e) { setBusyKey(null); setError(e.message); setStarted(false); setShowForm(true); return; }
      setBusyKey(null);
    }
    await advance();
  };

  const approve = async (key) => {
    const st = approveStage(R.current.stages, key);
    commit(st); persist(st);
    await advance();
  };
  const regenerate = async (key, r) => { await runStage(key, r); if (R.current.auto) await advance(); };
  const edit = (key, value) => {
    const prevC = cur(key);
    const content = key === "weryfikacja" || key === "materialy" ? { ...prevC, text: shared.normalizeDashes(value) } : shared.normalizeDashes(value);
    const st = pushVersion(R.current.stages, key, { content, at: new Date().toISOString(), by: author, usd: 0, uwagi: "", source: "edycja" }, ORDER);
    commit(st); persist(st);
  };
  const pick = (key, i) => { const st = pickVersion(R.current.stages, key, i, ORDER); commit(st); persist(st); };
  // Zmiana wyboru (tytuł, otwarcie, hook, źródła): dalsze etapy z wynikiem stają się nieaktualne
  const markStaleAfter = (key) => {
    const idx = ORDER.indexOf(key);
    const st = { ...R.current.stages };
    ORDER.slice(idx + 1).forEach(k => { if (st[k]?.versions?.length) st[k] = { ...st[k], approved: false, stale: true }; });
    commit(st); return st;
  };
  const staleMaterials = () => {
    if (!R.current.stages.materialy?.versions?.length) return;
    const st = { ...R.current.stages, materialy: { ...R.current.stages.materialy, approved: false, stale: true } };
    commit(st); persist(markStaleAfter("materialy"));
  };
  const addFiles = async (fileList) => {
    setMatError(null); setMatBusy(true);
    const next = [...R.current.mats];
    const errs = [];
    for (const file of Array.from(fileList || [])) {
      try {
        const m = await readMaterialFile(file);
        const pdfTotal = [...next, m].filter(x => x.kind === "pdf").reduce((sum, x) => sum + x.size, 0);
        if (pdfTotal > MAT_LIMITS.total) { errs.push(`${file.name}: łącznie PDF-y przekroczyłyby ${sizeMB(MAT_LIMITS.total)}`); continue; }
        next.push(m);
      } catch (e) { errs.push(e.message); }
    }
    R.current.mats = next; setMats(next);
    if (errs.length) setMatError(errs.join("; "));
    setMatBusy(false);
    staleMaterials();
  };
  const removeMat = (id) => { const next = R.current.mats.filter(m => m.id !== id); R.current.mats = next; setMats(next); staleMaterials(); };
  const changeLinks = (v) => { R.current.matLinks = v; setMatLinks(v); };

  const setChoice = (k, v, afterKey) => {
    const c = { ...R.current.choices, [k]: v };
    R.current.choices = c; setChoices(c);
    persist(markStaleAfter(afterKey));
  };
  const toggleSource = (url) => {
    const ex = R.current.excluded.includes(url) ? R.current.excluded.filter(u => u !== url) : [...R.current.excluded, url];
    R.current.excluded = ex; setExcluded(ex);
    persist(markStaleAfter("weryfikacja"));
  };

  // --- zapis gotowego scenariusza
  const finish = async () => {
    setFinishing(true); setError(null);
    try {
      const res = ORDER.includes("weryfikacja") ? cur("weryfikacja") : null;
      const sources = (res?.sources || []).filter(s => !R.current.excluded.includes(s.url));
      const sourcesHtml = sources.length
        ? `<h2>Źródła z weryfikacji (${today()})</h2><ol>${sources.slice(0, 30).map(s => `<li><a href="${s.url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener">${(s.title || s.url).replace(/</g, "&lt;")}</a></li>`).join("")}</ol>`
        : "";
      const body = long
        ? `${cur("plan")}\n${joinTableHalves(cur("pol1"), cur("pol2"))}\n${cur("pakiet")}`
        : `${cur("brief")}\n${cur("scenariusz")}\n${cur("pakiet")}`;
      const matSrc = ORDER.includes("materialy") ? (cur("materialy")?.sources || []) : [];
      const matHtml = matSrc.length
        ? `<h2>Materiały redakcji</h2><ul>${matSrc.map(m => `<li>${m.url ? `<a href="${m.url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener">${m.name.replace(/</g, "&lt;")}</a>` : `${m.name.replace(/</g, "&lt;")} (${m.format})`}</li>`).join("")}</ul>`
        : "";
      const html = rebuildPrompter(`${body}\n${sourcesHtml}\n${matHtml}`, K.format);
      const c = R.current;
      const saved = await api("/scripts", {
        kind, title: (c.inputs.temat || "").trim().slice(0, 140), inputs: c.inputs, model: c.model, usd: c.usd, promptVersion: c.promptSnap?.version || 0,
        research: res ? { text: res.text, sources } : null, html, by: author,
      });
      await saver.remove();
      setFinishing(false);
      onSaved(saved.id);
    } catch (e) {
      setFinishing(false);
      setError(`Zapis scenariusza: ${e.message}`);
    }
  };

  // --- dane formularza po starcie: zmiana unieważnia wszystkie etapy
  const set = (k, v) => {
    const next = { ...inputs, [k]: v };
    R.current.inputs = next; setInputs(next);
    if (started) {
      if (k === "linki") R.current.own = null;
      const st = { ...R.current.stages };
      ORDER.forEach(x => { if (st[x]?.versions?.length) st[x] = { ...st[x], approved: false, stale: true }; });
      commit(st);
    }
  };
  const ready = K.fields.filter(f => f.required).every(f => (inputs[f.key] || "").trim()) && prompt.loaded;
  const discard = async () => {
    if (!window.confirm("Porzucić ten szkic? Zniknie z listy „W toku” (admin może go odzyskać z kosza).")) return;
    await saver.remove();
    onReset();
  };

  const shownKey = selected || (busyKey) || nextKey;
  const shown = shownKey ? stageList.find(s => s.key === shownKey) : null;
  const sources = cur("weryfikacja", stages)?.sources || [];

  const choiceBox = shown && !busy && (
    shown.key === "plan" ? (
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12, padding: 12, borderRadius: theme.radius.control, background: P.soft }}>
        <ChoiceSelect label="Tytuł i miniatura" value={choices.tytul} options={CHOICE_OPTS.tytul} onChange={v => setChoice("tytul", v, "plan")} />
        <ChoiceSelect label="Otwarcie" value={choices.otwarcie} options={CHOICE_OPTS.otwarcie} onChange={v => setChoice("otwarcie", v, "plan")} />
        <label style={{ display: "grid", gap: 4, fontSize: theme.size.small + 1, fontWeight: 600, flex: "1 1 220px" }}>
          Własny tytuł roboczy (opcjonalnie)
          <input value={choices.wlasnyTytul || ""} onChange={e => { const c = { ...R.current.choices, wlasnyTytul: e.target.value }; R.current.choices = c; setChoices(c); }}
            onBlur={() => persist(markStaleAfter("plan"))} style={ui.input} placeholder="nadpisuje wybrany zestaw" />
        </label>
      </div>
    ) : shown.key === "brief" ? (
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12, padding: 12, borderRadius: theme.radius.control, background: P.soft }}>
        <ChoiceSelect label="Hook do scenariusza" value={choices.hook} options={CHOICE_OPTS.hook} onChange={v => setChoice("hook", v, "brief")} />
      </div>
    ) : shown.key === "materialy" ? (
      <div style={{ marginTop: 12, fontSize: theme.size.small + 1 }}>
        <label style={ui.label}>Materiały w tym wyciągu</label>
        <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
          {(cur("materialy", stages)?.sources || []).map((m, i) => (
            <li key={i}>{m.url ? <a href={m.url} target="_blank" rel="noreferrer" style={{ color: theme.color.text }}>{m.name}</a> : m.name} <span style={ui.help}>({m.kind === "link" ? "link" : m.format})</span></li>
          ))}
        </ul>
        {(cur("materialy", stages)?.failed || []).length > 0 && <div style={{ ...ui.banner("warning"), marginTop: 8 }}>Nie pobrano: {cur("materialy", stages).failed.join("; ")}</div>}
      </div>
    ) : shown.key === "weryfikacja" && sources.length ? (
      <div style={{ marginTop: 12 }}>
        <label style={ui.label}>Źródła ({sources.length - excluded.filter(u => sources.some(s => s.url === u)).length} z {sources.length} w użyciu); odznacz te, których nie chcesz</label>
        <div style={{ display: "grid", gap: 4, maxHeight: 220, overflow: "auto" }} className="scroll-thin">
          {sources.map(s => (
            <label key={s.url} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: theme.size.small + 1 }}>
              <input type="checkbox" checked={!excluded.includes(s.url)} onChange={() => toggleSource(s.url)} style={{ marginTop: 3 }} />
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: theme.color.text }}>{s.title || s.url}</a>
            </label>
          ))}
        </div>
      </div>
    ) : null
  );

  return (
    <div style={{ display: "grid", gap: theme.space(2) }}>
      <div style={ui.card}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: "0 0 4px", fontFamily: theme.font.heading }}>{K.label}{started && inputs.temat ? `: ${inputs.temat.slice(0, 80)}` : ""}</h2>
            <p style={{ fontSize: theme.size.body, color: theme.color.textSecondary, margin: "0 0 8px", maxWidth: 760 }}>{K.opis}</p>
          </div>
          {started && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <DraftStatus saver={saver} />
              <button onClick={() => setShowForm(!showForm)} style={{ ...ui.btnSecondary, padding: "5px 10px" }}>{showForm ? "Ukryj dane" : "Pokaż dane"}</button>
              <button onClick={discard} disabled={busy} style={{ ...ui.btnSecondary, padding: "5px 10px", ...(busy ? ui.btnDisabled : {}) }}>Porzuć szkic</button>
            </div>
          )}
        </div>
        {K.spec && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={ui.pill(P.soft, theme.color.text)}>{GROUPS[K.group]}</span>
            <span style={ui.pill(theme.color.bg, theme.color.text)}>Proporcje: {K.spec.proporcje}</span>
            <span style={ui.pill(theme.color.bg, theme.color.text)}>Długość: {K.spec.dlugosc}</span>
            <span style={ui.pill(theme.color.bg, theme.color.text)}>Gdzie: {K.spec.platformy}</span>
          </div>
        )}
        {showForm && (
          <>
            <p style={{ ...ui.help, marginTop: 0 }}>
              Wynik: {Object.values(F.sections).map(x => x.replace(/^[A-H]\. /, "").toLowerCase()).join(", ")}. Pola wymagane oznaczono gwiazdką, reszta ma wartości domyślne.
              {started ? " Zmiana danych oznaczy gotowe etapy jako nieaktualne." : ""}
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
            <div style={{ marginTop: theme.space(2), padding: 12, border: `1px dashed ${theme.color.border}`, borderRadius: theme.radius.control }}>
              <label style={{ ...ui.label, display: "flex", alignItems: "center", gap: 6 }}><Paperclip size={13} /> Materiały źródłowe (opcjonalnie)</label>
              <p style={{ ...ui.help, marginTop: 0 }}>
                Pliki PDF, DOCX, XLSX, CSV, TXT i linki do stron z danymi medycznymi lub innymi ważnymi treściami. Pierwszy etap zrobi z nich wyciąg ze źródłami;
                po Twoim zatwierdzeniu weryfikacja w źródłach i wszystkie dalsze etapy będą go uwzględniać. PDF do {MAT_LIMITS.pdf / 1024 / 1024} MB, łącznie do {MAT_LIMITS.total / 1024 / 1024} MB.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ ...ui.btnSecondary, cursor: busy || matBusy ? "not-allowed" : "pointer", ...(busy || matBusy ? ui.btnDisabled : {}) }}>
                  {matBusy ? <Loader2 size={13} className="spin" /> : <Upload size={13} />} Dodaj pliki
                  <input type="file" multiple accept={MAT_ACCEPT} style={{ display: "none" }} disabled={busy || matBusy}
                    onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
                {mats.map(m => (
                  <span key={m.id} style={{ ...ui.pill(theme.color.bg, theme.color.text), border: `1px solid ${theme.color.border}` }}>
                    <FileText size={12} /> {m.name} <span style={ui.help}>({m.kind === "pdf" ? sizeMB(m.size) : `${m.format}, ${(m.chars || m.text.length).toLocaleString("pl-PL")} znaków`})</span>
                    {!busy && <button onClick={() => removeMat(m.id)} title="Usuń" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "inline-flex" }}><X size={12} /></button>}
                  </span>
                ))}
              </div>
              {!mats.length && matMeta.length > 0 && (
                <p style={{ ...ui.help }}>W szkicu były pliki: {matMeta.map(m => m.name).join(", ")}. Wyciąg z nich jest zapisany; pliki trzeba dodać ponownie tylko, jeśli chcesz wygenerować wyciąg od nowa.</p>
              )}
              <label style={{ ...ui.label, marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}><Link2 size={13} /> Linki źródłowe (jeden w linii, maks. {MAT_LIMITS.links})</label>
              <textarea value={matLinks} onChange={e => changeLinks(e.target.value)} onBlur={() => staleMaterials()} rows={2} disabled={busy}
                style={{ ...ui.input, resize: "vertical", fontFamily: theme.font.mono, fontSize: 12 }}
                placeholder="np. https://www.mp.pl/pacjent/... albo link do PDF z wytycznymi" />
              {matError && <div style={{ ...ui.banner("danger"), marginTop: 8 }}>{matError}</div>}
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: theme.space(2) }}>
          <select value={model} onChange={e => { setModel(e.target.value); R.current.model = e.target.value; lsSet("lemone_scen_model", e.target.value); }} style={{ ...ui.input, width: "auto" }} disabled={busy}
            title="Model można zmienić także między etapami (np. tańszy do poprawek)">
            {Object.entries(MODELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={effort} onChange={e => { setEffort(e.target.value); R.current.effort = e.target.value; lsSet("lemone_scen_effort", e.target.value); }} style={{ ...ui.input, width: "auto" }} disabled={busy}
            title="Ile model myśli i dopracowuje przed napisaniem planu i scenariusza; można zmienić między etapami">
            {Object.entries(EFFORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: theme.size.small + 1, cursor: started ? "default" : "pointer" }}>
            <input type="checkbox" checked={webSearch} onChange={e => setWebSearch(e.target.checked)} disabled={started} /> Weryfikacja w źródłach (web search)
          </label>
          {webSearch && (
            <select value={depth} onChange={e => setDepth(e.target.value)} style={{ ...ui.input, width: "auto" }} disabled={busy}>
              {Object.entries(SEARCH_DEPTH).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: theme.size.small + 1, cursor: "pointer" }}
            title="Wszystkie etapy jeden po drugim, bez zatrzymywania (jak przed v4.17)">
            <input type="checkbox" checked={auto} onChange={e => { setAuto(e.target.checked); R.current.auto = e.target.checked; }} disabled={busy} /> Bez zatwierdzania (wszystkie etapy od razu)
          </label>
          <div style={{ flex: 1 }} />
          {!started && (
            <button onClick={start} disabled={!ready || busy} style={{ ...ui.btnPrimary(P), ...(!ready || busy ? ui.btnDisabled : {}) }}>
              {busy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} {auto ? "Generuj scenariusz" : "Rozpocznij: pierwszy etap"}
            </button>
          )}
          {started && auto && !busy && !allApproved && nextKey && (
            <button onClick={advance} style={ui.btnPrimary(P)}><Sparkles size={14} /> Kontynuuj bez zatwierdzania</button>
          )}
        </div>
      </div>

      {started && (
        <StageStepper stages={stageList} statusOf={statusOf} selected={shownKey} onSelect={setSelected}
          usd={R.current.usd} startedAt={stepStart} busy={!!busyKey} profile={P} />
      )}

      {busyKey && (
        <div style={{ ...ui.card, display: "flex", gap: 10, alignItems: "center" }}>
          <Loader2 size={16} className="spin" color={P.accentHover} />
          <span style={{ fontSize: theme.size.body }}><strong>{STAGE_META[busyKey].label}</strong>{detail ? `: ${detail}` : "..."} Możesz przełączać zakładki; nie zamykaj strony.</span>
        </div>
      )}
      {error && (
        <div style={ui.banner("danger")}>
          <AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}
          {failedKey && (
            <div style={{ marginTop: 8 }}>
              <button onClick={async () => { const ok = await runStage(failedKey); if (ok && R.current.auto) await advance(); }} disabled={busy} style={ui.btnSecondary}><RefreshCw size={13} /> Ponów ten etap</button>
            </div>
          )}
        </div>
      )}

      {shown && !busyKey && shown.versions?.length > 0 && (
        <StageCard stage={shown} status={statusOf(shown)} kind={shown.key === "weryfikacja" || shown.key === "materialy" ? "text" : "html"} busy={busy} profile={P}
          approveLabel={ORDER.indexOf(shown.key) === ORDER.length - 1 ? "Zatwierdź" : "Zatwierdź i dalej"}
          onApprove={() => approve(shown.key)} onRegenerate={(r) => regenerate(shown.key, r)} onEdit={(v) => edit(shown.key, v)} onPickVersion={(i) => pick(shown.key, i)}
          note={shown.key === "pol2" ? <p style={{ ...ui.help, marginTop: 0 }}>Druga połowa dołączy do tabeli z pierwszej połowy; tekst do promptera powstanie z obu.</p> : null}>
          {choiceBox}
        </StageCard>
      )}

      {allApproved && !busyKey && (
        <div style={{ ...ui.card, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderColor: P.accent }}>
          <CheckCircle2 size={18} color={P.accentHover} />
          <span style={{ flex: 1, minWidth: 240, fontSize: theme.size.body }}>Wszystkie etapy zatwierdzone. Zapis złoży scenariusz w całość, doda tekst do promptera{sources.length ? " i listę źródeł" : ""} i otworzy go do edycji; szkic zniknie z listy „W toku”.</span>
          <button onClick={finish} disabled={finishing} style={{ ...ui.btnPrimary(P), ...(finishing ? ui.btnDisabled : {}) }}>
            {finishing ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Zapisz scenariusz
          </button>
        </div>
      )}

      {costs.length > 0 && <CostMeter costs={costs} note={d0?.usd ? `wcześniej w tym szkicu: ${usdFmt(d0.usd)} USD` : ""} />}
    </div>
  );
}

// === Lista scenariuszy (wszystkie rodzaje): szukanie, filtr autora i rodzaju, sortowanie, usuwanie ===
function ScriptList({ onOpen, session, onResume }) {
  const [items, setItems] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const load = async () => {
    setError(null);
    try { setItems((await api("/scripts")).items); } catch (e) { setError(e.message); }
    try { setDrafts(await listDrafts("scenariusz")); } catch (e) { /* lista szkiców opcjonalna */ }
  };
  useEffect(() => { load(); }, []);
  const byKind = (items || []).filter(it => !filter || (it.kind || "lekarz-yt") === filter);
  const listLabel = (it) => KINDS[it.kind] ? kindOf(it.kind).label : "Scenariusz zewnętrzny";
  const reg = useRegistry(byKind, it => [listLabel(it), it.external ? "dokument zewnętrzny" : ""]);
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
      {drafts.length > 0 && (
        <div style={{ marginBottom: theme.space(2), padding: 12, borderRadius: theme.radius.control, background: theme.color.warningSoft }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontFamily: theme.font.heading }}>W toku: {drafts.length} {drafts.length === 1 ? "szkic" : "szkice"} do dokończenia</div>
          {drafts.map(d => (
            <RegistryRow key={d.id} onOpen={() => onResume(d.id)} deleteLabel={d.title || "szkic"}
              onDelete={session && (session.role === "admin" || session.email === d.author) ? async () => { await deleteDraft(d.id); setDrafts(x => x.filter(y => y.id !== d.id)); } : null}
              right="Wznów">
              <div style={{ fontWeight: 600 }}>{d.title || "(bez tematu)"}</div>
              <div style={{ ...ui.help, margin: "3px 0 0" }}>{kindOf(d.kind).label} · {d.stage} · {d.author}{d.updatedBy && d.updatedBy !== d.author ? `, ostatnio ${d.updatedBy}` : ""} · {fmt(d.updatedAt)}</div>
            </RegistryRow>
          ))}
        </div>
      )}
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
          <div style={{ ...ui.help, margin: "3px 0 0" }}>{it.external ? "Dokument zewnętrzny · " : ""}{listLabel(it)} · {it.author} · {fmt(it.createdAt)}{it.v > 1 ? ` · wersja ${it.v} (${fmt(it.updatedAt)})` : ""}</div>
        </RegistryRow>
      ))}
    </div>
  );
}

// === Edycja scenariusza: podgląd edytowalny albo kod HTML, wersje ===
export function ScriptEditor({ id, shared, author, onBack }) {
  const [x, setX] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("preview");
  const [viewV, setViewV] = useState(null);
  const [code, setCode] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null);
  const [notice, setNotice] = useState(null); // {type: "info"|"warning"|"danger", text}
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
  // Edytor pokazuje dokładnie to, co jest zapisane (po zapisie, usunięciu wersji, humanizacji)
  const showSaved = (rec) => {
    const last = rec.versions[rec.versions.length - 1].html;
    setCode(last);
    if (editorRef.current) editorRef.current.innerHTML = sanitizeHtml(last);
  };
  const save = async () => {
    setBusy(true); setNotice(null);
    try {
      const raw = shared.normalizeDashes(working());
      // v4.24: tekst do promptera poprawiony ręcznie (tabela bez zmian) zapisujemy tak, jak jest;
      // wcześniej był zawsze odtwarzany z tabeli i ręczne poprawki znikały bez ostrzeżenia
      const tableChanged = tableSpoken(raw, K.format) !== tableSpoken(current.html, K.format);
      const prompterEdited = prompterText(raw, K.format) !== prompterText(current.html, K.format);
      const keepPrompter = prompterEdited && !tableChanged;
      const html = keepPrompter ? raw : rebuildPrompter(raw, K.format);
      const updated = await api(`/scripts/${id}`, { html, by: author });
      setX(updated); setViewV(null); setDirty(false); showSaved(updated);
      const lastV = updated.versions[updated.versions.length - 1];
      const vNo = `${lastV.v} (${fmt(lastV.at)}, ${lastV.by})`;
      if (updated.changed === false) {
        setNotice({ type: "warning", text: `Nic nie zapisano: treść jest taka sama jak w ostatniej wersji ${vNo}. Nowa wersja nie powstała.` });
      } else if (keepPrompter) {
        setNotice({ type: "info", text: `Zapisano jako wersję ${vNo}. Tekst do promptera zapisany z Twoimi poprawkami (tabela scenariusza bez zmian).` });
      } else if (prompterEdited && tableChanged) {
        setNotice({ type: "warning", text: `Zapisano jako wersję ${vNo}. Zmieniono i tabelę, i tekst do promptera: tekst do promptera odtworzono z tabeli, więc ręczne poprawki w nim nie zostały zachowane. Popraw je w tabeli albo zapisz osobno.` });
      } else {
        setNotice({ type: "info", text: `Zapisano jako wersję ${vNo}; tekst do promptera odświeżony z tabeli.` });
      }
    } catch (e) { setNotice({ type: "danger", text: `Nie zapisano: ${e.message}. Twoje zmiany są nadal w edytorze; spróbuj ponownie.` }); }
    setBusy(false);
  };
  // v4.24: usuwanie wersji (wybranej albo wszystkich poza bieżącą); usunięte trafiają do kosza
  const deleteVersions = async (list, label) => {
    if (!window.confirm(`Usunąć ${label}? Usunięte wersje trafią do kosza (admin może je odzyskać).`)) return;
    setBusy(true); setNotice(null);
    try {
      const updated = await api(`/scripts/${id}`, { action: "deleteVersions", versions: list });
      setX(updated); setViewV(null); setDirty(false); showSaved(updated);
      setNotice({ type: "info", text: `Usunięto: ${label}. Zostało wersji: ${updated.versions.length}.` });
    } catch (e) { setNotice({ type: "danger", text: `Nie usunięto: ${e.message}` }); }
    setBusy(false);
  };
  // Humanizacja (no-ai-slop): tekst mówiony z tabeli i opis do publikacji; wynik = nowa wersja
  const humanize = async () => {
    setHumanizeErr(null);
    setHumanizeStep("Wczytuję zasady humanizacji...");
    try {
      const rules = await loadAntiSlopRules();
      const voice = await loadVoice(K.cel);
      let usd = 0;
      const res = await humanizeHtml(current.html, {
        callModel, rules, mode: "script", format: F, klinika: K.cel === "klinika", voice,
        track: (e) => { usd += e.usd; },
        onProgress: (p) => setHumanizeStep(`Humanizacja: ${p.label} (${p.current}/${p.total})`),
      });
      if (!res.changed) { setSaved("Humanizacja nie znalazła nic do poprawy; wersja bez zmian."); }
      else {
        const html = rebuildPrompter(shared.normalizeDashes(res.html), K.format);
        const updated = await api(`/scripts/${id}`, { html, by: author });
        setX(updated); setViewV(null); setDirty(false); showSaved(updated);
        setSaved(`Humanizacja zapisana jako wersja ${updated.versions[updated.versions.length - 1].v} (poprawione fragmenty: ${res.changed}, koszt ${usdFmt(usd)} USD). Poprzednia wersja jest w historii.`);
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
          {x.external
            ? <><strong>Dokument zewnętrzny</strong> · {KINDS[x.kind] ? K.label : "rodzaj nieokreślony"} · dodał(a): {x.author} · {fmt(x.createdAt)}{x.externalSource ? ` · źródło: ${x.externalSource}` : ""}</>
            : <>{K.label} · {x.author} · {fmt(x.createdAt)} · model: {MODELS[x.model] || x.model || "-"} · prompt: {x.promptVersion ? `wersja ${x.promptVersion}` : "domyślny"} · koszt: {usdFmt(x.usd)} USD</>}
          {x.inputs?.lekarz ? ` · ${x.inputs.lekarz}` : x.inputs?.wystepuje ? ` · ${x.inputs.wystepuje}` : ""}
        </p>
        <p style={{ ...ui.help, margin: "4px 0 0", color: theme.color.text }}>
          <strong>Ostatni zapis:</strong> {fmt(current.at)} · {current.by} · wersja {current.v} z {x.versions.length}
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <CopyButton text={prompterText(shown.html, K.format)} label={`Kopiuj: ${F.sections[F.prompter].replace(/^[A-H]\. /, "").toLowerCase()}`} primary profile={P} />
        <CopyButton text={shown.html} label="Kopiuj całość (HTML)" />
        <button onClick={download} style={ui.btnSecondary}><Download size={13} /> Pobierz .html</button>
        <div style={{ flex: 1 }} />
        {x.versions.length > 1 && (
          <>
            <select value={shown.v} onChange={e => { if (dirty && !window.confirm("Masz niezapisane zmiany. Przejść do innej wersji i je porzucić?")) return; setViewV(Number(e.target.value)); }} style={{ ...ui.input, width: "auto" }} disabled={busy}>
              {x.versions.map(v => <option key={v.v} value={v.v}>Wersja {v.v} ({v.by}, {fmt(v.at)}){v === current ? " · bieżąca" : ""}</option>)}
            </select>
            <button onClick={() => deleteVersions([shown.v], `wersję ${shown.v}${isCurrent ? " (bieżącą; bieżącą stanie się poprzednia)" : ""}`)} disabled={busy}
              style={{ ...ui.btnSecondary, padding: "6px 10px" }} title="Usuń oglądaną wersję"><Trash2 size={13} /> Usuń tę wersję</button>
            <button onClick={() => deleteVersions(x.versions.filter(v => v !== current).map(v => v.v), `wszystkie starsze wersje (${x.versions.length - 1}); zostanie tylko bieżąca`)} disabled={busy}
              style={{ ...ui.btnSecondary, padding: "6px 10px" }} title="Zostaw tylko bieżącą wersję"><Trash2 size={13} /> Usuń starsze</button>
          </>
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
      {notice && <div style={{ ...ui.banner(notice.type), display: "flex", gap: 10, alignItems: "flex-start" }}><span style={{ flex: 1 }}>{notice.text}</span><button onClick={() => setNotice(null)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }} aria-label="Zamknij"><X size={13} /></button></div>}
      {humanizeErr && <div style={ui.banner("danger")}>{humanizeErr}</div>}
      {!isCurrent && <p style={{ ...ui.help, margin: 0 }}>Podgląd starszej wersji {shown.v}: tylko do odczytu.</p>}
      <p style={{ ...ui.help, margin: 0 }}>Tekst do promptera ({F.prompter}) powstaje z drugiej kolumny tabeli scenariusza ({F.table}). Zmiana w tabeli odświeża go przy zapisie; poprawki wpisane wprost w tekst do promptera (bez zmian w tabeli) zapisują się tak, jak je wpiszesz.</p>
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
