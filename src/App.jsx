import { useState, useMemo } from "react";
import { Copy, Check, FileText, Sparkles, AlertCircle, Loader2, RefreshCw, ChevronDown, ChevronRight, Package, Zap, Download, Plus, X } from "lucide-react";

// === CATEGORIES from Mapowanie_kategorii_Lemone.xlsx (156 entries) ===
const CATEGORIES = [
  {n:"Pielęgnacja okolic oczu",s:"/pielegnacja-okolic-oczu"},
  {n:"Podrażnienie/uwrażliwienie",s:"/podraznienie-uwrazliwienie"},
  {n:"Pielęgnacja twarzy",s:"/pielegnacja-twarzy"},
  {n:"Tarcza antyoksydacyjna",s:"/tarcza-antyoksydacyjna"},
  {n:"Zmarszczki",s:"/zmarszczki"},
  {n:"Pielęgnacja skóry głowy",s:"/pielegnacja-skory-glowy"},
  {n:"Krem z retinolem",s:"/krem-z-retinolem"},
  {n:"Witaminy i minerały",s:"/witaminy-i-mineraly"},
  {n:"Utrata blasku skóry",s:"/utrata-blasku-skory"},
  {n:"Suchość",s:"/suchosc"},
  {n:"Makijaż twarzy",s:"/makijaz-twarzy"},
  {n:"Bielactwo (brak dalszego podziału)",s:"/bielactwo-brak-dalszego-podzialu"},
  {n:"Pielęgnacja ciała",s:"/pielegnacja-ciala"},
  {n:"Pielęgnacja paznokci",s:"/pielegnacja-paznokci"},
  {n:"Bioaktywne formuły",s:"/bioaktywne-formuly"},
  {n:"Codzienne dolegliwości",s:"/codzienne-dolegliwosci"},
  {n:"Ochrona przeciwsłoneczna",s:"/ochrona-przeciwsloneczna"},
  {n:"Utrata jędrności",s:"/utrata-jedrnosci"},
  {n:"Pielęgnacja - oczyszczanie twarzy",s:"/pielegnacja-oczyszczanie-twarzy"},
  {n:"Trądzik pospolity",s:"/tradzik-pospolity"},
  {n:"Cienie i obrzęki pod oczami",s:"/cienie-i-obrzeki-pod-oczami"},
  {n:"Kosmetyki z witaminą C",s:"/kosmetyki-z-witamina-c"},
  {n:"Wsparcie ukierunkowane",s:"/wsparcie-ukierunkowane"},
  {n:"Budujące organizm",s:"/budujace-organizm"},
  {n:"Trądzik różowaty",s:"/tradzik-rozowaty"},
  {n:"Blizny",s:"/blizny"},
  {n:"Dermokosmetyki",s:"/dermokosmetyki"},
  {n:"Mężczyżni",s:"/mezczyzni"},
  {n:"Porost włosów",s:"/porost-wlosow"},
  {n:"Menopauza",s:"/menopauza"},
  {n:"Pielęgnacja włosów",s:"/pielegnacja-wlosow"},
  {n:"Przebarwienia",s:"/przebarwienia"},
  {n:"Kosmetyki do opalania",s:"/kosmetyki-do-opalania"},
  {n:"Dzieci",s:"/dzieci"},
  {n:"Naturalne kosmetyki dla dzieci",s:"/naturalne-kosmetyki-dla-dzieci"},
  {n:"Pielęgnacja jamy ustnej",s:"/pielegnacja-jamy-ustnej"},
  {n:"Naturalne kosmetyki do włosów",s:"/naturalne-kosmetyki-do-wlosow"},
  {n:"Złuszczanie",s:"/zluszczanie"},
  {n:"Atopowe zapalenie skóry",s:"/atopowe-zapalenie-skory"},
  {n:"Kosmetyki do masażu",s:"/kosmetyki-do-masazu"},
  {n:"Pielęgnacja - demakijaż",s:"/pielegnacja-demakijaz"},
  {n:"Pielęgnacja biustu",s:"/pielegnacja-biustu"},
  {n:"Pielęgnacja brwi",s:"/pielegnacja-brwi"},
  {n:"Pielęgnacja całoroczna",s:"/pielegnacja-caloroczna"},
  {n:"Pielęgnacja dłoni",s:"/pielegnacja-dloni"},
  {n:"Pielęgnacja na jesień",s:"/pielegnacja-na-jesien"},
  {n:"Pielęgnacja na lato",s:"/pielegnacja-na-lato"},
  {n:"Pielęgnacja na wiosnę",s:"/pielegnacja-na-wiosne"},
  {n:"Pielęgnacja na zimę",s:"/pielegnacja-na-zime"},
  {n:"Pielęgnacja nóg",s:"/pielegnacja-nog"},
  {n:"Pielęgnacja okolic intymnych",s:"/pielegnacja-okolic-intymnych"},
  {n:"Pielęgnacja onkologiczna",s:"/pielegnacja-onkologiczna"},
  {n:"Pielęgnacja pozabiegowa",s:"/pielegnacja-pozabiegowa"},
  {n:"Pielęgnacja rzęs",s:"/pielegnacja-rzes"},
  {n:"Pielęgnacja stóp",s:"/pielegnacja-stop"},
  {n:"Pielęgnacja szyi i dekoltu",s:"/pielegnacja-szyi-i-dekoltu"},
  {n:"Pielęgnacja ust",s:"/pielegnacja-ust"},
  {n:"Pielęgnacja zarostu",s:"/pielegnacja-zarostu"},
  {n:"Dla kobiety i mężczyzny",s:"/dla-kobiety-i-mezczyzny"},
  {n:"Kobiety",s:"/kobiety"},
  {n:"Kobiety w ciąży lub karmiące",s:"/kobiety-w-ciazy-lub-karmiace"},
  {n:"Nastolatkowie",s:"/nastolatkowie"},
  {n:"Akcesoria do włosów",s:"/akcesoria-do-wlosow"},
  {n:"Akcesoria i dodatki",s:"/akcesoria-i-dodatki"},
  {n:"Domowe SPA",s:"/domowe-spa"},
  {n:"Domowe urządzenia pielęgnacyjne",s:"/domowe-urzadzenia-pielegnacyjne"},
  {n:"Kosmetyki do kąpieli",s:"/kosmetyki-do-kapieli"},
  {n:"Naturalne kosmetyki dla mężczyzn",s:"/naturalne-kosmetyki-dla-mezczyzn"},
  {n:"Naturalne kosmetyki do ciała",s:"/naturalne-kosmetyki-do-ciala"},
  {n:"Naturalne kosmetyki do makijażu",s:"/naturalne-kosmetyki-do-makijazu"},
  {n:"Naturalne kosmetyki do rąk",s:"/naturalne-kosmetyki-do-rak"},
  {n:"Naturalne kosmetyki do rzęs",s:"/naturalne-kosmetyki-do-rzes"},
  {n:"Naturalne kosmetyki do stóp",s:"/naturalne-kosmetyki-do-stop"},
  {n:"Naturalne kosmetyki do twarzy",s:"/naturalne-kosmetyki-do-twarzy"},
  {n:"Naturalne kosmetyki do ust",s:"/naturalne-kosmetyki-do-ust"},
  {n:"Naturalne kosmetyki pod oczy",s:"/naturalne-kosmetyki-pod-oczy"},
  {n:"Kosmetyki po opalaniu",s:"/kosmetyki-po-opalaniu"},
  {n:"Kosmetyki pod prysznic",s:"/kosmetyki-pod-prysznic"},
  {n:"Kosmetyki wegańskie",s:"/kosmetyki-weganskie"},
  {n:"Kosmetyki z kwasami",s:"/kosmetyki-z-kwasami"},
  {n:"Kosmetyki z retinolem",s:"/kosmetyki-z-retinolem"},
  {n:"Serum z retinolem",s:"/serum-z-retinolem"},
  {n:"Ochrona przed światłem niebieskim",s:"/ochrona-przed-swiatlem-niebieskim"},
  {n:"Przyśpieszacze opalania",s:"/przyspieszacze-opalania"},
  {n:"Stylizacja włosów",s:"/stylizacja-wlosow"},
  {n:"Zapachy",s:"/zapachy"},
  {n:"Zestawy",s:"/zestawy"},
  {n:"Żywność Funkcjonalna",s:"/zywnosc-funkcjonalna"},
  {n:"Akcesoria do makijażu",s:"/akcesoria-do-makijazu"},
  {n:"Konturowanie",s:"/konturowanie"},
  {n:"Kosmetyki mineralne",s:"/kosmetyki-mineralne"},
  {n:"Makijaż brwi",s:"/makijaz-brwi"},
  {n:"Makijaż oczu",s:"/makijaz-oczu"},
  {n:"Makijaż rzęs",s:"/makijaz-rzes"},
  {n:"Makijaż ust",s:"/makijaz-ust"},
  {n:"Zestawy do makijażu",s:"/zestawy-do-makijazu"},
  {n:"Anti-pollution",s:"/anti-pollution"},
  {n:"Cellulit",s:"/cellulit"},
  {n:"Dermo-makijaż (brak dalszego podziału)",s:"/dermo-makijaz-brak-dalszego-podzialu"},
  {n:"Fotostarzenie (brak dalszego podziału)",s:"/fotostarzenie-brak-dalszego-podzialu"},
  {n:"Higiena intymna",s:"/higiena-intymna"},
  {n:"Kosmetyki na wrastające włoski",s:"/kosmetyki-na-wrastajace-wloski"},
  {n:"Łojotok",s:"/lojotok"},
  {n:"Łupież",s:"/lupiez"},
  {n:"Łuszczyca",s:"/luszczyca"},
  {n:"Naczynka",s:"/naczynka"},
  {n:"Nadmierna potliwość",s:"/nadmierna-potliwosc"},
  {n:"Odkażanie i dezynfekcja",s:"/odkazanie-i-dezynfekcja"},
  {n:"Odwodnienie",s:"/odwodnienie"},
  {n:"Oparzenie słoneczne",s:"/oparzenie-sloneczne"},
  {n:"Osłabienie brwi lub rzęs",s:"/oslabienie-brwi-lub-rzes"},
  {n:"Relaksacja",s:"/relaksacja"},
  {n:"Rogowacenie okołomieszkowe",s:"/rogowacenie-okolomieszkowe"},
  {n:"Rozstępy",s:"/rozstepy"},
  {n:"Rozszerzone pory",s:"/rozszerzone-pory"},
  {n:"Rumień/zaczerwienienie",s:"/rumien-zaczerwienienie"},
  {n:"Świąd",s:"/swiad"},
  {n:"Wągry i zaskórniki",s:"/wagry-i-zaskorniki"},
  {n:"Wypadanie włosów",s:"/wypadanie-wlosow"},
  {n:"Wyszczuplanie",s:"/wyszczuplanie"},
  {n:"Home care",s:"/home-care"},
  {n:"Zaburzony owal twarzy",s:"/zaburzony-owal-twarzy"},
  {n:"Formuły dedykowane",s:"/formuly-dedykowane"},
  {n:"Kremy pod oczy",s:"/kremy-pod-oczy"},
  {n:"Kremy do twarzy",s:"/kremy-do-twarzy"},
  {n:"Kremy pod oczy przeciwzmarszczkowe",s:"/kremy-pod-oczy-przeciwzmarszczkowe"},
  {n:"Kremy nawilżające",s:"/kremy-nawilzajace"},
  {n:"Maski do skóry głowy",s:"/maski-do-skory-glowy"},
  {n:"Suplementy na stany zapalne",s:"/suplementy-na-stany-zapalne"},
  {n:"Kremy z retinolem do twarzy",s:"/kremy-z-retinolem-do-twarzy"},
  {n:"Kosmetyki do tonizacji twarzy",s:"/kosmetyki-do-tonizacji-twarzy"},
  {n:"Kremy BB i CC rozświetlające",s:"/kremy-bb-i-cc-rozswietlajace"},
  {n:"Kremy pod oczy na cienie",s:"/kremy-pod-oczy-na-cienie"},
  {n:"Krem z retinolem na noc",s:"/krem-z-retinolem-na-noc"},
  {n:"Ampułki pod oczy",s:"/ampulki-pod-oczy"},
  {n:"Suplementy na porost włosów",s:"/suplementy-na-porost-wlosow"},
  {n:"Kremy do twarzy z witaminą C",s:"/kremy-do-twarzy-z-witamina-c"},
  {n:"Suplementy na oczyszczanie organizmu",s:"/suplementy-na-oczyszczanie-organizmu"},
  {n:"Kremy na dzień dla mężczyzn",s:"/kremy-na-dzien-dla-mezczyzn"},
  {n:"Suplementy z kwasem hialuronowym (HA)",s:"/suplementy-z-kwasem-hialuronowym-ha"},
  {n:"Kremy koloryzujące do twarzy BB i CC",s:"/kremy-koloryzujace-do-twarzy-bb-i-cc"},
  {n:"Naturalne szampony dla dzieci",s:"/naturalne-szampony-dla-dzieci"},
  {n:"Kremy ujędrniające do twarzy",s:"/kremy-ujedrniajace-do-twarzy"},
  {n:"Suplementy z koenzymem Q10",s:"/suplementy-z-koenzymem-q10"},
  {n:"Szampony do włosów",s:"/szampony-do-wlosow"},
  {n:"Akcesoria na cienie pod oczami",s:"/akcesoria-na-cienie-pod-oczami"},
  {n:"Serum z witaminą C",s:"/serum-z-witamina-c"},
  {n:"Kremy pod oczy na noc",s:"/kremy-pod-oczy-na-noc"},
  {n:"Kremy oczyszczające do twarzy",s:"/kremy-oczyszczajace-do-twarzy"},
  {n:"Pasta do zębów",s:"/pasta-do-zebow"},
  {n:"Naturalne szampony do włosów",s:"/naturalne-szampony-do-wlosow"},
  {n:"Kremy pod oczy z witaminą C",s:"/kremy-pod-oczy-z-witamina-c"},
  {n:"Suplementy z karotenoidami",s:"/suplementy-z-karotenoidami"},
  {n:"Maści na atopowe zapalenie skóry",s:"/masci-na-atopowe-zapalenie-skory"},
  {n:"Szampony nawilżające",s:"/szampony-nawilzajace"},
  {n:"Szczotka do masażu",s:"/szczotka-do-masazu"}
];

