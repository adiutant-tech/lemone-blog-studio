// === Lemoné Blog Studio v4.0 \u2014 moduł Generator (Etap 1) ===
// Zakres Etapu 1: ścieżka Sklep/Edukacyjny w pełnym przebiegu A-E (specyfikacja v4.0-v2).
// Pozostałe typy i profil Klinika widoczne, ale zablokowane (Etap 2/3).
// Moduł NIE duplikuje logiki formatowania: funkcje wspólne przychodzą przez props
// `shared` z App.jsx (normalizeDashes, buildFaqCmsJson, buildCompleteArticle,
// extractTocItems, generateFAQ), więc każda wywalczona poprawka pipeline'u
// obowiązuje też treści generowane.

import { useState, useEffect, useMemo } from "react";
import { Sparkles, Copy, Check, RefreshCw, AlertCircle, Loader2, Pencil, ChevronRight, FileText } from "lucide-react";
import theme, { ui } from "./theme.js";

const apiUrl = import.meta.env.VITE_API_URL || "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const SECTION_GAP_MS = 2000; // wzorzec z boxów: rozkłada wywołania, chroni przed rate limitem

// Długości artykułu (liczba sekcji H2 bez intro)
const LENGTHS = {
  krotki:   { label: "Krótki (4-6 sekcji)",   sections: 5 },
  standard: { label: "Standard (7-9 sekcji)", sections: 8 },
  dlugi:    { label: "Długi (10-12 sekcji)",  sections: 11 },
};

// === Warstwa 1 anti-slop: zawsze w promptach (specyfikacja 3D) ===
const ANTI_SLOP = `ZASADY STYLU (bezwzględne):
- ZAKAZ pustych otwarć: "w dzisiejszych czasach", "w dobie", "nie da się ukryć", "od zarania dziejów", "jak powszechnie wiadomo"
- ZAKAZ waty: "warto pamiętać, że", "należy podkreślić", "co ciekawe", "warto zaznaczyć"
- ZAKAZ otwierania sekcji pytaniem retorycznym jako schematu
- Listy punktowane TYLKO gdy treść jest realnym wyliczeniem; maksymalnie jedna lista na sekcję
- Każda teza poparta konkretem, przykładem lub mechanizmem działania; zero truizmów
- Zdania zróżnicowanej długości, naturalny polski, bez kalk z angielskiego
- NIGDY nie używaj myślnika "\u2014" ani półpauzy "\u2013"; wyłącznie zwykły dywiz "-"
- Zakresy liczbowe bez spacji: "2-3 godziny", "20-30 minut"
- Pisz neutralnie rodzajowo (nie "jesteś narażona/narażony"; tak: "Twoja skóra jest narażona", "jesteśmy narażeni")
- Fakty fizyczne: ekrany urządzeń emitują światło niebieskie (HEV), NIE promieniowanie UV`;

const GUARD_SKLEP = `GRANICE MERYTORYCZNE (sklep kosmetyczny, prawo kosmetyczne):
- Kosmetyk pielęgnuje, wspiera, redukuje widoczność; NIGDY nie leczy, nie usuwa chorób, nie ma działania terapeutycznego
- Claimy składnikowe tylko w granicach powszechnej wiedzy kosmetologicznej; zero wymyślonych badań i procentów skuteczności
- Suplementy: bez obietnic efektów zdrowotnych wykraczających poza dozwolone oświadczenia`;

