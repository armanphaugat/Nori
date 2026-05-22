import { useEffect } from "react";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { min-height: 100%; height: 100%; }

  body {
    font-family: 'Inter', sans-serif;
    background: #07080d;
    color: #e3e1ed;
    -webkit-font-smoothing: antialiased;
  }

  :root {
    --bg:                    #07080d;
    --surface:               #090a12;
    --surface-low:           #040508;
    --surface-container:     #0c0e18;
    --surface-high:          #151724;
    --surface-highest:       #202235;
    --surface-lowest:        #12131e;
    --surface-dim:           #0b0c16;
    --on-surface:            #e3e1ed;
    --on-surface-variant:    #a0a0b0;
    --outline:               #8f8fa0;
    --outline-variant:       rgba(255, 255, 255, 0.08);
    --primary:               #5865f2;
    --primary-container:     rgba(88, 101, 242, 0.12);
    --primary-fixed:         rgba(88, 101, 242, 0.2);
    --on-primary:            #ffffff;
    --on-primary-container:  #bec2ff;
    --secondary:             #4edea3;
    --secondary-container:   rgba(78, 222, 163, 0.1);
    --on-secondary:          #ffffff;
    --tertiary:              #d0bcff;
    --tertiary-container:    rgba(208, 188, 255, 0.1);
    --on-tertiary:           #ffffff;
    --error:                 #ffb4ab;
    --error-container:       rgba(255, 180, 171, 0.08);
    --on-error-container:    #ffb4ab;
    --inverse-surface:       #e3e1ed;
    --discord:               #5865f2;
    --blue:                  #00b0f4;

    --r-sm: 8px;
    --r-md: 12px;
    --r-lg: 16px;
    --r-xl: 24px;
    --r-full: 9999px;
    --tr: 0.2s cubic-bezier(0.4,0,0.2,1);
    --shadow-sm: 0 4px 20px rgba(0,0,0,0.35);
    --shadow-md: 0 10px 40px rgba(0,0,0,0.5);
  }

  .ms { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-size: 20px; line-height:1; display:inline-flex; }
  .ms-fill { font-variation-settings: 'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes typing { 0%,100%{opacity:1} 50%{opacity:.2} }

  .au { animation: fadeUp .45s cubic-bezier(0.16,1,0.3,1) both; }

  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(255, 255, 255, 0.15); border-radius:99px; }

  .kb-input {
    width:100%; background:var(--surface-low); border:1.5px solid var(--outline-variant);
    color:var(--on-surface); border-radius:var(--r-md); padding:10px 14px;
    font-size:14px; font-family:'Inter',sans-serif; outline:none;
    transition:border-color var(--tr),box-shadow var(--tr);
  }
  .kb-input option {
    background: #151724;
    color: #e3e1ed;
  }
  .kb-input::placeholder { color:var(--on-surface-variant); opacity:.5; }
  .kb-input:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(0, 176, 244, 0.15); }

  .kb-mono { font-family:'DM Mono',monospace!important; font-size:12px!important; }

  input[type=range] {
    -webkit-appearance:none; width:100%; height:4px;
    background:var(--surface-high); border-radius:99px; outline:none; cursor:pointer;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance:none; width:18px; height:18px;
    background:var(--blue); border-radius:50%; cursor:pointer;
    box-shadow:0 2px 8px rgba(0,176,244,0.3); border:2px solid #fff; transition:transform .1s;
  }
  input[type=range]::-webkit-slider-thumb:hover { transform:scale(1.15); }

  .nav-item {
    display:flex; align-items:center; gap:10px; padding:9px 12px;
    border-radius:var(--r-md); font-size:14px; font-weight:500; color:var(--on-surface-variant);
    cursor:pointer; border:none; background:none; font-family:'Inter',sans-serif;
    transition:all var(--tr); white-space:nowrap; width:100%; text-align:left;
  }
  .nav-item:hover { background:var(--surface-high); color:var(--on-surface); }
  .nav-item.active { background:var(--primary-fixed); color:var(--primary); font-weight:600; }

  .drop-zone {
    border:2px dashed var(--outline-variant); border-radius:var(--r-lg);
    padding:32px 20px; display:flex; flex-direction:column; align-items:center;
    gap:10px; cursor:pointer; transition:all var(--tr); text-align:center;
    background:rgba(255, 255, 255, 0.01);
  }
  .drop-zone:hover { border-color:var(--blue); background:rgba(0,176,244,0.03); }

  .data-table { width:100%; border-collapse:collapse; font-size:13.5px; }
  .data-table th {
    padding:11px 16px; text-align:left; color:var(--on-surface-variant); font-weight:600;
    font-size:11px; letter-spacing:.06em; text-transform:uppercase;
    background:rgba(0,0,0,0.25); border-bottom:1px solid var(--outline-variant);
    white-space:nowrap;
  }
  .data-table td {
    padding:13px 16px; border-bottom:1px solid rgba(255,255,255,0.04);
    color:var(--on-surface-variant); vertical-align:middle;
  }
  .data-table tr:hover td { background:rgba(255,255,255,0.02); color:var(--on-surface); }

  .typing-dot {
    width:5px; height:5px; border-radius:50%; background:var(--blue); display:inline-block;
    animation:typing 1.2s ease infinite;
  }

  .server-select-wrapper {
    position: relative;
  }
  .server-select-wrapper select {
    appearance: none;
    -webkit-appearance: none;
    padding-right: 32px;
    cursor: pointer;
  }
  .server-select-wrapper::after {
    content: 'expand_more';
    font-family: 'Material Symbols Outlined';
    font-size: 16px;
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--on-surface-variant);
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