const VALID_SLUGS = new Set(CATEGORIES.map(c => c.s));
const CATS_LIST_TEXT = CATEGORIES.map(c => `${c.n} | ${c.s}`).join("\n");

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
    return `            <p style="${style}">\n                ${escapeHtml(q)}\n            </p>`;
  }).join("\n");

  return `<div style="background-color:#f4f8f4;border-radius:12px;border:1px solid #dce8dc;margin:25px 0;padding:24px 28px;">
            <h3 style="margin:0 0 18px;font-size:17px;color:#2d4a2d;font-weight:600;letter-spacing:0.2px;">
                Czego dowiesz się w tym artykule
            </h3>
${itemsHtml}
        </div>`;
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

  // 2. Insert new TOC right before first H2
  const firstH2 = doc.querySelector("h2");
  const tocHtml = buildTocHTML(tocItems);
  if (firstH2 && tocHtml) {
    const tmp = doc.createElement("div");
    tmp.innerHTML = tocHtml;
    if (tmp.firstElementChild) {
      firstH2.parentNode.insertBefore(tmp.firstElementChild, firstH2);
    }
  }

  // 3. Splice product boxes (replace existing colored box or insert after image)
  for (const product of products) {
    const box = boxes[product.url];
    if (!box || box.status !== "ready") continue;

    const newBoxHtml = buildBoxOnly({
      forWho: box.forWho,
      whyWorth: box.whyWorth,
      related: box.related
    });

    const productLinks = Array.from(doc.querySelectorAll(`a[href="${CSS.escape(product.url)}"]`));
    if (productLinks.length === 0) continue;

    const wrapper = productLinks[0].closest("div.product");
    if (!wrapper) continue;

    const col = wrapper.querySelector(".col-12") || wrapper;

    // Locate existing colored box that belongs to THIS product (not nested)
    let existingBox = null;
    const candidates = Array.from(col.querySelectorAll("div"));
    for (const c of candidates) {
      const style = c.getAttribute("style") || "";
      if (/background-color:\s*#fff8e6/i.test(style)) {
        // Confirm this box's nearest .product wrapper is our wrapper (not a nested one)
        const nearestProduct = c.closest("div.product");
        if (nearestProduct === wrapper) {
          existingBox = c;
          break;
        }
      }
    }

    const tmp = doc.createElement("div");
    tmp.innerHTML = newBoxHtml;
    const newBox = tmp.firstElementChild;
    if (!newBox) continue;

    if (existingBox) {
      existingBox.replaceWith(newBox);
    } else {
      // Fallback: insert after the figure (product image)
      const figure = wrapper.querySelector("figure");
      if (figure && figure.parentNode === col) {
        figure.after(newBox);
      } else if (figure) {
        figure.after(newBox);
      } else {
        col.appendChild(newBox);
      }
    }
  }

  return doc.body.innerHTML;
}