// === Wywołanie modelu przez Workera (ten sam proxy co Formatowanie) ===
async function callModel(content, { maxTokens = 2200, effortLow = false } = {}) {
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content }],
  };
  if (effortLow) body.output_config = { effort: "low" };
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${t.slice(0, 180)}`);
  }
  const data = await res.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  if (!text.trim()) throw new Error("Pusta odpowiedź modelu");
  return text;
}

function parseJsonLoose(text) {
  let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Brak JSON w odpowiedzi");
  return JSON.parse(t.slice(start, end + 1));
}

function stripTags(html) {
  const d = new DOMParser().parseFromString(html || "", "text/html");
  return (d.body.textContent || "").replace(/\s+/g, " ").trim();
}

function countOccurrences(text, phrase) {
  if (!phrase) return 0;
  const esc = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(esc, "gi")) || []).length;
}

// === Prompty ===
function buildOutlinePrompt(f) {
  const n = LENGTHS[f.length].sections;
  return `${f.promptMatka ? "PROMPT MATKA (nadrzędne wytyczne redakcji):\n" + f.promptMatka + "\n\n" : ""}Jesteś redaktorem prowadzącym polskiego bloga kosmetyczno-zdrowotnego Lemoné (sklep.lemone.pl). Przygotuj KONSPEKT artykułu edukacyjnego.

TEMAT I KĄT: ${f.topic}
FRAZA GŁÓWNA (SEO): ${f.keyword}
${f.keywordsAux ? "FRAZY POMOCNICZE: " + f.keywordsAux : ""}
${f.materials ? "\nMATERIAŁY ŹRÓDŁOWE (mają PIERWSZEŃSTWO nad Twoją wiedzą; nie wychodź poza nie w faktach spornych):\n" + f.materials.slice(0, 6000) : ""}

WYMAGANIA KONSPEKTU:
- Dokładnie ${n} sekcji H2 (bez sekcji FAQ i bez "Podsumowania" jako pustego rytuału; ostatnia sekcja ma wnosić treść, np. praktyczne wnioski lub tabelę decyzyjną)
- Fraza główna w maksymalnie JEDNYM nagłówku H2
- Dla każdej sekcji: tytuł H2, opcjonalnie 2-3 H3, jedno zdanie tezy (co sekcja udowadnia/daje czytelnikowi)
- 3 propozycje H1 (różne kąty, każdy z frazą główną, bez clickbaitu)

${ANTI_SLOP}

${GUARD_SKLEP}

ZWRÓĆ WYŁĄCZNIE JSON, bez markdown:
{"h1":["...","...","..."],"sections":[{"h2":"...","h3":["..."],"thesis":"..."}]}`;
}

function buildSectionPrompt(f, outline, idx, prevExcerpt) {
  const sec = outline.sections[idx];
  const isIntro = idx === -1;
  const header = isIntro
    ? `Napisz LEAD artykułu (2-3 akapity <p>, bez żadnego nagłówka): zapowiedź tematu i obietnica wartości. Fraza główna dokładnie RAZ, naturalnie.`
    : `Napisz sekcję artykułu:
H2: ${sec.h2}
${sec.h3 && sec.h3.length ? "H3 do użycia (wszystkie): " + sec.h3.join(" | ") : "Bez H3."}
TEZA SEKCJI: ${sec.thesis}`;
  return `${f.promptMatka ? "PROMPT MATKA (nadrzędne wytyczne redakcji):\n" + f.promptMatka + "\n\n" : ""}Piszesz artykuł edukacyjny na blog Lemoné (polski, branża kosmetyczna).
TYTUŁ ARTYKUŁU (H1, nie powtarzaj go w treści): ${outline.chosenH1}
FRAZA GŁÓWNA: ${f.keyword}${f.keywordsAux ? "\nFRAZY POMOCNICZE (wplataj naturalnie, bez upychania): " + f.keywordsAux : ""}
${f.materials ? "\nMATERIAŁY ŹRÓDŁOWE (pierwszeństwo nad Twoją wiedzą):\n" + f.materials.slice(0, 6000) : ""}
${prevExcerpt ? "\nKONIEC POPRZEDNIEJ SEKCJI (dla ciągłości; NIE powtarzaj tych treści):\n..." + prevExcerpt : ""}

${header}

