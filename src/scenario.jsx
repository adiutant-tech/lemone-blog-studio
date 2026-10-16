// === Lemoné Blog Studio v4.9 - moduł Scenariusz (filmy z lekarzem, rolki zespołu i influencerów) ===
// Rodzaje: film YouTube z lekarzem (format długi) oraz rolki sklepu, kliniki i influencerów
// (format krótki, pion 9:16). Każdy rodzaj ma własny prompt matkę z historią wersji widoczną
// dla wszystkich (Worker /prompts/<nazwa>; domyślne w src/prompts/).
// Generacja w częściach (pełny scenariusz z tabelą nie mieści się w jednej odpowiedzi).
// Tekst do promptera/lektora składamy z kolumny wypowiedzi tabeli scenariusza: zawsze zgodny,
// odświeżany przy każdym zapisie. Scenariusze (Worker /scripts) widzą i edytują wszyscy.

import { useState, useEffect, useRef } from "react";
import { Clapperboard, Loader2, AlertCircle, RefreshCw, Save, ArrowLeft, Code2, Eye, History, RotateCcw, Download, Sparkles } from "lucide-react";
import theme, { ui } from "./theme.js";
import { apiFetch } from "./auth.jsx";
import { sanitizeHtml, CopyButton } from "./shared.jsx";
import { callModel, CostMeter, MODELS, DEFAULT_MODEL, SEARCH_DEPTH, stripFences } from "./generator.jsx";
import { SCENARIUSZ_PROMPT_DEFAULT, SCENARIUSZ_FIELDS } from "./prompts/scenariusz.js";
import { ROLKI, rolkaFields } from "./prompts/rolki.js";

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
    table: "D", prompter: "E",
    tableHead: "<th>Czas (orientacyjny)</th><th>Tekst lekarza</th><th>Obraz, plansza lub napis</th><th>Źródło lub uwaga do weryfikacji</th>",
  },
  short: {
    data: "DANE DO ROLKI",
    sections: {
      A: "A. BRIEF", B: "B. TRZY WARIANTY HOOKA", C: "C. SCENARIUSZ", D: "D. TEKST DO PROMPTERA LUB LEKTORA",
      E: "E. OPIS I HASHTAGI", F: "F. KONTROLA ZGODNOŚCI", G: "G. PLAN OCENY",
    },
    table: "C", prompter: "D",
    tableHead: "<th>Czas</th><th>Tekst mówiony lub lektor</th><th>Ujęcie i obraz</th><th>Napis na ekranie</th>",
  },
};

const GROUPS = { klinika: "Klinika", sklep: "Sklep", influencer: "Influencerzy" };