// ─── TINY COMPONENTS ─────────────────────────────────────────────────────────

export function Spinner({ size = 16, color = "var(--blue)" }) {
  return (
    <span style={{
      width: size, height: size, border: `2px solid rgba(0,176,244,0.15)`,
      borderTopColor: color, borderRadius: "50%",
      animation: "spin .6s linear infinite", display: "inline-block", flexShrink: 0,
    }} />
  );
}

export function StatusBadge({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: "10px 16px", borderRadius: "var(--r-md)", fontSize: 13.5, fontWeight: 500,
      background: ok ? "rgba(78,222,163,0.06)" : "var(--error-container)",
      border: `1px solid ${ok ? "rgba(78,222,163,0.15)" : "rgba(255,180,171,0.15)"}`,
      color: ok ? "#4edea3" : "var(--error)",
    }}>{msg}</div>
  );
}

export function Tag({ children, variant = "primary", style = {} }) {
  const variants = {
    primary: { bg: "var(--primary-fixed)", color: "var(--on-primary-container)" },
    success: { bg: "rgba(78,222,163,0.12)", color: "#4edea3" },
    warn:    { bg: "rgba(234,179,8,0.12)", color: "#eab308" },
    error:   { bg: "var(--error-container)", color: "var(--error)" },
    neutral: { bg: "rgba(255,255,255,0.06)", color: "var(--on-surface-variant)" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: "var(--r-full)", fontSize: 11, fontWeight: 600, letterSpacing: ".04em",
      background: v.bg, color: v.color, ...style,
    }}>{children}</span>
  );
}

export function Btn({ children, onClick, disabled, variant = "primary", style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7, border: "none",
    cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600,
    borderRadius: "var(--r-md)", transition: "all var(--tr)", whiteSpace: "nowrap",
    userSelect: "none", opacity: disabled ? .4 : 1, pointerEvents: disabled ? "none" : "auto",
    fontSize: 14, minHeight: 40,
  };
  const variants = {
    primary: { background: "var(--blue)", color: "#000", padding: "10px 22px", boxShadow: "0 4px 16px rgba(0,176,244,0.25)" },
    ghost:   { background: "rgba(255,255,255,0.04)", color: "var(--on-surface)", padding: "10px 18px", border: "1.5px solid var(--outline-variant)" },
    danger:  { background: "var(--error-container)", color: "var(--error)", padding: "8px 14px", border: "1.5px solid rgba(255,180,171,0.2)" },
    success: { background: "rgba(78,222,163,0.1)", color: "#4edea3", padding: "10px 20px", border: "1.5px solid rgba(78,222,163,0.2)" },
    discord: { background: "var(--discord)", color: "#fff", padding: "11px 24px", boxShadow: "0 4px 20px rgba(88,101,242,0.3)" },
    outline: { background: "transparent", color: "var(--blue)", padding: "10px 20px", border: "1.5px solid var(--blue)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if(!disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { if(!disabled) e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {children}
    </button>
  );
}

export function Icon({ name, size = 20, fill = false, style = {} }) {
  return (
    <span className={`ms${fill ? " ms-fill" : ""}`} style={{ fontSize: size, ...style }}>{name}</span>
  );
}

export function OnlineDot() {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0,
      background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.5)",
      animation: "pulse-dot 2.5s ease infinite",
    }} />
  );
}

export function Card({ children, style = {}, pad = "24px" }) {
  return (
    <div style={{
      background: "rgba(20, 22, 36, 0.4)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "var(--r-lg)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      padding: pad,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function SectionHeader({ label, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--blue)", marginBottom: 6 }}>{label}</div>}
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--on-surface)", letterSpacing: "-0.01em", marginBottom: 4 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 14, color: "var(--on-surface-variant)", lineHeight: 1.6 }}>{subtitle}</p>}
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

// Empty state displayed when no server is selected
export function NoServerSelected({ onGoToOverview }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "80px 20px", textAlign: "center", gap: 16,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "var(--r-xl)", background: "var(--primary-fixed)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="dns" size={32} style={{ color: "var(--primary)", opacity: 0.5 }} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--on-surface)", marginBottom: 8 }}>
          No server selected
        </div>
        <div style={{ fontSize: 14, color: "var(--on-surface-variant)", lineHeight: 1.6, maxWidth: 320 }}>
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
