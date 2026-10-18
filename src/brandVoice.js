// === Głos marki (v4.19): wczytanie z Workera i blok do promptów ===
// Jeden blok na cel materiału: klinika albo sklep. Edycja w aplikacji (Scenariusz -> Prompt -> Głos marki),
// historia wersji w Workerze; bez zapisanej wersji obowiązuje tekst domyślny z src/prompts/glosMarki.js.

import { apiFetch } from "./auth.jsx";
import { GLOS_KLINIKA_DEFAULT, GLOS_SKLEP_DEFAULT } from "./prompts/glosMarki.js";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const VOICE = {
  klinika: { prompt: "glos-klinika", label: "Głos marki: klinika", defaultText: GLOS_KLINIKA_DEFAULT },
  sklep: { prompt: "glos-sklep", label: "Głos marki: sklep", defaultText: GLOS_SKLEP_DEFAULT },
};
const voiceOf = (cel) => VOICE[cel === "klinika" ? "klinika" : "sklep"];

// Aktualny tekst głosu marki (ostatnia zapisana wersja albo domyślny)
export async function loadVoice(cel) {
  const v = voiceOf(cel);
  try {
    const res = await apiFetch(`${API}/prompts/${v.prompt}`);
    const j = await res.json();
    const last = j.versions?.[j.versions.length - 1];
    return last?.text || v.defaultText;
  } catch (e) {
    return v.defaultText;
  }
}

// Blok do promptu; zasady zgodności i rzetelności mają pierwszeństwo przed tonem
export function voiceBlock(text, { influencer = false } = {}) {
  if (!text) return "";
  return `GŁOS MARKI LEMONÉ (obowiązuje w całym materiale; przy konflikcie pierwszeństwo mają zasady zgodności, rzetelności medycznej i prawa kosmetycznego):
${text}${influencer ? "\nW materiałach z twórcą głos marki obowiązuje w briefie, przekazach obowiązkowych i opisie; sam twórca mówi własnym stylem, bez sprzeczności z zasadami powyżej." : ""}`;
}