export const KINDS = {
  "lekarz-yt": { label: "Film YouTube z lekarzem", cel: "klinika", group: "klinika", format: "long", promptName: "scenariusz", defaultPrompt: SCENARIUSZ_PROMPT_DEFAULT, fields: SCENARIUSZ_FIELDS, webSearch: true },
  ...Object.fromEntries(Object.entries(ROLKI).map(([k, v]) => [k, {
    label: v.label, cel: v.cel, group: v.group || v.cel, format: "short", promptName: k, defaultPrompt: v.prompt, fields: rolkaFields(k),
    webSearch: !!v.webSearch,
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
function usePrompt(kind) {
  const K = kindOf(kind);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = async () => {
    setData(null); setError(null);
    try { setData(await api(`/prompts/${K.promptName}`)); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, [K.promptName]); // eslint-disable-line react-hooks/exhaustive-deps
  const versions = data?.versions || [];
  const current = versions[versions.length - 1];
  return { name: K.promptName, defaultText: K.defaultPrompt, versions, current, text: current ? current.text : K.defaultPrompt, version: current ? current.v : 0, setData, error, loaded: !!data };
}

function KindSelect({ value, onChange, withAll = false }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...ui.input, width: "auto" }} aria-label="Rodzaj scenariusza">
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
        {tab !== "lista" && <KindSelect value={kind} onChange={(k) => { setKind(k); lsSet("lemone_scen_kind", k); }} />}
        <div style={{ flex: 1 }} />
        {!session && (
          <input value={who} onChange={e => { setWho(e.target.value); lsSet("lemone_review_name", e.target.value); }}
            style={{ ...ui.input, width: 200 }} placeholder="Twoje imię (podpis wersji)" />
        )}
        {tab !== "lista" && <span style={ui.help}>Prompt: {prompt.version ? `wersja ${prompt.version}` : "domyślny"}</span>}
      </div>

      {tab === "nowy" && <NewScenario key={kind} kind={kind} shared={shared} prompt={prompt} author={author} onSaved={(id) => { setOpenId(id); setTab("lista"); }} />}
      {tab === "lista" && (openId
        ? <ScriptEditor id={openId} shared={shared} author={author} onBack={() => setOpenId(null)} />
        : <ScriptList onOpen={setOpenId} />)}
      {tab === "prompt" && <PromptEditor key={kind} kind={kind} prompt={prompt} author={author} />}
    </div>
  );
}

// === Nowy scenariusz: formularz rodzaju + generacja w częściach ===
function NewScenario({ kind, shared, prompt, author, onSaved }) {
  const K = kindOf(kind);
  const F = FORMATS[K.format];
  const P = theme.profile[K.cel];
  const [inputs, setInputs] = useState({});
  const [model, setModel] = useState(() => { const m = lsGet("lemone_scen_model", DEFAULT_MODEL); return MODELS[m] ? m : DEFAULT_MODEL; });
  const [webSearch, setWebSearch] = useState(K.webSearch);
  const [depth, setDepth] = useState(K.format === "short" ? "szybkie" : "standard");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(null);
  const [error, setError] = useState(null);
  const [costs, setCosts] = useState([]);
  const parts = useRef({}); // wyniki udanych części (ponowienie nie powtarza ich)
  const costsRef = useRef([]); // aktualna suma kosztu do zapisu (stan w zamknięciu generate jest nieaktualny)

  const ready = K.fields.filter(f => f.required).every(f => (inputs[f.key] || "").trim()) && prompt.loaded;
  const track = (e) => { costsRef.current = [...costsRef.current, e]; setCosts(costsRef.current); };
  const opts = (o) => ({ model, track, ...o });
  const norm = (h) => shared.normalizeDashes(stripFences(h));
  const S = F.sections;

  const generate = async () => {
    setBusy(true); setError(null);
    const p = parts.current;
    try {
      if (p.own === undefined) {
        if ((inputs.linki || "").trim()) setStep("Pobieram treść naszych stron...");
        p.own = await fetchOwnPages(inputs.linki);
      }
      const base = `${prompt.text}\n\n${appRules(K.format)}\n\n${inputsBlock(kind, inputs, p.own)}`;
      if (p.research === undefined) {
        if (webSearch) {
          setStep("Weryfikacja w źródłach (web search)...");
          p.research = await callModel(
            `${base}\n\nCZĘŚĆ 1: tylko weryfikacja. Sprawdź w aktualnych, wiarygodnych źródłach kluczowe fakty potrzebne do tego materiału${K.format === "long" ? " (krok 1 promptu: SPRAWDŹ PODSTAWY)" : ""}. Zwróć zwięzłą notatkę (maks. ok. ${K.format === "long" ? 800 : 400} słów, zwykły tekst w punktach): datę weryfikacji, ustalenia z URL źródła w nawiasie przy każdym punkcie. Bez scenariusza.`,
            opts({ maxTokens: 8000, search: true, searchUses: SEARCH_DEPTH[depth].uses, stage: "weryfikacja" }));
        } else {
          p.research = null;
        }
      }
      const research = p.research
        ? `\n\nNOTATKA WERYFIKACYJNA (źródła z wyszukiwania):\n${p.research.text}`
        : "\n\nBEZ WERYFIKACJI ONLINE: nie wymyślaj źródeł, statystyk ani badań; fakty tylko z danych i materiałów.";
      const ctx = base + research;

      if (K.format === "long") {
        if (!p.plan) {
          setStep("Plan filmu, tytuły i otwarcia (A-C)...");
          p.plan = norm(await callModel({ cached: ctx, text: `CZĘŚĆ 2 z 4: zwróć wyłącznie sekcje A, B i C (${S.A}, ${S.B}, ${S.C}).` }, opts({ maxTokens: 16000, effort: "medium", stage: "plan" })));
        }
        if (!p.script) {
          setStep("Pełny scenariusz (D)...");
          p.script = norm(await callModel({ cached: ctx, text: `PRZYGOTOWANE JUŻ SEKCJE A-C:\n${p.plan}\n\nCZĘŚĆ 3 z 4: zwróć wyłącznie sekcję D: <h2>${S.D}</h2> i jedną tabelę <table> z wierszem nagłówka ${F.tableHead}. Zrealizuj otwarcie wybrane w C i długość z briefu.` }, opts({ maxTokens: 16000, effort: "medium", stage: "scenariusz" })));
        }
        if (!p.pack) {
          setStep("Pakiet publikacyjny, kontrola jakości, plan oceny (F-H)...");
          p.pack = norm(await callModel({ cached: ctx, text: `PRZYGOTOWANE JUŻ SEKCJE A-D:\n${p.plan}\n${p.script}\n\nCZĘŚĆ 4 z 4: zwróć wyłącznie sekcje F, G i H (${S.F}, ${S.G}, ${S.H}). W G sprawdź rzeczywisty scenariusz z sekcji D.` }, opts({ maxTokens: 16000, effort: "low", stage: "pakiet" })));
        }
      } else {
        if (!p.script) {
          setStep("Brief, hooki i scenariusz rolki (A-C)...");
          p.plan = "";
          p.script = norm(await callModel({ cached: ctx, text: `CZĘŚĆ 2 z 3: zwróć wyłącznie sekcje A, B i C (${S.A}, ${S.B}, ${S.C}). Sekcja C to jedna tabela <table> z wierszem nagłówka ${F.tableHead}.` }, opts({ maxTokens: 16000, effort: "medium", stage: "scenariusz" })));
        }
        if (!p.pack) {
          setStep("Opis, hashtagi, kontrola zgodności, plan oceny (E-G)...");
          p.pack = norm(await callModel({ cached: ctx, text: `PRZYGOTOWANE JUŻ SEKCJE A-C:\n${p.script}\n\nCZĘŚĆ 3 z 3: zwróć wyłącznie sekcje E, F i G (${S.E}, ${S.F}, ${S.G}). W F sprawdź rzeczywisty scenariusz z sekcji C.` }, opts({ maxTokens: 16000, effort: "low", stage: "pakiet" })));
        }
      }

      setStep("Zapisuję...");
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
      setCosts([]);
      onSaved(saved.id);
    } catch (e) {
      setError(`${e.message}. Kliknij ponownie „Generuj scenariusz”: gotowe części nie zostaną powtórzone.`);
    }
    setBusy(false); setStep(null);
  };

  const set = (k, v) => { setInputs({ ...inputs, [k]: v }); parts.current = {}; };

  return (
    <div style={ui.card}>
      <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: "0 0 4px", fontFamily: theme.font.heading }}>{K.label}</h2>
      <p style={{ ...ui.help, marginTop: 0 }}>
        {K.format === "short" ? "Rolka pionowa 9:16. " : ""}Pola z promptu matki tego rodzaju; wymagane oznaczono gwiazdką, reszta ma wartości domyślne.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: theme.space(2) }}>
        {K.fields.map(f => (
          <div key={f.key} style={f.rows > 2 ? { gridColumn: "1 / -1" } : undefined}>
            <label style={ui.label}>{f.label}{f.required ? " *" : ""}</label>
            {f.rows ? (
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
      {step && <p style={{ ...ui.help, color: theme.color.text }}><Loader2 size={13} className="spin" style={{ verticalAlign: "-2px" }} /> {step}</p>}
      {error && <div style={{ ...ui.banner("danger"), marginTop: 10 }}><AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}</div>}
      <CostMeter costs={costs} />
      <p style={ui.help}>{K.format === "short" ? "Rolka powstaje w 1-2 minuty." : "Film powstaje w kilka minut (4 części)."} Scenariusz zapisuje się automatycznie i otwiera do edycji.</p>
    </div>
  );
}

// === Lista scenariuszy (wszystkie rodzaje) ===
function ScriptList({ onOpen }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const load = async () => { setError(null); try { setItems((await api("/scripts")).items); } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, []);
  const shown = (items || []).filter(it => !filter || (it.kind || "lekarz-yt") === filter);
  return (
    <div style={ui.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: theme.space(2), flexWrap: "wrap" }}>
        <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Scenariusze</h2>
        <div style={{ flex: 1 }} />
        <KindSelect value={filter} onChange={setFilter} withAll />
        <button onClick={load} style={ui.btnSecondary}><RefreshCw size={13} /> Odśwież</button>
      </div>
      {error && <div style={ui.banner("danger")}>{error}</div>}
      {!items && !error && <p style={ui.help}><Loader2 size={13} className="spin" style={{ verticalAlign: "-2px" }} /> Wczytuję...</p>}
      {items && shown.length === 0 && <p style={ui.help}>Brak scenariuszy{filter ? " tego rodzaju" : ""}. Wygeneruj pierwszy w zakładce „Nowy scenariusz”.</p>}
      {shown.map(it => (
        <button key={it.id} onClick={() => onOpen(it.id)}
          style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6, width: "100%", textAlign: "left", background: "transparent", border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.control, padding: "10px 12px", marginBottom: 8, cursor: "pointer", fontFamily: "inherit", color: theme.color.text }}>
          <div>
            <div style={{ fontWeight: 600 }}>{it.title || "(bez tematu)"}</div>
            <div style={{ ...ui.help, margin: "3px 0 0" }}>{kindOf(it.kind).label} · {it.author} · {fmt(it.createdAt)}{it.v > 1 ? ` · wersja ${it.v} (${fmt(it.updatedAt)})` : ""}</div>
          </div>
          <div style={{ alignSelf: "center", ...ui.help, margin: 0 }}>{usdFmt(it.usd)} USD</div>
        </button>
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
        <CopyButton text={prompterText(shown.html, K.format)} label={K.format === "short" ? "Kopiuj tekst do promptera / lektora" : "Kopiuj tekst do promptera"} primary profile={P} />
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
        <button onClick={save} disabled={!isCurrent || !dirty || busy} style={{ ...ui.btnPrimary(P), ...(!isCurrent || !dirty || busy ? ui.btnDisabled : {}) }}
          title={isCurrent ? (dirty ? "" : "Brak zmian do zapisania") : "Edytować można tylko bieżącą wersję"}>
          {busy ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Zapisz zmiany
        </button>
      </div>
      {saved && <div style={ui.banner("info")}>{saved}</div>}
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
function PromptEditor({ kind, prompt, author }) {
  const K = kindOf(kind);
  const P = theme.profile[K.cel];
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
      setSaved(`Zapisano jako wersję ${res.versions.length}. Nowe scenariusze tego rodzaju używają jej od teraz.`);
      setTimeout(() => setSaved(null), 3500);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const history = [...prompt.versions].reverse();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 340px)", gap: theme.space(2), alignItems: "start" }}>
      <div style={ui.card}>
        <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: "0 0 4px", fontFamily: theme.font.heading }}>Prompt matka: {K.label}</h2>
        <p style={{ ...ui.help, marginTop: 0 }}>Wspólny dla wszystkich. Każdy zapis tworzy nową wersję w historii; poprzednie zostają i można je przywrócić.</p>
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
          <div style={ui.help}>z aplikacji ({K.format === "short" ? "src/prompts/rolki.js" : "src/prompts/scenariusz.js"})</div>
          {prompt.current && <button onClick={() => { setText(prompt.defaultText); setNote("Przywrócenie wersji domyślnej"); }} style={{ ...ui.btnSecondary, padding: "3px 8px", fontSize: theme.size.small, marginTop: 4 }}><RotateCcw size={11} /> Przywróć do edycji</button>}
        </div>
      </div>
    </div>
  );
}