WYMAGANIA:
- Czysty HTML: ${isIntro ? "<p>" : "<h2>, opcjonalnie <h3>,"} <p>, <strong>, <ul><li> (lista tylko jeśli konieczna)
- ${isIntro ? "80-130" : "170-280"} słów
- Fraza główna w tej sekcji maksymalnie ${isIntro ? "1 raz" : "1 raz, a jeśli jest w H2, to w treści wcale"}
- Bez odnośników, bez obrazków, bez FAQ, bez podsumowywania całego artykułu

${ANTI_SLOP}

${GUARD_SKLEP}

ZWRÓĆ WYŁĄCZNIE HTML sekcji, bez komentarzy i bez markdown.`;
}

function buildRedlinePrompt(html, f) {
  return `Jesteś bezlitosnym redaktorem. Dostajesz artykuł HTML. Zrób pass redakcyjny:
- Wytnij każdy slop: puste otwarcia, watę ("warto pamiętać"), truizmy, powtórzenia między sekcjami
- Skróć zdania przegadane, skonkretyzuj ogólniki (jeśli brak konkretu w tekście, przeformułuj na ostrożne, ale treściwe)
- NIE zmieniaj: struktury H2/H3, kolejności sekcji, faktów, frazy głównej "${f.keyword}" (jej liczba wystąpień ma nie wzrosnąć)
- NIE dodawaj nowych sekcji ani list
- Zachowaj HTML; każde "\u2014" i "\u2013" zamień na "-"; zakresy liczbowe bez spacji (2-3)

${ANTI_SLOP}

ARTYKUŁ:
${html}

