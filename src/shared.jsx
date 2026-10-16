// === Lemoné Blog Studio v4.8 - wspólne elementy UI i akceptacja autora ===
// Akceptacja (od v4.8): autor sam przechodzi checklistę i wybiera piśmiennictwo, potem
// jeden przycisk zapisuje artykuł w Rejestrze (widocznym dla admina). Zastępuje dawny obieg
// akceptacji z linkami i drugą osobą (v4.1-v4.7), który okazał się zbyt zawiły.
// Tu też narzędzia używane przez kilka modułów: sanitizacja HTML z bazy, przycisk kopiowania.

import { useState } from "react";
import { Copy, Check, CheckCircle2, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import theme, { ui } from "./theme.js";
import { apiFetch, getSession } from "./auth.jsx";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Checklisty akceptacji: klinika (treść medyczna) i sklep (prawo kosmetyczne, linki)
export const CHECKS = {
  klinika: [
    "Fakty medyczne zgodne z aktualną wiedzą i wytycznymi",
    "Leki: wskazania, przeciwwskazania, działania niepożądane i oznaczenia off-label poprawne",
    "Ciąża, karmienie i grupy szczególne opisane bezpiecznie (lub nie dotyczy)",
    "Źródła z notatki sprawdzone; twierdzenia oznaczone do weryfikacji rozstrzygnięte",
    "Brak obietnic efektów i marketingowego zawyżania skuteczności",
  ],
  sklep: [
    "Fakty, nazwy produktów i składniki sprawdzone",
    "Linki (produkty, kategorie, nasze strony) prowadzą tam, gdzie trzeba",
    "Brak obietnic leczenia i zawyżonej skuteczności (prawo kosmetyczne)",
  ],
};

function lsGet(key, fallback = "") {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

// Treść z bazy współdzielonej przez wszystkich: przed wyrenderowaniem usuwamy skrypty,
// osadzenia i handlery zdarzeń.
export function sanitizeHtml(html) {
  const d = new DOMParser().parseFromString(html || "", "text/html");
  d.querySelectorAll("script, iframe, object, embed, link, meta, base, form").forEach(n => n.remove());
  d.querySelectorAll("*").forEach(el => {
    for (const a of [...el.attributes]) {
      const n = a.name.toLowerCase();
      if (n.startsWith("on")) el.removeAttribute(a.name);
      else if ((n === "href" || n === "src") && /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
    }
  });
  return d.body.innerHTML;
}

const escapeHtml = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const longDate = (iso) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

// Blok dołączany do artykułu kliniki: piśmiennictwo i (opcjonalnie) podpis weryfikacji (E-E-A-T)
export function buildPublishedBlock({ sources = [], signature = "", at }) {
  const list = sources.filter(s => /^https?:\/\//i.test(s.url));
  const refs = list.length
    ? `<h2>Piśmiennictwo</h2>\n<ol>\n${list.map(s => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title || s.url)}</a></li>`).join("\n")}\n</ol>\n`
    : "";
  const sig = signature.trim() ? `<p><em>Treść zweryfikowana merytorycznie: ${escapeHtml(signature.trim())}, ${longDate(at || new Date().toISOString())}.</em></p>` : "";
  return refs + sig;
}

async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    document.body.removeChild(ta);
  }
}

export function CopyButton({ text, label, primary = false, profile, disabled = false, title = "" }) {
  const [done, setDone] = useState(false);
  const base = primary ? ui.btnPrimary(profile) : ui.btnSecondary;
  return (
    <button disabled={disabled} title={title}
      onClick={async () => { if (disabled) return; await copyToClipboard(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
      style={{ ...base, ...(disabled ? ui.btnDisabled : {}) }}>
      {done ? <Check size={13} /> : <Copy size={13} />} {done ? "Skopiowano" : label}
    </button>
  );
}

// === Akceptacja autora: checklista, piśmiennictwo (klinika), podpis (opcjonalny), zapis w Rejestrze ===
// payload: {typ, title, keyword, topic, model, usd, html, faqItems, note, sources}
// onAccepted(finalHtml): treść gotowa do CMS (z piśmiennictwem i podpisem)
export function AcceptPanel({ kind = "sklep", payload, profile = theme.profile.sklep, onAccepted }) {
  const checks = CHECKS[kind] || CHECKS.sklep;
  const [ticked, setTicked] = useState(checks.map(() => false));
  const [pub, setPub] = useState(() => new Set());
  const session = getSession();
  const [name, setName] = useState(() => lsGet("lemone_review_name"));
  const sigKey = `lemone_sig_${(session?.email || name).trim().toLowerCase()}`;
  const [signature, setSignature] = useState(() => lsGet(sigKey));
  const [state, setState] = useState({ status: "idle" }); // idle | saving | done | error
  const sources = (kind === "klinika" ? payload.sources : null) || [];
  const ready = ticked.every(Boolean) && (session || name.trim()) && payload.html;

  const accept = async () => {
    setState({ status: "saving" });
    if (!session) lsSet("lemone_review_name", name.trim());
    if (kind === "klinika") lsSet(sigKey, signature.trim());
    const chosen = sources.filter(s => pub.has(s.url));
    const block = kind === "klinika" ? buildPublishedBlock({ sources: chosen, signature }) : "";
    const finalHtml = payload.html + (block ? "\n" + block : "");
    try {
      const res = await apiFetch(`${API}/articles`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload, kind, html: finalHtml, by: name.trim(),
          accepted: { checks, signature: kind === "klinika" ? signature.trim() : "", sources: chosen },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setState({ status: "done", at: new Date() });
      onAccepted && onAccepted(finalHtml);
    } catch (e) { setState({ status: "error", error: e.message }); }
  };

  if (state.status === "done") {
    return (
      <div style={ui.banner("info")}>
        <CheckCircle2 size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
        <strong>Zaakceptowano i zapisano w rejestrze</strong> ({state.at.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}).
        {kind === "klinika" && " Kopiowana treść zawiera wybrane piśmiennictwo" + (signature.trim() ? " i podpis." : ".")}
      </div>
    );
  }

  const toggle = (url) => { const n = new Set(pub); n.has(url) ? n.delete(url) : n.add(url); setPub(n); };
  return (
    <div style={{ ...ui.card, borderColor: kind === "klinika" ? theme.color.warning : theme.color.border }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <ShieldCheck size={16} color={profile.accentHover} />
        <h3 style={{ fontSize: theme.size.h3 + 1, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Akceptacja</h3>
      </div>
      <p style={{ ...ui.help, marginTop: 0 }}>Sprawdź wszystkie punkty{sources.length ? " i wybierz piśmiennictwo" : ""}. Akceptacja zapisuje artykuł w rejestrze{kind === "klinika" ? " i odblokowuje kopiowanie do CMS" : ""}.</p>
      {checks.map((c, i) => (
        <label key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: theme.size.small + 1, margin: "6px 0", cursor: "pointer" }}>
          <input type="checkbox" checked={ticked[i]} onChange={e => setTicked(ticked.map((t, ti) => ti === i ? e.target.checked : t))} />
          {c}
        </label>
      ))}

      {sources.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <label style={ui.label}>Piśmiennictwo do publikacji ({pub.size}/{sources.length})</label>
            <button onClick={() => setPub(pub.size === sources.length ? new Set() : new Set(sources.map(s => s.url)))}
              style={{ ...ui.btnSecondary, padding: "3px 8px", fontSize: theme.size.small }}>
              {pub.size === sources.length ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
            </button>
          </div>
          <p style={{ ...ui.help, marginTop: 0 }}>Zaznacz tylko sprawdzone źródła: trafią na koniec artykułu jako „Piśmiennictwo”.</p>
          <div style={{ maxHeight: 220, overflow: "auto" }} className="scroll-thin">
            {sources.map(s => (
              <label key={s.url} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: theme.size.small + 0.5, margin: "5px 0", cursor: "pointer" }}>
                <input type="checkbox" checked={pub.has(s.url)} onChange={() => toggle(s.url)} />
                <span>{s.title} <a href={s.url} target="_blank" rel="noreferrer" style={{ color: theme.color.textMuted }}>(otwórz)</a></span>
              </label>
            ))}
          </div>
        </div>
      )}

      {kind === "klinika" && (
        <>
          <label style={{ ...ui.label, marginTop: 12 }}>Podpis weryfikacji pod artykułem (opcjonalnie)</label>
          <input value={signature} onChange={e => setSignature(e.target.value)} style={ui.input} placeholder="np. lek. med. Agnieszka Tomala" />
          <p style={ui.help}>Wpisz tylko, jeśli treść zweryfikował lekarz. Pojawi się jako „Treść zweryfikowana merytorycznie: …, data”.</p>
        </>
      )}

      {!session && (
        <>
          <label style={{ ...ui.label, marginTop: 8 }}>Twoje imię</label>
          <input value={name} onChange={e => setName(e.target.value)} style={ui.input} placeholder="np. Joanna" />
        </>
      )}

      {state.status === "error" && <div style={{ ...ui.banner("danger"), marginTop: 10 }}><AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />Nie zapisano: {state.error}</div>}
      <button onClick={accept} disabled={!ready || state.status === "saving"}
        style={{ ...ui.btnPrimary(profile), marginTop: 12, ...(!ready || state.status === "saving" ? ui.btnDisabled : {}) }}
        title={ready ? "" : "Zaznacz wszystkie punkty checklisty"}>
        {state.status === "saving" ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />} Akceptuję i zapisuję w rejestrze
      </button>
    </div>
  );
}
