import { useState, useMemo } from "react";
import { Copy, Check, FileText, Sparkles, AlertCircle, Loader2, RefreshCw, ChevronDown, ChevronRight, Package, Zap, Download, Plus, X } from "lucide-react";

// === CATEGORIES from Mapowanie_kategorii_Lemone.xlsx (156 entries) — REVERTED z 1149 do oryginału ===
// Robert: nowe powiązania (gdy lista miała 1149) były gorsze jakościowo. Wracamy do 156 oryginalnych
// kategorii z arkuszy "Ranking L2/L3" pliku Mapowanie_kategorii_Lemone.xlsx — te slugi są zwalidowane
// na produkcji i wcześniejsze powiązania działały dobrze. Każdy wpis dostaje pole `c` (kontener)
// żeby klasyfikator (Haiku) mógł nadal filtrować pulę kategorii dla swojego promptu.
const CATEGORIES = [
  {n:"Pielęgnacja okolic oczu",s:"/pielegnacja-okolic-oczu",c:"pielegnacja"},
  {n:"Podrażnienie/uwrażliwienie",s:"/podraznienie-uwrazliwienie",c:"wskazanie"},
  {n:"Pielęgnacja twarzy",s:"/pielegnacja-twarzy",c:"pielegnacja"},
  {n:"Tarcza antyoksydacyjna",s:"/tarcza-antyoksydacyjna",c:"suplementy"},
  {n:"Zmarszczki",s:"/zmarszczki",c:"wskazanie"},
  {n:"Pielęgnacja skóry głowy",s:"/pielegnacja-skory-glowy",c:"pielegnacja"},
  {n:"Krem z retinolem",s:"/krem-z-retinolem",c:"kosmetyki_naturalne"},
  {n:"Witaminy i minerały",s:"/witaminy-i-mineraly",c:"suplementy"},
  {n:"Utrata blasku skóry",s:"/utrata-blasku-skory",c:"wskazanie"},
  {n:"Suchość",s:"/suchosc",c:"wskazanie"},
  {n:"Makijaż twarzy",s:"/makijaz-twarzy",c:"makijaz"},
  {n:"Bielactwo (brak dalszego podziału)",s:"/bielactwo-brak-dalszego-podzialu",c:"wskazanie"},
  {n:"Pielęgnacja ciała",s:"/pielegnacja-ciala",c:"pielegnacja"},
  {n:"Pielęgnacja paznokci",s:"/pielegnacja-paznokci",c:"pielegnacja"},
  {n:"Bioaktywne formuły",s:"/bioaktywne-formuly",c:"suplementy"},
  {n:"Codzienne dolegliwości",s:"/codzienne-dolegliwosci",c:"suplementy"},
  {n:"Ochrona przeciwsłoneczna",s:"/ochrona-przeciwsloneczna",c:"pielegnacja"},
  {n:"Utrata jędrności",s:"/utrata-jedrnosci",c:"wskazanie"},
  {n:"Pielęgnacja - oczyszczanie twarzy",s:"/pielegnacja-oczyszczanie-twarzy",c:"pielegnacja"},
  {n:"Trądzik pospolity",s:"/tradzik-pospolity",c:"wskazanie"},
  {n:"Cienie i obrzęki pod oczami",s:"/cienie-i-obrzeki-pod-oczami",c:"wskazanie"},
  {n:"Kosmetyki z witaminą C",s:"/kosmetyki-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Wsparcie ukierunkowane",s:"/wsparcie-ukierunkowane",c:"suplementy"},
  {n:"Budujące organizm",s:"/budujace-organizm",c:"suplementy"},
  {n:"Trądzik różowaty",s:"/tradzik-rozowaty",c:"wskazanie"},
  {n:"Blizny",s:"/blizny",c:"wskazanie"},
  {n:"Dermokosmetyki",s:"/dermokosmetyki",c:"dermokosmetyki"},
  {n:"Mężczyżni",s:"/mezczyzni",c:"dla_kogo"},
  {n:"Porost włosów",s:"/porost-wlosow",c:"wskazanie"},
  {n:"Menopauza",s:"/menopauza",c:"wskazanie"},
  {n:"Pielęgnacja włosów",s:"/pielegnacja-wlosow",c:"pielegnacja"},
  {n:"Przebarwienia",s:"/przebarwienia",c:"wskazanie"},
  {n:"Kosmetyki do opalania",s:"/kosmetyki-do-opalania",c:"kategorie"},
  {n:"Dzieci",s:"/dzieci",c:"dla_kogo"},
  {n:"Naturalne kosmetyki dla dzieci",s:"/naturalne-kosmetyki-dla-dzieci",c:"kosmetyki_naturalne"},
  {n:"Pielęgnacja jamy ustnej",s:"/pielegnacja-jamy-ustnej",c:"pielegnacja"},
  {n:"Naturalne kosmetyki do włosów",s:"/naturalne-kosmetyki-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Złuszczanie",s:"/zluszczanie",c:"wskazanie"},
  {n:"Atopowe zapalenie skóry",s:"/atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Kosmetyki do masażu",s:"/kosmetyki-do-masazu",c:"pielegnacja"},
  {n:"Pielęgnacja - demakijaż",s:"/pielegnacja-demakijaz",c:"makijaz"},
  {n:"Pielęgnacja biustu",s:"/pielegnacja-biustu",c:"pielegnacja"},
  {n:"Pielęgnacja brwi",s:"/pielegnacja-brwi",c:"pielegnacja"},
  {n:"Pielęgnacja całoroczna",s:"/pielegnacja-caloroczna",c:"pielegnacja"},
  {n:"Pielęgnacja dłoni",s:"/pielegnacja-dloni",c:"pielegnacja"},
  {n:"Pielęgnacja na jesień",s:"/pielegnacja-na-jesien",c:"pielegnacja"},
  {n:"Pielęgnacja na lato",s:"/pielegnacja-na-lato",c:"pielegnacja"},
  {n:"Pielęgnacja na wiosnę",s:"/pielegnacja-na-wiosne",c:"pielegnacja"},
  {n:"Pielęgnacja na zimę",s:"/pielegnacja-na-zime",c:"pielegnacja"},
  {n:"Pielęgnacja nóg",s:"/pielegnacja-nog",c:"pielegnacja"},
  {n:"Pielęgnacja okolic intymnych",s:"/pielegnacja-okolic-intymnych",c:"pielegnacja"},
  {n:"Pielęgnacja onkologiczna",s:"/pielegnacja-onkologiczna",c:"pielegnacja"},
  {n:"Pielęgnacja pozabiegowa",s:"/pielegnacja-pozabiegowa",c:"pielegnacja"},
  {n:"Pielęgnacja rzęs",s:"/pielegnacja-rzes",c:"pielegnacja"},
  {n:"Pielęgnacja stóp",s:"/pielegnacja-stop",c:"pielegnacja"},
  {n:"Pielęgnacja szyi i dekoltu",s:"/pielegnacja-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Pielęgnacja ust",s:"/pielegnacja-ust",c:"pielegnacja"},
  {n:"Pielęgnacja zarostu",s:"/pielegnacja-zarostu",c:"pielegnacja"},
  {n:"Dla kobiety i mężczyzny",s:"/dla-kobiety-i-mezczyzny",c:"dla_kogo"},
  {n:"Kobiety",s:"/kobiety",c:"dla_kogo"},
  {n:"Kobiety w ciąży lub karmiące",s:"/kobiety-w-ciazy-lub-karmiace",c:"dla_kogo"},
  {n:"Nastolatkowie",s:"/nastolatkowie",c:"dla_kogo"},
  {n:"Akcesoria do włosów",s:"/akcesoria-do-wlosow",c:"kategorie"},
  {n:"Akcesoria i dodatki",s:"/akcesoria-i-dodatki",c:"kategorie"},
  {n:"Domowe SPA",s:"/domowe-spa",c:"kategorie"},
  {n:"Domowe urządzenia pielęgnacyjne",s:"/domowe-urzadzenia-pielegnacyjne",c:"kategorie"},
  {n:"Kosmetyki do kąpieli",s:"/kosmetyki-do-kapieli",c:"kategorie"},
  {n:"Naturalne kosmetyki dla mężczyzn",s:"/naturalne-kosmetyki-dla-mezczyzn",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do ciała",s:"/naturalne-kosmetyki-do-ciala",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do makijażu",s:"/naturalne-kosmetyki-do-makijazu",c:"makijaz"},
  {n:"Naturalne kosmetyki do rąk",s:"/naturalne-kosmetyki-do-rak",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do rzęs",s:"/naturalne-kosmetyki-do-rzes",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do stóp",s:"/naturalne-kosmetyki-do-stop",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do twarzy",s:"/naturalne-kosmetyki-do-twarzy",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do ust",s:"/naturalne-kosmetyki-do-ust",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki pod oczy",s:"/naturalne-kosmetyki-pod-oczy",c:"kosmetyki_naturalne"},
  {n:"Kosmetyki po opalaniu",s:"/kosmetyki-po-opalaniu",c:"kategorie"},
  {n:"Kosmetyki pod prysznic",s:"/kosmetyki-pod-prysznic",c:"kategorie"},
  {n:"Kosmetyki wegańskie",s:"/kosmetyki-weganskie",c:"kosmetyki_naturalne"},
  {n:"Kosmetyki z kwasami",s:"/kosmetyki-z-kwasami",c:"kosmetyki_naturalne"},
  {n:"Kosmetyki z retinolem",s:"/kosmetyki-z-retinolem",c:"kosmetyki_naturalne"},
  {n:"Serum z retinolem",s:"/serum-z-retinolem",c:"kosmetyki_naturalne"},
  {n:"Ochrona przed światłem niebieskim",s:"/ochrona-przed-swiatlem-niebieskim",c:"kategorie"},
  {n:"Przyśpieszacze opalania",s:"/przyspieszacze-opalania",c:"kategorie"},
  {n:"Stylizacja włosów",s:"/stylizacja-wlosow",c:"kategorie"},
  {n:"Zapachy",s:"/zapachy",c:"kategorie"},
  {n:"Zestawy",s:"/zestawy",c:"kategorie"},
  {n:"Żywność Funkcjonalna",s:"/zywnosc-funkcjonalna",c:"suplementy"},
  {n:"Akcesoria do makijażu",s:"/akcesoria-do-makijazu",c:"makijaz"},
  {n:"Konturowanie",s:"/konturowanie",c:"makijaz"},
  {n:"Kosmetyki mineralne",s:"/kosmetyki-mineralne",c:"makijaz"},
  {n:"Makijaż brwi",s:"/makijaz-brwi",c:"makijaz"},
  {n:"Makijaż oczu",s:"/makijaz-oczu",c:"makijaz"},
  {n:"Makijaż rzęs",s:"/makijaz-rzes",c:"makijaz"},
  {n:"Makijaż ust",s:"/makijaz-ust",c:"makijaz"},
  {n:"Zestawy do makijażu",s:"/zestawy-do-makijazu",c:"makijaz"},
  {n:"Anti-pollution",s:"/anti-pollution",c:"wskazanie"},
  {n:"Cellulit",s:"/cellulit",c:"wskazanie"},
  {n:"Dermo-makijaż (brak dalszego podziału)",s:"/dermo-makijaz-brak-dalszego-podzialu",c:"makijaz"},
  {n:"Fotostarzenie (brak dalszego podziału)",s:"/fotostarzenie-brak-dalszego-podzialu",c:"wskazanie"},
  {n:"Higiena intymna",s:"/higiena-intymna",c:"wskazanie"},
  {n:"Kosmetyki na wrastające włoski",s:"/kosmetyki-na-wrastajace-wloski",c:"wskazanie"},
  {n:"Łojotok",s:"/lojotok",c:"wskazanie"},
  {n:"Łupież",s:"/lupiez",c:"wskazanie"},
  {n:"Łuszczyca",s:"/luszczyca",c:"wskazanie"},
  {n:"Naczynka",s:"/naczynka",c:"wskazanie"},
  {n:"Nadmierna potliwość",s:"/nadmierna-potliwosc",c:"wskazanie"},
  {n:"Odkażanie i dezynfekcja",s:"/odkazanie-i-dezynfekcja",c:"wskazanie"},
  {n:"Odwodnienie",s:"/odwodnienie",c:"wskazanie"},
  {n:"Oparzenie słoneczne",s:"/oparzenie-sloneczne",c:"wskazanie"},
  {n:"Osłabienie brwi lub rzęs",s:"/oslabienie-brwi-lub-rzes",c:"wskazanie"},
  {n:"Relaksacja",s:"/relaksacja",c:"wskazanie"},
  {n:"Rogowacenie okołomieszkowe",s:"/rogowacenie-okolomieszkowe",c:"wskazanie"},
  {n:"Rozstępy",s:"/rozstepy",c:"wskazanie"},
  {n:"Rozszerzone pory",s:"/rozszerzone-pory",c:"wskazanie"},
  {n:"Rumień/zaczerwienienie",s:"/rumien-zaczerwienienie",c:"wskazanie"},
  {n:"Świąd",s:"/swiad",c:"wskazanie"},
  {n:"Wągry i zaskórniki",s:"/wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Wypadanie włosów",s:"/wypadanie-wlosow",c:"wskazanie"},
  {n:"Wyszczuplanie",s:"/wyszczuplanie",c:"wskazanie"},
  {n:"Home care",s:"/home-care",c:"kategorie"},
  {n:"Zaburzony owal twarzy",s:"/zaburzony-owal-twarzy",c:"wskazanie"},
  {n:"Formuły dedykowane",s:"/formuly-dedykowane",c:"suplementy"},
  {n:"Kremy pod oczy",s:"/kremy-pod-oczy",c:"pielegnacja"},
  {n:"Kremy do twarzy",s:"/kremy-do-twarzy",c:"pielegnacja"},
  {n:"Kremy pod oczy przeciwzmarszczkowe",s:"/kremy-pod-oczy-przeciwzmarszczkowe",c:"pielegnacja"},
  {n:"Kremy nawilżające",s:"/kremy-nawilzajace",c:"pielegnacja"},
  {n:"Maski do skóry głowy",s:"/maski-do-skory-glowy",c:"kategorie"},
  {n:"Suplementy na stany zapalne",s:"/suplementy-na-stany-zapalne",c:"suplementy"},
  {n:"Kremy z retinolem do twarzy",s:"/kremy-z-retinolem-do-twarzy",c:"pielegnacja"},
  {n:"Kosmetyki do tonizacji twarzy",s:"/kosmetyki-do-tonizacji-twarzy",c:"pielegnacja"},
  {n:"Kremy BB i CC rozświetlające",s:"/kremy-bb-i-cc-rozswietlajace",c:"pielegnacja"},
  {n:"Kremy pod oczy na cienie",s:"/kremy-pod-oczy-na-cienie",c:"pielegnacja"},
  {n:"Krem z retinolem na noc",s:"/krem-z-retinolem-na-noc",c:"pielegnacja"},
  {n:"Ampułki pod oczy",s:"/ampulki-pod-oczy",c:"pielegnacja"},
  {n:"Suplementy na porost włosów",s:"/suplementy-na-porost-wlosow",c:"suplementy"},
  {n:"Kremy do twarzy z witaminą C",s:"/kremy-do-twarzy-z-witamina-c",c:"pielegnacja"},
  {n:"Suplementy na oczyszczanie organizmu",s:"/suplementy-na-oczyszczanie-organizmu",c:"suplementy"},
  {n:"Kremy na dzień dla mężczyzn",s:"/kremy-na-dzien-dla-mezczyzn",c:"pielegnacja"},
  {n:"Suplementy z kwasem hialuronowym (HA)",s:"/suplementy-z-kwasem-hialuronowym-ha",c:"suplementy"},
  {n:"Kremy koloryzujące do twarzy BB i CC",s:"/kremy-koloryzujace-do-twarzy-bb-i-cc",c:"pielegnacja"},
  {n:"Naturalne szampony dla dzieci",s:"/naturalne-szampony-dla-dzieci",c:"kosmetyki_naturalne"},
  {n:"Kremy ujędrniające do twarzy",s:"/kremy-ujedrniajace-do-twarzy",c:"pielegnacja"},
  {n:"Suplementy z koenzymem Q10",s:"/suplementy-z-koenzymem-q10",c:"suplementy"},
  {n:"Szampony do włosów",s:"/szampony-do-wlosow",c:"pielegnacja"},
  {n:"Akcesoria na cienie pod oczami",s:"/akcesoria-na-cienie-pod-oczami",c:"kategorie"},
  {n:"Serum z witaminą C",s:"/serum-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Kremy pod oczy na noc",s:"/kremy-pod-oczy-na-noc",c:"pielegnacja"},
  {n:"Kremy oczyszczające do twarzy",s:"/kremy-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Pasta do zębów",s:"/pasta-do-zebow",c:"pielegnacja"},
  {n:"Naturalne szampony do włosów",s:"/naturalne-szampony-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Kremy pod oczy z witaminą C",s:"/kremy-pod-oczy-z-witamina-c",c:"pielegnacja"},
  {n:"Suplementy z karotenoidami",s:"/suplementy-z-karotenoidami",c:"suplementy"},
  {n:"Maści na atopowe zapalenie skóry",s:"/masci-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Szampony nawilżające",s:"/szampony-nawilzajace",c:"pielegnacja"},
  {n:"Szczotka do masażu",s:"/szczotka-do-masazu",c:"kategorie"}
];

const VALID_SLUGS = new Set(CATEGORIES.map(c => c.s));
const CATS_LIST_TEXT = CATEGORIES.map(c => `${c.n} | ${c.s}`).join("\n"); // fallback only — used when classifier fails

// === CONTAINER METADATA ===
// 8 top-level branches from Akeneo "Drzewo kategorii Lemone nowe" — used by classifier (multi-label).
// Order matters for prompt readability (most common first).
const CONTAINERS = [
  { id: "pielegnacja",         label: "Pielęgnacja",         desc: "codzienna pielęgnacja skóry/włosów/ciała/ust — kremy, sera, mleczka, balsamy, peelingi, oleje, maski; kategorie typu 'Krem do twarzy na noc', 'Serum do ust', 'Mleczko do ciała'" },
  { id: "wskazanie",           label: "Wskazanie",           desc: "produkt nakierowany na konkretny problem — trądzik, zmarszczki, AZS, łuszczyca, wypadanie włosów, menopauza, blizny, cienie pod oczami, przebarwienia, cellulit" },
  { id: "kosmetyki_naturalne", label: "Kosmetyki naturalne", desc: "clean / natural beauty — ekologiczne, wegańskie, retinol naturalny, witamina C, kosmetyki bez parabenów; nie konfundować ze zwykłą pielęgnacją" },
  { id: "suplementy",          label: "Suplementy diety",    desc: "produkty do spożycia — witaminy, minerały, kapsułki, tabletki, formuły bioaktywne, syropy, krople, fitoterapia" },
  { id: "makijaz",             label: "Makijaż",             desc: "kolorówka — podkład, korektor, puder, róż, pomadka, szminka, błyszczyk, tusz do rzęs, eyeliner, cienie, kredka, akcesoria do makijażu" },
  { id: "dla_kogo",            label: "Dla kogo",            desc: "produkty wyraźnie targetowane na grupę — dzieci, kobiety w ciąży / karmiące, mężczyźni, nastolatki" },
  { id: "kategorie",           label: "Kategorie",           desc: "akcesoria i SPA — szczotki, masażery, urządzenia, kosmetyki do kąpieli, opalanie, akcesoria do włosów, dodatki" },
  { id: "dermokosmetyki",      label: "Dermokosmetyki",      desc: "linie dermo / apteczne / lecznicze — szczególnie do skóry wrażliwej, atopowej, trądzikowej, naczynkowej, podkłady i kremy BB dermokosmetyczne" }
];
const CONTAINER_IDS = new Set(CONTAINERS.map(c => c.id));

// Pre-bucketed lookup for fast filtering: containerId → array of {n, s, c}
const CATEGORIES_BY_CONTAINER = (() => {
  const m = {};
  for (const id of CONTAINER_IDS) m[id] = [];
  for (const cat of CATEGORIES) {
    if (m[cat.c]) m[cat.c].push(cat);
  }
  return m;
})();

// Returns concatenated, deduped category list for a set of container IDs.
// Falls back to ALL categories when input is empty/invalid (safety net).
function getCategoriesForContainers(containers) {
  if (!Array.isArray(containers) || containers.length === 0) return CATEGORIES;
  const set = new Set();
  const out = [];
  for (const c of containers) {
    for (const cat of (CATEGORIES_BY_CONTAINER[c] || [])) {
      if (!set.has(cat.s)) {
        set.add(cat.s);
        out.push(cat);
      }
    }
  }
  return out.length > 0 ? out : CATEGORIES;
}

// === HTML PARSER ===
const PRODUCT_URL_RE = /^\/p-.+\.html$/;

function parseProducts(input) {
  const html = (input || "").trim();
  if (!html) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");
  const allLinks = Array.from(doc.querySelectorAll("a[href]"));
  const productLinks = allLinks.filter(a => PRODUCT_URL_RE.test(a.getAttribute("href")));

  if (productLinks.length === 0) return [];

  const order = [];
  const byUrl = new Map();
  for (const link of productLinks) {
    const url = link.getAttribute("href");
    if (!byUrl.has(url)) { byUrl.set(url, []); order.push(url); }
    byUrl.get(url).push(link);
  }

  const products = [];
  for (const url of order) {
    const links = byUrl.get(url);
    let name = "";
    let subtitle = "";
    let imageUrl = "";

    for (const l of links) {
      const strong = l.querySelector("strong");
      if (strong) {
        const t = strong.textContent.replace(/\s+/g, " ").trim();
        if (t.length > name.length) name = t;
      }
    }
    if (!name) {
      for (const l of links) {
        const t = l.textContent.replace(/\s+/g, " ").trim();
        if (t && !l.querySelector("img") && t.length > name.length) name = t;
      }
    }
    if (!name) continue;

    for (const l of links) {
      const sub = l.querySelector(".subtitle, span.subtitle");
      if (sub) {
        const t = sub.textContent.replace(/\s+/g, " ").trim();
        if (t && t !== name) { subtitle = t; break; }
      }
    }

    for (const l of links) {
      const img = l.querySelector("img");
      if (img) { imageUrl = img.getAttribute("src") || ""; break; }
    }

    products.push({ url, name, subtitle, imageUrl, description: "" });
  }

  const fullText = doc.body.textContent.replace(/\s+/g, " ").trim();
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const startIdx = fullText.indexOf(p.name);
    if (startIdx < 0) continue;
    let endIdx = fullText.length;
    if (i + 1 < products.length) {
      const next = fullText.indexOf(products[i + 1].name, startIdx + p.name.length);
      if (next > 0) endIdx = next;
    }
    p.description = fullText.slice(startIdx, endIdx).slice(0, 2000).trim();
  }

  return products;
}

