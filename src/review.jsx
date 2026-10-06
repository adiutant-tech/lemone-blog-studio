// === Lemoné Blog Studio v4.1 - moduł Akceptacje ===
// Autor (np. Joanna) wysyła gotowy artykuł do akceptacji osobie wskazanej z imienia
// (np. Agnieszka); dostaje link #/akceptacja/<id>. Akceptujący może poprawić tekst sam
// (nowa wersja z jego podpisem), akceptuje albo odsyła do poprawy; autor odsyła kolejną wersję.
// Klinika: bramka weryfikacji merytorycznej jest u akceptującego, a kopiowanie do CMS
// odblokowuje się dopiero po akceptacji. Sklep: akceptacja bez bramki, kopiowanie zawsze.
// Dane: Worker /reviews (Cloudflare KV). Tożsamość = wpisane imię (decyzja Roberta 2026-10-06).
// Funkcje wspólne (normalizeDashes, buildFaqCmsJson) przychodzą przez props z App.

import { useState, useEffect, useRef } from "react";
import { Send, Copy, Check, RefreshCw, AlertCircle, Loader2, ShieldCheck, ArrowLeft, Pencil, Link2, CheckCircle2, Undo2 } from "lucide-react";
import theme, { ui } from "./theme.js";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const GATE_CHECKS = [
  "Fakty medyczne zgodne z aktualną wiedzą i wytycznymi",
  "Leki: wskazania, przeciwwskazania, działania niepożądane i oznaczenia off-label poprawne",
  "Ciąża, karmienie i grupy szczególne opisane bezpiecznie (lub nie dotyczy)",
  "Źródła z notatki sprawdzone; twierdzenia oznaczone do weryfikacji rozstrzygnięte",
  "Brak obietnic efektów i marketingowego zawyżania skuteczności",
];

const S = {
  labelRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  linkBtn: { ...ui.btnSecondary, padding: "3px 8px", fontSize: theme.size.small },
};

const STATUS = {
  pending:  { label: "Czeka na akceptację", tone: "warning" },
  changes:  { label: "Do poprawy",          tone: "danger" },
  approved: { label: "Zaakceptowany",       tone: "info" },
};
const ACTION_LABEL = {
  submitted: "wysłał(a) do akceptacji",
  resubmitted: "wysłał(a) poprawioną wersję",
  changes: "odesłał(a) do poprawy",
  approved: "zaakceptował(a)",
};

async function api(path, body) {
  const res = await fetch(API + path, body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : undefined);
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
  return j;
}

function lsGet(key, fallback = "") {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

// Treść przychodzi z bazy współdzielonej przez wszystkich: przed wyrenderowaniem
// usuwamy skrypty, osadzenia i handlery zdarzeń.
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
const longDate = (iso) => iso ? new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) : "";

// Blok dołączany do artykułu po akceptacji (klinika): piśmiennictwo zatwierdzone przez lekarza
// i podpis weryfikacji merytorycznej (sygnał E-E-A-T, działa bez danych strukturalnych).
function buildPublishedBlock(published) {
  if (!published) return "";
  const list = (published.sources || []).filter(s => /^https?:\/\//i.test(s.url));
  const refs = list.length
    ? `<h2>Piśmiennictwo</h2>\n<ol>\n${list.map(s => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title || s.url)}</a></li>`).join("\n")}\n</ol>\n`
    : "";
  const sig = published.signature
    ? `<p><em>Treść zweryfikowana merytorycznie: ${escapeHtml(published.signature)}, ${longDate(published.at)}.</em></p>`
    : "";
  return refs + sig;
}

export const reviewLink = (id) => `${window.location.origin}${window.location.pathname}#/akceptacja/${id}`;
const fmt = (iso) => iso ? new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : "";

async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    document.body.removeChild(ta);
  }
}

