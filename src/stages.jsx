// === Praca etapami (v4.17): wspólne elementy scenariuszy i artykułów ===
// Po każdym etapie generacja się zatrzymuje: wynik można zatwierdzić, poprawić ręcznie albo wygenerować
// ponownie z uwagami (model dostaje poprzednią wersję i uwagi). Każda wersja etapu zostaje w historii.
// Szkic zapisuje się na serwerze (Worker /drafts) po każdym kroku, więc pracę można dokończyć później,
// na innym komputerze albo przez inną osobę.

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Circle, Loader2, AlertTriangle, XCircle, RefreshCw, Pencil, Check, X, History, ChevronRight, PauseCircle } from "lucide-react";
import theme, { ui } from "./theme.js";
import { apiFetch } from "./auth.jsx";
import { sanitizeHtml } from "./shared.jsx";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const fmt = (iso) => iso ? new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : "";
const usdFmt = (n) => (Number(n) || 0).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------- szkice na serwerze ----------
async function draftApi(path, body) {
  const res = await apiFetch(API + path, body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : undefined);
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
  return j;
}
export const listDrafts = async (typ) => (await draftApi("/drafts")).items.filter(d => !typ || d.typ === typ);
export const getDraft = (id) => draftApi(`/drafts/${id}`);
export const deleteDraft = (id) => draftApi(`/drafts/${id}`, { action: "delete" });

// Zapis szkicu: pierwszy zapis tworzy szkic, kolejne go nadpisują. Zapisy idą po kolei (bez wyścigów),
// a gdy w trakcie zapisu przyjdzie nowszy stan, wysyłamy tylko najnowszy.
export function useDraftSaver(typ, initialId = null) {
  const idRef = useRef(initialId);
  const [state, setState] = useState({ saving: false, savedAt: null, error: null, id: initialId });
  const queue = useRef(null);
  const running = useRef(false);
  const flush = async () => {
    if (running.current) return;
    running.current = true;
    while (queue.current) {
      const payload = queue.current; queue.current = null;
      setState(s => ({ ...s, saving: true }));
      try {
        const r = idRef.current
          ? await draftApi(`/drafts/${idRef.current}`, payload)
          : await draftApi("/drafts", { typ, ...payload });
        idRef.current = r.id || idRef.current;
        setState({ saving: false, savedAt: r.updatedAt || new Date().toISOString(), error: null, id: idRef.current });
      } catch (e) {
        setState(s => ({ ...s, saving: false, error: e.message }));
      }
    }
    running.current = false;
  };
  const save = (payload) => { queue.current = payload; flush(); };
  const remove = async () => { if (idRef.current) { const id = idRef.current; idRef.current = null; setState({ saving: false, savedAt: null, error: null, id: null }); await deleteDraft(id).catch(() => {}); } };
  // Odpięcie bez usuwania: szkic zostaje na liście "W toku", kolejny zapis utworzy nowy
  const detach = () => { idRef.current = null; queue.current = null; setState({ saving: false, savedAt: null, error: null, id: null }); };
  const attach = (id) => { idRef.current = id; setState({ saving: false, savedAt: null, error: null, id }); };
  return { ...state, save, remove, detach, attach };
}

export function DraftStatus({ saver }) {
  if (saver.error) return <span style={{ ...ui.help, margin: 0, color: theme.color.danger }}>Nie zapisano szkicu: {saver.error} (praca jest w tej karcie; spróbuje przy następnym kroku)</span>;
  if (saver.saving) return <span style={{ ...ui.help, margin: 0 }}><Loader2 size={11} className="spin" style={{ verticalAlign: "-1px" }} /> Zapisuję szkic...</span>;
  if (saver.savedAt) return <span style={{ ...ui.help, margin: 0 }}><Check size={11} style={{ verticalAlign: "-1px" }} /> Szkic zapisany {fmt(saver.savedAt)} (lista „W toku”)</span>;
  return null;
}

