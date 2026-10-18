// === Humanizacja (no-ai-slop) na żądanie: przycisk po generacji (v4.13) ===
// Zasady: prompt "anti-slop" z Workera (edytowalny, z historią), domyślnie src/prompts/antiSlop.js.
// Tekst idzie do modelu jako tablica JSON fragmentów jednej sekcji (cała sekcja = kontekst),
// wraca tablica tej samej długości. Struktura HTML, nagłówki, linki, boxy, spis treści, tabele
// i FAQ zostają nietknięte; podmieniamy tylko wnętrze akapitów i punktów list (artykuł)
// albo komórki tekstu mówionego i opis do publikacji (scenariusz).

import { apiFetch } from "./auth.jsx";
import { ANTI_SLOP_DEFAULT } from "./prompts/antiSlop.js";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const ANTI_SLOP_PROMPT = "anti-slop";
export const HUMANIZE_MODEL = "claude-sonnet-5-5"; // jak redakcja: tańszy model wystarcza do edycji stylu
const MAX_BATCH_CHARS = 9000;

export async function loadAntiSlopRules() {
  try {
    const res = await apiFetch(`${API}/prompts/${ANTI_SLOP_PROMPT}`);
    const j = await res.json();
    const last = j.versions?.[j.versions.length - 1];
    return last?.text || ANTI_SLOP_DEFAULT;
  } catch (e) {
    return ANTI_SLOP_DEFAULT;
  }
}

// Kontenery, których treści nie ruszamy (boxy produktowe, spis treści, FAQ w divach, tabele, skrypty)
const SKIP = new Set(["DIV", "NAV", "TABLE", "DETAILS", "SUMMARY", "SCRIPT", "STYLE", "ASIDE", "FIGURE", "SECTION", "HEADER", "FOOTER"]);
const skipped = (el, root) => {
  for (let a = el.parentElement; a && a !== root; a = a.parentElement) if (SKIP.has(a.tagName) || a.hasAttribute("class")) return true;
  return false;
};
const FAQ_H2 = /pytania|faq/i;

// Artykuł: grupy = wstęp + sekcje H2; fragmenty = akapity i punkty list z treści właściwej
function articleGroups(root) {
  const groups = [{ label: "Wstęp", els: [] }];
  let skipGroup = false;
  for (const el of root.querySelectorAll("h2, p, li")) {
    if (skipped(el, root)) continue;
    if (el.tagName === "H2") { skipGroup = FAQ_H2.test(el.textContent); groups.push({ label: el.textContent.trim(), els: [] }); continue; }
    if (skipGroup) continue;
    if (el.tagName === "LI" && el.querySelector("ul, ol, p")) continue; // zagnieżdżone: edytujemy dzieci
    if (el.tagName === "P" && el.closest("li")) continue;
    if (el.textContent.trim().length < 25) continue; // krótkie etykiety zostawiamy
    groups[groups.length - 1].els.push(el);
  }
  return groups.filter(g => g.els.length);
}

// Scenariusz: komórki tekstu mówionego (kolumna 2 tabeli scenariusza) i akapity sekcji opisu
function scriptGroups(root, { table, publish }) {
  const h2s = [...root.querySelectorAll("h2")];
  const find = (key) => h2s.find(h => h.textContent.trim().toUpperCase().startsWith(key + "."));
  const groups = [];
  const hT = find(table);
  for (let el = hT?.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) {
    const t = el.tagName === "TABLE" ? el : el.querySelector?.("table");
    if (!t) continue;
    const cells = [...t.querySelectorAll("tr")].map(tr => tr.querySelectorAll("td")[1]).filter(td => td && td.textContent.trim());
    for (let i = 0; i < cells.length; i += 25) groups.push({ label: "Tekst mówiony", els: cells.slice(i, i + 25), spoken: true });
    break;
  }
  const hP = publish && find(publish);
  const pub = [];
  for (let el = hP?.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) {
    if (el.tagName === "P" && el.textContent.trim().length >= 25) pub.push(el);
    else el.querySelectorAll?.("p, li").forEach(x => { if (x.textContent.trim().length >= 25) pub.push(x); });
  }
  if (pub.length) groups.push({ label: "Opis do publikacji", els: pub });
  return groups;
}

// Paczki do modelu: cała sekcja naraz, chyba że jest bardzo długa
function batches(groups) {
  const out = [];
  for (const g of groups) {
    let cur = [];
    let size = 0;
    for (const el of g.els) {
      const len = el.innerHTML.length;
      if (cur.length && size + len > MAX_BATCH_CHARS) { out.push({ ...g, els: cur }); cur = []; size = 0; }
      cur.push(el); size += len;
    }
    if (cur.length) out.push({ ...g, els: cur });
  }
  return out;
}

