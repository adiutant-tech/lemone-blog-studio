// === Lemoné Blog Studio v4.2 - logowanie Google i lista zaproszonych ===
// Wejście tylko kontem Google z listy zaproszonych (Worker: KV "users" + ADMIN_EMAILS).
// Role: admin (zarządza listą w zakładce Użytkownicy) i edytor (wszystko poza listą).
// Worker wydaje 12-godzinną sesję po weryfikacji tokenu Google; każde wywołanie API
// idzie przez apiFetch z nagłówkiem Authorization. Skreślenie z listy działa od razu,
// bo Worker sprawdza rolę przy każdym żądaniu.
// GOOGLE_CLIENT_ID jest publiczny (nie jest sekretem). Pusty = logowanie wyłączone,
// aplikacja działa jak przed v4.2.

import { useState, useEffect, useRef } from "react";
import { LogOut, Users, Trash2, Loader2, AlertCircle, RefreshCw, UserPlus } from "lucide-react";
import theme, { ui } from "./theme.js";

export const GOOGLE_CLIENT_ID = "";
export const AUTH_ENABLED = !!GOOGLE_CLIENT_ID;

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SESSION_KEY = "lemone_session";

export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return s && s.token && s.exp > Date.now() ? s : null;
  } catch (e) { return null; }
}
function setSession(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
}
export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

// fetch do Workera z sesją; 401 = sesja wygasła albo konto skreślone -> ekran logowania
export async function apiFetch(url, options = {}) {
  const s = getSession();
  const headers = { ...(options.headers || {}), ...(s ? { Authorization: `Bearer ${s.token}` } : {}) };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && AUTH_ENABLED) {
    clearSession();
    window.dispatchEvent(new Event("lemone-auth-expired"));
  }
  return res;
}

// Stan logowania dla App: {session, logout}; reaguje na wygaśnięcie sesji
export function useSession() {
  const [session, setS] = useState(getSession);
  useEffect(() => {
    const onExpired = () => setS(null);
    window.addEventListener("lemone-auth-expired", onExpired);
    return () => window.removeEventListener("lemone-auth-expired", onExpired);
  }, []);
  return {
    session,
    login: (s) => { setSession(s); setS(s); },
    logout: () => {
      clearSession(); setS(null);
      try { window.google?.accounts.id.disableAutoSelect(); } catch (e) {}
    },
  };
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const el = document.createElement("script");
    el.src = "https://accounts.google.com/gsi/client";
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Nie udało się wczytać logowania Google"));
    document.head.appendChild(el);
  });
}

