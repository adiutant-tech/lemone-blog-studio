// === Lemoné Studio Design System (v4.0, specyfikacja sekcja 9) ===
// Jedyne źródło kolorów, typografii i geometrii UI. Zero hexów poza tym plikiem
// w warstwie interfejsu (wyjątek: generowany HTML artykułów = output do CMS).
// Paleta z brandbooku Lemoné; UI bazowo na palecie SKLEP, profil Klinika
// podmienia akcent (patrz profile niżej).

const theme = {
  color: {
    // Marka
    accent: "#88d41a",        // limonka: CTA, elementy aktywne; ZAWSZE z ciemnym tekstem
    accentHover: "#519d3c",   // ciemna zieleń: hover/focus interakcji
    accentSoft: "#eef8dd",    // tinta limonki ~12%: tła informacyjne, podświetlenia
    yellow: "#f9e01d",        // oszczędnie: highlight, nigdy tło długiego tekstu

    // Tekst
    text: "#1d1d1b",
    textSecondary: "#5a4d45", // brąz z brandbooku
    textMuted: "#7c7477",

    // Powierzchnie
    bg: "#faf8f4",            // tło aplikacji (ciepły krem)
    surface: "#ffffff",       // karty
    border: "#e1e1e1",

    // Stany
    success: "#519d3c",
    warning: "#f4c725",       // amber z brandbooku
    warningSoft: "#fdf6dd",
    danger: "#c0392b",
    dangerSoft: "#faeae7",
  },

  // Profile celów (sekcja 9.3): akcent przełącza się z celem, żeby redaktor
  // zawsze widział, dla kogo pisze.
  profile: {
    sklep:   { accent: "#88d41a", accentHover: "#519d3c", soft: "#eef8dd", label: "Sklep" },
    klinika: { accent: "#75af1e", accentHover: "#5a8a16", soft: "#dfd3c3", label: "Klinika" },
  },

  font: {
    heading: "'Montserrat', 'IBM Plex Sans', system-ui, sans-serif",
    body: "'Montserrat', 'IBM Plex Sans', system-ui, sans-serif",
    mono: "ui-monospace, 'Cascadia Mono', monospace",
  },

  // Skala typograficzna (sekcja 9.1)
  size: { h1: 24, h2: 18, h3: 15, body: 13.5, small: 12 },

  radius: { card: 14, control: 10, pill: 99 },

  shadow: {
    card: "0 1px 3px rgba(29,29,27,.08)",
    raised: "0 6px 24px rgba(29,29,27,.14)",
  },

  space: (n) => n * 8, // siatka 8px

  transition: "all 0.18s ease",
};

// Gotowe style bazowe komponentów (obiekty inline, zgodnie z podejściem aplikacji)
export const ui = {
  btnPrimary: (p = theme.profile.sklep) => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    background: p.accent, color: theme.color.text,
    border: "none", borderRadius: theme.radius.control,
    padding: "9px 16px", fontSize: theme.size.body, fontWeight: 600,
    fontFamily: theme.font.body, cursor: "pointer", transition: theme.transition,
  }),
  btnSecondary: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: theme.color.surface, color: theme.color.text,
    border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.control,
    padding: "8px 14px", fontSize: theme.size.small + 0.5, fontWeight: 500,
    fontFamily: theme.font.body, cursor: "pointer", transition: theme.transition,
  },
  btnDisabled: {
    opacity: 0.45, cursor: "not-allowed",
  },
  card: {
    background: theme.color.surface, border: `1px solid ${theme.color.border}`,
    borderRadius: theme.radius.card, boxShadow: theme.shadow.card,
    padding: theme.space(3),
  },
  label: {
    display: "block", fontSize: theme.size.small, fontWeight: 600,
    color: theme.color.text, margin: "0 0 6px", fontFamily: theme.font.body,
  },
  help: {
    fontSize: theme.size.small, color: theme.color.textMuted, margin: "4px 0 0",
  },
  input: {
    width: "100%", boxSizing: "border-box",
    border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.control,
    padding: "9px 11px", fontSize: theme.size.body, fontFamily: theme.font.body,
    color: theme.color.text, background: theme.color.surface, outline: "none",
  },
  pill: (bg, fg) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    background: bg, color: fg, borderRadius: theme.radius.pill,
    padding: "3px 10px", fontSize: 11.5, fontWeight: 600,
  }),
  banner: (variant) => {
    const map = {
      info:    { bg: theme.color.accentSoft, border: theme.color.accent,  fg: theme.color.text },
      warning: { bg: theme.color.warningSoft, border: theme.color.warning, fg: theme.color.text },
      danger:  { bg: theme.color.dangerSoft,  border: theme.color.danger,  fg: theme.color.danger },
    };
    const v = map[variant] || map.info;
    return {
      background: v.bg, border: `1px solid ${v.border}`, borderLeft: `4px solid ${v.border}`,
      color: v.fg, borderRadius: theme.radius.control, padding: "12px 16px",
      fontSize: theme.size.body,
    };
  },
};

export default theme;