// ---------- etapy ----------
// Etap: { key, label, hint, versions: [{content, at, by, usd, uwagi, source}], cur, approved, stale }
export const curVersion = (st) => st && st.versions?.length ? st.versions[st.cur ?? st.versions.length - 1] : null;

// Status do paska: approved | review | stale | running | failed | pending
export function stageStatus(st, { runningKey, failedKey }) {
  if (st.key === runningKey) return "running";
  if (st.key === failedKey) return "failed";
  if (st.stale) return "stale";
  if (st.approved) return "approved";
  if (st.versions?.length) return "review";
  return "pending";
}

const ICON = {
  approved: (P) => <CheckCircle2 size={15} color={P.accentHover} />,
  review: () => <PauseCircle size={15} color={theme.color.warning} />,
  stale: () => <AlertTriangle size={15} color={theme.color.warning} />,
  running: (P) => <Loader2 size={15} className="spin" color={P.accentHover} />,
  failed: () => <XCircle size={15} color={theme.color.danger} />,
  pending: () => <Circle size={15} color={theme.color.textMuted} />,
};
const STATUS_LABEL = { approved: "zatwierdzony", review: "czeka na Twoją decyzję", stale: "nieaktualny (zmieniono wcześniejszy etap)", running: "generuję", failed: "błąd", pending: "czeka" };