export function LoginView({ onLogin }) {
  const btnRef = useRef(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadGoogleScript().then(() => {
      if (!alive) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setBusy(true); setError(null);
          try {
            const res = await fetch(`${API}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential }),
            });
            const j = await res.json().catch(() => ({}));
            if (res.status === 403 && j.error === "not-invited") {
              setError(`Konto ${j.email} nie jest na liście zaproszonych. Poproś administratora o dostęp.`);
            } else if (!res.ok) {
              setError(`Logowanie nieudane (${j.error || res.status}).`);
            } else {
              onLogin({ token: j.token, email: j.email, name: j.name, picture: j.picture, role: j.role, exp: Date.now() + 11.5 * 3600 * 1000 });
            }
          } catch (e) { setError(e.message); }
          setBusy(false);
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, { theme: "outline", size: "large", text: "signin_with", locale: "pl" });
    }).catch(e => setError(e.message));
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.color.bg, padding: 16 }}>
      <div style={{ ...ui.card, maxWidth: 420, width: "100%", textAlign: "center" }}>
        <h1 style={{ fontFamily: theme.font.heading, fontSize: 22, margin: "0 0 6px" }}>Lemoné Blog Studio</h1>
        <p style={{ ...ui.help, marginBottom: 20 }}>Dostęp tylko dla zaproszonych kont Google.</p>
        <div ref={btnRef} style={{ display: "flex", justifyContent: "center", minHeight: 44 }} />
        {busy && <p style={ui.help}><Loader2 size={13} className="spin" style={{ verticalAlign: "-2px" }} /> Sprawdzam dostęp...</p>}
        {error && <div style={{ ...ui.banner("danger"), marginTop: 16, textAlign: "left" }}><AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}</div>}
      </div>
    </div>
  );
}

export function UserBar({ session, onLogout }) {
  if (!session) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: theme.color.textSecondary }}>
      <span title={session.email}>{session.name || session.email}{session.role === "admin" ? " · admin" : ""}</span>
      <button onClick={onLogout} style={{ ...ui.btnSecondary, padding: "5px 9px" }} title="Wyloguj"><LogOut size={13} /></button>
    </div>
  );
}

// === Zakładka Użytkownicy (tylko admin) ===
export function AdminUsers() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [busy, setBusy] = useState(false);

  const call = async (path, body) => {
    const res = await apiFetch(`${API}${path}`, body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : undefined);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
    return j;
  };
  const load = async () => {
    setError(null);
    try { setItems((await call("/admin/users")).items); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const save = async (e, r) => {
    setBusy(true); setError(null);
    try { await call("/admin/users", { email: e, role: r }); await load(); setEmail(""); } catch (err) { setError(err.message); }
    setBusy(false);
  };
  const remove = async (e) => {
    if (!window.confirm(`Usunąć dostęp dla ${e}?`)) return;
    setBusy(true); setError(null);
    try { await call("/admin/users/remove", { email: e }); await load(); } catch (err) { setError(err.message); }
    setBusy(false);
  };
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  return (
    <div className="fade-in" style={{ ...ui.card, maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: theme.space(2) }}>
        <Users size={16} color={theme.color.accentHover} />
        <h2 style={{ fontSize: theme.size.h2, fontWeight: 600, margin: 0, fontFamily: theme.font.heading }}>Użytkownicy</h2>
        <div style={{ flex: 1 }} />
        <button onClick={load} style={ui.btnSecondary}><RefreshCw size={13} /> Odśwież</button>
      </div>
      <p style={ui.help}>Do Studio wejdą tylko konta Google z tej listy. Admin zarządza listą, edytor ma dostęp do wszystkiego poza nią.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 8, alignItems: "end", margin: "12px 0 16px" }}>
        <div>
          <label style={ui.label}>Adres Google (Gmail)</label>
          <input value={email} onChange={e => setEmail(e.target.value)} style={ui.input} placeholder="np. joanna@gmail.com" />
        </div>
        <div>
          <label style={ui.label}>Rola</label>
          <select value={role} onChange={e => setRole(e.target.value)} style={ui.input}>
            <option value="editor">Edytor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button disabled={!emailOk || busy} onClick={() => save(email.trim().toLowerCase(), role)}
          style={{ ...ui.btnPrimary(), ...(!emailOk || busy ? ui.btnDisabled : {}) }}>
          <UserPlus size={14} /> Zaproś
        </button>
      </div>

      {error && <div style={{ ...ui.banner("danger"), marginBottom: 12 }}><AlertCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{error}</div>}
      {!items && !error && <p style={ui.help}><Loader2 size={13} className="spin" style={{ verticalAlign: "-2px" }} /> Wczytuję...</p>}
      {items && items.map(u => (
        <div key={u.email} style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 8, alignItems: "center", borderTop: `1px solid ${theme.color.border}`, padding: "8px 0" }}>
          <div>
            <div style={{ fontSize: theme.size.body }}>{u.email}</div>
            <div style={{ ...ui.help, margin: 0 }}>{u.builtIn ? "admin stały (konfiguracja Workera)" : `dodał(a): ${u.addedBy || "-"}`}</div>
          </div>
          <select value={u.role} disabled={u.builtIn || busy} onChange={e => save(u.email, e.target.value)} style={ui.input}>
            <option value="editor">Edytor</option>
            <option value="admin">Admin</option>
          </select>
          <button disabled={u.builtIn || busy} onClick={() => remove(u.email)} title="Usuń dostęp"
            style={{ ...ui.btnSecondary, padding: "6px 9px", ...(u.builtIn ? ui.btnDisabled : {}) }}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