ZWRÓĆ WYŁĄCZNIE poprawiony HTML, bez komentarzy.`;
}

// === Komponent ===
export default function Generator({ shared }) {
  const P = theme.profile.sklep; // Etap 1: tylko sklep; Etap 3 przełączy na profile[cel]

  // Krok A: formularz
  const [cel, setCel] = useState("sklep");
  const [typ, setTyp] = useState("edukacyjny");
  const [promptMatka, setPromptMatka] = useState("");
  const [keyword, setKeyword] = useState("");
  const [keywordsAux, setKeywordsAux] = useState("");
  const [topic, setTopic] = useState("");
  const [materials, setMaterials] = useState("");
  const [length, setLength] = useState("standard");
  const [redline, setRedline] = useState(true); // warstwa 2, default ON dla edukacyjnych

  // Prompt matka: pamięć per cel+typ (localStorage), wklejany raz
  const pmKey = `lemone_gen_pm_${cel}_${typ}`;
  useEffect(() => {
    try { setPromptMatka(localStorage.getItem(pmKey) || ""); } catch (e) {}
  }, [pmKey]);
  const savePm = (v) => {
    setPromptMatka(v);
    try { localStorage.setItem(pmKey, v); } catch (e) {}
  };

  // Przebieg
  const [phase, setPhase] = useState("form"); // form | outlineLoading | outline | writing | finishing | done
  const [error, setError] = useState(null);
  const [outline, setOutline] = useState(null); // {h1:[], chosenH1, sections:[{h2,h3[],thesis}]}
  const [secHtml, setSecHtml] = useState([]);   // [intro, s0, s1, ...]
  const [progress, setProgress] = useState(null); // {current,total}
  const [failedIdx, setFailedIdx] = useState(null); // -1 intro, 0..n sekcje
  const [result, setResult] = useState(null);   // {html, faqItems, words}
  const [copiedArt, setCopiedArt] = useState(false);
  const [copiedFaq, setCopiedFaq] = useState(false);

  const canStart = topic.trim() && keyword.trim();

  const genOutline = async () => {
    setError(null); setPhase("outlineLoading");
    try {
      const f = { promptMatka, keyword, keywordsAux, topic, materials, length };
      const txt = await callModel(buildOutlinePrompt(f), { maxTokens: 1500, effortLow: true });
      const j = parseJsonLoose(txt);
      if (!j.h1?.length || !j.sections?.length) throw new Error("Konspekt niekompletny");
      setOutline({ h1: j.h1, chosenH1: j.h1[0], sections: j.sections });
      setPhase("outline");
    } catch (e) { setError(e.message || String(e)); setPhase("form"); }
  };

  const writeOne = async (idx, prevHtml) => {
    const f = { promptMatka, keyword, keywordsAux, topic, materials, length };
    const prevExcerpt = prevHtml ? stripTags(prevHtml).slice(-300) : "";
    const html = await callModel(buildSectionPrompt(f, outline, idx, prevExcerpt), { maxTokens: 2200 });
    return html.replace(/^```html?\s*/i, "").replace(/\s*```$/, "").trim();
  };

  const startWriting = async () => {
    setError(null); setFailedIdx(null); setPhase("writing");
    const total = outline.sections.length + 1;
    const parts = [];
    setSecHtml([]);
    try {
      for (let i = -1; i < outline.sections.length; i++) {
        setProgress({ current: i + 2, total });
        const html = await writeOne(i, parts[parts.length - 1]);
        parts.push(html);
        setSecHtml([...parts]);
        if (i < outline.sections.length - 1) await new Promise(r => setTimeout(r, SECTION_GAP_MS));
      }
      await finishPipeline(parts);
    } catch (e) {
      setFailedIdx(parts.length - 1); // -1=intro, 0..=sekcja o tym indeksie
      setError(`Sekcja ${parts.length}/${total} padła: ${e.message}. Możesz ponowić samą tę sekcję.`);
    }
  };

  const retryFailed = async () => {
    setError(null);
    const total = outline.sections.length + 1;
    const parts = [...secHtml];
    try {
      for (let i = parts.length - 1; i < outline.sections.length; i++) {
        setProgress({ current: i + 2, total });
        const html = await writeOne(i, parts[parts.length - 1]);
        parts.push(html);
        setSecHtml([...parts]);
        if (i < outline.sections.length - 1) await new Promise(r => setTimeout(r, SECTION_GAP_MS));
      }
      setFailedIdx(null);
      await finishPipeline(parts);
    } catch (e) {
      setFailedIdx(parts.length - 1);
      setError(`Sekcja ${parts.length}/${total} padła ponownie: ${e.message}`);
    }
  };

  const finishPipeline = async (parts) => {
    setPhase("finishing");
    const f = { promptMatka, keyword, keywordsAux, topic, materials, length };
    let body = parts.join("\n");
    if (redline) {
      body = await callModel(buildRedlinePrompt(body, f), { maxTokens: 3000 });
      body = body.replace(/^```html?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    // Normalizacja całości (pipeline normalizuje FAQ i boxy, body artykułu robimy tu)
    body = shared.normalizeDashes(body);
    const toc = shared.extractTocItems(body);
    let faqItems = [];
    try {
      faqItems = await shared.generateFAQ({ products: [], tocItems: toc, articleHtml: body });
    } catch (e) { /* FAQ opcjonalne: artykuł bez FAQ nadal ma wartość */ }
    // Pełny pipeline formatowania: TOC, cleanup, kotwice; zero boxów (ścieżka bez produktów)
    const finalHtml = shared.buildCompleteArticle(body, [], {}, toc, faqItems);
    const words = stripTags(finalHtml).split(/\s+/).filter(Boolean).length;
    setResult({ html: finalHtml, faqItems, words });
    setPhase("done");
    setProgress(null);
  };

  const copyText = async (text, setFlag) => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta);
    }
    setFlag(true); setTimeout(() => setFlag(false), 1500);
  };

  const resetAll = () => {
    setPhase("form"); setOutline(null); setSecHtml([]); setResult(null);
    setError(null); setProgress(null); setFailedIdx(null);
  };

  // Mini-checklist jakości (specyfikacja: testy Etapu 1)
  const checks = useMemo(() => {
    if (!result) return null;
    const plain = stripTags(result.html);
    const kw = countOccurrences(plain, keyword);
    const h2kw = countOccurrences((result.html.match(/<h2[^>]*>[^<]*<\/h2>/gi) || []).join(" "), keyword);
    return {
      words: result.words,
      kwTotal: kw,
      kwOk: kw <= 3,
      h2kw,
      h2kwOk: h2kw <= 2,
      emDash: (result.html.match(/[\u2014\u2013]/g) || []).length,
      sections: (result.html.match(/<h2/gi) || []).length,
      faq: result.faqItems.length,
    };
  }, [result, keyword]);

  const disabledOpt = (label, why) => (
    <option disabled value={label.toLowerCase()}>{label} ({why})</option>
  );

  const S = { // skróty stylów
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.space(2) },
    field: { marginBottom: theme.space(2) },
  };

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: phase === "form" ? "1fr" : "minmax(340px, 420px) 1fr", gap: theme.space(3), alignItems: "start" }}>
      {/* ===== Lewa kolumna: formularz (krok A) ===== */}
      <div style={{ ...ui.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: theme.space(2) }}>
          <Sparkles size={16} color={P.accentHover} />
          <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Nowy artykuł</h2>
          <span style={ui.pill(P.soft, theme.color.text)}>{P.label} · edukacyjny</span>
        </div>

        <div style={S.row2}>
          <div style={S.field}>
            <label style={ui.label}>Cel</label>
            <select value={cel} onChange={e => setCel(e.target.value)} style={ui.input} disabled={phase !== "form"}>
              <option value="sklep">Sklep (sklep.lemone.pl)</option>
              {disabledOpt("Klinika", "Etap 3")}
            </select>
          </div>
          <div style={S.field}>
            <label style={ui.label}>Typ artykułu</label>
            <select value={typ} onChange={e => setTyp(e.target.value)} style={ui.input} disabled={phase !== "form"}>
              <option value="edukacyjny">Edukacyjny</option>
              {disabledOpt("Lifestylowy", "Etap 2")}
              {disabledOpt("Ranking", "Etap 2")}
            </select>
          </div>
        </div>

        <div style={S.field}>
          <label style={ui.label}>Prompt matka (pamiętany dla: {cel} / {typ})</label>
          <textarea value={promptMatka} onChange={e => savePm(e.target.value)} rows={5} style={{ ...ui.input, resize: "vertical" }} disabled={phase !== "form"}
            placeholder="Nadrzędne wytyczne redakcji dla tej kategorii: ton, zakres, czego unikać. Wklejasz raz; zapisuje się w przeglądarce." />
        </div>

        <div style={S.row2}>
          <div style={S.field}>
            <label style={ui.label}>Fraza główna (SEO)</label>
            <input value={keyword} onChange={e => setKeyword(e.target.value)} style={ui.input} disabled={phase !== "form"} placeholder="np. pielęgnacja skóry naczynkowej" />
          </div>
          <div style={S.field}>
            <label style={ui.label}>Frazy pomocnicze</label>
            <input value={keywordsAux} onChange={e => setKeywordsAux(e.target.value)} style={ui.input} disabled={phase !== "form"} placeholder="po przecinku, opcjonalnie" />
          </div>
        </div>

        <div style={S.field}>
          <label style={ui.label}>Rozwinięcie tematu</label>
          <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={3} style={{ ...ui.input, resize: "vertical" }} disabled={phase !== "form"}
            placeholder="Temat konkretnego artykułu, kąt, grupa docelowa." />
        </div>

        <div style={S.field}>
          <label style={ui.label}>Opis zagadnienia / materiały źródłowe (opcjonalne)</label>
          <textarea value={materials} onChange={e => setMaterials(e.target.value)} rows={5} style={{ ...ui.input, resize: "vertical" }} disabled={phase !== "form"}
            placeholder="Notatki, badania, teksty producentów. Mają pierwszeństwo nad wiedzą modelu." />
        </div>

        <div style={S.row2}>
          <div style={S.field}>
            <label style={ui.label}>Długość</label>
            <select value={length} onChange={e => setLength(e.target.value)} style={ui.input} disabled={phase !== "form"}>
              {Object.entries(LENGTHS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ ...S.field, display: "flex", alignItems: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: theme.size.small + 0.5, cursor: "pointer", padding: "9px 0" }}>
              <input type="checkbox" checked={redline} onChange={e => setRedline(e.target.checked)} disabled={phase !== "form"} />
              Pass redakcyjny anti-slop (2. przebieg)
            </label>
          </div>
        </div>

        {error && phase === "form" && (
          <div style={{ ...ui.banner("danger"), marginBottom: theme.space(2) }}>
            <AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}
          </div>
        )}

        {phase === "form" && (
          <button onClick={genOutline} disabled={!canStart}
            style={{ ...ui.btnPrimary(P), ...(canStart ? {} : ui.btnDisabled) }}
            title={canStart ? "Krok B: konspekt do akceptacji" : "Wypełnij temat i frazę główną"}>
            <ChevronRight size={15} /> Generuj konspekt
          </button>
        )}
        {phase !== "form" && (
          <button onClick={resetAll} style={ui.btnSecondary}>
            <FileText size={13} /> Nowy artykuł (reset)
          </button>
        )}
      </div>

      {/* ===== Prawa kolumna: konspekt / postęp / wynik ===== */}
      {phase !== "form" && (
        <div style={{ display: "grid", gap: theme.space(2) }}>

          {phase === "outlineLoading" && (
            <div style={{ ...ui.card, display: "flex", alignItems: "center", gap: 10 }}>
              <Loader2 size={16} className="spin" color={P.accentHover} />
              <span style={{ fontSize: theme.size.body }}>Buduję konspekt...</span>
            </div>
          )}

          {(phase === "outline") && outline && (
            <div style={ui.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: theme.space(2) }}>
                <Pencil size={15} color={P.accentHover} />
                <h3 style={{ fontSize: theme.size.h3 + 1, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Konspekt do akceptacji (krok B)</h3>
              </div>
              <div style={{ marginBottom: theme.space(2) }}>
                <label style={ui.label}>Tytuł (H1)</label>
                <select value={outline.chosenH1} onChange={e => setOutline({ ...outline, chosenH1: e.target.value })} style={ui.input}>
                  {outline.h1.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
                <input value={outline.chosenH1} onChange={e => setOutline({ ...outline, chosenH1: e.target.value })} style={{ ...ui.input, marginTop: 6 }} />
                <p style={ui.help}>Wybierz propozycję albo edytuj ręcznie.</p>
              </div>
              {outline.sections.map((s, i) => (
                <div key={i} style={{ border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.control, padding: 12, marginBottom: 10 }}>
                  <label style={ui.label}>Sekcja {i + 1} (H2)</label>
                  <input value={s.h2} onChange={e => {
                    const sections = outline.sections.map((x, xi) => xi === i ? { ...x, h2: e.target.value } : x);
                    setOutline({ ...outline, sections });
                  }} style={ui.input} />
                  <label style={{ ...ui.label, marginTop: 8 }}>Teza</label>
                  <input value={s.thesis} onChange={e => {
                    const sections = outline.sections.map((x, xi) => xi === i ? { ...x, thesis: e.target.value } : x);
                    setOutline({ ...outline, sections });
                  }} style={ui.input} />
                  {s.h3 && s.h3.length > 0 && (
                    <p style={ui.help}>H3: {s.h3.join(" · ")}</p>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={startWriting} style={ui.btnPrimary(P)}>
                  <ChevronRight size={15} /> Akceptuję, pisz artykuł
                </button>
                <button onClick={genOutline} style={ui.btnSecondary}>
                  <RefreshCw size={13} /> Inny konspekt
                </button>
              </div>
            </div>
          )}

          {(phase === "writing" || phase === "finishing") && (
            <div style={ui.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: theme.space(2) }}>
                <Loader2 size={16} className="spin" color={P.accentHover} />
                <span style={{ fontSize: theme.size.body, fontWeight: 600 }}>
                  {phase === "finishing"
                    ? (redline ? "Redakcja anti-slop + pipeline (TOC, FAQ, cleanup)..." : "Pipeline: TOC, FAQ, cleanup...")
                    : `Piszę sekcję ${progress ? progress.current : "..."} z ${progress ? progress.total : "..."}`}
                </span>
              </div>
              {progress && phase === "writing" && (
                <div style={{ height: 8, background: theme.color.border, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(progress.current / progress.total) * 100}%`, background: P.accent, transition: "width .3s ease" }} />
                </div>
              )}
              {error && (
                <div style={{ ...ui.banner("danger"), marginTop: theme.space(2) }}>
                  <AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}
                  <div style={{ marginTop: 10 }}>
                    <button onClick={retryFailed} style={ui.btnSecondary}><RefreshCw size={13} /> Ponów od padłej sekcji</button>
                  </div>
                </div>
              )}
              {secHtml.length > 0 && (
                <p style={{ ...ui.help, marginTop: 10 }}>Gotowe sekcje: {secHtml.length}. Gap {SECTION_GAP_MS / 1000}s między wywołaniami (ochrona rate limit).</p>
              )}
            </div>
          )}

          {phase === "done" && result && (
            <>
              <div style={ui.banner("info")}>
                <strong>Artykuł gotowy.</strong> Przeszedł pełny pipeline Formatowania: cleanup, spis treści, FAQ jako JSON do pola CMS. Workflow: treść do pola wpisu, JSON do pola "FAQ (dane strukturalne)".
              </div>

              {checks && (
                <div style={{ ...ui.card, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <span style={ui.pill(theme.color.accentSoft, theme.color.text)}>{checks.words} słów</span>
                  <span style={ui.pill(theme.color.accentSoft, theme.color.text)}>{checks.sections} sekcji H2</span>
                  <span style={ui.pill(checks.kwOk ? theme.color.accentSoft : theme.color.warningSoft, theme.color.text)}>fraza w treści: {checks.kwTotal}x {checks.kwOk ? "" : "(limit 3)"}</span>
                  <span style={ui.pill(checks.h2kwOk ? theme.color.accentSoft : theme.color.warningSoft, theme.color.text)}>fraza w H2: {checks.h2kw}x</span>
                  <span style={ui.pill(checks.emDash === 0 ? theme.color.accentSoft : theme.color.dangerSoft, checks.emDash === 0 ? theme.color.text : theme.color.danger)}>em-dash: {checks.emDash}</span>
                  <span style={ui.pill(theme.color.accentSoft, theme.color.text)}>FAQ: {checks.faq} pytań</span>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => copyText(result.html, setCopiedArt)} style={ui.btnPrimary(P)}>
                  {copiedArt ? <Check size={14} /> : <Copy size={14} />} {copiedArt ? "Skopiowano" : "Kopiuj pełny artykuł"}
                </button>
                <button onClick={() => copyText(shared.buildFaqCmsJson(result.faqItems), setCopiedFaq)}
                  style={{ ...ui.btnSecondary, ...(result.faqItems.length ? {} : ui.btnDisabled) }}
                  disabled={!result.faqItems.length}
                  title='JSON do pola "FAQ (dane strukturalne)" w CMS'>
                  {copiedFaq ? <Check size={13} /> : <Copy size={13} />} {copiedFaq ? "Skopiowano" : "Kopiuj JSON FAQ"}
                </button>
              </div>

              <div style={{ ...ui.card, maxHeight: 520, overflow: "auto" }} className="scroll-thin">
                <p style={{ ...ui.help, margin: "0 0 10px" }}>Podgląd (H1 dodasz w CMS jako tytuł wpisu): <strong>{outline.chosenH1}</strong></p>
                <div style={{ fontSize: 14, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: result.html }} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
