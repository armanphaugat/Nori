import { useEffect, useState, createContext, useContext } from "react";

// ─── THEME CONTEXT ────────────────────────────────────────────────────────────
export const ThemeContext = createContext({ dark: false, setDark: () => {} });
export function useTheme() { return useContext(ThemeContext); }

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Outfit:wght@300..900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { min-height: 100%; height: 100%; }

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #F8FAFC;
    color: #0F172A;
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
    --danger:           #EF233C;
    --danger-deep:      #D90429;
    --danger-dim:       rgba(30,58,138,0.10);
    --danger-glow:      rgba(30,58,138,0.20);
    --danger-border:    rgba(30,58,138,0.25);

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

    /* ── Accent (Blue) ── */
    --accent:        #1D4ED8;
    --accent-deep:   #1E3A8A;
    --accent-dim:    rgba(30,58,138,0.10);
    --accent-glow:   rgba(30,58,138,0.20);
    --accent-border: rgba(30,58,138,0.25);

    /* ── Alias tokens ── */
    --primary:       #1D4ED8;
    --blue:          #8D99AE;
    --on-surface-variant: #5a5d78;
    --outline-variant:    rgba(43,45,66,0.18);

    /* ── Misc ── */
    --r-sm:   8px;
    --r-md:   14px;
    --r-lg:   20px;
    --r-xl:   28px;
    --r-full: 9999px;
    --tr:     0.2s cubic-bezier(0.4,0,0.2,1);
    --shadow-sm: 0 1px 3px rgba(43,45,66,0.03), 0 1px 2px rgba(43,45,66,0.02);
    --shadow-md: 0 4px 20px -2px rgba(43,45,66,0.05), 0 2px 8px -1px rgba(43,45,66,0.03);
    --shadow-lg: 0 20px 48px -6px rgba(43,45,66,0.08), 0 10px 20px -4px rgba(43,45,66,0.04);
    /* ── Always-dark brand color (for icon containers, accent strips) ── */
    --brand-dark:    #2B2D42;
    --brand-dark-2:  #1a1c2e;
  }

  /* ── Dark Mode ── */
  [data-theme="dark"] {
    --navy:          #FFFFFF;
    --navy-mid:      #93C5FD;
    --navy-light:    rgba(59,130,246,0.07);
    --slate:         #60A5FA;
    --slate-dim:     rgba(59,130,246,0.18);
    --light:         #0D111A;
    --danger:           #F87171;
    --danger-deep:      #FCA5A5;
    --danger-dim:       rgba(248,113,113,0.12);
    --danger-glow:      rgba(248,113,113,0.20);
    --danger-border:    rgba(248,113,113,0.30);

    --bg:            #000000;
    --surface:       #000000;
    --surface-2:     #08090C;
    --surface-3:     #0F121A;
    --surface-4:     #181C26;

    --text:          #FFFFFF;
    --muted:         #93C5FD;
    --muted2:        rgba(147,197,253,0.65);

    --border:        rgba(59,130,246,0.20);
    --border2:       rgba(59,130,246,0.40);

    --accent:        #3B82F6;
    --accent-deep:   #2563EB;
    --accent-dim:    rgba(59,130,246,0.15);
    --accent-glow:   rgba(59,130,246,0.35);
    --accent-border: rgba(59,130,246,0.50);

    --primary:       #3B82F6;
    --blue:          #93C5FD;
    --on-surface-variant: #93C5FD;
    --outline-variant:    rgba(59,130,246,0.25);

    --shadow-sm: 0 1px 3px rgba(0,0,0,0.40), 0 1px 2px rgba(0,0,0,0.30);
    --shadow-md: 0 4px 20px -2px rgba(0,0,0,0.60), 0 2px 8px -1px rgba(0,0,0,0.40);
    --shadow-lg: 0 20px 48px -6px rgba(0,0,0,0.70), 0 10px 20px -4px rgba(0,0,0,0.55);
    /* brand-dark adapts to dark mode — cold premium dark navy */
    --brand-dark:    #000000;
    --brand-dark-2:  #000000;
  }

  [data-theme="dark"] body {
    background: #000000;
    color: #FFFFFF;
  }

  [data-theme="dark"] ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.25); }
  [data-theme="dark"] ::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.45); }

  [data-theme="dark"] .kb-input {
    background: var(--surface-2);
    color: var(--text);
  }
  [data-theme="dark"] .kb-input option { background: #1E293B; color: var(--text); }

  [data-theme="dark"] .nav-item:hover { background: rgba(59,130,246,0.10); color: var(--accent-deep); }
  [data-theme="dark"] .nav-item.active { background: var(--accent-dim); color: var(--accent-deep); }

  [data-theme="dark"] .data-table th { background: var(--surface-2); }
  [data-theme="dark"] .data-table tr:hover td { background: var(--surface-3); color: var(--text); }

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
  h1,h2,h3,h4 { font-family: 'Outfit', sans-serif; font-weight: 700; }

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
    font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none;
    transition: border-color var(--tr), box-shadow var(--tr);
  }
  .kb-input::placeholder { color: var(--muted2); }
  .kb-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
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
    border: 2px solid #fff; box-shadow: 0 2px 8px var(--accent-glow); transition: transform .1s;
  }
  input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.15); }

  /* ── Nav items (sidebar) ── */
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    border-radius: var(--r-md); font-size: 14px; font-weight: 500;
    color: var(--muted); cursor: pointer; border: none; background: none;
    font-family: 'Plus Jakarta Sans', sans-serif; transition: all var(--tr);
    white-space: nowrap; width: 100%; text-align: left;
  }
  .nav-item:hover  { background: var(--navy-light); color: var(--accent-deep); }
  .nav-item.active { background: var(--accent-dim); color: var(--accent-deep); font-weight: 600; }

  /* ── Drop zone ── */
  .drop-zone {
    border: 2px dashed var(--border2); border-radius: var(--r-lg);
    padding: 32px 20px; display: flex; flex-direction: column; align-items: center;
    gap: 10px; cursor: pointer; transition: all var(--tr); text-align: center;
    background: var(--surface-2);
  }
  .drop-zone:hover { border-color: var(--accent); background: var(--accent-dim); }

  /* ── Table ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .data-table th {
    padding: 11px 16px; text-align: left; color: var(--muted); font-weight: 600;
    font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
    background: var(--surface-2); border-bottom: 1px solid var(--border);
    white-space: nowrap; font-family: 'Plus Jakarta Sans', sans-serif;
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
    border-radius: 99px; background: var(--accent-dim); border: 1px solid var(--accent-border);
    margin-bottom: 10px;
  }
  .section-pill span.bar {
    width: 3px; height: 14px; border-radius: 2px; background: var(--accent); display: inline-block;
  }
  .section-pill span.label {
    font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
    color: var(--accent-deep); font-family: 'Plus Jakarta Sans', sans-serif;
  }
`;

export function GlobalStyles({ dark }) {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute("data-theme", "dark");
      document.body.style.background = "#000000";
      document.body.style.color = "#FFFFFF";
    } else {
      root.removeAttribute("data-theme");
      document.body.style.background = "";
      document.body.style.color = "";
    }
  }, [dark]);

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
      border: `2px solid var(--accent-dim)`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin .6s linear infinite",
      display: "inline-block",
      flexShrink: 0,
    }} />
  );
}

export function OnlineDot() {
  return null;
}

export function StatusBadge({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: "10px 16px", borderRadius: "var(--r-md)", fontSize: 13.5, fontWeight: 500,
      background: ok ? "rgba(34,197,94,0.06)" : "var(--danger-dim)",
      border: `1px solid ${ok ? "rgba(34,197,94,0.2)" : "var(--danger-border)"}`,
      color: ok ? "#16a34a" : "var(--danger-deep)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>{msg}</div>
  );
}

export function Tag({ children, variant = "primary", style = {} }) {
  const variants = {
    primary: { bg: "var(--accent-dim)",                     color: "var(--accent-deep)",   border: "var(--accent-border)" },
    ghost:   { bg: "transparent",                           color: "var(--muted)",         border: "transparent" },
    danger:  { bg: "var(--danger-dim)",                     color: "var(--danger-deep)",   border: "var(--danger-border)" },
    error:   { bg: "rgba(239,35,60,0.08)",                  color: "var(--danger-deep)",   border: "var(--danger-border)" },
    neutral: { bg: "var(--surface-2)",                   color: "var(--muted)",         border: "var(--border2)" },
    slate:   { bg: "var(--slate-dim)",                   color: "var(--navy-mid)",      border: "rgba(141,153,174,0.3)" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px",
      borderRadius: "var(--r-full)", fontSize: 11, fontWeight: 700, letterSpacing: ".04em",
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      fontFamily: "'Plus Jakarta Sans', sans-serif", ...style,
    }}>{children}</span>
  );
}

export function Btn({ children, onClick, disabled, variant = "primary", style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7,
    border: "none", cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
    borderRadius: "var(--r-md)", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    whiteSpace: "nowrap", userSelect: "none",
    opacity: disabled ? .45 : 1,
    pointerEvents: disabled ? "none" : "auto",
    fontSize: 13.5, minHeight: 38,
  };
  const variants = {
    primary: {
      background: "linear-gradient(135deg, var(--accent-deep) 0%, var(--accent) 100%)",
      color: "#fff",
      padding: "8px 20px",
      boxShadow: "0 4px 14px rgba(30,58,138, 0.35)",
    },
    ghost: {
      background: "var(--surface)", color: "var(--muted)",
      padding: "8px 16px", border: "1.5px solid var(--border2)",
    },
    danger: {
      background: "rgba(239, 35, 60, 0.08)", color: "var(--danger-deep)",
      padding: "6px 12px", border: "1.5px solid var(--danger-border)",
    },
    success: {
      background: "rgba(34,197,94,0.07)", color: "#15803d",
      padding: "8px 18px", border: "1.5px solid rgba(34,197,94,0.2)",
    },
    accent: {
      background: "linear-gradient(135deg, var(--accent) 0%, #60A5FA 100%)",
      color: "#fff",
      padding: "8px 20px",
      boxShadow: "0 4px 14px rgba(30,58,138, 0.35)",
    },
    outline: {
      background: "transparent", color: "var(--accent-deep)",
      padding: "8px 18px", border: "1.5px solid var(--accent-border)",
    },
    discord: {
      background: "linear-gradient(135deg, #5865F2 0%, #404eed 100%)",
      color: "#fff",
      padding: "9px 22px",
      boxShadow: "0 4px 16px rgba(88,101,242,0.25)",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { 
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(-1.5px)";
          if (variant === "primary" || variant === "accent") {
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(30,58,138, 0.45)";
          }
        }
      }}
      onMouseLeave={e => { 
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(0)";
          if (variant === "primary" || variant === "accent") {
            e.currentTarget.style.boxShadow = variants[variant].boxShadow;
          }
        }
      }}
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
  return null;
}

export function SectionHeader({ label, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {label && <SectionLabel text={label} />}
      <h2 style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: "clamp(22px,3vw,32px)",
        lineHeight: 1.15,
        letterSpacing: "-0.025em",
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
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <g transform="translate(0, 28.5)">
        <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" />
      </g>
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
        background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="dns" size={30} style={{ color: "var(--accent-deep)", opacity: 0.6 }} />
      </div>
      <div>
        <div style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 600,
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