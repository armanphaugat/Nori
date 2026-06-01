import { useEffect } from "react";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { min-height: 100%; height: 100%; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #EDF2F4;
    color: #2B2D42;
    -webkit-font-smoothing: antialiased;
  }

  :root {
    /* ── Brand palette (mirrors landing page) ── */
    --navy:          #2B2D42;
    --navy-mid:      #3d3f58;
    --navy-light:    rgba(43,45,66,0.06);
    --slate:         #8D99AE;
    --slate-dim:     rgba(141,153,174,0.18);
    --light:         #EDF2F4;
    --red:           #EF233C;
    --red-deep:      #D90429;
    --red-dim:       rgba(239,35,60,0.10);
    --red-glow:      rgba(239,35,60,0.20);
    --red-border:    rgba(239,35,60,0.25);

    /* ── Surface layers ── */
    --bg:            #EDF2F4;
    --surface:       #ffffff;
    --surface-2:     #f4f7f9;
    --surface-3:     #e8edf1;
    --surface-4:     #dde3ea;

    /* ── Text ── */
    --text:          #2B2D42;
    --muted:         #5a5d78;
    --muted2:        rgba(141,153,174,0.8);

    /* ── Borders ── */
    --border:        rgba(43,45,66,0.10);
    --border2:       rgba(43,45,66,0.22);

    /* ── Accent ── */
    --accent:        #EF233C;
    --accent-deep:   #D90429;

    /* ── Misc ── */
    --r-sm:   6px;
    --r-md:   10px;
    --r-lg:   14px;
    --r-xl:   20px;
    --r-full: 9999px;
    --tr:     0.2s cubic-bezier(0.4,0,0.2,1);
    --shadow-sm: 0 2px 12px rgba(43,45,66,0.08);
    --shadow-md: 0 8px 32px rgba(43,45,66,0.12);
    --shadow-lg: 0 20px 60px rgba(43,45,66,0.14);
  }

  /* ── Material Symbols ── */
  .ms {
    font-family: 'Material Symbols Outlined';
    font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
    font-size: 20px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }
  .ms-fill { font-variation-settings: 'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }

  /* ── Headings ── */
  h1,h2,h3,h4 { font-family: 'Playfair Display', serif; }

  /* ── Animations ── */
  @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes pulse-dot{ 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes tdot     { 0%,100%{opacity:0.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-3px)} }

  .au { animation: fadeUp .4s cubic-bezier(0.16,1,0.3,1) both; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--slate-dim); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--slate); }

  /* ── Input ── */
  .kb-input {
    width: 100%;
    background: var(--surface);
    border: 1.5px solid var(--border2);
    color: var(--text);
    border-radius: var(--r-md);
    padding: 10px 14px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color var(--tr), box-shadow var(--tr);
  }
  .kb-input::placeholder { color: var(--muted2); }
  .kb-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--red-dim);
  }
  .kb-input option { background: #ffffff; color: var(--text); }

  .kb-mono { font-family: 'DM Mono', monospace !important; font-size: 12.5px !important; }

  /* ── Range ── */
  input[type=range] {
    -webkit-appearance: none; width: 100%; height: 4px;
    background: var(--surface-3); border-radius: 99px; outline: none; cursor: pointer;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 18px; height: 18px;
    background: var(--accent); border-radius: 50%; cursor: pointer;
    border: 2px solid #fff; box-shadow: 0 2px 8px var(--red-glow); transition: transform .1s;
  }
  input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.15); }

  /* ── Nav items (sidebar) ── */
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 9px 12px;
    border-radius: var(--r-md); font-size: 14px; font-weight: 500;
    color: var(--muted); cursor: pointer; border: none; background: none;
    font-family: 'DM Sans', sans-serif; transition: all var(--tr);
    white-space: nowrap; width: 100%; text-align: left;
  }
  .nav-item:hover  { background: var(--navy-light); color: var(--navy); }
  .nav-item.active { background: var(--red-dim); color: var(--accent-deep); font-weight: 600; }

  /* ── Drop zone ── */
  .drop-zone {
    border: 2px dashed var(--border2); border-radius: var(--r-lg);
    padding: 32px 20px; display: flex; flex-direction: column; align-items: center;
    gap: 10px; cursor: pointer; transition: all var(--tr); text-align: center;
    background: var(--surface-2);
  }
  .drop-zone:hover { border-color: var(--accent); background: var(--red-dim); }

  /* ── Table ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .data-table th {
    padding: 11px 16px; text-align: left; color: var(--muted); font-weight: 600;
    font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
    background: var(--surface-2); border-bottom: 1px solid var(--border);
    white-space: nowrap; font-family: 'DM Sans', sans-serif;
  }
  .data-table td {
    padding: 13px 16px; border-bottom: 1px solid var(--border);
    color: var(--muted); vertical-align: middle;
  }
  .data-table tr:hover td { background: var(--surface-2); color: var(--text); }

  /* ── Typing dots ── */
  .typing-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--accent);
    display: inline-block; animation: tdot 1.2s ease infinite;
  }

  /* ── Select wrapper ── */
  .server-select-wrapper { position: relative; }
  .server-select-wrapper select { appearance: none; -webkit-appearance: none; padding-right: 32px; cursor: pointer; }
  .server-select-wrapper::after {
    content: 'expand_more'; font-family: 'Material Symbols Outlined'; font-size: 16px;
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    pointer-events: none; color: var(--muted);
  }

  /* ── Section label pill ── */
  .section-pill {
    display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px;
    border-radius: 99px; background: var(--red-dim); border: 1px solid var(--red-border);
    margin-bottom: 10px;
  }
  .section-pill span.bar {
    width: 3px; height: 14px; border-radius: 2px; background: var(--accent); display: inline-block;
  }
  .section-pill span.label {
    font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
    color: var(--accent-deep); font-family: 'DM Sans', sans-serif;
  }
