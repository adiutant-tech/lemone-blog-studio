// === Lemoné Blog Studio v4.0 - moduł Generator (Etapy 1-3) ===
// Etap 1: ścieżka Sklep/Edukacyjny w pełnym przebiegu A-E (specyfikacja v4.0-v2).
// Etap 2: typy Lifestylowy i Ranking.
// Etap 3: profil Klinika (MEDLINES): prompt matka per dziedzina z src/prompts/klinika.js (edytowalny,
// z przywracaniem oryginału), zaplecze merytoryczne z web search, FAQ inline w HTML (format
// bezpieczny: zero script, CMS kliniki nieprzetestowany), notatka dla lekarza poza treścią
// i twarda bramka weryfikacji merytorycznej przed kopiowaniem.
// Moduł NIE duplikuje logiki formatowania: funkcje wspólne przychodzą przez props
// `shared` z App.jsx (normalizeDashes, buildFaqCmsJson, buildCompleteArticle,
// extractTocItems, generateFAQ), więc każda wywalczona poprawka pipeline'u
// obowiązuje też treści generowane.
// Ranking nie składa artykułu sam: buduje szkic w formacie wklejki z CMS (dwuliniowy
// tytuł produktu, link /p-*.html, zdjęcie) i przekazuje go do Formatowania przez
// `onSendToFormat`. Boxy, karty H3, ItemList, TOC i FAQ robi dojrzały pipeline.

import { useState, useEffect, useMemo } from "react";
import { Sparkles, Copy, Check, RefreshCw, AlertCircle, Loader2, Pencil, ChevronRight, ChevronUp, ChevronDown, FileText, ArrowRight, ShieldCheck, RotateCcw, Search } from "lucide-react";
import theme, { ui } from "./theme.js";
import { DZIEDZINY } from "./prompts/klinika.js";

const apiUrl = import.meta.env.VITE_API_URL || "https://api.anthropic.com/v1/messages";
const SECTION_GAP_MS = 2000; // wzorzec z boxów: rozkłada wywołania, chroni przed rate limitem
const MIN_RANKING_PRODUCTS = 3;
const EM = String.fromCharCode(0x2014); // myślnik, tylko jako przykład zakazu w promptach
const EN = String.fromCharCode(0x2013); // półpauza, j.w.
const DASH_RE = new RegExp(`[${EM}${EN}]`, "g");

// Modele do wyboru (Worker ma tę samą białą listę). Formatowanie ma własne, bez zmian.
const MODELS = {
  "claude-opus-5-5":   "Opus 5.5 (najwyższa jakość)",
  "claude-sonnet-5-5": "Sonnet 5.5 (szybszy, tańszy)",
  "claude-sonnet-4-6": "Sonnet 4.6 (poprzedni)",
};
const DEFAULT_MODEL = "claude-opus-5-5";
const WEB_SEARCH_TOOL = { type: "web_search_20260209", name: "web_search", max_uses: 5 };

// Długości artykułu: liczba sekcji H2 bez intro; w rankingu liczba sekcji poza listą produktów
const LENGTHS = {
  krotki:   { label: "Krótki (4-6 sekcji)",   sections: 5,  rankingSections: 2 },
  standard: { label: "Standard (7-9 sekcji)", sections: 8,  rankingSections: 3 },
  dlugi:    { label: "Długi (10-12 sekcji)",  sections: 11, rankingSections: 4 },
};

// Typy artykułów. redlineDefault: lifestylowy domyślnie bez passu, bo redakcja anti-slop
// spłaszcza lekki ton; można włączyć ręcznie.
const TYPES = {
  edukacyjny:  { label: "Edukacyjny",  redlineDefault: true,  sectionWords: "170-280" },
  lifestylowy: { label: "Lifestylowy", redlineDefault: false, sectionWords: "150-250" },
  ranking:     { label: "Ranking",     redlineDefault: true,  sectionWords: "120-220" },
  klinika:     { label: "Strona kliniki", redlineDefault: true, sectionWords: "200-350" },
};

// Bramka weryfikacji merytorycznej (Etap 3): wszystkie punkty muszą być potwierdzone
const GATE_CHECKS = [
  "Fakty medyczne zgodne z aktualną wiedzą i wytycznymi",
  "Leki: wskazania, przeciwwskazania, działania niepożądane i oznaczenia off-label poprawne",
  "Ciąża, karmienie i grupy szczególne opisane bezpiecznie (lub nie dotyczy)",
  "Źródła z notatki sprawdzone; twierdzenia oznaczone do weryfikacji rozstrzygnięte",
  "Brak obietnic efektów i marketingowego zawyżania skuteczności",
];

// === Warstwa 1 anti-slop: zawsze w promptach (specyfikacja 3D) ===
const ANTI_SLOP = `ZASADY STYLU (bezwzględne):
- ZAKAZ pustych otwarć: "w dzisiejszych czasach", "w dobie", "nie da się ukryć", "od zarania dziejów", "jak powszechnie wiadomo"
- ZAKAZ waty: "warto pamiętać, że", "należy podkreślić", "co ciekawe", "warto zaznaczyć"
- ZAKAZ otwierania sekcji pytaniem retorycznym jako schematu
- Listy punktowane TYLKO gdy treść jest realnym wyliczeniem; maksymalnie jedna lista na sekcję
- Każda teza poparta konkretem, przykładem lub mechanizmem działania; zero truizmów
- Zdania zróżnicowanej długości, naturalny polski, bez kalk z angielskiego
- NIGDY nie używaj myślnika "${EM}" ani półpauzy "${EN}"; wyłącznie zwykły dywiz "-"
- Zakresy liczbowe bez spacji: "2-3 godziny", "20-30 minut"
- Pisz neutralnie rodzajowo (nie "jesteś narażona/narażony"; tak: "Twoja skóra jest narażona", "jesteśmy narażeni")
- Fakty fizyczne: ekrany urządzeń emitują światło niebieskie (HEV), NIE promieniowanie UV`;

const GUARD_SKLEP = `GRANICE MERYTORYCZNE (sklep kosmetyczny, prawo kosmetyczne):
- Kosmetyk pielęgnuje, wspiera, redukuje widoczność; NIGDY nie leczy, nie usuwa chorób, nie ma działania terapeutycznego
- Claimy składnikowe tylko w granicach powszechnej wiedzy kosmetologicznej; zero wymyślonych badań i procentów skuteczności
- Suplementy: bez obietnic efektów zdrowotnych wykraczających poza dozwolone oświadczenia`;

const GUARD_KLINIKA = `GRANICE MERYTORYCZNE (strona kliniki medycznej, czytelnik: pacjent):
- Ton spokojny, lekarski; zero obietnic efektów ("gwarantujemy", "skutecznie usuwa", "trwale"), zero sensacji
- Każdą metodę leczenia opisuj ze wskazaniem, jakością dowodów (słownie: silne / umiarkowane / ograniczone / niewystarczające) i statusem off-label, jeśli dotyczy
- Nie przenoś dowodów z jednego rozpoznania na inne (np. z FPHL na telogen effluvium)
- Nie podawaj schematów dawkowania do samodzielnego stosowania; decyzję o leczeniu podejmuje lekarz
- Nigdy nie zachęcaj do samodzielnego odstawiania ani rozpoczynania leków
- Ciąża i karmienie: zawsze ostrożnie, z odesłaniem do lekarza
- Używaj nazw substancji, nie nazw handlowych leków ani marek produktów
- Nie wymyślaj liczb, odsetków, nazw badań ani wytycznych; przy niepewności formułuj ostrożnie
- Bez linków i bez przypisów w treści dla pacjenta: źródła trafiają do notatki dla lekarza`;