// Pasek etapów: klik w etap z wynikiem pokazuje go (podgląd, edycja, ponowienie)
export function StageStepper({ stages, statusOf, selected, onSelect, usd, startedAt, busy, profile: P, extra }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!busy) return undefined; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [busy]);
  const done = stages.filter(s => statusOf(s) === "approved").length;
  const sec = startedAt && busy ? Math.round((now - startedAt) / 1000) : null;
  return (
    <div style={{ border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.card, padding: "12px 14px", background: theme.color.bg }} role="status" aria-live="polite">
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <strong style={{ fontFamily: theme.font.heading, fontSize: theme.size.h3 }}>Etapy</strong>
        <span style={ui.help}>zatwierdzone {done} z {stages.length} · koszt {usdFmt(usd)} USD{sec != null ? ` · bieżący krok ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : ""}</span>
        <div style={{ flex: 1 }} />
        {extra}
      </div>
      <div style={{ height: 5, borderRadius: 99, background: theme.color.border, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ width: `${Math.round((done / stages.length) * 100)}%`, height: "100%", background: P.accent, transition: "width .4s ease" }} />
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
        {stages.map((s, i) => {
          const st = statusOf(s);
          const clickable = !!s.versions?.length;
          const isSel = selected === s.key;
          return (
            <li key={s.key}>
              <button type="button" onClick={() => clickable && onSelect(s.key)} disabled={!clickable}
                style={{ width: "100%", display: "flex", gap: 8, alignItems: "center", textAlign: "left", border: "none", borderRadius: 8, padding: "5px 8px", fontFamily: "inherit",
                  background: isSel ? theme.color.surface : "transparent", boxShadow: isSel ? theme.shadow.card : "none", cursor: clickable ? "pointer" : "default",
                  color: st === "pending" ? theme.color.textMuted : theme.color.text, fontSize: theme.size.body, fontWeight: st === "review" || st === "running" ? 600 : 400 }}>
                {ICON[st](P)}
                <span style={{ flex: 1 }}>{i + 1}. {s.label}</span>
                <span style={{ ...ui.help, margin: 0, fontWeight: 400 }}>{st === "pending" ? s.hint : STATUS_LABEL[st]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Karta etapu: podgląd wersji, edycja ręczna, ponowienie z uwagami, zatwierdzenie
export function StageCard({ stage, status, kind = "html", busy, profile: P, onApprove, onRegenerate, onEdit, onPickVersion, children, approveLabel = "Zatwierdź i dalej", note }) {
  const v = curVersion(stage);
  const [editing, setEditing] = useState(false);
  const [buf, setBuf] = useState("");
  const [uwagi, setUwagi] = useState("");
  const [mode, setMode] = useState("popraw");
  const [showHist, setShowHist] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setEditing(false); setUwagi(""); }, [stage.key, stage.versions?.length, stage.cur]);
  useEffect(() => { if (editing && kind !== "text" && ref.current) ref.current.innerHTML = sanitizeHtml(buf); }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!v) return null;
  const text = kind === "text" ? (v.content?.text ?? v.content) : null;
  const startEdit = () => { setBuf(kind === "text" ? text : v.content); setEditing(true); };
  const saveEdit = () => {
    const next = kind === "text" ? buf : (ref.current ? ref.current.innerHTML : buf);
    setEditing(false);
    onEdit(next);
  };

  const banner = status === "stale"
    ? <div style={{ ...ui.banner("warning"), marginBottom: 10 }}><AlertTriangle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />Wcześniejszy etap się zmienił. Wygeneruj ten etap ponownie albo zatwierdź go bez zmian.</div>
    : null;

  return (
    <div style={{ ...ui.card, borderColor: status === "review" || status === "stale" ? P.accent : theme.color.border }} className="scenario-doc">
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontFamily: theme.font.heading, fontSize: theme.size.h3 + 1 }}>{stage.label}</h3>
        <span style={ui.pill(status === "approved" ? theme.color.accentSoft : theme.color.warningSoft, theme.color.text)}>{STATUS_LABEL[status] || status}</span>
        <span style={ui.help}>wersja {(stage.cur ?? stage.versions.length - 1) + 1} z {stage.versions.length}{v.source === "edycja" ? " (edycja ręczna)" : ""} · {v.by || ""} {fmt(v.at)}{v.usd ? ` · ${usdFmt(v.usd)} USD` : ""}</span>
        <div style={{ flex: 1 }} />
        {stage.versions.length > 1 && <button onClick={() => setShowHist(!showHist)} style={{ ...ui.btnSecondary, padding: "4px 10px" }}><History size={12} /> Wersje</button>}
      </div>
      {showHist && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {stage.versions.map((x, i) => (
            <button key={i} onClick={() => onPickVersion(i)} disabled={busy}
              style={{ ...ui.btnSecondary, padding: "3px 9px", fontSize: theme.size.small, ...(i === (stage.cur ?? stage.versions.length - 1) ? { borderColor: P.accent, background: P.soft } : {}) }}
              title={x.uwagi ? `Uwagi: ${x.uwagi}` : ""}>
              v{i + 1}{x.source === "edycja" ? " (edycja)" : x.uwagi ? " (z uwagami)" : ""}
            </button>
          ))}
        </div>
      )}
      {banner}
      {note}
      {v.uwagi && <p style={{ ...ui.help, marginTop: 0 }}>Uwagi do tej wersji: „{v.uwagi}”</p>}

      <div style={{ maxHeight: 520, overflow: "auto", border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.control, padding: "10px 12px", background: theme.color.surface }} className="scroll-thin">
        {editing ? (
          kind === "text"
            ? <textarea value={buf} onChange={e => setBuf(e.target.value)} rows={18} style={{ ...ui.input, border: "none", padding: 0, fontSize: 13.5, lineHeight: 1.6 }} />
            : <div ref={ref} contentEditable suppressContentEditableWarning style={{ fontSize: 14, lineHeight: 1.65, outline: "none" }} />
        ) : kind === "text"
          ? <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.6 }}>{text}</div>
          : <div style={{ fontSize: 14, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(v.content) }} />}
      </div>

      {children}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
        {editing ? (
          <>
            <button onClick={saveEdit} style={ui.btnPrimary(P)}><Check size={14} /> Zapisz poprawki</button>
            <button onClick={() => setEditing(false)} style={ui.btnSecondary}><X size={13} /> Anuluj</button>
          </>
        ) : (
          <>
            {status !== "approved" && (
              <button onClick={onApprove} disabled={busy} style={{ ...ui.btnPrimary(P), ...(busy ? ui.btnDisabled : {}) }}><ChevronRight size={15} /> {status === "stale" ? "Zatwierdź bez zmian" : approveLabel}</button>
            )}
            <button onClick={startEdit} disabled={busy} style={{ ...ui.btnSecondary, ...(busy ? ui.btnDisabled : {}) }}><Pencil size={13} /> Popraw ręcznie</button>
          </>
        )}
      </div>

      {!editing && onRegenerate && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${theme.color.border}` }}>
          <label style={ui.label}>Wygeneruj ten etap ponownie</label>
          <textarea value={uwagi} onChange={e => setUwagi(e.target.value)} rows={2} disabled={busy} style={{ ...ui.input, resize: "vertical" }}
            placeholder="Uwagi, np.: otwarcie mniej straszące, więcej o leczeniu; krótsze zdania; bez wątku suplementów" />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: theme.size.small + 1 }}>
              <input type="radio" checked={mode === "popraw"} onChange={() => setMode("popraw")} disabled={busy} /> popraw obecną wersję
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: theme.size.small + 1 }}>
              <input type="radio" checked={mode === "nowo"} onChange={() => setMode("nowo")} disabled={busy} /> napisz od nowa
            </label>
            <div style={{ flex: 1 }} />
            <button onClick={() => onRegenerate({ uwagi: uwagi.trim(), mode })} disabled={busy || (mode === "popraw" && !uwagi.trim())}
              title={mode === "popraw" && !uwagi.trim() ? "Do poprawy wpisz uwagi" : ""}
              style={{ ...ui.btnSecondary, ...(busy || (mode === "popraw" && !uwagi.trim()) ? ui.btnDisabled : {}) }}>
              {busy ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />} Wygeneruj ponownie
            </button>
          </div>
          <p style={{ ...ui.help, marginBottom: 0 }}>Płacisz tylko za ten etap. Poprzednia wersja zostaje w „Wersje”.</p>
        </div>
      )}
    </div>
  );
}

