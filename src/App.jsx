import { useState, useMemo, useRef, useEffect } from "react";
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
// Wariant tolerancyjny — łapie WSZYSTKIE warianty linków produktu jakie CMS może wkleić:
//   /p-XXX.html                              (relative, kanoniczny)
//   /cms/p-XXX.html                          (stary edytor, /cms/ prefix — v2.2)
//   https://sklep.lemone.pl/p-XXX.html       (absolute URL, nowy CKEditor — v2.7)
//   https://www.sklep.lemone.pl/p-XXX.html   (z www, na wszelki wypadek)
// Bez tego apka nie grupowałaby linka tytułu i linka obrazka, generowała lemone-product
// bez lp-photo i zostawiała luźny <p><a><img></a></p> w treści.
const PRODUCT_URL_TOLERANT_RE = /^(?:https?:\/\/(?:www\.)?sklep\.lemone\.pl)?(?:\/cms)?\/p-.+\.html$/i;

// Zwraca canoniczny URL produktu z dowolnego wariantu — strip:
//   (1) absolute prefix https://sklep.lemone.pl (z/bez www)
//   (2) /cms/ prefix
// Wszystkie 3 warianty z PRODUCT_URL_TOLERANT_RE redukują się do /p-XXX.html.
function canonicalProductUrl(href) {
  if (!href) return "";
  let canonical = href.replace(/^https?:\/\/(?:www\.)?sklep\.lemone\.pl/i, "");
  canonical = canonical.replace(/^\/cms\//, "/");
  return canonical;
}

function parseProducts(input) {
  const html = (input || "").trim();
  if (!html) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");
  const allLinks = Array.from(doc.querySelectorAll("a[href]"));
  // Łapiemy WSZYSTKIE warianty (z i bez /cms/), ale grupujemy po canonical URL (bez prefixu).
  // Dzięki temu link "/p-XXX.html" i "/cms/p-XXX.html" trafiają do tego samego produktu — ważne
  // bo niektóre obrazki w CMS mają prefix /cms/ podczas gdy tytuł produktu go nie ma.
  const productLinks = allLinks.filter(a => PRODUCT_URL_TOLERANT_RE.test(a.getAttribute("href")));

  if (productLinks.length === 0) return [];

  const order = [];
  const byUrl = new Map();
  for (const link of productLinks) {
    const rawHref = link.getAttribute("href");
    const url = canonicalProductUrl(rawHref); // ZAWSZE canonical (bez /cms/)
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

  // H2s w kolejności w dokumencie — to są główne sekcje artykułu.
  // Headery wrapperów FAQ (z details>summary w środku) pomijamy, bo summary'es nie idą do głównego TOC.
  // (v2.8) Wcześniej apka łapała też details>summary jako pozycje TOC, co powodowało że pytania
  // ze starych sekcji FAQ wskakiwały do głównego spisu treści jako osobne sekcje. Niepożądane —
  // TOC powinien zawierać tylko sekcje H2 najwyższego poziomu.
  const h2s = Array.from(doc.querySelectorAll("h2"));
  for (const h2 of h2s) {
    const text = h2.textContent.replace(/\s+/g, " ").trim();
    if (!text || seen.has(text)) continue;
    // Skip stare wrappery FAQ ("Najczęstsze pytania", "FAQ") — zostaną zastąpione przez
    // generated FAQ section z buildFaqHTML, który dorzuca własną pozycję TOC z poprawnym id.
    if (/najczęstsze pytania|^faq$/i.test(text)) continue;
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
// Renders FAQ section as styled cards (no accordion — CMS sanitization strips
// interactive `<details>` styling). Each Q&A is a self-contained div with inline styles.
// Plus FAQPage JSON-LD schema embedded as <script> for SEO (Google rich results).
// v3.3 (B4 z briefu): ujednolicenie myślników w treściach generowanych przez model.
// Sonnet potrafi zwracać "—" (em-dash) i "–" (en-dash); artykuł używa "-". Normalizujemy
// do "-" z otaczającymi spacjami, żeby widoczny tekst i JSON-LD były spójne z resztą treści.
function normalizeDashes(s) {
  return (s || "")
    // v3.4.2: zakresy liczbowe NAJPIERW — "2–3", "2 — 3", "2 - 3" → "2-3" (dywiz bez spacji).
    // Poprzednia wersja rozbijała zakresy na "2 - 3", bo reguła ogólna łapała też cyfry.
    .replace(/(\d)\s*[—–-]\s*(\d)/g, "$1-$2")
    // Reszta em/en dashy → " - "
    .replace(/\s*[—–]\s*/g, " - ");
}

// v3.5: JSON dla dedykowanego pola "FAQ (dane strukturalne)" w CMS Lemoné.
// Format wymagany przez pole: [{"question": "...", "answer": "..."}].
// CMS renderuje z tego sekcję FAQ na stronie i generuje FAQPage JSON-LD samodzielnie,
// więc Studio nie wstawia już żadnego FAQ do treści artykułu.
function buildFaqCmsJson(items) {
  const filtered = (items || []).filter(it => it && it.q && it.a)
    .map(it => ({ question: normalizeDashes(it.q).trim(), answer: normalizeDashes(it.a).trim() }));
  if (filtered.length === 0) return "";
  return JSON.stringify(filtered, null, 2);
}

function buildFaqHTML(items) {
  const filtered = (items || []).filter(it => it && it.q && it.a)
    .map(it => ({ q: normalizeDashes(it.q), a: normalizeDashes(it.a) }));
  if (filtered.length === 0) return "";

  const cards = filtered.map(it => {
    const q = escapeHtml(it.q.trim());
    const a = escapeHtml(it.a.trim());
    return `    <div style="border:1px solid #dce8dc;border-left:4px solid #5b8c5a;border-radius:10px;margin:14px 0;background:#fafbf8;padding:18px 22px;">
        <p style="font-size:16px;font-weight:600;color:#2d4a2d;margin:0 0 10px;line-height:1.4;">
            ${q}
        </p>
        <p style="font-size:14px;color:#3a4a3a;line-height:1.65;margin:0;">
            ${a}
        </p>
    </div>`;
  }).join("\n");

  // JSON-LD FAQPage schema — Google reads this to potentially show Q&A in search results.
  // Independent from visual rendering; works even bez akordeonu.
  const schemaItems = filtered.map(it => ({
    "@type": "Question",
    "name": it.q.trim(),
    "acceptedAnswer": { "@type": "Answer", "text": it.a.trim() }
  }));
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": schemaItems
  };
  const schemaScript = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;

  return `<div style="margin:40px 0 30px;">
    <h2 id="sec-q-a-czesto-zadawane-pytania" style="font-size:22px;color:#2d4a2d;margin-bottom:18px;">Q&amp;A - często zadawane pytania</h2>
${cards}
${schemaScript}
</div>`;
}

function buildCompleteArticle(originalHtml, products, boxes, tocItems, faqItems) {
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

  // 4. CLEANUP starych formatów z poprzednich generacji apki.
  // Czyścimy TRZY warianty żeby regeneracja zawsze zaczynała z czystą kartą:
  //   (a) stare żółte boxy ze stylem inline background-color:#fff8e6 (apka <= v1.9)
  //   (b) stare <figure class="image"> wstawione przez image transform (v1.6-v1.9)
  //   (c) stare <div class="lemone-product"> (poprzednie uruchomienie nowego formatu — np. user zregenerował)
  const oldYellowBoxes = Array.from(doc.querySelectorAll("div[style]")).filter(el =>
    /background-color:\s*#fff8e6/i.test(el.getAttribute("style") || "")
  );
  for (const el of oldYellowBoxes) el.remove();

  const oldFigures = Array.from(doc.querySelectorAll("figure.image"));
  for (const fig of oldFigures) {
    // Wyciągnij obrazek z figure i wstaw z powrotem jako "luźny" link z img w paragrafie,
    // żeby krok 5 mógł go znów ZNALEŹĆ i opakować w lemone-product.
    const link = fig.querySelector("a");
    const img = fig.querySelector("img");
    if (link && img) {
      const newP = doc.createElement("p");
      const newA = doc.createElement("a");
      newA.setAttribute("href", link.getAttribute("href") || "");
      const newImg = doc.createElement("img");
      newImg.setAttribute("src", img.getAttribute("src") || "");
      if (img.getAttribute("alt")) newImg.setAttribute("alt", img.getAttribute("alt"));
      newA.appendChild(newImg);
      newP.appendChild(newA);
      fig.replaceWith(newP);
    } else {
      fig.remove();
    }
  }

  const oldLemoneProducts = Array.from(doc.querySelectorAll("div.lemone-product"));
  for (const lp of oldLemoneProducts) {
    // Rozpakuj zdjęcie z lemone-product i wstaw z powrotem jako luźny <p> z linkiem do produktu,
    // żeby krok 5 mógł go ponownie opakować w nową strukturę.
    const photoA = lp.querySelector(".lp-photo a");
    const photoImg = lp.querySelector(".lp-photo img");
    if (photoA && photoImg) {
      const newP = doc.createElement("p");
      const newA = doc.createElement("a");
      newA.setAttribute("href", photoA.getAttribute("href") || "");
      const newImg = doc.createElement("img");
      newImg.setAttribute("src", photoImg.getAttribute("src") || "");
      if (photoImg.getAttribute("alt")) newImg.setAttribute("alt", photoImg.getAttribute("alt"));
      newA.appendChild(newImg);
      newP.appendChild(newA);
      lp.replaceWith(newP);
    } else {
      lp.remove();
    }
  }

  // 4.5 NORMALIZACJA ANOMALII CZCIONKOWYCH (v2.4).
  // CMS wstawia podtytuły wewnątrz list jako <h5> lub <h6>, które domyślnie są MNIEJSZE
  // od paragrafu (~0.83em). Wizualnie tytuł powinien być WIĘKSZY i pogrubiony, nie mniejszy.
  // Wymuszamy inline style na takich elementach żeby wyglądały jak prawdziwy podtytuł sekcji.
  const smallHeadings = doc.querySelectorAll("li h5, li h6");
  for (const h of smallHeadings) {
    const existing = (h.getAttribute("style") || "").trim();
    // Skip jeśli już znormalizowane (idempotent)
    if (/font-size\s*:\s*16px/i.test(existing)) continue;
    const sep = existing && !existing.endsWith(";") ? ";" : "";
    h.setAttribute("style", existing + sep + "font-size:16px;font-weight:600;margin:0 0 6px;");
  }

  // 4.6 USUNIĘCIE WRAPPERÓW .product/.row/.col-12 (v3.1, zastępuje spłaszczanie z v2.9).
  // CMS Lemoné przy wklejaniu kolejnych produktów zagnieżdża każdy następny WEWNĄTRZ poprzedniego:
  //   <div class="product"><div class="row"><div class="col-12">
  //     <p>tytuł1</p>... <div class="product">...  ← kaskada
  // v2.9 przenosiło zagnieżdżone div.product na poziom sibling, ale miało lukę: treść artykułu
  // (akapit zamykający, box "Zobacz również", FAQ), która siedziała w najgłębszym col-12 ZA
  // ostatnim produktem, zostawała UWIĘZIONA wewnątrz karty ostatniego produktu.
  // v3.1 idzie dalej: usuwa wrappery .product/.row/.col-12 CAŁKOWICIE (unwrap — zastąpienie
  // wrappera jego dziećmi, z zachowaniem kolejności). To legacy Bootstrap grid:
  //   - col-12 = pełna szerokość, czyli brak wrappera renderuje się identycznie
  //   - spec lemone-product Szczepana nie wymaga tych wrapperów
  //   - bez wrapperów kaskada zagnieżdżeń jest NIEMOŻLIWA z definicji
  //   - treść końcowa artykułu ląduje w naturalnym liniowym porządku dokumentu
  // Unwrap iteracyjny. Najpierw MARKUJEMY wrappery należące do struktur produktowych
  // (div.row/div.col-12 łapiemy tylko WEWNĄTRZ div.product, żeby nie ruszyć ewentualnego
  // grida użytego gdzie indziej w treści artykułu), potem unwrapujemy oznaczone.
  const toUnwrap = new Set();
  for (const el of doc.querySelectorAll("div.product")) toUnwrap.add(el);
  // v3.3 (D1 z briefu): unwrapujemy WSZYSTKIE div.row/div.col-12, nie tylko te wewnątrz
  // div.product. Audyt wykrył samodzielny wrapper row>col-12 obejmujący środek artykułu
  // (produkty + nagłówki H2), który przechodził nietknięty. Krok 6 odbudowuje wrappery
  // produktowe w poprawnej formie, więc żaden potrzebny wrapper nie ginie.
  for (const el of doc.querySelectorAll("div.row, div.col-12")) toUnwrap.add(el);
  let unwrapCounter = 0;
  for (const wrapper of toUnwrap) {
    if (unwrapCounter++ > 500) break;
    if (!wrapper.parentNode) continue; // już odłączony (nie powinno się zdarzyć, ale safety)
    const parent = wrapper.parentNode;
    while (wrapper.firstChild) {
      parent.insertBefore(wrapper.firstChild, wrapper);
    }
    parent.removeChild(wrapper);
  }

  // 4.7 CLEANUP ARTEFAKTÓW EDYTORA (v3.2, Defekt 3 z briefu audytowego).
  // - <p>&nbsp;</p> i puste akapity-wypełniacze: usuwamy w całości
  // - <span style="letter-spacing:0px;"> (artefakt wklejania z Worda): unwrap, treść zostaje
  // - wiodące/końcowe &nbsp; w tekstach: normalizacja w tytułach/podtytułach robiona przy parsowaniu
  for (const span of Array.from(doc.querySelectorAll('span[style*="letter-spacing"]'))) {
    const st = span.getAttribute("style") || "";
    // Tylko zerowe letter-spacing (0px, 0em, 0) — nie ruszamy celowych stylistycznych spacingów
    if (!/letter-spacing:\s*0(px|em|rem)?\s*(;|$)/i.test(st)) continue;
    const parent = span.parentNode;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
  }
  for (const p of Array.from(doc.querySelectorAll("p"))) {
    // Pusty akapit = tekst po usunięciu &nbsp; i whitespace jest pusty ORAZ brak elementów (img, a itd.)
    const textEmpty = p.textContent.replace(/[\s\u00a0]+/g, "") === "";
    if (textEmpty && !p.querySelector("*")) p.remove();
  }

  // 4.8 ROZSZERZONY CLEANUP ARTEFAKTÓW (v3.3, punkty C1-C5 z briefu poprawek).
  // (C1) wiodące <br> i &nbsp; na początkach akapitów po nagłówkach
  // (C5) końcowe <br> i <br>&nbsp; w akapitach i elementach list
  // (C3) trailing &nbsp; w nagłówkach i na końcach akapitów
  // (C4) wtrącone &nbsp; po myślnikach list zamieniamy na zwykłą spację
  // (C2) gołe węzły tekstowe &nbsp; wiszące między blokami
  const trimTargets = Array.from(doc.querySelectorAll("p, li, h1, h2, h3, h4"));
  for (const el of trimTargets) {
    // Wiodące: usuwaj <br> i whitespace/&nbsp; z przodu aż do pierwszej treści
    while (el.firstChild) {
      const n = el.firstChild;
      if (n.nodeType === 1 && n.tagName === "BR") { n.remove(); continue; }
      if (n.nodeType === 3) {
        n.textContent = n.textContent.replace(/^[\s\u00a0]+/, "");
        if (n.textContent === "") { n.remove(); continue; }
      }
      break;
    }
    // Końcowe: usuwaj <br> i whitespace/&nbsp; z tyłu
    while (el.lastChild) {
      const n = el.lastChild;
      if (n.nodeType === 1 && n.tagName === "BR") { n.remove(); continue; }
      if (n.nodeType === 3) {
        n.textContent = n.textContent.replace(/[\s\u00a0]+$/, "");
        if (n.textContent === "") { n.remove(); continue; }
      }
      break;
    }
  }
  // (C4) &nbsp; wewnątrz tekstu (poza <pre>) → zwykła spacja; podwójne spacje → pojedyncza.
  // (C2) text node zawierający TYLKO whitespace/&nbsp; jako bezpośrednie dziecko kontenera
  // blokowego (body/div) → usuwamy w całości.
  const walker = doc.createTreeWalker(doc.body, 4 /* NodeFilter.SHOW_TEXT */);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const t of textNodes) {
    const parentTag = t.parentNode && t.parentNode.tagName;
    if (parentTag === "PRE" || parentTag === "CODE" || parentTag === "SCRIPT" || parentTag === "STYLE") continue;
    const onlyWs = t.textContent.replace(/[\s\u00a0]+/g, "") === "";
    if (onlyWs && (parentTag === "BODY" || parentTag === "DIV")) {
      // Goły węzeł między blokami — jeśli zawiera &nbsp;, to artefakt; czysty whitespace
      // (indentacja HTML) zostaje bo jest nieznaczący i utrzymuje czytelność źródła
      if (/\u00a0/.test(t.textContent)) t.remove();
      continue;
    }
    if (/\u00a0/.test(t.textContent)) {
      t.textContent = t.textContent.replace(/\u00a0/g, " ").replace(/ {2,}/g, " ");
    }
  }

  // 5. Dla każdego produktu — znajdź paragraf-zdjęcie i OPAKUJ w nową strukturę lemone-product.
  // Strategia: znajdujemy <p> zawierający <a><img></a> (z linkiem do tego produktu, BĄDŹ z /cms/ prefix),
  // wycinamy ten <p> i wstawiamy zamiast niego pełną strukturę lemone-product.
  // Tytuł produktu (paragraf z <a><strong>nazwa</strong></a>) zostaje NIETKNIĘTY przed strukturą.
  // Opis (paragraf po zdjęciu) zostaje NIETKNIĘTY za strukturą.
  // BUG-FIX (v2.2): obsługa wariantu /cms/p-XXX.html — niektóre obrazki w wkleconym HTML z CMS
  // mają prefix /cms/ w linku, mimo że link tekstowy do produktu nie ma tego prefixu.
  // Bez tego apka generowała lemone-product bez lp-photo i zostawiała "luźny" <p><img></p> w treści.
  for (const product of products) {
    const box = boxes[product.url];
    if (!box || box.status !== "ready") continue;

    // Wszystkie linki które MATCHUJĄ ten produkt — z dowolnym wariantem prefixu /cms/.
    // Porównujemy canonicalny URL (bez /cms/) zamiast literalnego stringa.
    const allLinks = Array.from(doc.querySelectorAll("a[href]"));
    const productLinks = allLinks.filter(a => {
      const href = a.getAttribute("href") || "";
      if (!PRODUCT_URL_TOLERANT_RE.test(href)) return false;
      return canonicalProductUrl(href) === product.url;
    });
    if (productLinks.length === 0) continue;

    // Znajdź paragraf-zdjęcie: <p> zawierający <a> (z linkiem produktu, niezależnie od /cms/) z <img>
    let photoP = null;
    let photoImg = null;
    for (const link of productLinks) {
      const img = link.querySelector("img");
      if (!img) continue;
      const p = link.closest("p");
      if (!p) continue;
      // Paragraf zawiera TYLKO obrazek (tekst pusty) — to klasyczny "paragraf zdjęcia"
      if (p.textContent.replace(/\s+/g, "") !== "") continue;
      photoP = p;
      photoImg = img;
      break;
    }

    // Buduj product object z aktualnym imageUrl (z faktycznego HTML, nie z `product.imageUrl`,
    // żeby nie używać stale data jeśli ktoś zmienił URL obrazka)
    const productWithImg = {
      ...product,
      imageUrl: photoImg ? (photoImg.getAttribute("src") || product.imageUrl) : product.imageUrl
    };

    const wrapperHtml = buildBoxOnly(productWithImg, {
      forWho: box.forWho,
      whyWorth: box.whyWorth,
      related: box.related
    });
    const tmp = doc.createElement("div");
    tmp.innerHTML = wrapperHtml;
    const wrapperEl = tmp.firstElementChild;
    if (!wrapperEl) continue;

    if (photoP) {
      // Mamy paragraf-zdjęcie → ZAMIEŃ go na strukturę lemone-product (zdjęcie idzie do lp-photo)
      photoP.replaceWith(wrapperEl);
    } else {
      // Brak paragrafu-zdjęcia (rzadki przypadek) → wstaw strukturę po tytule produktu
      let titleP = null;
      for (const link of productLinks) {
        const p = link.closest("p");
        if (p) { titleP = p; break; }
      }
      if (titleP) {
        titleP.after(wrapperEl);
      } else {
        productLinks[0].after(wrapperEl);
      }
    }

    // Po wstawieniu lemone-product: jeszcze raz przeleć przez WSZYSTKIE pozostałe paragrafy-zdjęcia
    // tego produktu i USUŃ je. To dotyczy wariantów /cms/p-XXX gdzie obrazek był w innym paragrafie
    // niż ten który zastąpiliśmy. Bez tego stary <p><a href="/cms/..."><img></a></p> zostawał luźny.
    const remainingLinks = Array.from(doc.querySelectorAll("a[href]")).filter(a => {
      const href = a.getAttribute("href") || "";
      if (!PRODUCT_URL_TOLERANT_RE.test(href)) return false;
      return canonicalProductUrl(href) === product.url;
    });
    for (const link of remainingLinks) {
      const img = link.querySelector("img");
      if (!img) continue;
      // Sprawdź czy ten obrazek nie jest już w naszej strukturze lemone-product
      if (link.closest("div.lemone-product")) continue;
      const p = link.closest("p");
      if (!p) continue;
      // Tylko jeśli paragraf zawiera tylko obrazek (nie ruszamy paragrafów z tekstem!)
      if (p.textContent.replace(/\s+/g, "") !== "") continue;
      p.remove();
    }
  }

  // 6. PRZEBUDOWA SEKCJI PRODUKTOWYCH NA FORMAT ZŁOTY (v3.2, Defekty 1-2 z briefu + wzorzec
  // z artykułu który rankuje). Dla każdego produktu, w kolejności dokumentu:
  //   (a) tytuł-paragraf (<p><a><strong>nazwa</strong></a>...) → <h3 id="prod-{slug}">
  //       <a href="{url}">{nr}. {nazwa}</a></h3> + podtytuł jako <p><strong>{podtytuł}</strong></p>
  //       BEZ drugiego linku (duplikacja linków rozmywa anchor text — brief, Defekt 2)
  //   (b) segment [h3, podtytuł, lemone-product, kolejne <p> opisu] → opakowany w
  //       <div class="product"><div class="row"><div class="col-12">...
  //       Wrapper wstawiany ZAWSZE na poziomie root treści (sibling), nigdy w innym wrapperze —
  //       kaskada niemożliwa, bo krok 4.6 wcześniej usunął wszystkie stare wrappery.
  //   (c) po ostatnim wrapperze: JSON-LD ItemList (Defekt 4) z pozycją, nazwą i absolutnym URL.
  const productOrder = [];
  const headerByUrl = new Map();

  // PASS 1: wszystkie tytuły-paragrafy → h3 + podtytuł. Robimy to dla WSZYSTKICH produktów
  // ZANIM zaczniemy zbierać segmenty, bo inaczej zbieranie opisów produktu N połykałoby
  // tytuł-paragraf produktu N+1 (który na tym etapie byłby jeszcze zwykłym <p>).
  for (const product of products) {
    const box = boxes[product.url];
    if (!box || box.status !== "ready") continue;

    const links = Array.from(doc.querySelectorAll("a[href]")).filter(a => {
      const href = a.getAttribute("href") || "";
      if (!PRODUCT_URL_TOLERANT_RE.test(href)) return false;
      return canonicalProductUrl(href) === product.url;
    });
    let titleEl = null;
    for (const l of links) {
      if (l.querySelector("img")) continue;
      if (l.closest("div.lemone-product")) continue; // link w lp-photo/related nie jest tytułem
      if (l.closest("table")) continue;               // tabela "Szybkie dopasowanie" nie jest tytułem
      // v3.4 FIX IDEMPOTENCJI: link w istniejącym H3 to tytuł z POPRZEDNIEJ generacji Studio.
      // v3.3 pomijała go ("już przebudowany"), przez co przy regeneracji własnego outputu
      // krok 4.6 rozbierał wrappery, a krok 6 ich nie odbudowywał (produkt niewykryty).
      // Teraz istniejący H3 traktujemy jak tytuł do przebudowy: renumeracja + wrapping.
      const h3host = l.closest("h3");
      if (h3host) { titleEl = h3host; break; }
      const p = l.closest("p");
      if (!p) continue;
      titleEl = p;
      break;
    }
    if (!titleEl) continue;

    const nr = productOrder.length + 1;
    productOrder.push(product);

    // Slug z canonical URL: /p-dermaquest-essential-moisturizer-2496.html → dermaquest-essential-moisturizer
    const slug = product.url
      .replace(/^\/p-/, "")
      .replace(/-\d+\.html$/i, "")
      .replace(/\.html$/i, "");

    const h3 = doc.createElement("h3");
    h3.setAttribute("id", `prod-${slug}`);
    const h3a = doc.createElement("a");
    h3a.setAttribute("href", product.url);
    // v3.4: strip starego numeru z nazwy ("1. Nazwa" → "Nazwa") — przy regeneracji własnego
    // outputu nazwa z linku H3 zawiera już numerację; bez strippingu numer by się dublował.
    const baseName0 = (product.name || "").replace(/^\s*\d+[.)]\s*/, "").replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, "");
    let cleanSubtitle = (product.subtitle || "").replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, "");
    let baseName = baseName0;
    // v3.6: rozklejenie nazw scalonych przez v3.3-v3.5 ("Nazwa - opis pojemność" w jednym H3).
    // Przy regeneracji artykułu z tamtych wersji podtytułu nie ma osobno, siedzi w nazwie
    // po " - ". Dzielimy na pierwszym " - ", żeby wrócić do formatu dwuliniowego.
    if (!cleanSubtitle && baseName.includes(" - ")) {
      const idx = baseName.indexOf(" - ");
      cleanSubtitle = baseName.slice(idx + 3).trim();
      baseName = baseName.slice(0, idx).trim();
    }
    // v3.6 (powrót do formatu dwuliniowego, decyzja Roberta 2026-08-02):
    // H3 = TYLKO marka + nazwa handlowa (z numeracją). Opis + pojemność idą do OSOBNEGO
    // akapitu pod H3, lekko mniejszego. v3.3 skleiła to w jeden H3 i wizualnie "znikały"
    // główne nazwy produktów. Pełna nazwa (nazwa + opis) zostaje w altach i ItemList.
    const fullName = cleanSubtitle
      ? `${baseName} - ${cleanSubtitle.charAt(0).toLowerCase()}${cleanSubtitle.slice(1)}`
      : baseName;
    h3a.textContent = `${nr}. ${baseName}`;
    h3.appendChild(h3a);

    titleEl.replaceWith(h3);

    // Usuń ewentualny STARY akapit podtytułu tuż pod h3 (regeneracja formatu v3.6),
    // żeby nie zdublować — zaraz wstawimy świeży.
    const maybeOldSub = h3.nextElementSibling;
    if (maybeOldSub && maybeOldSub.tagName === "P" && maybeOldSub.querySelector("span.subtitle")) {
      if (!cleanSubtitle) {
        const t = maybeOldSub.textContent.replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, "");
        if (t) cleanSubtitle = t;
      }
      maybeOldSub.remove();
    }

    let lastHeaderEl = h3;
    if (cleanSubtitle) {
      const subP = doc.createElement("p");
      // Delikatnie mniejszy od H3, pogrubiony, bez linku (brief D2: bez dublowania anchor textu).
      // span.subtitle w środku pozwala parseProducts odzyskać podtytuł przy kolejnej regeneracji.
      subP.setAttribute("style", "font-size:15px;font-weight:600;margin:2px 0 10px;");
      const subSpan = doc.createElement("span");
      subSpan.setAttribute("class", "subtitle");
      subSpan.textContent = cleanSubtitle.charAt(0).toUpperCase() + cleanSubtitle.slice(1);
      subP.appendChild(subSpan);
      h3.after(subP);
      lastHeaderEl = subP;
    }
    headerByUrl.set(product.url, { h3, lastHeaderEl, fullName });
  }

  // PASS 2: zbieranie segmentów i wrapping. Teraz każdy tytuł jest już h3, więc pętla
  // zbierająca opisy zatrzyma się na h3 następnego produktu (nie jest <p>).
  for (const product of productOrder) {
    const header = headerByUrl.get(product.url);
    if (!header) continue;
    const { h3, lastHeaderEl } = header;

    const segment = [h3];
    if (lastHeaderEl !== h3) segment.push(lastHeaderEl);
    let cursor = lastHeaderEl.nextElementSibling;
    let sawBox = false;
    while (cursor) {
      const tag = cursor.tagName;
      const isBox = tag === "DIV" && cursor.classList.contains("lemone-product");
      const isDescP = tag === "P";
      if (isBox && !sawBox) {
        segment.push(cursor);
        sawBox = true;
        cursor = cursor.nextElementSibling;
        continue;
      }
      if (isDescP && sawBox) {
        segment.push(cursor);
        cursor = cursor.nextElementSibling;
        continue;
      }
      break;
    }

    // Opakuj segment w div.product > div.row > div.col-12, wrapper wstawiony w miejscu h3
    const wrapProduct = doc.createElement("div");
    wrapProduct.setAttribute("class", "product");
    const wrapRow = doc.createElement("div");
    wrapRow.setAttribute("class", "row");
    const wrapCol = doc.createElement("div");
    wrapCol.setAttribute("class", "col-12");
    wrapProduct.appendChild(wrapRow);
    wrapRow.appendChild(wrapCol);

    h3.parentNode.insertBefore(wrapProduct, h3);
    for (const el of segment) wrapCol.appendChild(el);
  }

  // 6.5 JSON-LD ItemList po ostatnim wrapperze produktowym (Defekt 4).
  // Absolutne URL-e (https://sklep.lemone.pl + canonical), kolejność = kolejność bloków w treści.
  // v3.4: najpierw USUŃ stare ItemListy z poprzednich generacji (analogicznie do FAQPage
  // w kroku 7). Bez tego przy regeneracji stary skrypt ("Ranking produktów", nazwy bez
  // marek) zostawał w treści zamiast nowego lub obok niego.
  for (const s of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const j = JSON.parse(s.textContent || "{}");
      if (j["@type"] === "ItemList") s.remove();
    } catch (_) {}
  }
  if (productOrder.length > 0) {
    const allWrappers = doc.querySelectorAll("div.product");
    const lastWrapper = allWrappers[allWrappers.length - 1];
    if (lastWrapper) {
      // v3.4.1: nazwa listy — heurystyka trójstopniowa:
      //   1) H2 zawierający "TOP {n}" (klasyczny ranking)
      //   2) H2 bezpośrednio POPRZEDZAJĄCY pierwszy blok produktowy w dokumencie
      //      (to sekcja, w której produkty faktycznie występują)
      //   3) neutralne "Polecane produkty"
      // Poprzedni fallback ("ostatni H2 nie-FAQ") brał nagłówek sekcji poradnikowej
      // typu "Jak wybrać SPF...", bo taka sekcja zwykle kończy artykuł. Zła heurystyka.
      let listName = (tocItems && tocItems.find(t => /top \d+/i.test(t))) || "";
      if (!listName) {
        const firstWrapper = allWrappers[0];
        let prev = firstWrapper ? firstWrapper.previousElementSibling : null;
        while (prev) {
          if (prev.tagName === "H2") { listName = prev.textContent.replace(/\s+/g, " ").trim(); break; }
          prev = prev.previousElementSibling;
        }
      }
      if (!listName) listName = "Polecane produkty";
      const itemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": listName,
        "numberOfItems": productOrder.length,
        "itemListElement": productOrder.map((p, i) => {
          // v3.3 (D3/D4): pełna nazwa handlowa w ItemList — identyczna z H3 (bez numeru)
          const header = headerByUrl.get(p.url);
          const itemName = (header && header.fullName) || p.name;
          return {
            "@type": "ListItem",
            "position": i + 1,
            "name": itemName.replace(/[\s\u00a0]+$/g, ""),
            "url": "https://sklep.lemone.pl" + p.url
          };
        })
      };
      // Walidacja parserem przed zapisem (wymóg briefu): JSON.stringify + parse round-trip
      let itemListJson = "";
      try {
        itemListJson = JSON.stringify(itemList);
        JSON.parse(itemListJson);
      } catch (e) {
        itemListJson = "";
      }
      if (itemListJson) {
        const script = doc.createElement("script");
        script.setAttribute("type", "application/ld+json");
        script.textContent = itemListJson;
        lastWrapper.after(script);
      }
    }
  }

  // 7. Wstaw sekcję FAQ na samym dole artykułu (po Podsumowaniu, jako ostatni element treści).
  // Jeśli artykuł miał już sekcję FAQ z poprzedniej generacji, wykasuj ją żeby nie duplikować.
  // Wykrywanie starej: dopasowuje OBA warianty nazwy używane przez Studio kiedykolwiek
  // ("Najczęściej zadawane pytania" v1.8, "Q&A - często zadawane pytania" v1.9+).
  const oldFaqHeadings = Array.from(doc.querySelectorAll("h2")).filter(h => {
    const t = (h.textContent || "").toLowerCase();
    return /najczęściej zadawane pytania/.test(t) || /q&a.*często zadawane pytania/.test(t);
  });
  for (const h of oldFaqHeadings) {
    // Usuń wszystko od tego h2 do końca rodzica (ten h2 + następujące rodzeństwo do końca)
    const parent = h.parentElement;
    if (!parent) { h.remove(); continue; }
    let el = h;
    while (el) {
      const next = el.nextSibling;
      el.remove();
      el = next;
    }
    // v3.3 (D2 z briefu): po wyczyszczeniu zawartości rodzic-wrapper (np.
    // <div style="margin:40px 0 30px;">) zostaje pusty — usuwamy go, żeby nie wisiał
    // przed nową sekcją Q&A jako martwy element.
    if (parent.tagName === "DIV" && parent.textContent.replace(/[\s\u00a0]+/g, "") === "" && !parent.querySelector("img, script")) {
      parent.remove();
    }
  }
  // Też skasuj stare FAQPage JSON-LD schema (zostawiamy inne JSON-LD jak Article)
  const oldFaqSchemas = Array.from(doc.querySelectorAll('script[type="application/ld+json"]')).filter(s => {
    try {
      const j = JSON.parse(s.textContent || "{}");
      return j["@type"] === "FAQPage";
    } catch (_) { return false; }
  });
  for (const s of oldFaqSchemas) s.remove();

  // v3.5: NIE wstawiamy już sekcji FAQ ani FAQPage do treści artykułu.
  // CMS Lemoné ma dedykowane pole "FAQ (dane strukturalne)" przyjmujące JSON
  // [{"question","answer"}]; sanitizer edytora usuwa bloki <script type="application/ld+json">
  // z treści wpisu przy zapisie, a sekcję FAQ i schema FAQPage renderuje sam CMS
  // (w miejscu znacznika [faq] w treści, a bez znacznika — na końcu wpisu).
  // Cleanup starych sekcji i schem powyżej ZOSTAJE: wejściowe artykuły z poprzednich
  // generacji nadal zawierają FAQ w treści i trzeba je stamtąd usuwać.
  // JSON dla pola CMS generuje buildFaqCmsJson(), kopiowany osobnym przyciskiem w UI.

  // v3.3 (D2 z briefu) — GLOBALNY SWEEP PUSTYCH DIVÓW.
  // Puste divy-wypełniacze (np. <div style="margin:40px 0 30px;"></div>) zostające po
  // ręcznych edycjach w CMS albo po usunięciu treści: usuwamy każdy div bez tekstu,
  // bez obrazków i bez skryptów. Iteracyjnie, bo usunięcie dziecka może opróżnić rodzica.
  let sweepPass = 0;
  while (sweepPass < 10) {
    sweepPass++;
    let removed = 0;
    for (const d of Array.from(doc.querySelectorAll("div"))) {
      if (d.textContent.replace(/[\s\u00a0]+/g, "") !== "") continue;
      if (d.querySelector("img, script, iframe, video, hr, table")) continue;
      d.remove();
      removed++;
    }
    if (removed === 0) break;
  }

  // v2.9 — KAP MAKSYMALNEGO WCIĘCIA TEKSTOWEGO.
  // Spłaszczenie zagnieżdżonych div.product (krok 4.6) zmienia STRUKTURĘ DOM, ale
  // text nodes (newline + spacje) zachowane z oryginalnego HTML zostają. Output ma
  // wtedy linie z 36+ spacjami wcięcia, nieczytelne w widoku Źródła w CMS.
  // Whitespace między tagami w HTML nie ma znaczenia semantycznego (poza <pre>/<code>,
  // których w boxach produktowych nie używamy), więc capujemy leading whitespace na
  // 16 spacji = 4 poziomy 4-spacjowego indentu. To nie zmienia renderowania, tylko
  // wygląd kodu w widoku Źródła CMS i edytora HTML.
  return doc.body.innerHTML.replace(/^ {17,}/gm, '                ')
    .replace(/^[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
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
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      // effort=low — Anthropic rekomenduje dla "high-volume, simple tasks like classification,
      // routing, or data extraction where speed matters". Bez tego Sonnet 4.6 ma default high
      // z extended thinkingiem co dawałoby 3-4x dłuższy czas generacji per box. Dla strukturalnego
      // JSON-a z 3 punktami w forWho/whyWorth/related to overkill.
      output_config: { effort: "low" },
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

// === ANTHROPIC API CALL — FAQ GENERATOR ===
// Wywoływane raz na końcu batcha (po wygenerowaniu wszystkich boxów).
// Generuje 6 pytań + odpowiedzi dopasowanych do tematu artykułu.
// Pytania mają NIE być parafrazami TOC (już je czytelnik widzi w spisie treści).
async function generateFAQ(context) {
  const tocText = (context.tocItems || []).map(t => `- ${t}`).join("\n") || "(brak)";
  const productsText = (context.products || []).map(p => `- ${p.name}${p.subtitle ? " (" + p.subtitle + ")" : ""}`).join("\n") || "(brak — artykuł edukacyjny bez produktów)";
  // v3.7: fragment treści artykułu w kontekście. Dla artykułów edukacyjnych (bez produktów)
  // to jedyne źródło tematu poza TOC; dla produktowych — doprecyzowuje kontekst pytań.
  let articleExcerpt = "";
  if (context.articleHtml) {
    try {
      const tmpDoc = new DOMParser().parseFromString(context.articleHtml, "text/html");
      articleExcerpt = (tmpDoc.body.textContent || "").replace(/\s+/g, " ").trim().slice(0, 2500);
    } catch (e) { articleExcerpt = ""; }
  }

  const prompt = `Jesteś redaktorem polskiego bloga kosmetyczno-zdrowotnego Lemoné. Wygeneruj sekcję FAQ — 6 najczęściej zadawanych pytań wraz z odpowiedziami — która uzupełni poniższy artykuł.

KONTEKST ARTYKUŁU
Sekcje (TOC):
${tocText}

Produkty omawiane w artykule:
${productsText}
${articleExcerpt ? `\nFragment treści artykułu:\n${articleExcerpt}\n` : ""}

ZASADY DOBORU PYTAŃ
- Pytania mają być takie, jakie czytelnik faktycznie wpisze w Google (search intent — "jak", "kiedy", "czy", "ile", "co lepiej")
- NIE PARAFRAZUJ pytań ze spisu treści (TOC) — czytelnik już je widzi powyżej; rozszerz temat o pytania komplementarne
- Każde pytanie ma rozpocząć dyskusję której artykuł nie pokrywa wprost
- Unikaj pytań abstrakcyjnych ("co to jest..."); preferuj praktyczne ("jak długo stosować...", "czy można łączyć z...", "dla kogo nie jest wskazane...")
- Różnorodność: zadawaj pytania z różnych kątów (skutki uboczne, łączenie produktów, częstotliwość, alternatywy, konkretne grupy odbiorców)

ZASADY ODPOWIEDZI
- 2-4 zdania, konkretne, faktyczne
- Polski język, naturalny ton
- NIE rozpoczynaj od "Tak,"/"Nie," — rozbuduj odpowiedź żeby brzmiała redaktorsko
- NIE wymyślaj statystyk, badań klinicznych ani konkretnych cyfr które nie są powszechną wiedzą
- NIE polecaj konkretnych produktów (chyba że tylko ogólnie wspomnij kategorię)
- Pisz NEUTRALNIE RODZAJOWO — nigdy "jesteś narażona/narażony"; używaj form typu "Twoja skóra jest narażona" albo "jesteśmy narażeni"
- Zakresy liczbowe zapisuj dywizem bez spacji: "2-3 godziny", "20-30 minut"
- Używaj wyłącznie zwykłego dywizu "-"; nigdy myślnika "—" ani półpauzy "–"
- FAKTY FIZYCZNE: ekrany urządzeń elektronicznych NIE emitują promieniowania UV — emitują światło niebieskie (HEV); promieniowanie UVA przenika przez szyby okien, ale nie pochodzi z ekranów. Nie twierdź inaczej

ZWRÓĆ TYLKO JSON, BEZ MARKDOWN:
{"items":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}]}`;

  const apiUrl = import.meta.env.VITE_API_URL || "https://api.anthropic.com/v1/messages";
  const response = await fetchWithRetry(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      // effort=low — patrz komentarz w generateBoxData. FAQ to też strukturalny JSON
      // (6 par Q&A), nie wymaga extended thinkingu.
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.text();
      if (body) detail = body.slice(0, 300);
    } catch (_) {}
    throw new Error(`FAQ API ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("").trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let parsed;
  try { parsed = JSON.parse(cleaned); }
  catch (e) { throw new Error("FAQ — niepoprawny JSON: " + cleaned.slice(0, 120)); }

  const items = (Array.isArray(parsed.items) ? parsed.items : [])
    .filter(it => it && typeof it.q === "string" && typeof it.a === "string")
    .map(it => ({ q: it.q.trim(), a: it.a.trim() }))
    .filter(it => it.q && it.a);

  return items;
}

// === HTML BUILDER ===
const escapeHtml = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// === HTML BUILDERS (v2.0 — nowy format zgodny ze spec Szczepana) ===
// Klasy z motywu sklepu: lemone-product, lp-photo, lp-info.
// CSS w motywie obsługuje: flex layout (desktop), kolumna (mobile <600px), kremowe tło, ramka.
// ZASADY TWARDE: zero stylów inline, zero <figure>, <table>, <script>, atrybutu style, max-width, display:inline-block.

// Buduje TYLKO zawartość boksu z korzyściami (do umieszczenia obok <div class="lp-photo">).
// Nie zawiera <div class="lp-info"> — tylko paragrafy. To pozwala ponownie użyć tej samej funkcji
// w różnych kontekstach (osadzenie w lemone-product albo standalone).
// Buduje paragrafy z korzyściami WG DOKŁADNEGO formatowania z przykładu Roberta:
// każdy paragraf ma newline+indent po <p>, każdy element w środku osobno z indentem.
// Format: <p>\n    <strong>...</strong><br>\n    ✔ ...<br>\n    ✔ ...<br>\n    ✔ ...\n</p>
// UWAGA (v2.4): inline style="font-size:14px" na <p> w lp-info — kompromisowy workaround
// (łamie spec Szczepana "zero inline"), do usunięcia gdy Szczepan dorzuci do motywu:
//   .lp-info p { font-size: 14px; }
function buildBoxOnlyInner(data) {
  const forWhoLines = (data.forWho || []).map(l => normalizeDashes(l.trim())).filter(Boolean);
  const whyLines = (data.whyWorth || []).map(l => normalizeDashes(l.trim())).filter(Boolean);
  const related = data.related || [];

  const P_STYLE = ' style="font-size:14px;"'; // jedyne miejsce do podmiany wartości

  const forWhoHtml = forWhoLines.length
    ? `        <p${P_STYLE}>
            <strong>Dla kogo?</strong><br>
${forWhoLines.map(l => `            ✔ ${escapeHtml(l)}`).join("<br>\n")}
        </p>`
    : "";

  const whyHtml = whyLines.length
    ? `        <p${P_STYLE}>
            <strong>Dlaczego warto:</strong><br>
${whyLines.map(l => `            → ${escapeHtml(l)}`).join("<br>\n")}
        </p>`
    : "";

  const relatedHtml = related.length
    ? `        <p${P_STYLE}>
            <strong>Powiązane:</strong> ${related.map(r => `<a href="${escapeHtml(r.slug)}">${escapeHtml(r.label)}</a>`).join(" • ")}
        </p>`
    : "";

  return [forWhoHtml, whyHtml, relatedHtml].filter(Boolean).join("\n");
}

// Buduje sam wrapper lemone-product (zdjęcie + info) — bez tytułu nad i bez opisu pod.
// Format dokładnie jak we wzorze Roberta: lp-photo z newline+indent przy <a>, lp-info z paragrafami.
// UWAGA (v2.3): inline style="border-radius:10px" na <img> łamie spec Szczepana "zero inline".
// To kompromisowy obejście — do usunięcia gdy Szczepan dorzuci do CSS motywu regułę:
//   .lp-photo img { border-radius: 10px; }
function buildBoxOnly(product, data) {
  const inner = buildBoxOnlyInner(data);
  // Alt opisowy zgodnie z briefem: nazwa produktu + typ + pojemność (czyli nazwa + podtytuł).
  // v3.4: strip numeracji z nazwy — przy regeneracji własnego outputu nazwa z H3 zawiera
  // "{nr}. ", który nie może trafić do alta.
  const altBase = (product.name || "").replace(/^\s*\d+[.)]\s*/, "");
  const altText = product.subtitle
    ? `${altBase} - ${product.subtitle.toLowerCase()}`
    : altBase;
  const photoHtml = product.imageUrl
    ? `    <div class="lp-photo">
        <a href="${escapeHtml(product.url)}"><img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(altText)}" style="border-radius:10px;"></a>
    </div>`
    : "";

  return `<div class="lemone-product">
${photoHtml}
    <div class="lp-info">
${inner}
    </div>
</div>`;
}

// Buduje PEŁNY pakiet do osobnego użycia (np. zakładka "Tylko boxy" w UI / kopiuj-wklej).
// Tytuł nad strukturą, lemone-product (foto + info), bez opisu pod (opis jest poza naszą kontrolą — pochodzi z wkleconego artykułu).
function buildBoxHTML(product, data) {
  // Subtitle z wkleconego CMS (jak był) — normalizujemy do <strong> zgodnie ze spec Szczepana,
  // żeby nawet stare span.subtitle dawały spójny output w nowym formacie.
  const subtitleHtml = product.subtitle
    ? `<br><a href="${escapeHtml(product.url)}"><strong>${escapeHtml(product.subtitle)}</strong></a>`
    : "";

  const titleP = `<p><a href="${escapeHtml(product.url)}"><strong>${escapeHtml(product.name)}</strong></a>${subtitleHtml}</p>`;
  const wrapper = buildBoxOnly(product, data);

  return `${titleP}
${wrapper}`;
}

// === MAIN APP ===
export default function App() {
  const [step, setStep] = useState("input");
  const [input, setInput] = useState("");
  const [products, setProducts] = useState([]);
  const [boxes, setBoxes] = useState({});
  const [progress, setProgress] = useState(null);
  const [tocItems, setTocItems] = useState([]);
  const [faqItems, setFaqItems] = useState([]);
  const [faqStatus, setFaqStatus] = useState("idle"); // idle | loading | ready | error
  const [faqError, setFaqError] = useState(null);

  const handleAnalyze = async () => {
    const found = parseProducts(input);
    // v3.7 — ŚCIEŻKA EDUKACYJNA. Artykuł bez produktów (poradnik, treść ekspercka) to
    // pełnoprawny przypadek: dostaje TOC, cleanup artefaktów i FAQ (JSON do pola CMS),
    // czyli wszystko co buduje widoczność SEO/AIO, tylko bez boxów i ItemList.
    // "empty" zostaje wyłącznie dla pustego inputu.
    if (found.length === 0 && !(input || "").trim()) {
      setProducts([]);
      setStep("empty");
      return;
    }
    setProducts(found);
    setBoxes({});
    setFaqItems([]);
    setFaqStatus("idle");
    setFaqError(null);
    const initialToc = extractTocItems(input);
    setTocItems(initialToc);
    setStep("results");

    const generatedBoxes = {};
    if (found.length > 0) {
      setProgress({ current: 0, total: found.length });
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
    }

    // FAQ generuje się zawsze gdy jest treść — także w ścieżce edukacyjnej (v3.7).
    // Dla artykułów bez produktów kontekstem jest TOC + fragment treści artykułu.
    setFaqStatus("loading");
    try {
      const items = await generateFAQ({ products: found, tocItems: initialToc, articleHtml: input });
      setFaqItems(items);
      setFaqStatus("ready");
    } catch (e) {
      setFaqError(e.message || String(e));
      setFaqStatus("error");
    }
  };

  const regenerateFaq = async () => {
    setFaqStatus("loading");
    setFaqError(null);
    try {
      const items = await generateFAQ({ products, tocItems });
      setFaqItems(items);
      setFaqStatus("ready");
    } catch (e) {
      setFaqError(e.message || String(e));
      setFaqStatus("error");
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
        const deadList = dead.map(r => r.slug).join(", ");
        // Bez `html` — derywowane live przez komponenty
        next[product.url] = {
          ...box,
          related: alive,
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
      // Nie cache'ujemy `html` w state — HTML jest derywowany live z danych przez useMemo
      // w komponencie. Zmiana funkcji buildBoxHTML w deployu automatycznie aktualizuje markup
      // bez ponownego wywoływania API. State trzyma tylko surowe dane: forWho, whyWorth, related.
      const boxState = { status: "ready", ...data };
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
    setInput("");
    setProducts([]);
    setBoxes({});
    setProgress(null);
    setTocItems([]);
    setFaqItems([]);
    setFaqStatus("idle");
    setFaqError(null);
  };

  // v3.7: ścieżka edukacyjna (0 produktów) też jest "ready" — pełny artykuł dostępny
  // od razu (TOC + cleanup), bez czekania na boxy których nie ma.
  const allReady = products.length === 0
    ? step === "results"
    : products.every(p => boxes[p.url]?.status === "ready");

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
                v3.7 · ścieżka edukacyjna: artykuły bez produktów z TOC, cleanupem i FAQ
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
            faqItems={faqItems}
            setFaqItems={setFaqItems}
            faqStatus={faqStatus}
            faqError={faqError}
            onRegenerateFaq={regenerateFaq}
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

function ResultsView({ products, boxes, progress, allReady, onRetry, tocItems, setTocItems, faqItems, setFaqItems, faqStatus, faqError, onRegenerateFaq, rawHtml }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const allBoxesHtml = useMemo(() => {
    // Derywujemy live z danych boxa (forWho/whyWorth/related) zamiast używać cached box.html.
    // Zmiana w buildBoxHTML (np. nowy format markupu) automatycznie wpływa na wynik bez API calls.
    return products.map(p => {
      const box = boxes[p.url];
      if (!box || box.status !== "ready") return null;
      return buildBoxHTML(p, box);
    }).filter(Boolean).join("\n\n");
  }, [products, boxes]);

  const fullArticleHtml = useMemo(() => {
    if (!allReady) return "";
    return buildCompleteArticle(rawHtml, products, boxes, tocItems, faqItems);
  }, [rawHtml, products, boxes, tocItems, faqItems, allReady]);

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

      {products.length > 0 ? (
        <>
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
        </>
      ) : (
        <div style={{ marginTop: 28, padding: "14px 18px", background: "#eef4ee", border: "1px solid #cfe0cf", borderRadius: 10, fontSize: 13.5, color: "#2d4a2d" }}>
          <strong>Tryb edukacyjny</strong> — nie wykryto produktów w artykule. Studio przygotuje spis treści,
          cleanup kodu i sekcję Q&amp;A (JSON do pola CMS). Boxy produktowe i ItemList są pomijane.
        </div>
      )}

      <SectionHeader
        title="Q&A - często zadawane pytania"
        subtitle="6 pytań i odpowiedzi wygenerowanych dla artykułu — możesz edytować przed kopiowaniem. Wstawiane na końcu artykułu + FAQPage schema dla SEO."
        extraTop={28}
      />
      <FaqCard
        items={faqItems}
        setItems={setFaqItems}
        status={faqStatus}
        error={faqError}
        onRegenerate={onRegenerateFaq}
      />

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

function FaqCard({ items, setItems, status, error, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const updateQ = (i, v) => setItems(items.map((it, idx) => idx === i ? { ...it, q: v } : it));
  const updateA = (i, v) => setItems(items.map((it, idx) => idx === i ? { ...it, a: v } : it));
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const addItem = () => setItems([...items, { q: "", a: "" }]);

  const html = useMemo(() => buildFaqHTML(items), [items]);
  // v3.5: JSON dla pola "FAQ (dane strukturalne)" w CMS — to jest teraz GŁÓWNY output FAQ.
  const cmsJson = useMemo(() => buildFaqCmsJson(items), [items]);

  const copyText = async (text, setFlag) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 1500);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setFlag(true); setTimeout(() => setFlag(false), 1500); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  const copyFaq = () => copyText(html, setCopied);
  const copyJson = () => copyText(cmsJson, setCopiedJson);

  // Loading state — boxy jeszcze się generują, FAQ czeka albo właśnie się generuje
  if (status === "loading") {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 22, color: "#5b6b5b", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
        <Loader2 size={14} className="spin" />
        Generuję 6 pytań i odpowiedzi dopasowanych do tematyki artykułu...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ background: "#fff", border: "1px solid #fde2e0", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#8a2a1f", fontSize: 13, marginBottom: 10 }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Generowanie FAQ nie powiodło się</div>
            <div style={{ fontSize: 12, color: "#a04a3f" }}>{error || "Nieznany błąd"}</div>
          </div>
        </div>
        <button onClick={onRegenerate} style={{ ...btnSecondary, fontSize: 12 }}>
          <RefreshCw size={12} /> Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (status === "idle" || !items || items.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 22, color: "#a8a89a", fontSize: 13 }}>
        FAQ pojawi się tu gdy boxy się wygenerują. {status !== "idle" && (
          <button onClick={onRegenerate} style={{ ...btnSecondary, fontSize: 12, marginLeft: 8 }}>
            <RefreshCw size={12} /> Wygeneruj
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: 18, borderBottom: "1px solid #f0ebe0", background: "#faf8f4", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: "#5b8c5a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Pytania i odpowiedzi ({items.length})
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onRegenerate} style={{ ...btnSecondary, fontSize: 12 }} title="Wygeneruj nowe 6 pytań">
          <RefreshCw size={12} /> Wygeneruj ponownie
        </button>
        <button
          onClick={copyFaq}
          style={{ ...btnSecondary, padding: "7px 12px", fontSize: 12 }}
          title="Stary format: sekcja FAQ jako HTML do wklejenia w treść (nieużywany po zmianie CMS)"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Skopiowano" : "HTML (stary format)"}
        </button>
        <button
          onClick={copyJson}
          style={{ ...btnPrimary, padding: "7px 12px", fontSize: 12.5, background: copiedJson ? "#5b8c5a" : "#2d4a2d" }}
          title={'JSON do pola "FAQ (dane strukturalne)" w CMS. Wklej w polu pod treścią wpisu; sekcja i FAQPage wygenerują się po stronie CMS.'}
        >
          {copiedJson ? <Check size={13} /> : <Copy size={13} />}
          {copiedJson ? "Skopiowano" : "Kopiuj JSON dla CMS"}
        </button>
      </div>

      <div style={{ padding: 18, display: "grid", gap: 14 }}>
        {items.map((it, i) => (
          <div key={i} style={{ border: "1px solid #ecf0e6", borderRadius: 8, padding: 14, background: "#fcfdfb" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
              <span className="mono-font" style={{ fontSize: 11, color: "#a8a89a", paddingTop: 9, minWidth: 22 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <input
                value={it.q || ""}
                onChange={(e) => updateQ(i, e.target.value)}
                placeholder="Pytanie..."
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  border: "1px solid #d8d3c8",
                  borderRadius: 5,
                  fontSize: 13,
                  fontFamily: "inherit",
                  fontWeight: 600,
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
            <textarea
              value={it.a || ""}
              onChange={(e) => updateA(i, e.target.value)}
              placeholder="Odpowiedź..."
              rows={3}
              style={{
                width: "100%",
                marginLeft: 32,
                width: "calc(100% - 32px - 30px)",
                padding: "8px 10px",
                border: "1px solid #d8d3c8",
                borderRadius: 5,
                fontSize: 13,
                fontFamily: "inherit",
                lineHeight: 1.5,
                color: "#3a4a3a",
                background: "#faf8f4",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box"
              }}
            />
          </div>
        ))}
        <button onClick={addItem} style={{ ...btnSecondary, fontSize: 12, justifySelf: "start" }}>
          <Plus size={12} /> Dodaj pytanie
        </button>
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

  // Edycja inline kodu artykułu. `editedHtml` to override — gdy null, używamy props.html (auto-wygenerowany).
  // Gdy user edytuje w textarea, ustawiamy editedHtml na to co napisał. Wszystko poniżej (preview, linki,
  // kopiowanie, pobieranie) konsumuje `displayHtml`, więc zmiany kaskadują automatycznie.
  const [editedHtml, setEditedHtml] = useState(null);
  const [copiedDisplay, setCopiedDisplay] = useState(false);

  // Ref na div w tabie "Podgląd" — używamy go żeby ustawić innerHTML imperatywnie (z useEffect),
  // zamiast przez React VDOM. ContentEditable + React = konflikt: jeśli React renderuje przez
  // dangerouslySetInnerHTML przy każdej zmianie state, kursor gubi się w środku edycji.
  // Trick: ustawiamy innerHTML TYLKO gdy zmienia się "źródłowy" HTML (auto-regeneracja parenta)
  // albo wyniki walidacji linków (żeby highlighty się aktualizowały).
  // NIE odpalamy useEffect po onInput — przez deps liczymy tylko [html, liveStatuses, tab].
  const previewRef = useRef(null);

  const handlePreviewInput = (e) => {
    // Złap edycje user'a z contentEditable div'u — innerHTML reprezentuje aktualny stan DOM
    // po wszystkich zmianach (wpisaniu, usunięciu, paste). Ustawiamy jako override.
    setEditedHtml(e.currentTarget.innerHTML);
  };

  // Gdy parent zregeneruje (zmieni props.html — np. po regeneracji boxa albo edycji TOC/FAQ),
  // resetujemy edycje, żeby nie utknąć na przestarzałej edytowanej wersji.
  useEffect(() => {
    setEditedHtml(null);
  }, [html]);

  const displayHtml = editedHtml !== null ? editedHtml : html;
  const isEdited = editedHtml !== null && editedHtml !== html;

  // Extract all relative non-product links once per article (z aktualnej, ewentualnie edytowanej treści)
  const links = useMemo(() => extractArticleLinks(displayHtml), [displayHtml]);

  // Counts for tab badge
  const localMissingCount = useMemo(() => links.filter(l => l.localStatus === "local-missing").length, [links]);
  const liveBrokenCount = useMemo(
    () => Object.values(liveStatuses).filter(r => r && !r.ok && !r.error).length,
    [liveStatuses]
  );
  const totalIssues = localMissingCount + liveBrokenCount;

  // Highlighted preview HTML — recomputed when statuses or edits change
  const previewHtml = useMemo(
    () => highlightBrokenLinks(displayHtml, links, liveStatuses),
    [displayHtml, links, liveStatuses]
  );

  // Synchronizacja innerHTML w divie podglądu — TYLKO gdy zmienia się "źródło" (regeneracja przez parent,
  // wynik walidacji linków, wejście w tab "Podgląd"). NIE robi tego przy każdym onInput, żeby kursor nie skakał.
  // Jeśli zaktualizowalibyśmy innerHTML w odpowiedzi na każdą edycję, React/browser remountowałby DOM
  // i tracilibyśmy pozycję kursora po każdym znaku.
  useEffect(() => {
    if (tab !== "preview") return;
    if (!previewRef.current) return;
    // Tylko jeśli to faktycznie INNA treść niż aktualnie w divie. Daje to nam dwie ochrony:
    // (a) gdy useEffect odpala z powodu zmiany w liveStatuses ale highlight wyszedł identyczny — nie resetuj
    // (b) gdy odpala z powodu remount tabu — wczytaj świeże previewHtml (z highlightami jeśli są)
    if (previewRef.current.innerHTML !== previewHtml) {
      previewRef.current.innerHTML = previewHtml;
    }
  }, [tab, html, liveStatuses]);
  // ^ Krytyczne: tylko [tab, html, liveStatuses]. NIE [previewHtml, displayHtml, editedHtml] —
  // bo wtedy onInput user'a (ustawiający editedHtml) byłby cofany przez useEffect, kursor skakałby.

  const runLiveCheck = async () => {
    if (links.length === 0) return;
    setChecking(true);
    setCheckError(null);
    try {
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

  // Generic clipboard helper — używamy go dla wszystkich kopiowań w karcie
  const copyToClipboard = async (text, setFlag) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 1500);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setFlag(true); setTimeout(() => setFlag(false), 1500); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  const copyJustBoxes = () => copyToClipboard(boxesHtml, setCopiedBoxes);
  const copyDisplay = () => copyToClipboard(displayHtml, setCopiedDisplay);

  // Pobieranie też ma używać displayHtml — jeśli user edytował, pobiera edycje, nie auto-wersję
  const downloadDisplay = () => {
    const blob = new Blob([displayHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `artykul-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetEdits = () => {
    if (!isEdited) return;
    if (window.confirm("Cofnąć wszystkie ręczne edycje i wrócić do wersji wygenerowanej automatycznie?")) {
      setEditedHtml(null);
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
      <div style={{ display: "flex", borderBottom: "1px solid #f0ebe0", background: "#faf8f4", flexWrap: "wrap", alignItems: "center" }}>
        {tabBtn("preview", "Podgląd renderowany", totalIssues > 0 ? totalIssues : null, totalIssues > 0 ? "#c0392b" : null)}
        {tabBtn("links", "Linki", links.length > 0 ? links.length : null)}
        {tabBtn("code", `Kod HTML (${(displayHtml.length / 1024).toFixed(1)} KB)`)}
        {isEdited && (
          <span style={{ marginLeft: "auto", marginRight: 14, fontSize: 11, color: "#9a6e2a", background: "#fef3c7", padding: "3px 9px", borderRadius: 99, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            edytowane ręcznie
            <button onClick={resetEdits} style={{ background: "none", border: "none", color: "#9a6e2a", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }} title="Cofnij edycje">
              <RefreshCw size={11} />
            </button>
          </span>
        )}
      </div>

      {tab === "preview" && (
        <div className="scroll-thin" style={{ padding: 20, maxHeight: 600, overflow: "auto", background: "#fff" }}>
          <div
            ref={previewRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handlePreviewInput}
            style={{
              outline: "none",
              minHeight: 100,
              cursor: "text"
            }}
          />
          {isEdited && (
            <div style={{
              position: "sticky", bottom: 0, marginTop: 12,
              padding: "8px 14px", background: "#fff8e6",
              border: "1px solid #f0e6c8", borderRadius: 6,
              fontSize: 12, color: "#6b6b5b"
            }}>
              ✎ Zmiany ręczne aktywne — kopiuj/pobierz zawiera Twoje edycje
            </div>
          )}
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
        <textarea
          className="mono-font scroll-thin"
          value={displayHtml}
          onChange={(e) => setEditedHtml(e.target.value)}
          spellCheck={false}
          style={{
            display: "block",
            width: "100%",
            margin: 0,
            padding: 18,
            fontSize: 11,
            lineHeight: 1.55,
            color: "#d8d3c8",
            background: "#1f2e1f",
            border: "none",
            outline: "none",
            minHeight: 500,
            maxHeight: 500,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            resize: "vertical",
            boxSizing: "border-box",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
          }}
        />
      )}

      <div style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid #f0ebe0", background: "#faf8f4", flexWrap: "wrap" }}>
        <button onClick={copyDisplay} style={{ ...btnPrimary, padding: "8px 14px", fontSize: 13, background: copiedDisplay ? "#5b8c5a" : "#2d4a2d" }}>
          {copiedDisplay ? <Check size={14} /> : <Copy size={14} />}
          {copiedDisplay ? "Skopiowano cały kod artykułu" : "Kopiuj cały kod artykułu"}
        </button>
        <button onClick={downloadDisplay} style={btnSecondary}>
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

  // HTML derywujemy LIVE z danych boxa, nie z box.html. Dzięki temu zmiana w buildBoxHTML
  // (np. deploy nowego formatu) natychmiast aktualizuje markup bez wywoływania API.
  const displayHtml = useMemo(() => {
    if (!box || box.status !== "ready") return "";
    return buildBoxHTML(product, box);
  }, [product, box]);

  const copyHtml = async () => {
    if (!displayHtml) return;
    try {
      await navigator.clipboard.writeText(displayHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = displayHtml;
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
          {displayHtml}
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
