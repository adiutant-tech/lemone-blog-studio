// === Lemoné Studio: znak marki (v4.10) ===
// Plaster cytrusa: skórka (cytryna -> limonka), biały pierścień albedo, 8 segmentów miąższu
// z jasnym przejściem do środka i listek. Rysowany w SVG (ostry w każdym rozmiarze, bez plików).
// Kolory wyłącznie z theme.js.

import theme from "./theme.js";

let uid = 0;

// Klin segmentu od promienia r0 do r1 między kątami a0..a1 (stopnie, 0 = góra)
function wedge(cx, cy, r0, r1, a0, a1) {
  const p = (r, a) => {
    const t = (a - 90) * Math.PI / 180;
    return `${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`;
  };
  return `M ${p(r0, a0)} L ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

export function CitrusMark({ size = 40, leaf = true, title = "Lemoné" }) {
  const id = `cm${++uid}`;
  const c = theme.color;
  const segs = 8;
  const gap = 5; // stopnie przerwy między segmentami
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`${id}-rind`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.lemon} />
          <stop offset="1" stopColor={c.lime} />
        </linearGradient>
        <radialGradient id={`${id}-pulp`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.15" stopColor={c.lemonLight} />
          <stop offset="1" stopColor={c.lemon} />
        </radialGradient>
        <radialGradient id={`${id}-pulp2`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.15" stopColor={c.lemonLight} />
          <stop offset="1" stopColor={c.lime} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="34" r="27" fill={`url(#${id}-rind)`} />
      <circle cx="32" cy="34" r="23.5" fill={c.pith} />
      {Array.from({ length: segs }, (_, i) => {
        const a0 = i * 360 / segs + gap / 2;
        const a1 = (i + 1) * 360 / segs - gap / 2;
        return <path key={i} d={wedge(32, 34, 3.2, 21.5, a0, a1)} fill={`url(#${id}-${i % 2 ? "pulp2" : "pulp"})`} />;
      })}
      <circle cx="32" cy="34" r="2.4" fill={c.pith} />
      {leaf && (
        <g>
          <path d="M33 8.5 C 37 1.5, 47 0.8, 53 3.5 C 49 10, 40 12.5, 33 8.5 Z" fill={c.leaf} />
          <path d="M35 7.6 C 40 5.2, 45 4.2, 50 4.4" fill="none" stroke={c.pith} strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

// Znak + nazwa: „Lemoné” i podpis „Writer” (nazwa aplikacji od v4.18; wcześniej Blog Studio)
export function LemoneLogo({ size = 44, subtitle = "Writer" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <CitrusMark size={size} />
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: size * 0.56, letterSpacing: "-0.02em", color: theme.color.text }}>
          Lemoné
        </div>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 600, fontSize: Math.max(10, size * 0.24), letterSpacing: "0.22em", textTransform: "uppercase", color: theme.color.accentHover, marginTop: 4 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

// Dekoracyjny plaster w tle (bez listka, przyciemniony)
export function CitrusDecor({ size = 320, opacity = 0.08, style }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", pointerEvents: "none", opacity, ...style }}>
      <CitrusMark size={size} leaf={false} title="" />
    </div>
  );
}

// Pasek w barwach cytrusów (dół nagłówka)
export const citrusBar = `linear-gradient(90deg, ${theme.color.lemon}, ${theme.color.lime} 45%, ${theme.color.accentHover})`;
