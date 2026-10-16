// === Powiadomienie o nowej wersji (v4.14) ===
// Aplikacja porównuje swój znacznik builda z version.json na serwerze:
// co 5 minut, po powrocie na kartę i po odzyskaniu sieci (najczęściej raz na minutę).
// Nie przeładowuje sama, bo trwająca generacja by przepadła; pokazuje pasek z przyciskiem.

import { useState, useEffect, useRef } from "react";
import { RefreshCw, X } from "lucide-react";
import theme, { ui } from "./theme.js";
import { BUILD_ID } from "./version.js";

// Po "Odśwież teraz" usuwamy z adresu parametr ?v= (był tylko po to, by ominąć pamięć podręczną)
try {
  const u = new URL(window.location.href);
  if (u.searchParams.has("v")) { u.searchParams.delete("v"); window.history.replaceState(null, "", u.toString()); }
} catch (e) { /* bez znaczenia dla działania */ }

const CHECK_EVERY_MS = 5 * 60 * 1000;
const MIN_GAP_MS = 60 * 1000;
const VERSION_URL = `${import.meta.env.BASE_URL}version.json`;

export function useUpdateCheck() {
  const [available, setAvailable] = useState(null); // {build, version, note}
  const [dismissed, setDismissed] = useState(null); // build, który ktoś odłożył na później
  const last = useRef(0);

  useEffect(() => {
    if (BUILD_ID === "dev") return undefined; // npm run dev: zawsze najnowszy kod
    const check = async (force = false) => {
      if (!force && Date.now() - last.current < MIN_GAP_MS) return;
      last.current = Date.now();
      try {
        const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (j.build && j.build !== BUILD_ID) setAvailable(j);
      } catch (e) { /* brak sieci: spróbujemy przy następnej okazji */ }
    };
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    const onOnline = () => check();
    const timer = setInterval(() => check(true), CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onOnline);
    check(true);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return { available: available && available.build !== dismissed ? available : null, dismiss: () => setDismissed(available?.build) };
}

// Przeładowanie z parametrem omija pamięć podręczną strony (GitHub Pages trzyma index.html do 10 minut)
const reloadFresh = (build) => {
  const url = new URL(window.location.href);
  url.searchParams.set("v", String(build).replace(/\D/g, "").slice(0, 14));
  window.location.replace(url.toString());
};

export function UpdateBanner() {
  const { available, dismiss } = useUpdateCheck();
  if (!available) return null;
  return (
    <div role="status" style={{ position: "sticky", top: 0, zIndex: 50, background: theme.color.text, color: theme.color.surface, boxShadow: theme.shadow.raised }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: theme.size.body, fontFamily: theme.font.body }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: theme.color.lemon, flexShrink: 0 }} />
        <span style={{ flex: "1 1 320px" }}>
          <strong>Dostępna nowa wersja aplikacji{available.version ? ` ${available.version}` : ""}</strong>
          {available.note ? `: ${available.note}.` : "."} Zapisz lub skopiuj bieżącą pracę i odśwież stronę.
        </span>
        <button onClick={() => reloadFresh(available.build)} style={{ ...ui.btnPrimary(), padding: "7px 14px" }}>
          <RefreshCw size={14} /> Odśwież teraz
        </button>
        <button onClick={dismiss} aria-label="Później" title="Przypomnij przy kolejnej wersji"
          style={{ background: "transparent", border: "none", color: theme.color.surface, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: theme.size.small, fontFamily: "inherit" }}>
          <X size={14} /> Później
        </button>
      </div>
    </div>
  );
}