// === Etap 2: warstwy stylu per typ ===
const STYLE_BY_TYPE = {
  edukacyjny: "",
  klinika: "",
  lifestylowy: `STYL ARTYKUŁU LIFESTYLOWEGO:
- Ton lekki, ciepły i bliski czytelnikowi, ale rzeczowy: inspiracja zawsze kończy się czymś do zrobienia
- Osadzaj pielęgnację w realnych sytuacjach: poranek przed pracą, podróż, zmiana pory roku, wieczorny rytuał, sport
- Konkret praktyczny: kolejność kroków, czas, częstotliwość, na co zwrócić uwagę przy wyborze kategorii produktu
- Zwracaj się do czytelnika neutralnie ("Twoja skóra", "Twój rytuał"), bez form rodzajowych
- ZAKAZ egzaltacji i żargonu influencerskiego: "magiczny", "cudowny", "must-have", "absolutny hit", "game changer", "pokochasz"
- Możesz wymieniać kategorie produktów (np. "lekki krem z filtrem"), ale NIE konkretne marki, chyba że są w materiałach źródłowych`,
  ranking: `STYL ARTYKUŁU RANKINGOWEGO:
- Ton porównawczy i obiektywny: każde wyróżnienie uzasadnione cechą produktu (formuła, składnik, tekstura, przeznaczenie)
- ZAKAZ superlatyw bez pokrycia: "najlepszy na rynku", "numer jeden", "bezkonkurencyjny", "absolutny hit"
- Kryteria wyboru jawne i sprawdzalne dla czytelnika
- Kolejność produktów ustala redakcja; nie podważaj jej i nie wymyślaj własnej punktacji`,
};

const guardFor = (typ) => typ === "klinika" ? GUARD_KLINIKA : GUARD_SKLEP;

// === Wywołanie modelu przez Workera (ten sam proxy co Formatowanie) ===
// Worker ma limit max_tokens 8000. Ucięta odpowiedź (stop_reason "max_tokens") to błąd,
// nie wynik: wcześniej redakcja po cichu gubiła końcówkę artykułu.
// Przy web search obsługujemy "pause_turn" (wznowienie) i zbieramy cytowane źródła.
async function callModel(content, { model = DEFAULT_MODEL, maxTokens = 6000, effortLow = false, search = false } = {}) {
  const messages = [{ role: "user", content }];
  const texts = [];
  const sources = new Map();
  for (let round = 0; round < 4; round++) {
    const body = { model, max_tokens: maxTokens, messages };
    if (effortLow) body.output_config = { effort: "low" };
    if (search) body.tools = [WEB_SEARCH_TOOL];
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
    for (const b of data.content || []) {
      if (b.type === "text") {
        texts.push(b.text);
        for (const c of b.citations || []) if (c.url) sources.set(c.url, c.title || c.url);
      }
    }
    if (data.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: data.content });
      continue;
    }
    if (data.stop_reason === "max_tokens") throw new Error("Odpowiedź ucięta na limicie tokenów. Ponów albo skróć wejście.");
    if (data.stop_reason === "refusal") throw new Error("Model odmówił odpowiedzi (filtr bezpieczeństwa). Przeformułuj prompt albo zmień model.");
    break;
  }
  const text = texts.join(search ? "" : "\n");
  if (!text.trim()) throw new Error("Pusta odpowiedź modelu");
  return search ? { text, sources: [...sources].map(([url, title]) => ({ url, title })) } : text;
}