function CopyButton({ text, label, primary = false, profile, disabled = false, title = "" }) {
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

const statusPill = (status) => {
  const s = STATUS[status] || STATUS.pending;
  const bg = { warning: theme.color.warningSoft, danger: theme.color.dangerSoft, info: theme.color.accentSoft }[s.tone];
  return <span style={ui.pill(bg, theme.color.text)}>{s.label}</span>;
};

// === Wysyłka do akceptacji (Generator i Formatowanie) ===
// payload: {kind, title, topic, keyword, html, faqItems, note, sources}
export function SendForReview({ payload, profile = theme.profile.sklep }) {
  const [author, setAuthor] = useState(() => lsGet("lemone_review_name"));
  const [reviewer, setReviewer] = useState(() => lsGet("lemone_review_to", payload.kind === "klinika" ? "Agnieszka" : ""));
  const [title, setTitle] = useState(payload.title || "");
  const [comment, setComment] = useState("");
  const [state, setState] = useState({ status: "idle" }); // idle | sending | sent | error
  const ready = author.trim() && reviewer.trim() && title.trim() && payload.html;

  const send = async () => {
    setState({ status: "sending" });
    lsSet("lemone_review_name", author.trim());
    lsSet("lemone_review_to", reviewer.trim());
    try {
      const r = await api("/reviews", { ...payload, title: title.trim(), author: author.trim(), reviewer: reviewer.trim(), comment });
      setState({ status: "sent", id: r.id });
    } catch (e) { setState({ status: "error", error: e.message }); }
  };

  if (state.status === "sent") {
    const link = reviewLink(state.id);
    return (
      <div style={ui.banner("info")}>
        <strong>Wysłano do akceptacji: {reviewer}.</strong> Prześlij ten link (mail, Slack):
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          <code style={{ fontFamily: theme.font.mono, fontSize: 12, background: theme.color.surface, padding: "4px 8px", borderRadius: 6, wordBreak: "break-all" }}>{link}</code>
          <CopyButton text={link} label="Kopiuj link" />
          <a href={`#/akceptacja/${state.id}`} style={{ ...ui.btnSecondary, textDecoration: "none" }}><Link2 size={13} /> Otwórz</a>
        </div>
        <p style={{ ...ui.help, marginBottom: 0 }}>Status sprawdzisz w zakładce Akceptacje.</p>
      </div>
    );
  }

  return (
    <div style={ui.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: theme.space(2) }}>
        <Send size={15} color={profile.accentHover} />
        <h3 style={{ fontSize: theme.size.h3 + 1, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Wyślij do akceptacji</h3>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.space(2) }}>
        <div>
          <label style={ui.label}>Twoje imię</label>
          <input value={author} onChange={e => setAuthor(e.target.value)} style={ui.input} placeholder="np. Joanna" />
        </div>
        <div>
          <label style={ui.label}>Akceptuje</label>
          <input value={reviewer} onChange={e => setReviewer(e.target.value)} style={ui.input} placeholder="np. Agnieszka" />
        </div>
      </div>
      <label style={{ ...ui.label, marginTop: 10 }}>Tytuł</label>
      <input value={title} onChange={e => setTitle(e.target.value)} style={ui.input} />
      <label style={{ ...ui.label, marginTop: 10 }}>Komentarz (opcjonalnie)</label>
      <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} style={{ ...ui.input, resize: "vertical" }} placeholder="Na co zwrócić uwagę" />
      {state.status === "error" && (
        <div style={{ ...ui.banner("danger"), marginTop: 10 }}><AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />Nie wysłano: {state.error}</div>
      )}
      <button onClick={send} disabled={!ready || state.status === "sending"}
        style={{ ...ui.btnPrimary(profile), marginTop: 12, ...(ready ? {} : ui.btnDisabled) }}>
        {state.status === "sending" ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Wyślij
      </button>
    </div>
  );
}

// === Moduł Akceptacje: lista + szczegóły ===
export default function Reviews({ shared, reviewId, onOpen }) {
  return reviewId
    ? <ReviewDetail key={reviewId} id={reviewId} shared={shared} onBack={() => onOpen(null)} />
    : <ReviewList onOpen={onOpen} />;
}