// === ANTHROPIC API CALL ===
async function generateBoxData(product) {
  const prompt = `Jesteś redaktorem polskiego bloga kosmetycznego Lemoné. Generujesz dane do boxa pod produkt w artykule.

PRODUKT:
Nazwa: ${product.name}
Podtytuł: ${product.subtitle || "(brak)"}

OPIS Z ARTYKUŁU:
${product.description || "(brak — zinterpretuj na podstawie nazwy)"}

KATEGORIE STRONY (wybierz dokładnie 3 najlepiej dopasowane, slug KOPIUJ 1:1 z listy, NIE WYMYŚLAJ NOWYCH):
${CATS_LIST_TEXT}

ZASADY:
- "forWho" — 3-4 krótkie linijki po polsku: typ skóry/problem/sytuacja użytkownika. Format jak: "skóra sucha / odwodniona", "skóra wrażliwa / reaktywna", "po zabiegach estetycznych".
- "whyWorth" — 3 linijki po polsku z głównymi korzyściami z opisu produktu. Format jak: "intensywna odbudowa bariery hydrolipidowej", "szybkie ukojenie skóry".
- "related" — DOKŁADNIE 3 obiekty {slug, label}. Slug 1:1 z listy. Label to skrócona, lowercase nazwa wyświetlana w linku (max 4 słowa, naturalna forma w zdaniu np. "kremy nawilżające", "podrażnienie skóry").
- Jeśli produkt to suplement diety: w "forWho" pomiń "skóra X", użyj zdrowotnego kontekstu.

ZWRÓĆ WYŁĄCZNIE JSON, BEZ MARKDOWN, BEZ KOMENTARZY:
{"forWho":["...","...","..."],"whyWorth":["...","...","..."],"related":[{"slug":"/...","label":"..."},{"slug":"/...","label":"..."},{"slug":"/...","label":"..."}]}`;

  const apiUrl = import.meta.env.VITE_API_URL || "https://api.anthropic.com/v1/messages";
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText}`);
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

  return {
    forWho: Array.isArray(parsed.forWho) ? parsed.forWho.filter(Boolean) : [],
    whyWorth: Array.isArray(parsed.whyWorth) ? parsed.whyWorth.filter(Boolean) : [],
    related: validRelated,
    warnings: droppedRelated.length > 0
      ? [`Pominięto ${droppedRelated.length} slug(ów) spoza bazy: ${droppedRelated.map(r => r?.slug || "?").join(", ")}`]
      : []
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
    for (let i = 0; i < found.length; i++) {
      setProgress({ current: i + 1, total: found.length });
      await runOne(found[i]);
    }
    setProgress(null);
  };

  const runOne = async (product) => {
    setBoxes(prev => ({ ...prev, [product.url]: { status: "loading" } }));
    try {
      const data = await generateBoxData(product);
      const html = buildBoxHTML(product, data);
      setBoxes(prev => ({ ...prev, [product.url]: { status: "ready", ...data, html } }));
    } catch (e) {
      setBoxes(prev => ({ ...prev, [product.url]: { status: "error", error: e.message || String(e) } }));
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

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #f0ebe0", background: "#faf8f4" }}>
        <button
          onClick={() => setTab("preview")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 18px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: tab === "preview" ? 600 : 400,
            color: tab === "preview" ? "#1f2e1f" : "#6b6b5b",
            borderBottom: `2px solid ${tab === "preview" ? "#2d4a2d" : "transparent"}`,
            fontFamily: "inherit"
          }}
        >
          Podgląd renderowany
        </button>
        <button
          onClick={() => setTab("code")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 18px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: tab === "code" ? 600 : 400,
            color: tab === "code" ? "#1f2e1f" : "#6b6b5b",
            borderBottom: `2px solid ${tab === "code" ? "#2d4a2d" : "transparent"}`,
            fontFamily: "inherit"
          }}
        >
          Kod HTML ({(html.length / 1024).toFixed(1)} KB)
        </button>
      </div>

      {tab === "preview" && (
        <div className="scroll-thin" style={{ padding: 20, maxHeight: 600, overflow: "auto" }}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
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

function ReadyState({ box, onShowCode, showCode, onCopy, copied, onRetry }) {
  return (
    <div>
      <div style={{ background: "#faf8f4", borderRadius: 10, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: "#5b8c5a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Podgląd
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