function parseJsonLoose(text) {
  let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = t.search(/[[{]/);
  const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (start === -1 || end === -1) throw new Error("Brak JSON w odpowiedzi");
  return JSON.parse(t.slice(start, end + 1));
}

function stripTags(html) {
  const d = new DOMParser().parseFromString(html || "", "text/html");
  return (d.body.textContent || "").replace(/\s+/g, " ").trim();
}

function stripFences(text) {
  return text.replace(/^```html?\s*/i, "").replace(/\s*```$/, "").trim();
}

function countOccurrences(text, phrase) {
  if (!phrase) return 0;
  const esc = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(esc, "gi")) || []).length;
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function lsGet(key, fallback = "") {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
}
function lsSet(key, value) {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch (e) {}
}

// === Ranking: lista produktów z formularza ===
// Linia: URL | Nazwa handlowa | Podtytuł z pojemnością | URL zdjęcia | notatki
// URL w dowolnym wariancie (pełny, /cms/, sama ścieżka) redukujemy do /p-*.html, tak jak Formatowanie.
const PRODUCT_LINE_URL_RE = /^(?:https?:\/\/(?:www\.)?sklep\.lemone\.pl)?(?:\/cms)?(\/p-[^\s?#|]+\.html)/i;

function parseProductLines(text) {
  const items = [];
  const errors = [];
  (text || "").split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const cols = line.split("|").map(x => x.trim());
    const m = (cols[0] || "").match(PRODUCT_LINE_URL_RE);
    if (!m || !cols[1]) { errors.push(i + 1); return; }
    items.push({
      url: m[1],
      name: cols[1],
      subtitle: cols[2] || "",
      img: cols[3] || "",
      notes: cols.slice(4).join(" | "),
    });
  });
  return { items, errors };
}

// Nagłówek karty w formacie wklejki z CMS: dwuliniowy tytuł (nazwa handlowa, potem podtytuł),
// osobny akapit ze zdjęciem. parseProducts w App bierze nazwę z PIERWSZEGO <strong>.
function buildProductHead(p) {
  const href = escapeHtml(p.url);
  const title = `<p><a href="${href}"><strong>${escapeHtml(p.name)}</strong></a>`
    + (p.subtitle ? `<br><a href="${href}"><strong>${escapeHtml(p.subtitle)}</strong></a>` : "")
    + `</p>`;
  const photo = p.img ? `\n<p><a href="${href}"><img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}"></a></p>` : "";
  return title + photo;
}

function productsBrief(products) {
  return products.map((p, i) =>
    `${i + 1}. ${p.name}${p.subtitle ? " (" + p.subtitle + ")" : ""}${p.notes ? "\n   Notatki: " + p.notes.slice(0, 400) : ""}`
  ).join("\n");
}

// FAQ kliniki: format bezpieczny, w treści HTML (zero script; CMS kliniki nieprzetestowany)
function buildInlineFaq(items) {
  if (!items.length) return "";
  return `<h2>Najczęściej zadawane pytania</h2>\n` + items.map(it =>
    `<h3>${escapeHtml(it.question)}</h3>\n<p>${escapeHtml(it.answer)}</p>`
  ).join("\n");
}

// === Prompty ===
const pmBlock = (f) => f.promptMatka ? "PROMPT MATKA (nadrzędne wytyczne redakcji):\n" + f.promptMatka + "\n\n" : "";
const materialsLimit = (f) => f.typ === "klinika" ? 30000 : 6000;
const materialsBlock = (f, lead) => f.materials ? `\n${lead}\n` + f.materials.slice(0, materialsLimit(f)) : "";
const researchBlock = (f) => f.research ? `\nZAPLECZE MERYTORYCZNE (zebrane z aktualnych źródeł; fakty medyczne opieraj na nim):\n${f.research.text.slice(0, 20000)}\n` : "";

const OUTLINE_ROLE = {
  edukacyjny: "Przygotuj KONSPEKT artykułu edukacyjnego.",
  lifestylowy: "Przygotuj KONSPEKT artykułu lifestylowego: pielęgnacja osadzona w stylu życia, rytuałach i sytuacjach dnia codziennego. Artykuł ma inspirować i jednocześnie dawać konkretne, wykonalne wskazówki.",
  ranking: "Przygotuj KONSPEKT artykułu rankingowego (zestawienie polecanych produktów ze sklepu).",
  klinika: "Przygotuj KONSPEKT podstrony kliniki na podany temat, zgodnie z promptem matką. Kolejność sekcji sensowna dla pacjenta: mechanizm, rozpoznanie, leczenie w hierarchii (przyczynowe, farmakoterapia, korekta niedoborów, wspomagające, zabiegi), kiedy do lekarza. FAQ i notatka dla lekarza powstają osobno: NIE dawaj ich jako sekcji.",
};

function buildOutlinePrompt(f) {
  const isRanking = f.typ === "ranking";
  const n = isRanking ? LENGTHS[f.length].rankingSections : LENGTHS[f.length].sections;
  const lastSection = {
    lifestylowy: "ostatnia sekcja ma wnosić treść, np. gotowy rytuał krok po kroku albo plan na tydzień",
    klinika: "ostatnia sekcja ma wnosić treść, np. algorytm postępowania albo informację, kiedy zgłosić się do lekarza",
  }[f.typ] || "ostatnia sekcja ma wnosić treść, np. praktyczne wnioski lub tabelę decyzyjną";
  const countRule = f.typ === "klinika"
    ? `- Dokładnie ${n} sekcji H2; bez "Podsumowania" jako pustego rytuału; ${lastSection}`
    : `- Dokładnie ${n} sekcji H2 (bez sekcji FAQ i bez "Podsumowania" jako pustego rytuału; ${lastSection})`;
  const rankingReq = isRanking ? `
PRODUKTY W RANKINGU (kolejność ustalona przez redakcję, NIE zmieniaj jej):
${productsBrief(f.products)}

WYMAGANIA SPECJALNE RANKINGU:
- Poza listą produktów dokładnie ${n} sekcji H2: co najmniej jedna PRZED listą (kryteria wyboru, na co zwrócić uwagę) i co najmniej jedna PO liście (jak dobrać produkt do potrzeb, jak stosować)
- Lista produktów to osobny element w "sections": {"kind":"ranking","h2":"..."} wstawiony w odpowiednie miejsce
- Dla KAŻDEGO produktu, w tej samej kolejności, krótka etykieta "bestFor": dla kogo / do czego najlepszy (max 8 słów, bez superlatyw), oparta na nazwie, podtytule i notatkach
` : "";
  const json = isRanking
    ? `{"h1":["...","...","..."],"sections":[{"h2":"...","h3":["..."],"thesis":"..."},{"kind":"ranking","h2":"..."},{"h2":"...","h3":[],"thesis":"..."}],"products":[{"bestFor":"..."}]}`
    : `{"h1":["...","...","..."],"sections":[{"h2":"...","h3":["..."],"thesis":"..."}]}`;
  const who = f.typ === "klinika"
    ? "Jesteś redaktorem medycznym strony kliniki MEDLINES, piszącym dla pacjentów pod nadzorem lekarzy."
    : "Jesteś redaktorem prowadzącym polskiego bloga kosmetyczno-zdrowotnego Lemoné (sklep.lemone.pl).";
  return `${pmBlock(f)}${who} ${OUTLINE_ROLE[f.typ]}

TEMAT I KĄT: ${f.topic}
FRAZA GŁÓWNA (SEO): ${f.keyword}
${f.keywordsAux ? "FRAZY POMOCNICZE: " + f.keywordsAux : ""}
${materialsBlock(f, "MATERIAŁY ŹRÓDŁOWE (mają PIERWSZEŃSTWO nad Twoją wiedzą; nie wychodź poza nie w faktach spornych):")}
${researchBlock(f)}
${rankingReq}
WYMAGANIA KONSPEKTU:
${isRanking ? "" : countRule + "\n"}- Fraza główna w maksymalnie JEDNYM nagłówku H2
- Dla każdej sekcji: tytuł H2, opcjonalnie 2-3 H3, jedno zdanie tezy (co sekcja udowadnia/daje czytelnikowi)
- 3 propozycje H1 (różne kąty, każdy z frazą główną, bez clickbaitu${isRanking ? "; liczba produktów w tytule dozwolona" : ""})

${ANTI_SLOP}

${STYLE_BY_TYPE[f.typ]}

${guardFor(f.typ)}

ZWRÓĆ WYŁĄCZNIE JSON, bez markdown:
${json}`;
}

function articleContext(f, outline) {
  const kind = { edukacyjny: "artykuł edukacyjny na blog Lemoné (polski, branża kosmetyczna)", lifestylowy: "artykuł lifestylowy na blog Lemoné (polski, branża kosmetyczna)", ranking: "artykuł rankingowy na blog Lemoné (polski, branża kosmetyczna)", klinika: "podstronę kliniki medycznej MEDLINES dla pacjentów" }[f.typ];
  const productsLine = f.typ === "ranking"
    ? "\nPRODUKTY Z RANKINGU (odwołuj się do nich WYŁĄCZNIE tymi nazwami, bez linków): " + outline.products.map(p => p.name).join("; ")
    : "";
  return `${pmBlock(f)}Piszesz ${kind}.
TYTUŁ (H1, nie powtarzaj go w treści): ${outline.chosenH1}
FRAZA GŁÓWNA: ${f.keyword}${f.keywordsAux ? "\nFRAZY POMOCNICZE (wplataj naturalnie, bez upychania): " + f.keywordsAux : ""}${productsLine}
${f.typ === "klinika" ? "TEMAT PODSTRONY: " + f.topic + "\n" : ""}${materialsBlock(f, "MATERIAŁY ŹRÓDŁOWE (pierwszeństwo nad Twoją wiedzą):")}${researchBlock(f)}`;
}

function buildSectionPrompt(f, outline, unit, prevExcerpt) {
  const isIntro = unit.kind === "intro";
  const sec = unit.sec;
  const header = isIntro
    ? `Napisz LEAD (2-3 akapity <p>, bez żadnego nagłówka): zapowiedź tematu i obietnica wartości${f.typ === "klinika" ? " (wartości informacyjnej, nie efektu leczenia)" : ""}. Fraza główna dokładnie RAZ, naturalnie.${f.typ === "ranking" ? " Zapowiedz, ile produktów obejmuje zestawienie i według jakich kryteriów je dobrano." : ""}`
    : `Napisz sekcję:
H2: ${sec.h2}
${sec.h3 && sec.h3.length ? "H3 do użycia (wszystkie): " + sec.h3.join(" | ") : "Bez H3."}
TEZA SEKCJI: ${sec.thesis}${f.typ === "klinika" ? "\nRealizuj wyłącznie tezę tej sekcji; nie uprzedzaj kolejnych sekcji." : ""}`;
  const tags = isIntro ? "<p>" : `<h2>, opcjonalnie <h3>,${f.typ === "klinika" ? " <table> (tylko gdy tabela realnie porządkuje treść)," : ""}`;
  return `${articleContext(f, outline)}
${prevExcerpt ? "\nKONIEC POPRZEDNIEJ SEKCJI (dla ciągłości; NIE powtarzaj tych treści):\n..." + prevExcerpt : ""}

${header}

WYMAGANIA:
- Czysty HTML: ${tags} <p>, <strong>, <ul><li> (lista tylko jeśli konieczna)
- ${isIntro ? "80-130" : TYPES[f.typ].sectionWords} słów
- Fraza główna w tej sekcji maksymalnie ${isIntro ? "1 raz" : "1 raz, a jeśli jest w H2, to w treści wcale"}
- Bez odnośników, bez obrazków, bez FAQ, bez podsumowywania całości

${ANTI_SLOP}

${STYLE_BY_TYPE[f.typ]}

${guardFor(f.typ)}

ZWRÓĆ WYŁĄCZNIE HTML sekcji, bez komentarzy i bez markdown.`;
}

function buildRankingIntroPrompt(f, outline, unit, prevExcerpt) {
  return `${articleContext(f, outline)}
${prevExcerpt ? "\nKONIEC POPRZEDNIEJ SEKCJI (dla ciągłości; NIE powtarzaj tych treści):\n..." + prevExcerpt : ""}

Napisz OTWARCIE sekcji z listą produktów:
<h2>${unit.h2}</h2>
i pod nim JEDEN akapit <p> (40-80 słów): co łączy produkty w zestawieniu i jak czytać listę. Nie opisuj jeszcze żadnego produktu.

${ANTI_SLOP}

${STYLE_BY_TYPE.ranking}

ZWRÓĆ WYŁĄCZNIE HTML (<h2> + <p>), bez komentarzy i bez markdown.`;
}

function buildProductPrompt(f, outline, unit) {
  const p = unit.product;
  return `${articleContext(f, outline)}

Napisz OPIS PRODUKTU w rankingu (pozycja ${unit.rank} z ${outline.products.length}).
PRODUKT: ${p.name}${p.subtitle ? "\nPODTYTUŁ: " + p.subtitle : ""}
ETYKIETA REDAKCJI (dla kogo / do czego): ${p.bestFor || "(brak, wywnioskuj ostrożnie z nazwy i podtytułu)"}
${p.notes ? "NOTATKI O PRODUKCIE (jedyne źródło faktów o składzie i działaniu):\n" + p.notes : "BRAK NOTATEK: nie wymieniaj żadnych konkretnych składników ani stężeń; opisz przeznaczenie wyłącznie na podstawie nazwy, podtytułu i etykiety."}

WYMAGANIA:
- 2 akapity <p>, łącznie 90-150 słów; bez nagłówków, bez list, bez linków, bez obrazków
- Akapit 1: dla kogo i do jakiej sytuacji; akapit 2: co wyróżnia produkt na tle reszty zestawienia i jak go włączyć do pielęgnacji
- Nazwę produktu użyj najwyżej raz; nie powtarzaj podtytułu dosłownie
- NIE używaj frazy głównej "${f.keyword}"
- Bez wyliczanki "Dla kogo / Dlaczego warto": te boxy dokłada Formatowanie; tu wyłącznie proza

${ANTI_SLOP}

${STYLE_BY_TYPE.ranking}

${GUARD_SKLEP}

ZWRÓĆ WYŁĄCZNIE HTML (dwa <p>), bez komentarzy i bez markdown.`;
}

// Redakcja sekcja po sekcji: każda odpowiedź mieści się w limicie Workera,
// a karty produktów w rankingu w ogóle nie trafiają do redakcji.
function buildRedlinePrompt(html, f) {
  const typeRule = {
    edukacyjny: "",
    ranking: "",
    lifestylowy: "\n- Zachowaj lekki, ciepły ton i scenki z życia; tnij watę i egzaltację, nie osobowość tekstu",
    klinika: "\n- NIE zmieniaj treści medycznej: wskazań, przeciwwskazań, ocen jakości dowodów, oznaczeń off-label, ostrzeżeń; redagujesz wyłącznie styl",
  }[f.typ];
  return `Jesteś bezlitosnym redaktorem. Dostajesz JEDEN fragment artykułu w HTML (lead albo sekcję). Zrób pass redakcyjny:
- Wytnij każdy slop: puste otwarcia, watę ("warto pamiętać"), truizmy, powtórzenia
- Skróć zdania przegadane, skonkretyzuj ogólniki (jeśli brak konkretu w tekście, przeformułuj na ostrożne, ale treściwe)
- NIE zmieniaj: nagłówków H2/H3, kolejności akapitów, faktów, frazy głównej "${f.keyword}" (jej liczba wystąpień ma nie wzrosnąć)
- NIE dodawaj nowych akapitów, sekcji ani list
- Zachowaj HTML; każde "${EM}" i "${EN}" zamień na "-"; zakresy liczbowe bez spacji (2-3)${typeRule}

${ANTI_SLOP}

FRAGMENT:
${html}

ZWRÓĆ WYŁĄCZNIE poprawiony HTML fragmentu, bez komentarzy.`;
}

// === Etap 3: prompty specyficzne dla kliniki ===
function buildResearchPrompt(f) {
  return `${pmBlock(f)}Zbierasz ZAPLECZE MERYTORYCZNE do podstrony kliniki. Użyj wyszukiwarki, aby zweryfikować kluczowe fakty w aktualnych, wiarygodnych źródłach: wytyczne i stanowiska towarzystw naukowych, PubMed/MEDLINE, przeglądy systematyczne, metaanalizy, RCT, DermNet, AAD, EADV, BAD. NIE korzystaj z materiałów marketingowych producentów ani stron komercyjnych klinik.

TEMAT PODSTRONY:
${f.topic}
FRAZA GŁÓWNA: ${f.keyword}
${materialsBlock(f, "MATERIAŁY REDAKCJI (punkt wyjścia; zweryfikuj je):")}

ZWRÓĆ zwięzłe zaplecze (maks. ok. 900 słów), w punktach, pogrupowane według zagadnień tematu: mechanizm, rozpoznanie, leczenie, bezpieczeństwo. Przy każdej metodzie leczenia: jakość dowodów i status off-label. Zaznacz rozbieżności między źródłami i obszary niepewne. Bez wstępu i bez zakończenia.`;
}

function buildClinicFaqPrompt(f, outline, bodyText) {
  return `${pmBlock(f)}Przygotuj FAQ do podstrony kliniki "${outline.chosenH1}": 6 pytań, które pacjent realnie zadaje (lub wpisuje w Google), z odpowiedziami.

TEMAT PODSTRONY:
${f.topic}

TREŚĆ PODSTRONY (nie powtarzaj jej dosłownie; FAQ ma ją uzupełniać):
${bodyText.slice(0, 12000)}

WYMAGANIA:
- Odpowiedź 40-90 słów, konkretna, zgodna z treścią podstrony; bez obietnic efektów
- Nie zaczynaj od "Tak,"/"Nie,"
- Bez linków i bez nazw handlowych

${ANTI_SLOP}

${GUARD_KLINIKA}

ZWRÓĆ WYŁĄCZNIE JSON: [{"question":"...","answer":"..."}]`;
}

function buildDoctorNotePrompt(f, outline, bodyText, sources) {
  const list = sources.length
    ? sources.map((s, i) => `[${i + 1}] ${s.title} - ${s.url}`).join("\n")
    : "(brak źródeł z wyszukiwania)";
  return `Przygotuj NOTATKĘ MERYTORYCZNĄ DLA LEKARZA weryfikującego podstronę kliniki "${outline.chosenH1}". Notatka NIE jest publikowana; służy weryfikacji przed publikacją.

TEMAT PODSTRONY:
${f.topic}

TREŚĆ PODSTRONY:
${bodyText.slice(0, 16000)}
${researchBlock(f)}
ŹRÓDŁA Z WYSZUKIWANIA (jedyne, które wolno podać jako zweryfikowane):
${list}

STRUKTURA (HTML: <h3>, <p>, <ul><li>, opcjonalnie <table>):
1. Ocena jakości dowodów dla każdej metody opisanej w treści (silne / umiarkowane / ograniczone / niewystarczające)
2. Zastosowania off-label wymienione w treści
3. Punkty wymagające szczególnej ostrożności (ciąża, karmienie, przeciwwskazania, interakcje, grupy szczególne)
4. Twierdzenia do weryfikacji: konkretne zdania z treści, które lekarz musi potwierdzić, z krótkim uzasadnieniem
5. Źródła: wyłącznie z listy powyżej, z numerem i adresem URL. Jeśli brakuje źródła dla ważnego twierdzenia, wpisz je w punkcie 4 jako "brak źródła". NIE dopisuj źródeł z pamięci.

Pisz zwięźle, językiem lekarskim. ZWRÓĆ WYŁĄCZNIE HTML, bez markdown.`;
}

// Kolejka jednostek pisania: intro, sekcje, a w rankingu otwarcie listy + karta na produkt.
function buildUnits(outline) {
  const units = [{ kind: "intro" }];
  for (const sec of outline.sections) {
    if (sec.kind === "ranking") {
      units.push({ kind: "rankingIntro", h2: sec.h2 });
      outline.products.forEach((product, i) => units.push({ kind: "product", product, rank: i + 1 }));
    } else {
      units.push({ kind: "section", sec });
    }
  }
  return units;
}

const unitLabel = (u) => ({
  intro: "lead",
  section: `sekcja "${u.sec?.h2}"`,
  rankingIntro: "otwarcie listy",
  product: `produkt ${u.rank}: ${u.product?.name}`,
}[u.kind]);

const nowStamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// === Komponent ===
export default function Generator({ shared, onSendToFormat }) {
  // Krok A: formularz
  const [cel, setCel] = useState("sklep");
  const [typSklep, setTypSklep] = useState("edukacyjny");
  const typ = cel === "klinika" ? "klinika" : typSklep;
  const isKlinika = cel === "klinika";
  const P = theme.profile[cel];

  const [promptMatka, setPromptMatka] = useState("");
  const [keyword, setKeyword] = useState("");
  const [keywordsAux, setKeywordsAux] = useState("");
  const [topic, setTopic] = useState("");
  const [materials, setMaterials] = useState("");
  const [productsText, setProductsText] = useState("");
  const [length, setLength] = useState("standard");
  const [redline, setRedline] = useState(TYPES.edukacyjny.redlineDefault);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [webSearch, setWebSearch] = useState(true);

  // Klinika: dziedzina (każda ma własny prompt matka)
  const [dziedzina, setDziedzina] = useState("trychologia");
  const dz = DZIEDZINY[dziedzina];

  useEffect(() => { setRedline(TYPES[typ].redlineDefault); }, [typ]);

  // Model: pamięć per cel
  const modelKey = `lemone_gen_model_${cel}`;
  useEffect(() => {
    const m = lsGet(modelKey, DEFAULT_MODEL);
    setModel(MODELS[m] ? m : DEFAULT_MODEL);
  }, [modelKey]);
  const saveModel = (v) => { setModel(v); lsSet(modelKey, v); };

  // Prompt matka: sklep pamięta per cel+typ; klinika ma domyślny z pliku dziedziny + edycja
  const pmKey = isKlinika ? `lemone_kl_pm_${dziedzina}` : `lemone_gen_pm_${cel}_${typ}`;
  const pmDefault = isKlinika ? dz.promptMatka : "";
  useEffect(() => { setPromptMatka(lsGet(pmKey, pmDefault)); }, [pmKey, pmDefault]);
  const savePm = (v) => { setPromptMatka(v); lsSet(pmKey, v); };
  const pmEdited = isKlinika && promptMatka !== dz.promptMatka;

  const isRanking = typ === "ranking";
  const parsedProducts = useMemo(() => parseProductLines(productsText), [productsText]);

  // Przebieg
  const [phase, setPhase] = useState("form"); // form | research | outlineLoading | outline | writing | finishing | done
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [research, setResearch] = useState(null); // {text, sources[]}
  const [outline, setOutline] = useState(null); // {h1:[], chosenH1, sections:[{h2,h3[],thesis}|{kind:"ranking",h2}], products?:[]}
  const [secHtml, setSecHtml] = useState([]);   // HTML per jednostka z buildUnits
  const [progress, setProgress] = useState(null); // {current,total,label}
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState(null);   // {html, faqItems, words, draft, note, sources}
  const [copiedArt, setCopiedArt] = useState(false);
  const [copiedFaq, setCopiedFaq] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  // Bramka weryfikacji
  const [verifier, setVerifier] = useState(() => lsGet("lemone_kl_verifier", "Agnieszka"));
  const [gate, setGate] = useState(GATE_CHECKS.map(() => false));
  const [verified, setVerified] = useState(null); // {by, at}

  const productsOk = !isRanking || (parsedProducts.items.length >= MIN_RANKING_PRODUCTS && parsedProducts.errors.length === 0);
  const canStart = topic.trim() && keyword.trim() && productsOk;
  const formData = (extra = {}) => ({
    typ, promptMatka, keyword, keywordsAux, topic, materials, length,
    products: parsedProducts.items, research, ...extra,
  });
  const opts = (o = {}) => ({ model, ...o });

  const runResearch = async () => {
    setPhase("research");
    try {
      const r = await callModel(buildResearchPrompt(formData()), opts({ maxTokens: 8000, search: true }));
      setResearch(r);
      return r;
    } catch (e) {
      setWarning(`Web search nie zadziałał (${e.message}). Tekst powstaje bez zaplecza ze źródeł; notatka dla lekarza nie będzie miała zweryfikowanych źródeł.`);
      setResearch(null);
      return null;
    }
  };

  const genOutline = async () => {
    setError(null); setWarning(null);
    try {
      let r = research;
      if (isKlinika && webSearch && !research) r = await runResearch();
      setPhase("outlineLoading");
      const f = formData({ research: r });
      const txt = await callModel(buildOutlinePrompt(f), opts({ maxTokens: 6000, effortLow: true }));
      const j = parseJsonLoose(txt);
      if (!j.h1?.length || !j.sections?.length) throw new Error("Konspekt niekompletny");
      let sections = j.sections;
      let products;
      if (isRanking) {
        // Model ma wstawić element listy; jeśli go zgubił, lista idzie po pierwszej sekcji (kryteria).
        if (!sections.some(s => s.kind === "ranking")) {
          sections = [...sections.slice(0, 1), { kind: "ranking", h2: `Ranking: ${keyword}` }, ...sections.slice(1)];
        }
        sections = sections.filter((s, i, arr) => s.kind !== "ranking" || arr.findIndex(x => x.kind === "ranking") === i);
        products = f.products.map((p, i) => ({ ...p, bestFor: j.products?.[i]?.bestFor || "" }));
      } else {
        sections = sections.filter(s => s.kind !== "ranking");
      }
      setOutline({ h1: j.h1, chosenH1: j.h1[0], sections, products });
      setPhase("outline");
    } catch (e) { setError(e.message || String(e)); setPhase("form"); }
  };

  const writeUnit = async (unit, prevHtml) => {
    const f = formData();
    const prevExcerpt = prevHtml ? stripTags(prevHtml).slice(-300) : "";
    if (unit.kind === "product") {
      const prose = stripFences(await callModel(buildProductPrompt(f, outline, unit), opts({ maxTokens: 3000 })));
      return `<div class="product">${buildProductHead(unit.product)}\n${prose}\n</div>`;
    }
    const prompt = unit.kind === "rankingIntro"
      ? buildRankingIntroPrompt(f, outline, unit, prevExcerpt)
      : buildSectionPrompt(f, outline, unit, prevExcerpt);
    return stripFences(await callModel(prompt, opts({ maxTokens: 6000 })));
  };

  // Pisze jednostki od `parts.length` do końca; wspólne dla startu i ponowienia.
  const writeFrom = async (parts) => {
    const units = buildUnits(outline);
    const total = units.length;
    try {
      for (let i = parts.length; i < total; i++) {
        setProgress({ current: i + 1, total, label: "Piszę" });
        const html = await writeUnit(units[i], parts[parts.length - 1]);
        parts.push(html);
        setSecHtml([...parts]);
        if (i < total - 1) await new Promise(r => setTimeout(r, SECTION_GAP_MS));
      }
    } catch (e) {
      setFailed(true);
      setError(`Padło: ${unitLabel(units[parts.length])} (${parts.length + 1}/${total}): ${e.message}. Możesz ponowić od tego miejsca.`);
      return;
    }
    setFailed(false);
    await finishPipeline(parts, units);
  };

  const startWriting = async () => {
    setError(null); setFailed(false); setPhase("writing");
    setSecHtml([]);
    await writeFrom([]);
  };

  const retryFailed = async () => {
    setError(null);
    await writeFrom([...secHtml]);
  };

  // Redakcja sekcja po sekcji; karty produktów (ranking) pomijane
  const redlineParts = async (parts, units, f) => {
    const out = [...parts];
    const todo = units.map((u, i) => i).filter(i => units[i].kind !== "product");
    for (let k = 0; k < todo.length; k++) {
      const i = todo[k];
      setProgress({ current: k + 1, total: todo.length, label: "Redakcja" });
      out[i] = stripFences(await callModel(buildRedlinePrompt(parts[i], f), opts({ maxTokens: 6000, effortLow: true })));
      if (k < todo.length - 1) await new Promise(r => setTimeout(r, SECTION_GAP_MS));
    }
    return out;
  };

  const finishPipeline = async (parts, units) => {
    setPhase("finishing");
    const f = formData();
    try {
      const edited = redline ? await redlineParts(parts, units, f) : parts;
      setProgress(null);
      const body = shared.normalizeDashes(edited.join("\n"));
      if (f.typ === "ranking") {
        const words = stripTags(body).split(/\s+/).filter(Boolean).length;
        setResult({ html: body, faqItems: [], words, draft: true });
      } else if (f.typ === "klinika") {
        const bodyText = stripTags(body);
        setProgress({ current: 1, total: 2, label: "FAQ i notatka dla lekarza" });
        let faqItems = [];
        try {
          const j = parseJsonLoose(await callModel(buildClinicFaqPrompt(f, outline, bodyText), opts({ maxTokens: 4000, effortLow: true })));
          faqItems = (Array.isArray(j) ? j : []).filter(x => x && x.question && x.answer)
            .map(x => ({ question: shared.normalizeDashes(x.question), answer: shared.normalizeDashes(x.answer) }));
        } catch (e) { setWarning(`FAQ nie powstało (${e.message}); podstrona bez FAQ.`); }
        const html = body + (faqItems.length ? "\n" + buildInlineFaq(faqItems) : "");
        setProgress({ current: 2, total: 2, label: "FAQ i notatka dla lekarza" });
        const sources = research?.sources || [];
        const note = shared.normalizeDashes(stripFences(await callModel(buildDoctorNotePrompt(f, outline, bodyText, sources), opts({ maxTokens: 8000 }))));
        const words = stripTags(html).split(/\s+/).filter(Boolean).length;
        setGate(GATE_CHECKS.map(() => false));
        setVerified(null);
        setResult({ html, faqItems, words, draft: false, note, sources });
      } else {
        // Normalizacja całości (pipeline normalizuje FAQ i boxy, body artykułu robimy tu)
        const toc = shared.extractTocItems(body);
        let faqItems = [];
        try {
          faqItems = await shared.generateFAQ({ products: [], tocItems: toc, articleHtml: body });
        } catch (e) { /* FAQ opcjonalne: artykuł bez FAQ nadal ma wartość */ }
        // Pełny pipeline formatowania: TOC, cleanup, kotwice; zero boxów (ścieżka bez produktów)
        const finalHtml = shared.buildCompleteArticle(body, [], {}, toc, faqItems);
        const words = stripTags(finalHtml).split(/\s+/).filter(Boolean).length;
        setResult({ html: finalHtml, faqItems, words, draft: false });
      }
      setPhase("done");
    } catch (e) {
      setFailed(false);
      setError(`Etap końcowy padł: ${e.message}`);
      setPhase("writing");
    }
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
    setPhase("form"); setOutline(null); setSecHtml([]); setResult(null); setResearch(null);
    setError(null); setWarning(null); setProgress(null); setFailed(false);
    setVerified(null); setGate(GATE_CHECKS.map(() => false));
  };

  const approve = () => {
    lsSet("lemone_kl_verifier", verifier.trim());
    setVerified({ by: verifier.trim(), at: nowStamp() });
  };
  const gateReady = gate.every(Boolean) && verifier.trim();
  const locked = isKlinika && result && !verified;

  // Mini-checklist jakości (specyfikacja: testy Etapu 1); w rankingu bez kart produktów
  const checks = useMemo(() => {
    if (!result) return null;
    const editorial = result.draft
      ? result.html.replace(/<div class="product">[\s\S]*?<\/div>/g, "")
      : result.html;
    const plain = stripTags(editorial);
    const kw = countOccurrences(plain, keyword);
    const h2kw = countOccurrences((result.html.match(/<h2[^>]*>[^<]*<\/h2>/gi) || []).join(" "), keyword);
    return {
      words: result.words,
      kwTotal: kw,
      kwOk: kw <= 3,
      h2kw,
      h2kwOk: h2kw <= 2,
      emDash: (result.html.match(DASH_RE) || []).length,
      sections: (result.html.match(/<h2/gi) || []).length,
      faq: result.faqItems.length,
      products: result.draft ? (result.html.match(/<div class="product">/g) || []).length : null,
    };
  }, [result, keyword]);

  const disabledOpt = (label, why) => (
    <option disabled value={label.toLowerCase()}>{label} ({why})</option>
  );

  const updateSection = (i, patch) => {
    const sections = outline.sections.map((x, xi) => xi === i ? { ...x, ...patch } : x);
    setOutline({ ...outline, sections });
  };
  const updateProduct = (i, patch) => {
    const products = outline.products.map((x, xi) => xi === i ? { ...x, ...patch } : x);
    setOutline({ ...outline, products });
  };
  const moveProduct = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= outline.products.length) return;
    const products = [...outline.products];
    [products[i], products[j]] = [products[j], products[i]];
    setOutline({ ...outline, products });
  };

  const S = { // skróty stylów
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.space(2) },
    field: { marginBottom: theme.space(2) },
    box: { border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.control, padding: 12, marginBottom: 10 },
    iconBtn: { ...ui.btnSecondary, padding: "4px 6px" },
    linkBtn: { ...ui.btnSecondary, padding: "3px 8px", fontSize: theme.size.small },
    labelRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  };

  const totalUnits = outline ? buildUnits(outline).length : 0;
  const formLocked = phase !== "form";

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: phase === "form" ? "1fr" : "minmax(340px, 420px) 1fr", gap: theme.space(3), alignItems: "start" }}>
      {/* ===== Lewa kolumna: formularz (krok A) ===== */}
      <div style={{ ...ui.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: theme.space(2) }}>
          <Sparkles size={16} color={P.accentHover} />
          <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Nowy artykuł</h2>
          <span style={ui.pill(P.soft, theme.color.text)}>{P.label} · {isKlinika ? dz.label.toLowerCase() : TYPES[typ].label.toLowerCase()}</span>
        </div>

        <div style={S.row2}>
          <div style={S.field}>
            <label style={ui.label}>Cel</label>
            <select value={cel} onChange={e => setCel(e.target.value)} style={ui.input} disabled={formLocked}>
              <option value="sklep">Sklep (sklep.lemone.pl)</option>
              <option value="klinika">Klinika (MEDLINES)</option>
            </select>
          </div>
          {isKlinika ? (
            <div style={S.field}>
              <label style={ui.label}>Dziedzina</label>
              <select value={dziedzina} onChange={e => setDziedzina(e.target.value)} style={ui.input} disabled={formLocked}>
                {Object.entries(DZIEDZINY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          ) : (
            <div style={S.field}>
              <label style={ui.label}>Typ artykułu</label>
              <select value={typSklep} onChange={e => setTypSklep(e.target.value)} style={ui.input} disabled={formLocked}>
                {["edukacyjny", "lifestylowy", "ranking"].map(k => <option key={k} value={k}>{TYPES[k].label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={S.field}>
          <label style={ui.label}>Model</label>
          <select value={model} onChange={e => saveModel(e.target.value)} style={ui.input} disabled={formLocked}>
            {Object.entries(MODELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div style={S.field}>
          <div style={S.labelRow}>
            <label style={ui.label}>
              {isKlinika ? `Prompt matka (dziedzina: ${dz.label})` : `Prompt matka (pamiętany dla: ${cel} / ${typ})`}
              {pmEdited && <span style={{ ...ui.pill(theme.color.warningSoft, theme.color.text), marginLeft: 6 }}>zmieniony</span>}
            </label>
            {pmEdited && !formLocked && (
              <button onClick={() => { setPromptMatka(dz.promptMatka); lsSet(pmKey, null); }} style={S.linkBtn}>
                <RotateCcw size={11} /> Przywróć oryginał
              </button>
            )}
          </div>
          <textarea value={promptMatka} onChange={e => savePm(e.target.value)} rows={isKlinika ? 8 : 5} style={{ ...ui.input, resize: "vertical" }} disabled={formLocked}
            placeholder="Nadrzędne wytyczne redakcji dla tej kategorii: ton, zakres, czego unikać. Wklejasz raz; zapisuje się w przeglądarce." />
          {isKlinika && <p style={ui.help}>Zmiany zapisują się w tej przeglądarce. Oryginał jest w repo (src/prompts/klinika.js).</p>}
        </div>

          <div style={S.row2}>
            <div style={S.field}>
              <label style={ui.label}>Fraza główna (SEO)</label>
              <input value={keyword} onChange={e => setKeyword(e.target.value)} style={ui.input} disabled={formLocked}
                placeholder={isRanking ? "np. najlepszy krem do skóry naczynkowej" : "np. pielęgnacja skóry naczynkowej"} />
            </div>
            <div style={S.field}>
              <label style={ui.label}>Frazy pomocnicze</label>
              <input value={keywordsAux} onChange={e => setKeywordsAux(e.target.value)} style={ui.input} disabled={formLocked} placeholder="po przecinku, opcjonalnie" />
            </div>
          </div>

        <div style={S.field}>
          <label style={ui.label}>Rozwinięcie tematu</label>
          <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={isKlinika ? 5 : 3} style={{ ...ui.input, resize: "vertical" }} disabled={formLocked}
            placeholder={isKlinika
              ? "Temat podstrony i co ma obejmować, np. telogenowe wypadanie włosów: mechanizm, czynniki wyzwalające, rozpoznanie, leczenie w kolejności, czas odrostu."
              : (typ === "lifestylowy" ? "Sytuacja, sezon albo rytuał, wokół którego budujemy tekst; grupa docelowa." : "Temat konkretnego artykułu, kąt, grupa docelowa.")} />
        </div>

        {isRanking && (
          <div style={S.field}>
            <label style={ui.label}>Produkty w rankingu (min. {MIN_RANKING_PRODUCTS}, kolejność = pozycja)</label>
            <textarea value={productsText} onChange={e => setProductsText(e.target.value)} rows={6} style={{ ...ui.input, resize: "vertical", fontFamily: theme.font.mono, fontSize: 12 }} disabled={formLocked}
              placeholder={"Jeden produkt w linii:\nURL | Nazwa handlowa | Podtytuł z pojemnością | URL zdjęcia | notatki (składniki, działanie)\n\n/p-marka-krem-123.html | Marka Krem X | Krem kojący do skóry naczynkowej 50 ml | /media/images/.../original.webp | niacynamid 4%, wyciąg z wąkrotki"} />
            <p style={ui.help}>
              Rozpoznane: {parsedProducts.items.length}
              {parsedProducts.errors.length > 0 && <span style={{ color: theme.color.danger }}> · błędne linie: {parsedProducts.errors.join(", ")} (brak URL /p-*.html albo nazwy)</span>}
              . Zdjęcie i notatki opcjonalne; bez notatek opis nie wymienia składników.
            </p>
          </div>
        )}

        <div style={S.field}>
          <label style={ui.label}>Opis zagadnienia / materiały źródłowe (opcjonalne)</label>
          <textarea value={materials} onChange={e => setMaterials(e.target.value)} rows={5} style={{ ...ui.input, resize: "vertical" }} disabled={formLocked}
            placeholder="Notatki, badania, teksty producentów. Mają pierwszeństwo nad wiedzą modelu." />
          {isKlinika && <p style={ui.help}>Limit {materialsLimit({ typ }).toLocaleString("pl-PL")} znaków.</p>}
        </div>

          <div style={S.row2}>
            <div style={S.field}>
              <label style={ui.label}>Długość</label>
              <select value={length} onChange={e => setLength(e.target.value)} style={ui.input} disabled={formLocked}>
                {Object.entries(LENGTHS).map(([k, v]) => (
                  <option key={k} value={k}>{isRanking ? `${v.label.split(" (")[0]} (${v.rankingSections} sekcje + lista)` : v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ ...S.field, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: theme.size.small + 0.5, cursor: "pointer", padding: "4px 0" }}>
                <input type="checkbox" checked={redline} onChange={e => setRedline(e.target.checked)} disabled={formLocked} />
                Pass redakcyjny anti-slop (2. przebieg)
              </label>
              {isKlinika && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: theme.size.small + 0.5, cursor: "pointer", padding: "4px 0" }}>
                  <input type="checkbox" checked={webSearch} onChange={e => setWebSearch(e.target.checked)} disabled={formLocked} />
                  Zaplecze ze źródeł (web search)
                </label>
              )}
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
            title={canStart ? "Krok B: konspekt do akceptacji" : (productsOk ? "Wypełnij temat i frazę główną" : `Ranking wymaga min. ${MIN_RANKING_PRODUCTS} poprawnych produktów`)}>
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

          {(phase === "research" || phase === "outlineLoading") && (
            <div style={{ ...ui.card, display: "flex", alignItems: "center", gap: 10 }}>
              {phase === "research" ? <Search size={16} color={P.accentHover} /> : <Loader2 size={16} className="spin" color={P.accentHover} />}
              <span style={{ fontSize: theme.size.body }}>
                {phase === "research" ? "Zbieram zaplecze merytoryczne ze źródeł (web search, do 1-2 min)..." : "Buduję konspekt..."}
              </span>
            </div>
          )}

          {warning && phase !== "done" && (
            <div style={ui.banner("warning")}>
              <AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{warning}
            </div>
          )}

          {research && phase === "outline" && (
            <details style={ui.card}>
              <summary style={{ cursor: "pointer", fontSize: theme.size.body, fontWeight: 600 }}>
                Zaplecze merytoryczne: {research.sources.length} źródeł z wyszukiwania
              </summary>
              <div style={{ whiteSpace: "pre-wrap", fontSize: theme.size.small + 1, marginTop: 10 }}>{research.text}</div>
              {research.sources.length > 0 && (
                <ol style={{ fontSize: theme.size.small + 1 }}>
                  {research.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}
                </ol>
              )}
            </details>
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
              {outline.sections.map((s, i) => s.kind === "ranking" ? (
                <div key={i} style={{ ...S.box, background: P.soft }}>
                  <label style={ui.label}>Lista produktów (H2)</label>
                  <input value={s.h2} onChange={e => updateSection(i, { h2: e.target.value })} style={ui.input} />
                  {outline.products.map((p, pi) => (
                    <div key={p.url} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center", marginTop: 8 }}>
                      <strong style={{ fontSize: theme.size.small + 1 }}>{pi + 1}.</strong>
                      <div>
                        <div style={{ fontSize: theme.size.small + 1, fontWeight: 600 }}>{p.name}</div>
                        <input value={p.bestFor} onChange={e => updateProduct(pi, { bestFor: e.target.value })} style={{ ...ui.input, marginTop: 4 }} placeholder="Dla kogo / do czego" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <button onClick={() => moveProduct(pi, -1)} style={S.iconBtn} title="W górę"><ChevronUp size={12} /></button>
                        <button onClick={() => moveProduct(pi, 1)} style={S.iconBtn} title="W dół"><ChevronDown size={12} /></button>
                      </div>
                    </div>
                  ))}
                  <p style={ui.help}>Kolejność = pozycja w rankingu. Etykieta steruje opisem produktu.</p>
                </div>
              ) : (
                <div key={i} style={S.box}>
                  <label style={ui.label}>Sekcja {i + 1} (H2)</label>
                  <input value={s.h2} onChange={e => updateSection(i, { h2: e.target.value })} style={ui.input} />
                  <label style={{ ...ui.label, marginTop: 8 }}>Teza</label>
                  <input value={s.thesis} onChange={e => updateSection(i, { thesis: e.target.value })} style={ui.input} />
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
              <p style={ui.help}>
                Wywołań modelu: {totalUnits}{redline ? ` + ${outline.sections.filter(s => s.kind !== "ranking").length + 1 + (isRanking ? 1 : 0)} redakcji` : ""}{isKlinika ? " + FAQ + notatka" : ""}, gap {SECTION_GAP_MS / 1000}s. Model: {MODELS[model]}.
              </p>
            </div>
          )}

          {(phase === "writing" || phase === "finishing") && (
            <div style={ui.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: theme.space(2) }}>
                <Loader2 size={16} className="spin" color={P.accentHover} />
                <span style={{ fontSize: theme.size.body, fontWeight: 600 }}>
                  {progress
                    ? `${progress.label}: ${progress.current} z ${progress.total}`
                    : (isRanking ? "Składam szkic rankingu..." : "Pipeline końcowy...")}
                </span>
              </div>
              {progress && (
                <div style={{ height: 8, background: theme.color.border, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(progress.current / progress.total) * 100}%`, background: P.accent, transition: "width .3s ease" }} />
                </div>
              )}
              {error && (
                <div style={{ ...ui.banner("danger"), marginTop: theme.space(2) }}>
                  <AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}
                  <div style={{ marginTop: 10 }}>
                    <button onClick={failed ? retryFailed : () => { setError(null); finishPipeline(secHtml, buildUnits(outline)); }} style={ui.btnSecondary}>
                      <RefreshCw size={13} /> {failed ? "Ponów od padłego miejsca" : "Ponów etap końcowy"}
                    </button>
                  </div>
                </div>
              )}
              {secHtml.length > 0 && (
                <p style={{ ...ui.help, marginTop: 10 }}>Gotowe fragmenty: {secHtml.length}. Gap {SECTION_GAP_MS / 1000}s między wywołaniami (ochrona rate limit).</p>
              )}
            </div>
          )}

          {phase === "done" && result && (
            <>
              {result.draft ? (
                <div style={ui.banner("info")}>
                  <strong>Szkic rankingu gotowy.</strong> Karty produktów są w formacie wklejki z CMS. Przekaż szkic do Formatowania: dołoży karty H3, boxy "Dla kogo / Dlaczego warto / Powiązane", ItemList, spis treści i FAQ (JSON do pola CMS).
                </div>
              ) : isKlinika ? (
                <div style={ui.banner(verified ? "info" : "warning")}>
                  <strong>{verified ? `Zweryfikowano: ${verified.by}, ${verified.at}.` : "Treść medyczna: wymaga weryfikacji lekarza przed publikacją."}</strong>{" "}
                  FAQ jest w treści HTML (format bezpieczny, bez skryptów). Notatka dla lekarza nie trafia do treści.
                </div>
              ) : (
                <div style={ui.banner("info")}>
                  <strong>Artykuł gotowy.</strong> Przeszedł pełny pipeline Formatowania: cleanup, spis treści, FAQ jako JSON do pola CMS. Workflow: treść do pola wpisu, JSON do pola "FAQ (dane strukturalne)".
                </div>
              )}
              {warning && (
                <div style={ui.banner("warning")}>
                  <AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{warning}
                </div>
              )}

              {checks && (
                <div style={{ ...ui.card, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <span style={ui.pill(theme.color.accentSoft, theme.color.text)}>{checks.words} słów</span>
                  <span style={ui.pill(theme.color.accentSoft, theme.color.text)}>{checks.sections} sekcji H2</span>
                  {checks.products != null && <span style={ui.pill(theme.color.accentSoft, theme.color.text)}>{checks.products} produktów</span>}
                  <span style={ui.pill(checks.kwOk ? theme.color.accentSoft : theme.color.warningSoft, theme.color.text)}>fraza w treści: {checks.kwTotal}x {checks.kwOk ? "" : "(limit 3)"}</span>
                  <span style={ui.pill(checks.h2kwOk ? theme.color.accentSoft : theme.color.warningSoft, theme.color.text)}>fraza w H2: {checks.h2kw}x</span>
                  <span style={ui.pill(checks.emDash === 0 ? theme.color.accentSoft : theme.color.dangerSoft, checks.emDash === 0 ? theme.color.text : theme.color.danger)}>em-dash: {checks.emDash}</span>
                  {!result.draft && <span style={ui.pill(theme.color.accentSoft, theme.color.text)}>FAQ: {checks.faq} pytań</span>}
                  {isKlinika && <span style={ui.pill(theme.color.accentSoft, theme.color.text)}>źródła: {result.sources?.length || 0}</span>}
                </div>
              )}

              {locked && (
                <div style={{ ...ui.card, borderColor: theme.color.warning }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: theme.space(2) }}>
                    <ShieldCheck size={16} color={P.accentHover} />
                    <h3 style={{ fontSize: theme.size.h3 + 1, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Bramka weryfikacji merytorycznej</h3>
                  </div>
                  <p style={ui.help}>Kopiowanie treści odblokowuje się dopiero po potwierdzeniu wszystkich punktów przez lekarza. Najpierw przeczytaj notatkę dla lekarza poniżej.</p>
                  {GATE_CHECKS.map((c, i) => (
                    <label key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: theme.size.small + 1, margin: "8px 0", cursor: "pointer" }}>
                      <input type="checkbox" checked={gate[i]} onChange={e => setGate(gate.map((g, gi) => gi === i ? e.target.checked : g))} />
                      {c}
                    </label>
                  ))}
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={ui.label}>Weryfikuje</label>
                      <input value={verifier} onChange={e => setVerifier(e.target.value)} style={ui.input} />
                    </div>
                    <button onClick={approve} disabled={!gateReady} style={{ ...ui.btnPrimary(P), ...(gateReady ? {} : ui.btnDisabled) }}>
                      <ShieldCheck size={14} /> Zatwierdzam treść
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {result.draft ? (
                  <>
                    <button onClick={() => onSendToFormat && onSendToFormat(result.html)} style={ui.btnPrimary(P)} disabled={!onSendToFormat}>
                      <ArrowRight size={14} /> Przekaż do Formatowania
                    </button>
                    <button onClick={() => copyText(result.html, setCopiedArt)} style={ui.btnSecondary}>
                      {copiedArt ? <Check size={13} /> : <Copy size={13} />} {copiedArt ? "Skopiowano" : "Kopiuj szkic HTML"}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => !locked && copyText(result.html, setCopiedArt)} disabled={locked}
                      style={{ ...ui.btnPrimary(P), ...(locked ? ui.btnDisabled : {}) }}
                      title={locked ? "Najpierw weryfikacja lekarska" : ""}>
                      {copiedArt ? <Check size={14} /> : <Copy size={14} />} {copiedArt ? "Skopiowano" : "Kopiuj pełny artykuł"}
                    </button>
                    {!isKlinika && (
                      <button onClick={() => copyText(shared.buildFaqCmsJson(result.faqItems), setCopiedFaq)}
                        style={{ ...ui.btnSecondary, ...(result.faqItems.length ? {} : ui.btnDisabled) }}
                        disabled={!result.faqItems.length}
                        title='JSON do pola "FAQ (dane strukturalne)" w CMS'>
                        {copiedFaq ? <Check size={13} /> : <Copy size={13} />} {copiedFaq ? "Skopiowano" : "Kopiuj JSON FAQ"}
                      </button>
                    )}
                    {result.note && (
                      <button onClick={() => copyText(result.note, setCopiedNote)} style={ui.btnSecondary}>
                        {copiedNote ? <Check size={13} /> : <Copy size={13} />} {copiedNote ? "Skopiowano" : "Kopiuj notatkę dla lekarza"}
                      </button>
                    )}
                  </>
                )}
              </div>

              <div style={{ ...ui.card, maxHeight: 520, overflow: "auto" }} className="scroll-thin">
                <p style={{ ...ui.help, margin: "0 0 10px" }}>Podgląd (H1 dodasz w CMS jako tytuł): <strong>{outline.chosenH1}</strong></p>
                <div style={{ fontSize: 14, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: result.html }} />
              </div>

              {result.note && (
                <div style={{ ...ui.card, maxHeight: 520, overflow: "auto", background: P.soft }} className="scroll-thin">
                  <p style={{ ...ui.help, margin: "0 0 10px" }}><strong>Notatka merytoryczna dla lekarza</strong> (nie do publikacji)</p>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: result.note }} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