function ReviewList({ onOpen }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [who, setWho] = useState(() => lsGet("lemone_review_name"));
  const [onlyOpen, setOnlyOpen] = useState(true);

  const load = async () => {
    setError(null);
    try { setItems((await api("/reviews")).items); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const q = who.trim().toLowerCase();
  const shown = (items || []).filter(it =>
    (!q || [it.author, it.reviewer].some(n => (n || "").toLowerCase().includes(q))) &&
    (!onlyOpen || it.status !== "approved"));

  return (
    <div className="fade-in" style={ui.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: theme.space(2) }}>
        <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Akceptacje</h2>
        <div style={{ flex: 1 }} />
        <input value={who} onChange={e => { setWho(e.target.value); lsSet("lemone_review_name", e.target.value); }} style={{ ...ui.input, width: 200 }} placeholder="Filtr: imię" />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: theme.size.small + 1, cursor: "pointer" }}>
          <input type="checkbox" checked={onlyOpen} onChange={e => setOnlyOpen(e.target.checked)} /> tylko otwarte
        </label>
        <button onClick={load} style={ui.btnSecondary}><RefreshCw size={13} /> Odśwież</button>
      </div>
      {error && <div style={ui.banner("danger")}><AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}</div>}
      {!items && !error && <p style={ui.help}><Loader2 size={13} className="spin" style={{ verticalAlign: "-2px" }} /> Wczytuję...</p>}
      {items && shown.length === 0 && <p style={ui.help}>Brak zgłoszeń{q ? ` dla „${who}”` : ""}{onlyOpen ? " (otwartych)" : ""}.</p>}
      {shown.map(it => (
        <button key={it.id} onClick={() => onOpen(it.id)}
          style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6, width: "100%", textAlign: "left", background: "transparent", border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.control, padding: "10px 12px", marginBottom: 8, cursor: "pointer", fontFamily: "inherit", color: theme.color.text }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: theme.size.body }}>{it.title}</div>
            <div style={{ ...ui.help, margin: "3px 0 0" }}>
              {it.kind === "klinika" ? "Klinika" : "Sklep"} · {it.author} → {it.reviewer} · wersja {it.v} · {fmt(it.updatedAt)}
            </div>
          </div>
          <div style={{ alignSelf: "center" }}>{statusPill(it.status)}</div>
        </button>
      ))}
    </div>
  );
}