// === TOC EXTRACTOR ===
function extractTocItems(input) {
  const html = (input || "").trim();
  if (!html) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");
  const items = [];
  const seen = new Set();

  // H2s in document order — these are the main article sections
  const h2s = Array.from(doc.querySelectorAll("h2"));
  for (const h2 of h2s) {
    const text = h2.textContent.replace(/\s+/g, " ").trim();
    if (!text || seen.has(text)) continue;
    // Skip the FAQ wrapper heading (its summaries become items themselves)
    if (/najczęstsze pytania|faq/i.test(text)) continue;
    items.push(text);
    seen.add(text);
  }

  // FAQ summaries from <details><summary>
  const summaries = Array.from(doc.querySelectorAll("details summary, summary"));
  for (const sum of summaries) {
    const clone = sum.cloneNode(true);
    // Strip toggle indicators (typically last <span> with + / -)
    const spans = clone.querySelectorAll("span");
    for (const sp of spans) {
      const t = sp.textContent.trim();
      if (/^[+\-]$/.test(t)) sp.remove();
    }
    const text = clone.textContent.replace(/\s+/g, " ").trim();
    if (!text || seen.has(text)) continue;
    items.push(text);
    seen.add(text);
  }

  return items;
}

function buildTocHTML(items) {
  const filtered = (items || []).map(s => (s || "").trim()).filter(Boolean);
  if (filtered.length === 0) return "";

  const itemsHtml = filtered.map((q, i) => {
    const isLast = i === filtered.length - 1;
    const style = isLast
      ? "margin:0;color:#3a4a3a;line-height:1.5;"
      : "margin:0 0 12px;padding:0 0 12px;border-bottom:1px solid #dce8dc;color:#3a4a3a;line-height:1.5;";
    const id = slugifyToId(q);
    // Wewnętrzny link kotwicowy. color:inherit + text-decoration:underline żeby było widać że klikalne,
    // ale w kolorze TOC, nie domyślnym niebieskim brand-shopu. cursor:pointer redundant ale defensywnie.
    const inner = id
      ? `<a href="#${id}" style="color:inherit;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;cursor:pointer;">${escapeHtml(q)}</a>`
      : escapeHtml(q);
    return `            <p style="${style}">\n                ${inner}\n            </p>`;
  }).join("\n");

  return `<div style="background-color:#f4f8f4;border-radius:12px;border:1px solid #dce8dc;margin:25px 0;padding:24px 28px;">
            <h3 style="margin:0 0 18px;font-size:17px;color:#2d4a2d;font-weight:600;letter-spacing:0.2px;">
                Czego dowiesz się w tym artykule
            </h3>
${itemsHtml}
        </div>`;
}