`;

export function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ─── TINY COMPONENTS ──────────────────────────────────────────────────────────

export function Icon({ name, size = 20, fill = false, style = {} }) {
  return (
    <span
      className={`ms${fill ? " ms-fill" : ""}`}
      style={{ fontSize: size, ...style }}
    >
      {name}
    </span>
  );
}

export function Spinner({ size = 16, color = "var(--accent)" }) {
  return (
    <span style={{
      width: size, height: size,
      border: `2px solid var(--red-dim)`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin .6s linear infinite",
      display: "inline-block",
      flexShrink: 0,
    }} />
  );
}

export function OnlineDot() {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: "50%", display: "inline-block", flexShrink: 0,
      background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)",
      animation: "pulse-dot 2.5s ease infinite",
    }} />
  );
}

export function StatusBadge({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: "10px 16px", borderRadius: "var(--r-md)", fontSize: 13.5, fontWeight: 500,
      background: ok ? "rgba(34,197,94,0.06)" : "rgba(239,35,60,0.06)",
      border: `1px solid ${ok ? "rgba(34,197,94,0.2)" : "var(--red-border)"}`,
      color: ok ? "#16a34a" : "var(--accent-deep)",
      fontFamily: "'DM Sans', sans-serif",
    }}>{msg}</div>
  );
}

export function Tag({ children, variant = "primary", style = {} }) {
  const variants = {
    primary: { bg: "var(--red-dim)",                     color: "var(--accent-deep)",   border: "var(--red-border)" },
    success: { bg: "rgba(34,197,94,0.08)",               color: "#15803d",              border: "rgba(34,197,94,0.2)" },
    warn:    { bg: "rgba(234,179,8,0.08)",               color: "#a16207",              border: "rgba(234,179,8,0.25)" },
    error:   { bg: "rgba(239,35,60,0.08)",               color: "var(--accent-deep)",   border: "var(--red-border)" },
    neutral: { bg: "var(--surface-2)",                   color: "var(--muted)",         border: "var(--border2)" },
    slate:   { bg: "var(--slate-dim)",                   color: "var(--navy-mid)",      border: "rgba(141,153,174,0.3)" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: "var(--r-full)", fontSize: 11, fontWeight: 600, letterSpacing: ".04em",
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      fontFamily: "'DM Sans', sans-serif", ...style,
    }}>{children}</span>
  );
}

export function Btn({ children, onClick, disabled, variant = "primary", style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7,
    border: "none", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
    borderRadius: "var(--r-md)", transition: "all var(--tr)",
    whiteSpace: "nowrap", userSelect: "none",
    opacity: disabled ? .45 : 1,
    pointerEvents: disabled ? "none" : "auto",
    fontSize: 14, minHeight: 40,
  };
  const variants = {
    primary: {
      background: "var(--navy)", color: "#fff",
      padding: "10px 22px", boxShadow: "0 4px 16px rgba(43,45,66,0.2)",
    },
    ghost: {
      background: "var(--surface)", color: "var(--muted)",
      padding: "10px 18px", border: "1.5px solid var(--border2)",
    },
    danger: {
      background: "rgba(239,35,60,0.07)", color: "var(--accent-deep)",
      padding: "8px 14px", border: "1.5px solid var(--red-border)",
    },
    success: {
      background: "rgba(34,197,94,0.07)", color: "#15803d",
      padding: "10px 20px", border: "1.5px solid rgba(34,197,94,0.2)",
    },
    accent: {
      background: "var(--accent)", color: "#fff",
      padding: "10px 22px", boxShadow: "0 4px 16px var(--red-glow)",
    },
    outline: {
      background: "transparent", color: "var(--accent-deep)",
      padding: "10px 20px", border: "1.5px solid var(--red-border)",
    },
    discord: {
      background: "#5865F2", color: "#fff",
      padding: "11px 24px", boxShadow: "0 4px 20px rgba(88,101,242,0.3)",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {children}
    </button>
  );
}

export function Card({ children, style = {}, pad = "24px" }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border2)",
      borderRadius: "var(--r-lg)",
      boxShadow: "var(--shadow-sm)",
      padding: pad,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function SectionLabel({ text }) {
  return (
    <div className="section-pill">
      <span className="bar" />
      <span className="label">{text}</span>
    </div>
  );
}

export function SectionHeader({ label, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {label && <SectionLabel text={label} />}
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontWeight: 600,
        fontSize: "clamp(22px,3vw,32px)",
        lineHeight: 1.15,
        letterSpacing: "-0.01em",
        color: "var(--navy)",
        marginBottom: 6,
        marginTop: label ? 4 : 0,
      }}>{title}</h2>
      {subtitle && (
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, fontWeight: 300, maxWidth: 560 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function DiscordIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}

export function NoServerSelected({ onGoToOverview }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "80px 20px", textAlign: "center", gap: 16,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "var(--r-xl)",
        background: "var(--red-dim)", border: "1px solid var(--red-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="dns" size={30} style={{ color: "var(--accent-deep)", opacity: 0.6 }} />
      </div>
      <div>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600,
          color: "var(--navy)", marginBottom: 8,
        }}>No server selected</div>
        <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, maxWidth: 320, fontWeight: 300 }}>
          Please go back and select a server to manage.
        </div>
      </div>
      {onGoToOverview && (
        <Btn onClick={onGoToOverview} variant="ghost" style={{ marginTop: 4 }}>
          <Icon name="arrow_back" size={16} /> Back to Server Selection
        </Btn>
      )}
    </div>
  );
}