function ReviewDetail({ id, shared, onBack }) {
  const [r, setR] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState(() => lsGet("lemone_review_name"));
  const [comment, setComment] = useState("");
  const [gate, setGate] = useState(GATE_CHECKS.map(() => false));
  const [editing, setEditing] = useState(false);
  const [viewV, setViewV] = useState(null); // numer wersji do podglądu; null = bieżąca
  const [pubUrls, setPubUrls] = useState(() => new Set()); // źródła zaznaczone do publikacji
  const [signature, setSignature] = useState("");
  const editorRef = useRef(null);
  const sigKey = (name) => `lemone_review_sig_${name.trim().toLowerCase()}`;
  useEffect(() => { if (me.trim()) setSignature(lsGet(sigKey(me), "")); }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setError(null);
    try { setR(await api(`/reviews/${id}`)); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = r ? r.versions[r.versions.length - 1] : null;
  const shownVersion = r ? (r.versions.find(v => v.v === viewV) || current) : null;
  const isCurrent = shownVersion === current;

  // Podgląd przez ref (contentEditable + React VDOM gubiłoby kursor; wzorzec z FullArticleCard)
  useEffect(() => {
    if (editorRef.current && shownVersion) editorRef.current.innerHTML = sanitizeHtml(shownVersion.html);
  }, [shownVersion, editing]);

  if (error) return (
    <div style={ui.card}>
      <div style={ui.banner("danger")}><AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error === "not-found" ? "Nie ma takiego zgłoszenia (zły albo usunięty link)." : error}</div>
      <button onClick={onBack} style={{ ...ui.btnSecondary, marginTop: 12 }}><ArrowLeft size={13} /> Lista akceptacji</button>
    </div>
  );
  if (!r) return <div style={ui.card}><Loader2 size={16} className="spin" /> Wczytuję zgłoszenie...</div>;

  const P = theme.profile[r.kind] || theme.profile.sklep;
  const isKlinika = r.kind === "klinika";
  const editedHtml = () => {
    if (!editing || !editorRef.current) return undefined;
    return shared.normalizeDashes(sanitizeHtml(editorRef.current.innerHTML));
  };
  const lastApproval = [...r.history].reverse().find(h => h.action === "approved");
  const canCopy = !isKlinika || r.status === "approved";
  const publishedBlock = r.status === "approved" ? buildPublishedBlock(r.published) : "";
  const publishHtml = current.html + (publishedBlock ? "\n" + publishedBlock : "");
  const sources = r.sources || [];
  const togglePub = (url) => {
    const next = new Set(pubUrls);
    next.has(url) ? next.delete(url) : next.add(url);
    setPubUrls(next);
  };

  const act = async (path, body) => {
    if (!me.trim()) { setError("Wpisz swoje imię."); return; }
    lsSet("lemone_review_name", me.trim());
    setBusy(true);
    try {
      const updated = await api(`/reviews/${id}/${path}`, { by: me.trim(), comment, ...body });
      setR(updated); setComment(""); setEditing(false); setViewV(null); setGate(GATE_CHECKS.map(() => false));
    } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const gateOk = !isKlinika || (gate.every(Boolean) && signature.trim());
  const approve = () => {
    if (isKlinika) lsSet(sigKey(me), signature.trim());
    act("decision", {
      decision: "approved", html: editedHtml(),
      gate: isKlinika ? gate : undefined,
      publishedSources: isKlinika ? sources.filter(s => pubUrls.has(s.url)) : undefined,
      signature: isKlinika ? signature.trim() : undefined,
    });
  };

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "minmax(320px, 400px) 1fr", gap: theme.space(3), alignItems: "start" }}>
      {/* ===== Lewa kolumna: metryka, historia, decyzja ===== */}
      <div style={{ display: "grid", gap: theme.space(2) }}>
        <div style={ui.card}>
          <button onClick={onBack} style={{ ...ui.btnSecondary, padding: "4px 10px", marginBottom: 12 }}><ArrowLeft size={12} /> Lista</button>
          <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: "0 0 8px", fontFamily: theme.font.heading }}>{r.title}</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {statusPill(r.status)}
            <span style={ui.pill(P.soft, theme.color.text)}>{isKlinika ? "Klinika" : "Sklep"}</span>
            <span style={ui.help}>{r.author} → {r.reviewer}</span>
          </div>
          {r.status === "approved" && lastApproval && (
            <p style={{ ...ui.help, color: theme.color.text }}>
              <CheckCircle2 size={13} style={{ verticalAlign: "-2px" }} /> Zaakceptował(a) <strong>{lastApproval.by}</strong>, {fmt(lastApproval.at)}, wersja {lastApproval.v}.
            </p>
          )}
          {r.topic && <p style={{ ...ui.help, whiteSpace: "pre-wrap" }}><strong>Temat:</strong> {r.topic}</p>}
        </div>

        <div style={ui.card}>
          <label style={ui.label}>Historia</label>
          {r.history.map((h, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${theme.color.border}`, padding: "4px 0 4px 10px", margin: "6px 0" }}>
              <div style={{ fontSize: theme.size.small + 1 }}><strong>{h.by}</strong> {ACTION_LABEL[h.action] || h.action} (wersja {h.v})</div>
              <div style={ui.help}>{fmt(h.at)}</div>
              {h.comment && <div style={{ fontSize: theme.size.small + 1, whiteSpace: "pre-wrap", marginTop: 2 }}>„{h.comment}”</div>}
            </div>
          ))}
        </div>

        {r.status !== "approved" && (
          <div style={ui.card}>
            <label style={ui.label}>Twoje imię</label>
            <input value={me} onChange={e => setMe(e.target.value)} style={ui.input} placeholder="np. Agnieszka" />
            <label style={{ ...ui.label, marginTop: 10 }}>Komentarz</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} style={{ ...ui.input, resize: "vertical" }}
              placeholder={r.status === "changes" ? "Co poprawiono" : "Uwagi (wymagane przy odesłaniu do poprawy)"} />
            {editing && <p style={{ ...ui.help, color: theme.color.text }}><Pencil size={12} style={{ verticalAlign: "-2px" }} /> Twoje poprawki w tekście zapiszą się jako nowa wersja z Twoim podpisem.</p>}

            {r.status === "pending" && (
              <>
                {isKlinika && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ ...ui.label, display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={13} /> Weryfikacja merytoryczna</label>
                    {GATE_CHECKS.map((c, i) => (
                      <label key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: theme.size.small + 1, margin: "6px 0", cursor: "pointer" }}>
                        <input type="checkbox" checked={gate[i]} onChange={e => setGate(gate.map((g, gi) => gi === i ? e.target.checked : g))} />
                        {c}
                      </label>
                    ))}

                    {sources.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={S.labelRow}>
                          <label style={ui.label}>Piśmiennictwo do publikacji ({pubUrls.size}/{sources.length})</label>
                          <button onClick={() => setPubUrls(pubUrls.size === sources.length ? new Set() : new Set(sources.map(s => s.url)))} style={S.linkBtn}>
                            {pubUrls.size === sources.length ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
                          </button>
                        </div>
                        <p style={{ ...ui.help, marginTop: 0 }}>Zaznacz tylko źródła sprawdzone: trafią na koniec artykułu jako sekcja „Piśmiennictwo”.</p>
                        <div style={{ maxHeight: 220, overflow: "auto" }} className="scroll-thin">
                          {sources.map(s => (
                            <label key={s.url} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: theme.size.small + 0.5, margin: "5px 0", cursor: "pointer" }}>
                              <input type="checkbox" checked={pubUrls.has(s.url)} onChange={() => togglePub(s.url)} />
                              <span>{s.title} <a href={s.url} target="_blank" rel="noreferrer" style={{ color: theme.color.textMuted }}>(otwórz)</a></span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <label style={{ ...ui.label, marginTop: 12 }}>Podpis pod artykułem (wymagany)</label>
                    <input value={signature} onChange={e => setSignature(e.target.value)} style={ui.input} placeholder="np. lek. Agnieszka Kowalska, dermatolog" />
                    <p style={ui.help}>Pojawi się jako „Treść zweryfikowana merytorycznie: …, data”. Zapamiętywany dla Twojego imienia.</p>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <button disabled={busy || !gateOk || !me.trim()} onClick={approve}
                    style={{ ...ui.btnPrimary(P), ...(busy || !gateOk || !me.trim() ? ui.btnDisabled : {}) }}
                    title={gateOk ? "" : "Potwierdź wszystkie punkty weryfikacji i wpisz podpis"}>
                    <CheckCircle2 size={14} /> Akceptuję
                  </button>
                  <button disabled={busy || !comment.trim() || !me.trim()} onClick={() => act("decision", { decision: "changes", html: editedHtml() })}
                    style={{ ...ui.btnSecondary, ...(busy || !comment.trim() || !me.trim() ? ui.btnDisabled : {}) }}
                    title={comment.trim() ? "" : "Dopisz komentarz, co poprawić"}>
                    <Undo2 size={13} /> Do poprawy
                  </button>
                </div>
              </>
            )}

            {r.status === "changes" && (
              <button disabled={busy || !me.trim()} onClick={() => act("resubmit", { html: editedHtml() })}
                style={{ ...ui.btnPrimary(P), marginTop: 12, ...(busy || !me.trim() ? ui.btnDisabled : {}) }}>
                <Send size={14} /> Wyślij poprawioną wersję
              </button>
            )}
            {error && <div style={{ ...ui.banner("danger"), marginTop: 10 }}>{error}</div>}
          </div>
        )}
      </div>

      {/* ===== Prawa kolumna: treść, notatka ===== */}
      <div style={{ display: "grid", gap: theme.space(2) }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <CopyButton text={publishHtml} label="Kopiuj artykuł do CMS" primary profile={P} disabled={!canCopy}
            title={canCopy ? "" : "Treść medyczna: kopiowanie po akceptacji"} />
          {!isKlinika && r.faqItems?.length > 0 && <CopyButton text={shared.buildFaqCmsJson(r.faqItems)} label="Kopiuj JSON FAQ" />}
          {r.note && <CopyButton text={r.note} label="Kopiuj notatkę dla lekarza" />}
          <div style={{ flex: 1 }} />
          {r.versions.length > 1 && (
            <select value={shownVersion.v} onChange={e => { setEditing(false); setViewV(Number(e.target.value)); }} style={{ ...ui.input, width: "auto" }}>
              {r.versions.map(v => <option key={v.v} value={v.v}>Wersja {v.v} ({v.by}){v === current ? " · bieżąca" : ""}</option>)}
            </select>
          )}
          {r.status !== "approved" && isCurrent && (
            <button onClick={() => setEditing(!editing)} style={ui.btnSecondary}>
              <Pencil size={13} /> {editing ? "Zakończ edycję (bez zapisu)" : "Edytuj tekst"}
            </button>
          )}
        </div>
        {!canCopy && <p style={{ ...ui.help, margin: 0 }}>Treść medyczna: kopiowanie do CMS odblokuje się po akceptacji.</p>}

        <div style={{ ...ui.card, maxHeight: 640, overflow: "auto", outline: editing ? `2px solid ${P.accent}` : "none" }} className="scroll-thin">
          {!isCurrent && <p style={{ ...ui.help, margin: "0 0 10px" }}>Podgląd starszej wersji {shownVersion.v} ({shownVersion.by}, {fmt(shownVersion.at)}).</p>}
          <div ref={editorRef} contentEditable={editing} suppressContentEditableWarning
            style={{ fontSize: 14, lineHeight: 1.65, outline: "none" }} />
          {publishedBlock && isCurrent && (
            <div style={{ borderTop: `1px dashed ${theme.color.border}`, marginTop: 16, paddingTop: 8 }}>
              <p style={{ ...ui.help, margin: "0 0 6px" }}>Dołączone przy akceptacji (jest w kopiowanym artykule):</p>
              <div style={{ fontSize: 14, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(publishedBlock) }} />
            </div>
          )}
        </div>

        {r.note && (
          <div style={{ ...ui.card, maxHeight: 520, overflow: "auto", background: P.soft }} className="scroll-thin">
            <p style={{ ...ui.help, margin: "0 0 10px" }}><strong>Notatka merytoryczna dla lekarza</strong> (nie do publikacji)</p>
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(r.note) }} />
          </div>
        )}
      </div>
    </div>
  );
}