// Generates an HTML-safe id from Polish text. Used for both TOC anchors and the H2/summary id targets.
// Prefix "sec-" zapobiega kolizji z innymi id na stronie (np. "kontakt", "navbar" itd.).
function slugifyToId(text) {
  if (!text) return "";
  const PL_MAP = {ą:'a',ć:'c',ę:'e',ł:'l',ń:'n',ó:'o',ś:'s',ź:'z',ż:'z',Ą:'A',Ć:'C',Ę:'E',Ł:'L',Ń:'N',Ó:'O',Ś:'S',Ź:'Z',Ż:'Z'};
  const t = String(text).split("").map(ch => PL_MAP[ch] || ch).join("");
  const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug ? `sec-${slug}` : "";
}

// === FULL ARTICLE ASSEMBLER ===
function buildCompleteArticle(originalHtml, products, boxes, tocItems) {
  if (!originalHtml || !originalHtml.trim()) return "";

  const doc = new DOMParser().parseFromString(originalHtml, "text/html");

  // 1. Remove any existing TOC blocks (avoids double-TOC after enhancement)
  const tocCandidates = Array.from(doc.querySelectorAll("h3, p strong"));
  for (const el of tocCandidates) {
    const text = (el.textContent || "").toLowerCase();
    if (text.includes("czego dowiesz się") || text.includes("szybka nawigacja")) {
      const container = el.closest("div");
      if (container && container !== doc.body && container.children.length < 30) {
        container.remove();
      }
    }
  }

  // 2. Nadaj id wszystkim H2 i summary (cel kotwic z TOC). Robimy to PRZED wstawieniem TOC,
  // żeby TOC mógł się do nich linkować. Duplikaty rozstrzygane suffixem -2, -3...
  const usedIds = new Set();
  const headingsForIds = doc.querySelectorAll("h2, summary");
  for (const h of headingsForIds) {
    if (h.getAttribute("id")) {
      usedIds.add(h.getAttribute("id"));
      continue;
    }
    const text = (h.textContent || "").replace(/\s+/g, " ").trim();
    const baseId = slugifyToId(text);
    if (!baseId) continue;
    let unique = baseId;
    let n = 2;
    while (usedIds.has(unique)) { unique = `${baseId}-${n}`; n++; }
    usedIds.add(unique);
    h.setAttribute("id", unique);
  }

  // 3. Insert new TOC right before first H2
  const firstH2 = doc.querySelector("h2");
  const tocHtml = buildTocHTML(tocItems);
  if (firstH2 && tocHtml) {
    const tmp = doc.createElement("div");
    tmp.innerHTML = tocHtml;
    if (tmp.firstElementChild) {
      firstH2.parentNode.insertBefore(tmp.firstElementChild, firstH2);
    }
  }

  // 4. TRANSFORMACJA struktury obrazków: <p><a><strong>?<img></strong>?</a></p> → <figure class="image"><a><img></a></figure>
  // To wzorzec który działa na sklep.lemone.pl (potwierdzone na produkcyjnym artykule z Dermaquest).
  // CSS sklepu rozciąga <img> w <p> na 100% szerokości, ale honoruje max-width:400px na <img> w <figure class="image">.
  // Walka z CSS przez !important nie działa — różnica jest w opakowaniu, nie w stylu.
  const allParas = Array.from(doc.querySelectorAll("p"));
  for (const p of allParas) {
    const link = p.querySelector("a");
    if (!link) continue;
    const href = link.getAttribute("href") || "";
    if (!PRODUCT_URL_RE.test(href)) continue;
    const img = link.querySelector("img");
    if (!img) continue;
    // Tylko jeśli paragraf zawiera WYŁĄCZNIE obrazek (i ewentualnie whitespace)
    if (p.textContent.replace(/\s+/g, "") !== "") continue;

    // Buduj <figure class="image" style="height:auto;"><a href="..."><img style="..." src="..." alt="..." width="400"></a></figure>
    const figure = doc.createElement("figure");
    figure.setAttribute("class", "image");
    figure.setAttribute("style", "height:auto;");

    const newA = doc.createElement("a");
    newA.setAttribute("href", href);

    const newImg = doc.createElement("img");
    newImg.setAttribute("src", img.getAttribute("src") || "");
    if (img.getAttribute("alt")) newImg.setAttribute("alt", img.getAttribute("alt"));
    newImg.setAttribute("width", "400");
    newImg.setAttribute("style", "display:block;max-width:400px;");

    newA.appendChild(newImg);
    figure.appendChild(newA);
    p.replaceWith(figure);
  }

  // 5. Wyczyść WSZYSTKIE istniejące żółte boxy z poprzednich generacji.
  // Robimy to najpierw, niezależnie od `wrapper` — wcześniejsza logika zostawiała stare boxy
  // gdy struktura była zagnieżdżona i `closest("div.product")` zwracał innego "rodzica".
  const oldBoxes = Array.from(doc.querySelectorAll("div[style]")).filter(el =>
    /background-color:\s*#fff8e6/i.test(el.getAttribute("style") || "")
  );
  for (const oldBox of oldBoxes) oldBox.remove();

  // 6. Dla każdego produktu — znajdź najlepszy "anchor" do wstawienia boxa.
  // Priorytet: <p> z <img> linku produktu → <figure> linku produktu → <p> z linkiem tytułowym → fallback.
  // Działa zarówno dla zagnieżdżonej struktury Roberta (img w <p><a>...</a></p>)
  // jak i dla klasycznych artykułów z <figure class="image">.
  for (const product of products) {
    const box = boxes[product.url];
    if (!box || box.status !== "ready") continue;

    const newBoxHtml = buildBoxOnly({
      forWho: box.forWho,
      whyWorth: box.whyWorth,
      related: box.related
    });
    const tmp = doc.createElement("div");
    tmp.innerHTML = newBoxHtml;
    const newBox = tmp.firstElementChild;
    if (!newBox) continue;

    // Wszystkie linki do tego konkretnego produktu w całym dokumencie.
    // (Inne produkty mają inne URL-e, więc to nie złapie zagnieżdżonych.)
    const productLinks = Array.from(doc.querySelectorAll(`a[href="${CSS.escape(product.url)}"]`));
    if (productLinks.length === 0) continue;

    let anchor = null; // element po którym wstawimy box

    // Priorytet 1: <p> zawierający <a><img>...</a></p> dla tego produktu
    for (const link of productLinks) {
      if (link.querySelector("img")) {
        anchor = link.closest("p") || link.closest("figure") || link.parentElement;
        if (anchor) break;
      }
    }

    // Priorytet 2: <figure> zawierający link do tego produktu (stary format z <figure class="image">)
    if (!anchor) {
      for (const link of productLinks) {
        const fig = link.closest("figure");
        if (fig) { anchor = fig; break; }
      }
    }

    // Priorytet 3: <p> zawierający link do tego produktu (paragraf tytułowy z nazwą)
    if (!anchor) {
      for (const link of productLinks) {
        const p = link.closest("p");
        if (p) { anchor = p; break; }
      }
    }

    // Wstaw box po anchorze. Jeśli żaden nie znaleziony — last resort: po pierwszym linku produktu.
    if (anchor) {
      anchor.after(newBox);
    } else {
      productLinks[0].after(newBox);
    }
  }

  return doc.body.innerHTML;
}