// Dopisek do promptu przy ponowieniu: poprawa poprzedniej wersji albo nowa wersja z uwagami
export function regenNote({ uwagi, mode } = {}, prevContent) {
  if (!uwagi && mode !== "popraw") return "";
  if (mode === "popraw" && prevContent) {
    return `\n\nPOPRZEDNIA WERSJA TEJ CZĘŚCI (do poprawy):\n${prevContent}\n\nUWAGI REDAKCJI: ${uwagi}\nPopraw tę część zgodnie z uwagami. Zachowaj wszystko, czego uwagi nie dotyczą. Zwróć pełną nową wersję tej części w tym samym formacie.`;
  }
  return uwagi ? `\n\nUWAGI REDAKCJI (uwzględnij w tej wersji): ${uwagi}` : "";
}

// Nowa wersja etapu (z modelu albo z edycji); dalsze etapy stają się nieaktualne
export function pushVersion(stages, key, version, order) {
  const idx = order.indexOf(key);
  const next = { ...stages };
  const st = next[key] || { versions: [] };
  const versions = [...(st.versions || []), version];
  next[key] = { ...st, versions, cur: versions.length - 1, approved: false, stale: false };
  order.slice(idx + 1).forEach(k => { if (next[k]?.versions?.length) next[k] = { ...next[k], approved: false, stale: true }; });
  return next;
}
export function pickVersion(stages, key, i, order) {
  const idx = order.indexOf(key);
  const next = { ...stages, [key]: { ...stages[key], cur: i, approved: false, stale: false } };
  order.slice(idx + 1).forEach(k => { if (next[k]?.versions?.length) next[k] = { ...next[k], approved: false, stale: true }; });
  return next;
}
export const approveStage = (stages, key) => ({ ...stages, [key]: { ...stages[key], approved: true, stale: false } });