function parseArray(text) {
  const t = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const a = t.indexOf("["), b = t.lastIndexOf("]");
  if (a < 0 || b < a) throw new Error("brak tablicy JSON");
  const arr = JSON.parse(t.slice(a, b + 1));
  if (!Array.isArray(arr)) throw new Error("to nie tablica");
  return arr;
}

const linksOf = (html) => (String(html).match(/<a\b[^>]*href="[^"]*"/gi) || []).join("|");

function instructions(rules, { mode, keyword, klinika, voice }) {
  const extra = [
    keyword ? `- Fraza kluczowa "${keyword}": zachowaj każde jej wystąpienie (SEO); nie dodawaj nowych.` : "",
    klinika ? "- Treść medyczna: NIE zmieniaj wskazań, przeciwwskazań, ocen jakości dowodów, oznaczeń off-label ani ostrzeżeń; redagujesz wyłącznie styl." : "",
    mode === "script"
      ? "- Fragmenty oznaczone jako tekst mówiony będą czytane na głos z promptera: naturalny rytm mowy, krótkie zdania, potoczne słowa; długość każdego fragmentu zmieniaj najwyżej o kilkanaście procent (czasy w scenariuszu). Fragment mówiony nie może być pusty."
      : "- Jeśli cały fragment jest slopem (np. końcowe podsumowanie powtarzające tekst), zwróć dla niego pusty tekst \"\"; zostanie usunięty.",
  ].filter(Boolean).join("\n");
  return `${rules}
${voice ? `\nGŁOS MARKI LEMONÉ (wzorzec tonu: zachowaj go; nie zamieniaj sformułowań zgodnych z tym głosem na inne):\n${voice}\n` : ""}
TRYB PRACY APLIKACJI (nadrzędny wobec powyższego):
- To nie rozmowa: nie zadawaj pytań i nie dodawaj sekcji "Co zmieniono". Niejasny fragment zostaw bez zmian.
- Dostajesz tablicę JSON kolejnych fragmentów jednej sekcji ${mode === "script" ? "scenariusza wideo" : "artykułu"} (HTML wewnątrz akapitu lub punktu listy). Cała tablica to kontekst: usuwaj powtórzenia między fragmentami.
- Zwróć WYŁĄCZNIE tablicę JSON tej samej długości i w tej samej kolejności; element o indeksie i to poprawiona wersja fragmentu i. Dobry fragment zwróć bez zmian.
- Zachowaj znaczniki HTML wewnątrz fragmentu: każdy <a href> dokładnie (adres i tekst linku), <strong>, <em>. Nie dodawaj nowych znaczników.
- Nie dodawaj ani nie usuwaj faktów, liczb, nazw produktów i substancji.
${extra}`;
}

// Główna funkcja: zwraca { html, changed, removed } (html bez zmian, jeśli nic nie poprawiono)
export async function humanizeHtml(html, { callModel, rules, mode = "article", format, keyword, klinika, voice, track, onProgress }) {
  const d = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = d.getElementById("root");
  const groups = mode === "script" ? scriptGroups(root, format) : articleGroups(root);
  const todo = batches(groups);
  if (!todo.length) throw new Error("Nie znaleziono tekstu do humanizacji.");
  const cached = instructions(rules, { mode, keyword, klinika, voice });
  let changed = 0, removed = 0;
  for (let k = 0; k < todo.length; k++) {
    const g = todo[k];
    onProgress && onProgress({ current: k + 1, total: todo.length, label: g.label });
    const input = g.els.map(el => el.innerHTML);
    const out = parseArray(await callModel(
      { cached, text: `SEKCJA: ${g.label}${g.spoken ? " (tekst mówiony)" : ""}\nFRAGMENTY (JSON):\n${JSON.stringify(input)}` },
      { model: HUMANIZE_MODEL, maxTokens: 12000, effortLow: true, stage: "humanizacja", track },
    ));
    if (out.length !== input.length) throw new Error(`model zwrócił ${out.length} fragmentów zamiast ${input.length} (sekcja "${g.label}")`);
    // cięcie całej sekcji zostawiłoby pusty nagłówek: wtedy nic nie usuwamy
    const allEmpty = out.every(t => !(typeof t === "string" && t.trim()));
    out.forEach((txt, i) => {
      const el = g.els[i];
      const next = typeof txt === "string" ? txt.trim() : "";
      if (!next) {
        if (!g.spoken && mode !== "script" && !allEmpty) { el.remove(); removed++; }
        return;
      }
      if (linksOf(next) !== linksOf(input[i])) return; // zmienione linki: zostawiamy oryginał fragmentu
      if (next !== input[i]) { el.innerHTML = next; changed++; }
    });
  }
  root.querySelectorAll("ul, ol").forEach(l => { if (!l.querySelector("li")) l.remove(); }); // listy opróżnione przez cięcia
  return { html: root.innerHTML, changed, removed };
}