// === LINK VALIDATOR ===
const LINK_CHECK_URL = import.meta.env.VITE_LINK_CHECK_URL || "https://lemone-api.r-tomala.workers.dev/check-link";
const SHOP_HOSTNAME = "sklep.lemone.pl";

// Extract all relative non-product links from article HTML.
// Returns deduped list: [{url, text, count, localStatus}]
// - skips /p-XXX.html (product pages)
// - skips mailto:, tel:, #anchors, external hosts
// - normalizes absolute sklep.lemone.pl URLs to relative
function extractArticleLinks(html) {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const map = new Map();

  for (const a of Array.from(doc.querySelectorAll("a[href]"))) {
    const raw = (a.getAttribute("href") || "").trim();
    if (!raw) continue;
    if (PRODUCT_URL_RE.test(raw)) continue;
    if (raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) continue;

    let path = raw;
    if (/^https?:\/\//i.test(path)) {
      try {
        const u = new URL(path);
        if (u.hostname !== SHOP_HOSTNAME) continue;
        path = u.pathname + u.search + u.hash;
      } catch (_) {
        continue;
      }
    }
    if (!path.startsWith("/")) continue;

    // Canonical slug = path without query/hash, trailing slash stripped (but keep "/" itself)
    const slug = path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
    if (slug === "/" || PRODUCT_URL_RE.test(slug)) continue;

    if (!map.has(slug)) {
      const text = (a.textContent || "").replace(/\s+/g, " ").trim();
      map.set(slug, {
        url: slug,
        text: text || slug,
        count: 1,
        localStatus: VALID_SLUGS.has(slug) ? "local-ok" : "local-missing"
      });
    } else {
      map.get(slug).count += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.url.localeCompare(b.url));
}

// POST list of slugs to Worker /check-link endpoint, which performs HEAD requests
// to https://sklep.lemone.pl<slug> server-side (no CORS issue).
// Expected response: { results: [{ url, status, ok }, ...] }
async function checkLinksLive(urls) {
  if (!urls || urls.length === 0) return {};
  const response = await fetch(LINK_CHECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls })
  });
  if (!response.ok) {
    throw new Error(`Link check API ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  const out = {};
  for (const r of (data.results || [])) {
    if (r && r.url) out[r.url] = r;
  }
  return out;
}

// Wrap broken links in the rendered preview with red/orange highlight.
// Does NOT modify the original article HTML used for copy/download.
// statusBySlug values: "local-ok" | "local-missing" | "live-ok" | "live-broken" | "live-error"
function highlightBrokenLinks(html, links, liveStatuses) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  const statusBySlug = new Map();
  for (const l of links) {
    if (l.localStatus === "local-missing") {
      statusBySlug.set(l.url, "local-missing");
      continue;
    }
    const live = liveStatuses[l.url];
    if (!live) {
      statusBySlug.set(l.url, "local-ok");
    } else if (live.ok) {
      statusBySlug.set(l.url, "live-ok");
    } else if (live.error) {
      statusBySlug.set(l.url, "live-error");
    } else {
      statusBySlug.set(l.url, "live-broken");
    }
  }

  for (const a of Array.from(doc.querySelectorAll("a[href]"))) {
    const raw = (a.getAttribute("href") || "").trim();
    if (!raw || PRODUCT_URL_RE.test(raw)) continue;
    if (raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) continue;

    let path = raw;
    if (/^https?:\/\//i.test(path)) {
      try {
        const u = new URL(path);
        if (u.hostname !== SHOP_HOSTNAME) continue;
        path = u.pathname + u.search + u.hash;
      } catch (_) { continue; }
    }
    if (!path.startsWith("/")) continue;
    const slug = path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

    const status = statusBySlug.get(slug);
    if (status !== "local-missing" && status !== "live-broken" && status !== "live-error") continue;

    const styleByStatus = {
      "local-missing": { bg: "#fde2e0", border: "#c0392b", title: "Slug nie istnieje w bazie kategorii" },
      "live-broken":   { bg: "#fef3c7", border: "#d97706", title: "Slug w bazie, ale URL zwraca błąd na sklep.lemone.pl" },
      "live-error":    { bg: "#f0eadb", border: "#7d6e4a", title: "Nie udało się sprawdzić tego linku" }
    };
    const cfg = styleByStatus[status];
    const existingStyle = a.getAttribute("style") || "";
    a.setAttribute("style", `${existingStyle};background:${cfg.bg};border-bottom:2px wavy ${cfg.border};padding:0 2px;border-radius:2px;`);
    a.setAttribute("title", cfg.title);
    a.setAttribute("data-link-status", status);
  }

  return doc.body.innerHTML;
}

// === RATE-LIMIT-AWARE FETCH ===
// Anthropic API zwraca 429 przy przekroczeniu RPM/TPM (typowo TPM przy dużych promptach).
// Worker proxy może też zwrócić 502/503 przy chwilowych problemach. Retry z exp backoff,
// honoruje header Retry-After jeśli jest podany przez serwer.
async function fetchWithRetry(url, options, maxRetries = 5) {
  let lastResponse;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      lastResponse = await fetch(url, options);
    } catch (e) {
      // Network error — retry too, ale tylko raz (mogło być Failed to fetch / DNS hiccup)
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, 3000 * Math.pow(2, attempt)));
      continue;
    }

    const retryable = lastResponse.status === 429 || lastResponse.status === 502 || lastResponse.status === 503;
    if (!retryable) return lastResponse;
    if (attempt === maxRetries) return lastResponse;

    // Server-provided Retry-After ma pierwszeństwo (Anthropic czasem podaje sekundy do resetu TPM).
    const retryAfter = lastResponse.headers.get("retry-after");
    const serverWaitMs = retryAfter ? Math.min(parseFloat(retryAfter) * 1000, 30000) : null;
    const backoffMs = serverWaitMs ?? Math.min(3000 * Math.pow(2, attempt), 30000);
    await new Promise(r => setTimeout(r, backoffMs));
  }
  return lastResponse;
}

// === ANTHROPIC API CALL — CLASSIFIER (multi-label, picks 1-4 containers per product) ===
// Runs before generateBoxData. Output drives which categories enter the box-generation prompt,
// cutting input tokens 2-10× depending on product type.
async function classifyProduct(product) {
  const containerLines = CONTAINERS.map(c => `- ${c.id}: ${c.desc}`).join("\n");

  const prompt = `Sklasyfikuj produkt do 1-4 kontenerów z listy poniżej. Zwróć WYŁĄCZNIE JSON.

PRODUKT:
Nazwa: ${product.name}
Podtytuł: ${product.subtitle || "(brak)"}

KONTENERY (multi-label):
${containerLines}

ZASADY DOBORU:
- Wybierz 1-4 kontenerów które FAKTYCZNIE pasują do tego produktu
- Większość produktów pasuje do 2-3 kontenerów
- "wskazanie" dodaj tylko jeśli produkt jest jawnie nakierowany na konkretny problem (np. krem przeciwzmarszczkowy, ampułka na wypadanie); zwykły krem nawilżający to TYLKO "pielegnacja"
- "kosmetyki_naturalne" tylko gdy produkt jest jawnie naturalny / clean / wegański / bio
- "dermokosmetyki" tylko dla linii apteczno-dermatologicznych (Bioderma, La Roche-Posay, Avène, Pharmaceris, itp.)
- "dla_kogo" tylko gdy produkt JAWNIE targetuje grupę (np. "krem dla mężczyzn", "suplement dla kobiet w ciąży")

PRZYKŁADY:
- "Medik8 Crystal Retinal 3" (krem z retinolem) → ["pielegnacja", "wskazanie", "kosmetyki_naturalne"]
- "Vichy Dercos Aminexil" (ampułki na wypadanie włosów) → ["pielegnacja", "wskazanie", "dermokosmetyki"]
- "Solgar Magnez Cytrynian" (suplement) → ["suplementy"]
- "Sukin Hand Cream" (krem do rąk natural) → ["pielegnacja", "kosmetyki_naturalne"]
- "Avène Cleanance Comedomed" (krem na trądzik) → ["pielegnacja", "wskazanie", "dermokosmetyki"]
- "Bioderma Sensibio H2O" (płyn micelarny do wrażliwej) → ["pielegnacja", "dermokosmetyki"]
- "Lierac Lift Integral" (krem przeciwzmarszczkowy) → ["pielegnacja", "wskazanie"]
- "Mustela krem przy zmianie pieluszki" → ["pielegnacja", "dla_kogo"]

ZWRÓĆ TYLKO JSON, BEZ MARKDOWN:
{"containers":["..."]}`;

  const apiUrl = import.meta.env.VITE_API_URL || "https://api.anthropic.com/v1/messages";
  const response = await fetchWithRetry(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Haiku ma osobny pool TPM od Sonneta — classifier nie zjada budżetu generatorowi boxa.
      // Multi-label classification to dla Haiku 4.5 trywialne zadanie, jakość zostaje, koszt 5× niższy.
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.text();
      if (body) detail = body.slice(0, 300);
    } catch (_) {}
    throw new Error(`Classifier API ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("").trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Niepoprawny JSON z classifier: " + cleaned.slice(0, 120));
  }

  const raw = Array.isArray(parsed.containers) ? parsed.containers : [];
  // Validate against known IDs — drop anything the model hallucinated
  const valid = raw.filter(c => CONTAINER_IDS.has(c));
  const dropped = raw.filter(c => !CONTAINER_IDS.has(c));

  return {
    containers: valid,
    droppedContainers: dropped
  };
}

// === ANTHROPIC API CALL — BOX GENERATOR ===
async function generateBoxData(product) {
  // Step 1 — classify product to subset of containers (multi-label). Failures fall back to full list.
  let classifyResult = null;
  let classifyError = null;
  try {
    classifyResult = await classifyProduct(product);
  } catch (e) {
    classifyError = e.message || String(e);
  }

  const chosenContainers = classifyResult ? classifyResult.containers : [];
  const filteredCats = getCategoriesForContainers(chosenContainers);
  const usingFallback = filteredCats === CATEGORIES;
  const filteredListText = filteredCats.map(c => `${c.n} | ${c.s}`).join("\n");

  // Step 2 — generate box with filtered category list
  const prompt = `Jesteś redaktorem polskiego bloga kosmetycznego Lemoné. Generujesz dane do boxa pod produkt w artykule.

PRODUKT:
Nazwa: ${product.name}
Podtytuł: ${product.subtitle || "(brak)"}

OPIS Z ARTYKUŁU:
${product.description || "(brak — zinterpretuj na podstawie nazwy)"}

KATEGORIE STRONY (wybierz dokładnie 3 najlepiej dopasowane, slug KOPIUJ 1:1 z listy, NIE WYMYŚLAJ NOWYCH):
${filteredListText}

ZASADY:
- "forWho" — 3-4 krótkie linijki po polsku: typ skóry/problem/sytuacja użytkownika. Format jak: "skóra sucha / odwodniona", "skóra wrażliwa / reaktywna", "po zabiegach estetycznych".
- "whyWorth" — 3 linijki po polsku z głównymi korzyściami z opisu produktu. Format jak: "intensywna odbudowa bariery hydrolipidowej", "szybkie ukojenie skóry".
- "related" — DOKŁADNIE 3 obiekty {slug, label}. Slug 1:1 z listy. Label to skrócona, lowercase nazwa wyświetlana w linku (max 4 słowa, naturalna forma w zdaniu np. "kremy nawilżające", "podrażnienie skóry").
- Jeśli produkt to suplement diety: w "forWho" pomiń "skóra X", użyj zdrowotnego kontekstu.

ZWRÓĆ WYŁĄCZNIE JSON, BEZ MARKDOWN, BEZ KOMENTARZY:
{"forWho":["...","...","..."],"whyWorth":["...","...","..."],"related":[{"slug":"/...","label":"..."},{"slug":"/...","label":"..."},{"slug":"/...","label":"..."}]}`;

  const apiUrl = import.meta.env.VITE_API_URL || "https://api.anthropic.com/v1/messages";
  const response = await fetchWithRetry(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.text();
      if (body) detail = body.slice(0, 300);
    } catch (_) {}
    if (response.status === 429) {
      throw new Error(`Limit (429) — pomimo 3 prób. ${detail}`);
    }
    throw new Error(`API ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("").trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Niepoprawny JSON z API: " + cleaned.slice(0, 120));
  }

  const validRelated = (parsed.related || []).filter(r => r && r.slug && VALID_SLUGS.has(r.slug));
  const droppedRelated = (parsed.related || []).filter(r => !r || !r.slug || !VALID_SLUGS.has(r.slug));

  const warnings = [];
  if (droppedRelated.length > 0) {
    warnings.push(`Pominięto ${droppedRelated.length} slug(ów) spoza bazy: ${droppedRelated.map(r => r?.slug || "?").join(", ")}`);
  }
  if (classifyError) {
    warnings.push(`Klasyfikator zawiódł — użyto pełnej listy kategorii. Błąd: ${classifyError}`);
  } else if (classifyResult && classifyResult.droppedContainers.length > 0) {
    warnings.push(`Klasyfikator zwrócił nieznane kontenery: ${classifyResult.droppedContainers.join(", ")}`);
  }

  return {
    forWho: Array.isArray(parsed.forWho) ? parsed.forWho.filter(Boolean) : [],
    whyWorth: Array.isArray(parsed.whyWorth) ? parsed.whyWorth.filter(Boolean) : [],
    related: validRelated,
    containers: chosenContainers,
    catsConsidered: filteredCats.length,
    fallbackUsed: usingFallback,
    warnings
  };
}

// === HTML BUILDER ===
const escapeHtml = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildBoxOnly(data) {
  const forWhoLines = (data.forWho || []).map(l => l.trim()).filter(Boolean);
  const whyLines = (data.whyWorth || []).map(l => l.trim()).filter(Boolean);
  const related = data.related || [];

  const forWhoHtml = forWhoLines.length
    ? `    <p>\n        <strong>Dla kogo?</strong><br>\n${forWhoLines.map((l, i) => `        ✔ ${escapeHtml(l)}${i < forWhoLines.length - 1 ? "<br>" : ""}`).join("\n")}\n    </p>`
    : "";

  const whyHtml = whyLines.length
    ? `    <p>\n        <strong>Dlaczego warto:</strong><br>\n${whyLines.map((l, i) => `        → ${escapeHtml(l)}${i < whyLines.length - 1 ? "<br>" : ""}`).join("\n")}\n    </p>`
    : "";

  const relatedHtml = related.length
    ? `    <p>\n        <strong>Powiązane:</strong> ${related.map(r => `<a href="${escapeHtml(r.slug)}">${escapeHtml(r.label)}</a>`).join(" • ")}\n    </p>`
    : "";

  return `<div style="background-color:#fff8e6;border-radius:10px;border:1px solid #f0e6c8;margin:15px 0;padding:15px;">
${[forWhoHtml, whyHtml, relatedHtml].filter(Boolean).join("\n")}
</div>`;
}

function buildBoxHTML(product, data) {
  const innerBox = buildBoxOnly(data).split("\n").map(l => "            " + l).join("\n");

  const figure = product.imageUrl
    ? `            <figure class="image" style="height:auto;">
                <a href="${escapeHtml(product.url)}"><img style="display:block;max-width:400px;" src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" width="400"></a>
            </figure>
`
    : "";

  const subtitleHtml = product.subtitle
    ? `\n                <a href="${escapeHtml(product.url)}"><span class="subtitle">${escapeHtml(product.subtitle)}</span></a>`
    : "";

  return `<div class="product">
    <div class="row">
        <div class="col-12">
            <p style="text-align:left;">
                <a href="${escapeHtml(product.url)}"><strong>${escapeHtml(product.name)}</strong></a><br>${subtitleHtml}
            </p>
${figure}${innerBox}
        </div>
    </div>
</div>`;
}

// === MAIN APP ===
export default function App() {
  const [step, setStep] = useState("input");
  const [input, setInput] = useState("");
  const [products, setProducts] = useState([]);
  const [boxes, setBoxes] = useState({});
  const [progress, setProgress] = useState(null);
  const [tocItems, setTocItems] = useState([]);

  const handleAnalyze = async () => {
    const found = parseProducts(input);
    if (found.length === 0) {
      setProducts([]);
      setStep("empty");
      return;
    }
    setProducts(found);
    setBoxes({});
    setTocItems(extractTocItems(input));
    setStep("results");

    setProgress({ current: 0, total: found.length });
    const generatedBoxes = {};
    for (let i = 0; i < found.length; i++) {
      setProgress({ current: i + 1, total: found.length });
      const result = await runOne(found[i]);
      if (result?.status === "ready") generatedBoxes[found[i].url] = result;
      // Gap między boxami — rozkłada calls w czasie żeby nie kumulować rate limitu po stronie Workera/Anthropic.
      // Dla 4 produktów dodaje ~6s, ale dramatycznie zmniejsza szansę padu po 3-4 boxach.
      if (i < found.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    setProgress(null);

    // Po wygenerowaniu wszystkich boxów: walidacja `related` przeciwko żywym URL-om sklepu.
    // CATEGORIES ma 1149 wpisów z auto-derywowanymi slugami, ale shop może mieć inne dla części
    // kategorii. /check-link w Workerze robi HEAD do sklep.lemone.pl<slug> i mówi czy URL działa.
    // Te które nie działają, usuwamy z `related` i regenerujemy HTML boxa.
    if (Object.keys(generatedBoxes).length > 0) {
      await validateRelatedSlugs(found, generatedBoxes);
    }
  };

  // Sprawdza wszystkie unikalne slugi `related` we wszystkich boxach naraz (1 request HTTP).
  // Te które wracają !ok, są usuwane z odpowiednich boxów. HTML każdego dotkniętego boxa jest regenerowany.
  // Jeśli /check-link nie istnieje (Worker bez endpointu), pokazujemy globalny warning ale nie crashujemy.
  const validateRelatedSlugs = async (productList, currentBoxes) => {
    const allSlugs = new Set();
    for (const p of productList) {
      const box = currentBoxes[p.url];
      if (box?.status === "ready" && Array.isArray(box.related)) {
        for (const r of box.related) {
          if (r?.slug) allSlugs.add(r.slug);
        }
      }
    }
    if (allSlugs.size === 0) return;

    let liveStatuses;
    try {
      liveStatuses = await checkLinksLive([...allSlugs]);
    } catch (e) {
      // Worker bez /check-link albo inny problem sieciowy — graceful: dorzuć warning do każdego boxa,
      // ale nie modyfikuj related. Robert zobaczy ostrzeżenie i będzie wiedział że trzeba wdrożyć Worker.
      const reason = e.message || String(e);
      setBoxes(prev => {
        const next = { ...prev };
        for (const url in next) {
          const b = next[url];
          if (b.status === "ready") {
            next[url] = { ...b, warnings: [...(b.warnings || []), `Walidacja slugów niedostępna (${reason}). Wdróż endpoint /check-link w Workerze (worker-check-link.js).`] };
          }
        }
        return next;
      });
      return;
    }

    // Zaaplikuj wyniki: filtruj related, regeneruj html, dorzuć warning gdy coś usunięte.
    setBoxes(prev => {
      const next = { ...prev };
      for (const product of productList) {
        const box = next[product.url];
        if (!box || box.status !== "ready" || !Array.isArray(box.related)) continue;

        const dead = box.related.filter(r => {
          const live = liveStatuses[r.slug];
          return live && !live.ok && !live.error;
        });
        if (dead.length === 0) continue;

        const alive = box.related.filter(r => !dead.includes(r));
        const newHtml = buildBoxHTML(product, {
          forWho: box.forWho,
          whyWorth: box.whyWorth,
          related: alive
        });
        const deadList = dead.map(r => r.slug).join(", ");
        next[product.url] = {
          ...box,
          related: alive,
          html: newHtml,
          warnings: [...(box.warnings || []), `Usunięto ${dead.length} martwy(ch) slug(ów) (404 na sklepie): ${deadList}`]
        };
      }
      return next;
    });
  };

  const runOne = async (product) => {
    setBoxes(prev => ({ ...prev, [product.url]: { status: "loading" } }));
    try {
      const data = await generateBoxData(product);
      const html = buildBoxHTML(product, data);
      const boxState = { status: "ready", ...data, html };
      setBoxes(prev => ({ ...prev, [product.url]: boxState }));
      return boxState;
    } catch (e) {
      const errState = { status: "error", error: e.message || String(e) };
      setBoxes(prev => ({ ...prev, [product.url]: errState }));
      return errState;
    }
  };

  const handleReset = () => {
    setStep("input");
    setProducts([]);
    setBoxes({});
    setProgress(null);
    setTocItems([]);
  };

  const allReady = products.length > 0 && products.every(p => boxes[p.url]?.status === "ready");

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f4", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#1f2e1f" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        body { background: #faf8f4; }
        .display-font { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; }
        .mono-font { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        .scroll-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #d8d3c8; border-radius: 3px; }
        .scroll-thin::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <header style={{ borderBottom: "1px solid #e8e4dc", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 24px 22px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #d4e4a8, #2d4a2d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={18} color="#faf8f4" />
          </div>
          <div>
            <h1 className="display-font" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
              Lemoné Blog Studio
              <span style={{ fontSize: 10, fontWeight: 500, color: "#7d7d6d", background: "#eef2e8", padding: "2px 7px", borderRadius: 99, marginLeft: 10, verticalAlign: "middle", fontFamily: "ui-monospace, monospace" }}>
                v1.7 · powrót do 156 kategorii (oryginał z Mapowania)
              </span>
            </h1>
            <p style={{ fontSize: 12, color: "#6b6b5b", margin: "2px 0 0" }}>
              Wklej artykuł — dostaniesz boxy produktowe z powiązaniami z bazy {CATEGORIES.length} kategorii
            </p>
          </div>
          <div style={{ flex: 1 }} />
          {step !== "input" && (
            <button onClick={handleReset} style={btnSecondary}>
              <FileText size={14} /> Nowy artykuł
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
        {step === "input" && <InputView input={input} setInput={setInput} onAnalyze={handleAnalyze} />}
        {step === "empty" && <EmptyView onBack={handleReset} />}
        {step === "results" && (
          <ResultsView
            products={products}
            boxes={boxes}
            progress={progress}
            allReady={allReady}
            onRetry={runOne}
            tocItems={tocItems}
            setTocItems={setTocItems}
            rawHtml={input}
          />
        )}
      </main>

      <footer style={{ borderTop: "1px solid #e8e4dc", padding: "20px", textAlign: "center", fontSize: 11.5, color: "#6b6b5b" }}>
        Powiązania zawsze 1:1 z pliku Mapowanie_kategorii_Lemone.xlsx · slugi spoza bazy są odrzucane
      </footer>
    </div>
  );
}

function InputView({ input, setInput, onAnalyze }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28, maxWidth: 720 }}>
        <h2 className="display-font" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
          Wklej tekst artykułu
        </h2>
        <p style={{ fontSize: 14, color: "#3a4a3a", marginTop: 10, lineHeight: 1.6 }}>
          Wkleić można pełny HTML wpisu blogowego ze sklepu lub fragment z linkami produktowymi.
          Narzędzie wykryje wszystkie produkty po wzorcu URL <code className="mono-font" style={inlineCode}>/p-XXX.html</code>,
          a następnie dla każdego z nich wygeneruje box korzyści z propozycją 3 powiązań — wybranych ze 156 kategorii znajdujących się w bazie sklepu.
        </p>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 20 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Wklej HTML artykułu...'
          className="scroll-thin"
          style={{
            width: "100%",
            minHeight: 360,
            padding: 16,
            border: "1px solid #d8d3c8",
            borderRadius: 8,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12.5,
            lineHeight: 1.55,
            resize: "vertical",
            outline: "none",
            background: "#faf8f4",
            color: "#1f2e1f",
            boxSizing: "border-box"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#6b6b5b" }}>
            {input.length.toLocaleString()} znaków
          </span>
          <button
            onClick={onAnalyze}
            disabled={!input.trim()}
            style={{
              ...btnPrimary,
              opacity: input.trim() ? 1 : 0.4,
              cursor: input.trim() ? "pointer" : "not-allowed",
              padding: "11px 22px",
              fontSize: 14
            }}
          >
            <Zap size={15} /> Analizuj artykuł
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyView({ onBack }) {
  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: "60px auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff4e6", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <AlertCircle size={26} color="#c89a4a" />
      </div>
      <h2 className="display-font" style={{ fontSize: 26, fontWeight: 600, margin: "0 0 12px" }}>
        Nie wykryto produktów
      </h2>
      <p style={{ fontSize: 14, color: "#3a4a3a", lineHeight: 1.6, margin: "0 0 24px" }}>
        W przesłanym tekście nie znaleziono żadnych linków produktowych w formacie <code className="mono-font" style={inlineCode}>/p-NAZWA-XXXX.html</code>.
        <br />Sprawdź, czy kopiujesz HTML wraz z atrybutami <code className="mono-font" style={inlineCode}>href</code>, a nie czysty tekst.
      </p>
      <button onClick={onBack} style={btnPrimary}>
        <FileText size={15} /> Wróć i spróbuj ponownie
      </button>
    </div>
  );
}

function ResultsView({ products, boxes, progress, allReady, onRetry, tocItems, setTocItems, rawHtml }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const allBoxesHtml = useMemo(() => {
    return products.map(p => boxes[p.url]?.html).filter(Boolean).join("\n\n");
  }, [products, boxes]);

  const fullArticleHtml = useMemo(() => {
    if (!allReady) return "";
    return buildCompleteArticle(rawHtml, products, boxes, tocItems);
  }, [rawHtml, products, boxes, tocItems, allReady]);

  const copyText = async (text, setFlag) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 1800);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setFlag(true); setTimeout(() => setFlag(false), 1800); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  const downloadFullArticle = () => {
    const blob = new Blob([fullArticleHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `artykul-lemone-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h2 className="display-font" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
            Wykryto {products.length} {products.length === 1 ? "produkt" : products.length < 5 ? "produkty" : "produktów"}
          </h2>
          <p style={{ fontSize: 13, color: "#6b6b5b", margin: "4px 0 0" }}>
            {progress
              ? `Generowanie boxów: ${progress.current} / ${progress.total}`
              : allReady
                ? `Wszystko gotowe — pełny artykuł zawiera spis treści (${tocItems.length} pytań) i ${products.length} boxów`
                : "Ładowanie..."}
          </p>
        </div>
        <div style={{ flex: 1 }} />
        {allReady && (
          <>
            <button onClick={() => copyText(fullArticleHtml, setCopiedFull)} style={{ ...btnPrimary, background: copiedFull ? "#5b8c5a" : "#2d4a2d" }}>
              {copiedFull ? <Check size={15} /> : <Copy size={15} />}
              {copiedFull ? "Skopiowano!" : "Kopiuj cały artykuł"}
            </button>
            <button onClick={downloadFullArticle} style={btnSecondary}>
              <Download size={14} /> Pobierz .html
            </button>
          </>
        )}
      </div>

      {progress && (
        <div style={{ height: 4, background: "#e8e4dc", borderRadius: 99, overflow: "hidden", marginBottom: 24 }}>
          <div style={{
            height: "100%",
            width: `${(progress.current / progress.total) * 100}%`,
            background: "linear-gradient(90deg, #5b8c5a, #2d4a2d)",
            transition: "width 0.4s ease"
          }} />
        </div>
      )}

      <SectionHeader title="Spis treści" subtitle="Wyciągnięty z H2 i FAQ artykułu — możesz edytować przed kopiowaniem" />
      <TocCard items={tocItems} setItems={setTocItems} />

      <SectionHeader title="Boxy produktowe" subtitle={`${products.length} ${products.length === 1 ? "wykryty produkt" : "wykrytych produktów"} z artykułu`} extraTop={28} />
      <div style={{ display: "grid", gap: 16 }}>
        {products.map((p, idx) => (
          <ProductCard
            key={p.url}
            product={p}
            box={boxes[p.url]}
            index={idx + 1}
            onRetry={() => onRetry(p)}
          />
        ))}
      </div>

      {allReady && (
        <>
          <SectionHeader title="Pełny artykuł" subtitle="Twój artykuł z wstawionym spisem treści i podmienionymi boxami — kopiuj lub pobierz jako plik" extraTop={28} />
          <FullArticleCard
            html={fullArticleHtml}
            onCopy={() => copyText(fullArticleHtml, setCopiedAll)}
            copied={copiedAll}
            onDownload={downloadFullArticle}
            boxesHtml={allBoxesHtml}
          />
        </>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, extraTop = 0 }) {
  return (
    <div style={{ marginTop: extraTop, marginBottom: 14, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
      <h3 className="display-font" style={{ fontSize: 20, fontWeight: 600, color: "#1f2e1f", margin: 0, letterSpacing: "-0.01em" }}>
        {title}
      </h3>
      <span style={{ fontSize: 12.5, color: "#6b6b5b" }}>{subtitle}</span>
    </div>
  );
}

function TocCard({ items, setItems }) {
  const [copied, setCopied] = useState(false);

  const updateItem = (i, v) => setItems(items.map((x, idx) => idx === i ? v : x));
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const addItem = () => setItems([...items, ""]);

  const html = useMemo(() => buildTocHTML(items), [items]);

  const copyToc = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 20, color: "#a8a89a", fontSize: 13 }}>
        Nie udało się wyciągnąć żadnych pytań. Upewnij się, że artykuł zawiera nagłówki <code className="mono-font" style={inlineCode}>&lt;h2&gt;</code> lub sekcję FAQ z <code className="mono-font" style={inlineCode}>&lt;details&gt;&lt;summary&gt;</code>.
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 0 }}>
        <div style={{ padding: 18, borderRight: "1px solid #f0ebe0" }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: "#5b8c5a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Pytania ({items.length})
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((q, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span className="mono-font" style={{ fontSize: 11, color: "#a8a89a", paddingTop: 10, minWidth: 22 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  value={q}
                  onChange={(e) => updateItem(i, e.target.value)}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    border: "1px solid #d8d3c8",
                    borderRadius: 5,
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: "#1f2e1f",
                    background: "#faf8f4",
                    outline: "none"
                  }}
                />
                <button
                  onClick={() => removeItem(i)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#a8a89a", padding: 6, display: "flex" }}
                  title="Usuń"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addItem} style={{ ...btnSecondary, marginTop: 10, fontSize: 12 }}>
            <Plus size={12} /> Dodaj pytanie
          </button>
        </div>

        <div style={{ padding: 18, background: "#faf8f4" }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: "#5b8c5a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Podgląd
          </div>
          <div dangerouslySetInnerHTML={{ __html: html }} style={{ fontSize: 12.5 }} />
          <button
            onClick={copyToc}
            style={{ ...btnPrimary, marginTop: 12, padding: "7px 12px", fontSize: 12.5, background: copied ? "#5b8c5a" : "#2d4a2d" }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Skopiowano" : "Kopiuj tylko spis treści"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FullArticleCard({ html, onCopy, copied, onDownload, boxesHtml }) {
  const [tab, setTab] = useState("preview");
  const [copiedBoxes, setCopiedBoxes] = useState(false);
  const [liveStatuses, setLiveStatuses] = useState({}); // { url: { url, status, ok, error? } }
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);

  // Extract all relative non-product links once per article
  const links = useMemo(() => extractArticleLinks(html), [html]);

  // Counts for tab badge
  const localMissingCount = useMemo(() => links.filter(l => l.localStatus === "local-missing").length, [links]);
  const liveBrokenCount = useMemo(
    () => Object.values(liveStatuses).filter(r => r && !r.ok && !r.error).length,
    [liveStatuses]
  );
  const totalIssues = localMissingCount + liveBrokenCount;

  // Highlighted preview HTML — recomputed when statuses change
  const previewHtml = useMemo(
    () => highlightBrokenLinks(html, links, liveStatuses),
    [html, links, liveStatuses]
  );

  const runLiveCheck = async () => {
    if (links.length === 0) return;
    setChecking(true);
    setCheckError(null);
    try {
      // Only check links that exist locally — skip local-missing (URL would 404 anyway, no point hammering shop)
      const candidates = links.filter(l => l.localStatus === "local-ok").map(l => l.url);
      if (candidates.length === 0) {
        setLiveStatuses({});
        return;
      }
      const result = await checkLinksLive(candidates);
      setLiveStatuses(result);
    } catch (e) {
      setCheckError(e.message || String(e));
    } finally {
      setChecking(false);
    }
  };

  const copyJustBoxes = async () => {
    try {
      await navigator.clipboard.writeText(boxesHtml);
      setCopiedBoxes(true);
      setTimeout(() => setCopiedBoxes(false), 1500);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = boxesHtml;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopiedBoxes(true); setTimeout(() => setCopiedBoxes(false), 1500); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  const tabBtn = (id, label, badge = null, badgeColor = null) => (
    <button
      onClick={() => setTab(id)}
      style={{
        background: "none",
        border: "none",
        padding: "12px 18px",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: tab === id ? 600 : 400,
        color: tab === id ? "#1f2e1f" : "#6b6b5b",
        borderBottom: `2px solid ${tab === id ? "#2d4a2d" : "transparent"}`,
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 7
      }}
    >
      {label}
      {badge != null && (
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "1px 7px",
          borderRadius: 99,
          background: badgeColor || "#e8e4dc",
          color: badgeColor ? "#fff" : "#5b6b5b",
          minWidth: 18,
          textAlign: "center"
        }}>{badge}</span>
      )}
    </button>
  );

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #f0ebe0", background: "#faf8f4", flexWrap: "wrap" }}>
        {tabBtn("preview", "Podgląd renderowany", totalIssues > 0 ? totalIssues : null, totalIssues > 0 ? "#c0392b" : null)}
        {tabBtn("links", "Linki", links.length > 0 ? links.length : null)}
        {tabBtn("code", `Kod HTML (${(html.length / 1024).toFixed(1)} KB)`)}
      </div>

      {tab === "preview" && (
        <div className="scroll-thin" style={{ padding: 20, maxHeight: 600, overflow: "auto" }}>
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      )}

      {tab === "links" && (
        <LinksPanel
          links={links}
          liveStatuses={liveStatuses}
          checking={checking}
          checkError={checkError}
          onCheck={runLiveCheck}
        />
      )}

      {tab === "code" && (
        <pre className="mono-font scroll-thin" style={{
          margin: 0,
          padding: 18,
          fontSize: 11,
          lineHeight: 1.55,
          color: "#d8d3c8",
          background: "#1f2e1f",
          maxHeight: 500,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}>
          {html}
        </pre>
      )}

      <div style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid #f0ebe0", background: "#faf8f4", flexWrap: "wrap" }}>
        <button onClick={onCopy} style={{ ...btnPrimary, padding: "8px 14px", fontSize: 13, background: copied ? "#5b8c5a" : "#2d4a2d" }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Skopiowano cały artykuł" : "Kopiuj cały artykuł"}
        </button>
        <button onClick={onDownload} style={btnSecondary}>
          <Download size={13} /> Pobierz .html
        </button>
        <button onClick={copyJustBoxes} style={btnSecondary}>
          {copiedBoxes ? <Check size={13} /> : <Copy size={13} />}
          {copiedBoxes ? "Skopiowano boxy" : "Tylko boxy (do ręcznego wklejenia)"}
        </button>
      </div>
    </div>
  );
}

function LinksPanel({ links, liveStatuses, checking, checkError, onCheck }) {
  if (links.length === 0) {
    return (
      <div style={{ padding: 28, textAlign: "center", color: "#6b6b5b", fontSize: 13 }}>
        Brak linków kategorii w artykule (oprócz produktów <code style={inlineCode}>/p-XXX.html</code>).
      </div>
    );
  }

  const localOk = links.filter(l => l.localStatus === "local-ok").length;
  const localMissing = links.filter(l => l.localStatus === "local-missing").length;
  const liveCount = Object.keys(liveStatuses).length;

  const statusFor = (link) => {
    if (link.localStatus === "local-missing") return { label: "Brak slugu w bazie", color: "#c0392b", bg: "#fde2e0" };
    const live = liveStatuses[link.url];
    if (!live) return { label: "Lokalnie OK", color: "#5b8c5a", bg: "#e8f0e0" };
    if (live.error) return { label: `Błąd: ${live.error}`, color: "#7d6e4a", bg: "#f0eadb" };
    if (live.ok) return { label: `Live OK (${live.status})`, color: "#2d4a2d", bg: "#d4e8c8" };
    return { label: `Live ${live.status || "404"}`, color: "#d97706", bg: "#fef3c7" };
  };

  return (
    <div className="scroll-thin" style={{ maxHeight: 600, overflow: "auto" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0ebe0", background: "#faf8f4", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: "#3a4a3a" }}>
          <strong>{links.length}</strong> linków · <span style={{ color: "#5b8c5a" }}>{localOk} w bazie</span>
          {localMissing > 0 && <> · <span style={{ color: "#c0392b" }}>{localMissing} brak slugu</span></>}
          {liveCount > 0 && <> · <span style={{ color: "#5b6b5b" }}>{liveCount} sprawdzonych live</span></>}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={onCheck}
          disabled={checking || localOk === 0}
          style={{
            ...btnPrimary,
            padding: "7px 13px",
            fontSize: 12.5,
            background: checking ? "#5b8c5a" : "#2d4a2d",
            opacity: localOk === 0 ? 0.4 : 1,
            cursor: localOk === 0 ? "not-allowed" : "pointer"
          }}
        >
          {checking ? <Loader2 size={13} className="spin" /> : <Zap size={13} />}
          {checking ? "Sprawdzam..." : `Sprawdź na żywo (${localOk})`}
        </button>
      </div>

      {checkError && (
        <div style={{ padding: "10px 20px", background: "#fde2e0", color: "#8a2a1f", fontSize: 12.5, borderBottom: "1px solid #f0ebe0" }}>
          <AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Live check nie powiódł się: {checkError}
        </div>
      )}

      <div>
        {links.map((link) => {
          const s = statusFor(link);
          return (
            <div key={link.url} style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              padding: "11px 20px",
              borderBottom: "1px solid #f4f0e6",
              alignItems: "center"
            }}>
              <div style={{ minWidth: 0 }}>
                <div className="mono-font" style={{ fontSize: 12, color: "#1f2e1f", wordBreak: "break-all" }}>
                  {link.url}
                  {link.count > 1 && <span style={{ marginLeft: 8, fontSize: 10.5, color: "#7d7d6d", fontWeight: 500 }}>×{link.count}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "#7d7d6d", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  „{link.text}"
                </div>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 99,
                background: s.bg,
                color: s.color,
                whiteSpace: "nowrap"
              }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({ product, box, index, onRetry }) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = box?.status || "pending";

  const copyHtml = async () => {
    if (!box?.html) return;
    try {
      await navigator.clipboard.writeText(box.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = box.html;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid #f0ebe0" }}>
        <span className="display-font" style={{ fontSize: 26, fontStyle: "italic", color: "#a8a89a", lineHeight: 1, minWidth: 36 }}>
          {String(index).padStart(2, "0")}
        </span>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #f0ebe0", background: "#fafafa" }} onError={(e) => e.currentTarget.style.display = "none"} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 6, background: "#f4f0e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={18} color="#a8a89a" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "#1f2e1f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.name}
          </div>
          <div className="mono-font" style={{ fontSize: 11, color: "#6b6b5b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.url}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ padding: 18 }}>
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState error={box.error} onRetry={onRetry} />}
        {status === "pending" && <PendingState />}
        {status === "ready" && (
          <ReadyState
            box={box}
            onShowCode={() => setShowCode(s => !s)}
            showCode={showCode}
            onCopy={copyHtml}
            copied={copied}
            onRetry={onRetry}
          />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { bg: "#f4f0e6", color: "#a8a89a", text: "Oczekuje" },
    loading: { bg: "#fff4e6", color: "#c89a4a", text: "Generuję..." },
    ready: { bg: "#eef4e8", color: "#5b8c5a", text: "Gotowe" },
    error: { bg: "#fdecec", color: "#c66060", text: "Błąd" }
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 99, background: s.bg, color: s.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {s.text}
    </span>
  );
}

function PendingState() {
  return <div style={{ textAlign: "center", color: "#a8a89a", fontSize: 13, padding: "16px 0" }}>Czeka w kolejce...</div>;
}

function LoadingState() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px 0", color: "#6b6b5b", fontSize: 13 }}>
      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
      <span>Claude Sonnet analizuje opis i dobiera kategorie...</span>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ background: "#fdecec", border: "1px solid #f4caca", borderRadius: 8, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <AlertCircle size={18} color="#c66060" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#9a4a4a", marginBottom: 4 }}>Generowanie nie powiodło się</div>
        <div style={{ fontSize: 12.5, color: "#6b4a4a", marginBottom: 10 }}>{error}</div>
        <button onClick={onRetry} style={btnSecondary}>
          <RefreshCw size={13} /> Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}

function ContainerStrip({ containers, catsConsidered, fallbackUsed }) {
  if (fallbackUsed) {
    return (
      <span style={{ fontSize: 11, color: "#9a6e2a", display: "inline-flex", alignItems: "center", gap: 5 }}>
        <AlertCircle size={11} />
        fallback — pełna lista {catsConsidered} kategorii
      </span>
    );
  }
  if (!containers || containers.length === 0) return null;
  const labelById = Object.fromEntries(CONTAINERS.map(c => [c.id, c.label]));
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
      <span style={{ color: "#7d7d6d" }}>klasyfikator:</span>
      {containers.map((id) => (
        <span key={id} style={{
          background: "#eaf3e2",
          color: "#2d4a2d",
          border: "1px solid #cfe1bf",
          padding: "2px 8px",
          borderRadius: 99,
          fontWeight: 500
        }}>{labelById[id] || id}</span>
      ))}
      <span style={{ color: "#7d7d6d" }}>· {catsConsidered} kat.</span>
    </div>
  );
}

function ReadyState({ box, onShowCode, showCode, onCopy, copied, onRetry }) {
  return (
    <div>
      <div style={{ background: "#faf8f4", borderRadius: 10, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: "#5b8c5a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Podgląd
          </div>
          <ContainerStrip containers={box.containers} catsConsidered={box.catsConsidered} fallbackUsed={box.fallbackUsed} />
        </div>
        <div style={{ background: "#fff8e6", borderRadius: 10, border: "1px solid #f0e6c8", padding: 15, fontSize: 13, lineHeight: 1.55 }}>
          {box.forWho?.length > 0 && (
            <p style={{ margin: "0 0 10px" }}>
              <strong>Dla kogo?</strong><br />
              {box.forWho.map((l, i) => (
                <span key={i}>✔ {l}{i < box.forWho.length - 1 && <br />}</span>
              ))}
            </p>
          )}
          {box.whyWorth?.length > 0 && (
            <p style={{ margin: "10px 0" }}>
              <strong>Dlaczego warto:</strong><br />
              {box.whyWorth.map((l, i) => (
                <span key={i}>→ {l}{i < box.whyWorth.length - 1 && <br />}</span>
              ))}
            </p>
          )}
          {box.related?.length > 0 && (
            <p style={{ margin: "10px 0 0" }}>
              <strong>Powiązane:</strong>{" "}
              {box.related.map((r, i) => (
                <span key={i}>
                  <a href={r.slug} onClick={(e) => e.preventDefault()} style={{ color: "#2d4a2d", textDecoration: "underline" }}>
                    {r.label}
                  </a>
                  {i < box.related.length - 1 && " • "}
                </span>
              ))}
            </p>
          )}
        </div>

        {box.related?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {box.related.map((r, i) => (
              <span key={i} className="mono-font" style={{ fontSize: 10.5, color: "#5b8c5a", background: "#eef4e8", padding: "3px 8px", borderRadius: 99, border: "1px solid #d4e4c8" }}>
                ✓ {r.slug}
              </span>
            ))}
          </div>
        )}

        {box.warnings?.length > 0 && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#fff4e6", borderRadius: 6, fontSize: 11.5, color: "#9a6e2a" }}>
            ⚠ {box.warnings.join("; ")}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={onCopy} style={{ ...btnPrimary, padding: "8px 14px", fontSize: 13, background: copied ? "#5b8c5a" : "#2d4a2d" }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Skopiowano" : "Kopiuj HTML"}
        </button>
        <button onClick={onShowCode} style={{ ...btnSecondary, fontSize: 12.5 }}>
          {showCode ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {showCode ? "Ukryj kod" : "Pokaż kod"}
        </button>
        <button onClick={onRetry} style={{ ...btnSecondary, fontSize: 12.5 }}>
          <RefreshCw size={13} /> Wygeneruj ponownie
        </button>
      </div>

      {showCode && (
        <pre className="mono-font scroll-thin" style={{
          margin: "12px 0 0",
          padding: 14,
          fontSize: 11.5,
          lineHeight: 1.55,
          color: "#d8d3c8",
          background: "#1f2e1f",
          borderRadius: 8,
          maxHeight: 320,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}>
          {box.html}
        </pre>
      )}
    </div>
  );
}

const btnPrimary = {
  background: "#2d4a2d",
  color: "#faf8f4",
  border: "none",
  borderRadius: 6,
  padding: "9px 16px",
  fontSize: 13.5,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontFamily: "inherit",
  transition: "background 0.15s"
};

const btnSecondary = {
  background: "#fff",
  color: "#2d4a2d",
  border: "1px solid #d8d3c8",
  borderRadius: 6,
  padding: "7px 12px",
  fontSize: 12.5,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "inherit",
  transition: "all 0.15s"
};

const inlineCode = {
  background: "#f4f0e6",
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: "0.9em",
  color: "#5b6b5b"
};
