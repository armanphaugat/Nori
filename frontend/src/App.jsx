import { useState, useEffect, useRef, useCallback } from "react";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { min-height: 100%; height: 100%; }

  body {
    font-family: 'Inter', sans-serif;
    background: #fff8f5;
    color: #1f1b17;
    -webkit-font-smoothing: antialiased;
  }

  :root {
    --bg:                    #fff8f5;
    --surface:               #fff8f5;
    --surface-low:           #fcf2eb;
    --surface-container:     #f6ece6;
    --surface-high:          #f0e6e0;
    --surface-highest:       #eae1da;
    --surface-lowest:        #ffffff;
    --surface-dim:           #e2d8d2;
    --on-surface:            #1f1b17;
    --on-surface-variant:    #464554;
    --outline:               #767586;
    --outline-variant:       #c7c4d7;
    --primary:               #4648d4;
    --primary-container:     #6063ee;
    --primary-fixed:         #e1e0ff;
    --on-primary:            #ffffff;
    --on-primary-container:  #fffbff;
    --secondary:             #5f5e5e;
    --secondary-container:   #e2dfde;
    --on-secondary:          #ffffff;
    --tertiary:              #5b5c5c;
    --tertiary-container:    #737574;
    --on-tertiary:           #ffffff;
    --error:                 #ba1a1a;
    --error-container:       #ffdad6;
    --on-error-container:    #93000a;
    --inverse-surface:       #342f2b;
    --discord:               #5865f2;

    --r-sm: 8px;
    --r-md: 12px;
    --r-lg: 16px;
    --r-xl: 24px;
    --r-full: 9999px;
    --tr: 0.18s cubic-bezier(0.4,0,0.2,1);
    --shadow-sm: 0 4px 20px rgba(0,0,0,0.03);
    --shadow-md: 0 10px 40px rgba(0,0,0,0.06);
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
  ::-webkit-scrollbar-thumb { background:var(--outline-variant); border-radius:99px; }

  .kb-input {
    width:100%; background:var(--surface-lowest); border:1.5px solid var(--outline-variant);
    color:var(--on-surface); border-radius:var(--r-md); padding:10px 14px;
    font-size:14px; font-family:'Inter',sans-serif; outline:none;
    transition:border-color var(--tr),box-shadow var(--tr);
  }
  .kb-input::placeholder { color:var(--on-surface-variant); opacity:.6; }
  .kb-input:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(70,72,212,0.12); }

  .kb-mono { font-family:'DM Mono',monospace!important; font-size:12px!important; }

  input[type=range] {
    -webkit-appearance:none; width:100%; height:4px;
    background:var(--surface-highest); border-radius:99px; outline:none; cursor:pointer;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance:none; width:18px; height:18px;
    background:var(--primary); border-radius:50%; cursor:pointer;
    box-shadow:0 2px 8px rgba(70,72,212,0.3); border:2px solid #fff; transition:transform .1s;
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
    background:var(--surface-low);
  }
  .drop-zone:hover { border-color:var(--primary); background:rgba(70,72,212,0.04); }

  .data-table { width:100%; border-collapse:collapse; font-size:13.5px; }
  .data-table th {
    padding:11px 16px; text-align:left; color:var(--on-surface-variant); font-weight:600;
    font-size:11px; letter-spacing:.06em; text-transform:uppercase;
    background:var(--surface-low); border-bottom:1px solid var(--outline-variant);
    white-space:nowrap;
  }
  .data-table td {
    padding:13px 16px; border-bottom:1px solid rgba(199,196,215,0.15);
    color:var(--on-surface-variant); vertical-align:middle;
  }
  .data-table tr:hover td { background:var(--surface-low); color:var(--on-surface); }

  .typing-dot {
    width:5px; height:5px; border-radius:50%; background:var(--primary); display:inline-block;
    animation:typing 1.2s ease infinite;
  }
`;

function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL : "http://localhost:8000";

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const LS = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  str: (k) => { try { return localStorage.getItem(k) || null; } catch { return null; } },
  strSet: (k, v) => { try { localStorage.setItem(k, v || ""); } catch {} },
  rm: (k) => { try { localStorage.removeItem(k); } catch {} },
};

function getToken() { return LS.str("wb_token"); }
function setToken(t) { t ? LS.strSet("wb_token", t) : LS.rm("wb_token"); }

let _refreshPromise = null;
async function refreshOnce() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" })
    .then(async rr => { if (rr.ok) { const d = await rr.json(); if (d.access_token) { setToken(d.access_token); return d.access_token; } } return null; })
    .catch(() => null).finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

async function apiFetch(path, opts = {}, _retry = true, _token = null) {
  const { method = "GET", body, isForm = false } = opts;
  const headers = {};
  const token = _token || getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${path}`, {
    method, headers, credentials: "include",
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  if (res.status === 401 && _retry) {
    const newToken = await refreshOnce();
    if (newToken) return apiFetch(path, opts, false, newToken);
    setToken(null); LS.rm("wb_user");
    throw new Error("Session expired — please log in again");
  }
  if (!res.ok) { let e; try { e = await res.json(); } catch { e = {}; } throw new Error(e.detail || e.message || `HTTP ${res.status}`); }
  return res.json();
}

const fd = (obj) => { const f = new FormData(); Object.entries(obj).forEach(([k, v]) => f.append(k, v)); return f; };

const API = {
  getMe:             ()           => apiFetch("/auth/me"),
  logout:            ()           => apiFetch("/auth/logout", { method: "POST" }),
  getGuilds:         ()           => apiFetch("/guilds/"),
  getGuildChannels:  (gid)        => apiFetch(`/guilds/${encodeURIComponent(gid)}/channels`),
  addServer:         (gid, name)  => apiFetch("/server/add", { method: "POST", body: fd({ guild_id: gid, name }), isForm: true }),
  getConfig:         (gid)        => apiFetch(`/server/config?guild_id=${encodeURIComponent(gid)}`),
  updateFaissK:      (gid, k)     => apiFetch("/server/update-faiss-k",    { method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateBm25K:       (gid, k)     => apiFetch("/server/update-bm25-k",     { method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateTemp:        (gid, k)     => apiFetch("/server/update-temperature", { method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateChunkSize:   (gid, k)     => apiFetch("/server/update-chunk-size",  { method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateChunkOverlap:(gid, k)     => apiFetch("/server/update-chunk-overlap",{ method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateMaxToken:    (gid, k)     => apiFetch("/server/update-max-token",   { method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateSystemPrompt:(gid, text)  => apiFetch("/server/update-system-prompt",{ method: "PUT", body: fd({ guild_id: gid, text }), isForm: true }),
  listChannels:      (gid)        => apiFetch(`/channel/list?guild_id=${encodeURIComponent(gid)}`),
  listServersWithStatus: () => apiFetch("/server/list"),
  listAllServersWithStatus: () => apiFetch("/server/list-all"),
  addChannel:        (gid, cid)   => apiFetch("/channel/add",     { method: "PUT",    body: fd({ guild_id: gid, channel_id: cid }), isForm: true }),
  deleteChannel:     (gid, cid)   => apiFetch("/channel/delete",  { method: "DELETE", body: fd({ guild_id: gid, channel_id: cid }), isForm: true }),
  addModChannel:     (gid, cid)   => apiFetch("/channel/add-mod", { method: "PUT",    body: fd({ guild_id: gid, channel_id: cid }), isForm: true }),
  upload: (gid, files, urls) => {
    const f = new FormData(); f.append("guild_id", gid);
    files.forEach(fi => f.append("files", fi));
    if (urls) f.append("urls", urls);
    return apiFetch("/upload/", { method: "PUT", body: f, isForm: true });
  },
  uploadContacts:  (gid, file)  => { const f = new FormData(); f.append("guild_id", gid); f.append("file", file); return apiFetch("/upload/contacts", { method: "PUT", body: f, isForm: true }); },
  getAllUploads:    (gid)        => apiFetch(`/upload/all?guild_id=${encodeURIComponent(gid)}`),
  getSubUrls:      (url)        => apiFetch(`/upload/sub-urls?url=${encodeURIComponent(url)}`),
  query:           (question, server) => apiFetch("/query", { method: "POST", body: { question, server } }),
  getAnalytics:    (gid)        => apiFetch(`/analytics/summary?guild_id=${encodeURIComponent(gid)}`),
};

// ─── TINY COMPONENTS ─────────────────────────────────────────────────────────

function Spinner({ size = 16, color = "var(--primary)" }) {
  return (
    <span style={{
      width: size, height: size, border: `2px solid rgba(70,72,212,0.15)`,
      borderTopColor: color, borderRadius: "50%",
      animation: "spin .6s linear infinite", display: "inline-block", flexShrink: 0,
    }} />
  );
}

function StatusBadge({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: "10px 16px", borderRadius: "var(--r-md)", fontSize: 13.5, fontWeight: 500,
      background: ok ? "rgba(34,197,94,0.08)" : "var(--error-container)",
      border: `1px solid ${ok ? "rgba(34,197,94,0.2)" : "rgba(186,26,26,0.2)"}`,
      color: ok ? "#166534" : "var(--error)",
    }}>{msg}</div>
  );
}

function Tag({ children, variant = "primary", style = {} }) {
  const variants = {
    primary: { bg: "var(--primary-fixed)", color: "var(--primary)" },
    success: { bg: "rgba(34,197,94,0.1)", color: "#166534" },
    warn:    { bg: "rgba(234,179,8,0.1)", color: "#854d0e" },
    error:   { bg: "var(--error-container)", color: "var(--error)" },
    neutral: { bg: "var(--surface-container)", color: "var(--on-surface-variant)" },
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

function Btn({ children, onClick, disabled, variant = "primary", style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7, border: "none",
    cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600,
    borderRadius: "var(--r-md)", transition: "all var(--tr)", whiteSpace: "nowrap",
    userSelect: "none", opacity: disabled ? .4 : 1, pointerEvents: disabled ? "none" : "auto",
    fontSize: 14, minHeight: 40,
  };
  const variants = {
    primary: { background: "var(--primary)", color: "#fff", padding: "10px 22px", boxShadow: "0 4px 16px rgba(70,72,212,0.25)" },
    ghost:   { background: "var(--surface-container)", color: "var(--on-surface)", padding: "10px 18px", border: "1.5px solid var(--outline-variant)" },
    danger:  { background: "var(--error-container)", color: "var(--error)", padding: "8px 14px", border: "1.5px solid rgba(186,26,26,0.2)" },
    success: { background: "rgba(34,197,94,0.1)", color: "#166534", padding: "10px 20px", border: "1.5px solid rgba(34,197,94,0.2)" },
    discord: { background: "var(--discord)", color: "#fff", padding: "11px 24px", boxShadow: "0 4px 20px rgba(88,101,242,0.3)" },
    outline: { background: "transparent", color: "var(--primary)", padding: "10px 20px", border: "1.5px solid var(--primary)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Icon({ name, size = 20, fill = false, style = {} }) {
  return (
    <span className={`ms${fill ? " ms-fill" : ""}`} style={{ fontSize: size, ...style }}>{name}</span>
  );
}

function OnlineDot() {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0,
      background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.5)",
      animation: "pulse-dot 2.5s ease infinite",
    }} />
  );
}

function Card({ children, style = {}, pad = "24px" }) {
  return (
    <div style={{
      background: "var(--surface-lowest)", border: "1px solid rgba(199,196,215,0.4)",
      borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)", padding: pad,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ label, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 6 }}>{label}</div>}
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--on-surface)", letterSpacing: "-0.01em", marginBottom: 4 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 14, color: "var(--on-surface-variant)", lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, onSave, saving }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--on-surface)", fontWeight: 500 }}>{label}</span>
        <span style={{
          fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "var(--primary)",
          background: "var(--primary-fixed)", borderRadius: 6, padding: "2px 10px",
        }}>{value}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
          style={{ flex: 1 }} />
        <Btn onClick={onSave} disabled={saving} variant="ghost"
          style={{ padding: "6px 12px", fontSize: 13, flexShrink: 0, minWidth: 40, minHeight: 36 }}>
          {saving ? <Spinner size={14} /> : <Icon name="save" size={16} />}
        </Btn>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>{min}</span>
        <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>{max}</span>
      </div>
    </div>
  );
}

// ─── DISCORD ICON ─────────────────────────────────────────────────────────────
function DiscordIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview",  label: "Overview",         icon: "dashboard" },
  { id: "config",    label: "Server Config",     icon: "tune" },
  { id: "channels",  label: "Channels",          icon: "tag" },
  { id: "upload",    label: "Knowledge Base",    icon: "database" },
  { id: "crawler",   label: "URL Crawler",       icon: "travel_explore" },
];

function Sidebar({ tab, onTab, guilds, activeGuild, user, onLogout }) {
  return (
    <aside style={{
      width: 240, flexShrink: 0, background: "var(--surface-low)",
      borderRight: "1px solid rgba(199,196,215,0.2)",
      display: "flex", flexDirection: "column", height: "100vh",
      padding: 16, gap: 4,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px 20px" }}>
        <div style={{
          width: 38, height: 38, borderRadius: "var(--r-md)", background: "var(--primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="hub" size={20} fill style={{ color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--on-surface)" }}>WalluBot</div>
          <div style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>AI Workspace</div>
        </div>
      </div>

      {/* Active server chip */}
      {activeGuild && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
          background: "var(--surface-container)", borderRadius: "var(--r-md)",
          border: "1px solid var(--outline-variant)", marginBottom: 8, cursor: "pointer",
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, background: "var(--primary-container)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name="dns" size={14} fill style={{ color: "var(--on-primary-container)" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surface)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeGuild.name}</span>
          <Icon name="unfold_more" size={16} style={{ color: "var(--on-surface-variant)", flexShrink: 0 }} />
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map(n => (
          <button key={n.id} className={`nav-item${tab === n.id ? " active" : ""}`} onClick={() => onTab(n.id)}>
            <Icon name={n.icon} size={20} style={{ color: tab === n.id ? "var(--primary)" : "var(--on-surface-variant)" }} />
            {n.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ paddingTop: 12, borderTop: "1px solid rgba(199,196,215,0.2)" }}>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>{(user.username || "U").slice(0,1).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surface)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.username || "Admin"}</div>
              <div style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>Admin</div>
            </div>
          </div>
        )}
        <button className="nav-item" onClick={onLogout} style={{ color: "var(--error)", width: "100%" }}>
          <Icon name="logout" size={18} style={{ color: "var(--error)" }} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "psychology", title: "Hybrid RAG Retrieval", desc: "Combines FAISS vector search with BM25 keyword retrieval for precise, grounded answers every time." },
  { icon: "description", title: "PDF & URL Ingestion", desc: "Upload PDFs or paste website URLs — content gets chunked, embedded, and stored in your vector store automatically." },
  { icon: "travel_explore", title: "Web Crawler", desc: "Discover all sub-pages of any website, select which ones to ingest, and bulk-import entire documentation sites." },
  { icon: "tune", title: "Live Tunable Parameters", desc: "Adjust FAISS-K, BM25-K, temperature, chunk size, chunk overlap, and max tokens — all with live sliders." },
  { icon: "tag", title: "Channel Control", desc: "Whitelist exactly which Discord channels the bot listens in and set a dedicated mod/log channel." },
  { icon: "insights", title: "Analytics Dashboard", desc: "Track total queries, ingested documents, and bot activity across all registered servers." },
  { icon: "table_view", title: "Structured Data (XLSX)", desc: "Upload Excel sheets for contacts, faculty data, and structured records alongside documents." },
  { icon: "lock", title: "Discord OAuth Login", desc: "Secure admin access via Discord OAuth. Only verified server admins can configure and manage." },
  { icon: "edit_note", title: "System Prompt Editor", desc: "Customize the bot's persona with a full system prompt editor — make it truly yours." },
];

function LandingPage({ user, onLogin, onShowDashboard }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64,
        background: "rgba(255,248,245,0.85)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(199,196,215,0.3)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="hub" fill size={20} style={{ color: "#fff" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, color: "var(--on-surface)" }}>WalluBot</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user ? (
            <Btn onClick={onShowDashboard}>
              <Icon name="dashboard" size={16} /> Open Dashboard
            </Btn>
          ) : (
            <Btn onClick={onLogin} variant="discord">
              <DiscordIcon /> Login with Discord
            </Btn>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "96px 40px 80px", textAlign: "center", position: "relative", overflow: "hidden", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ position: "absolute", width: 600, height: 600, top: -200, right: -200, background: "rgba(70,72,212,0.05)", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }} className="au">
          <Tag style={{ marginBottom: 24, fontSize: 12 }}>⚡ RAG-Powered Discord AI</Tag>
          <h1 style={{ fontSize: "clamp(36px,6vw,60px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 20, color: "var(--on-surface)" }}>
            Give Your Discord Server<br />
            <span style={{ color: "var(--primary)" }}>an AI Brain</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--on-surface-variant)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
            WalluBot transforms your documents, PDFs, and websites into an intelligent Q&A assistant that lives directly inside your Discord server.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {user ? (
              <Btn onClick={onShowDashboard} style={{ fontSize: 15, padding: "13px 28px" }}>
                <Icon name="dashboard" /> Open Dashboard
              </Btn>
            ) : (
              <>
                <Btn onClick={onLogin} variant="discord" style={{ fontSize: 15, padding: "13px 28px" }}>
                  <DiscordIcon size={20} /> Get Started with Discord
                </Btn>
                <Btn onClick={onShowDashboard} variant="ghost" style={{ fontSize: 14 }}>
                  Preview Dashboard
                </Btn>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "72px 40px", background: "var(--surface-low)", borderTop: "1px solid rgba(199,196,215,0.3)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Tag style={{ marginBottom: 12 }}>Capabilities</Tag>
            <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>Everything Your Bot Can Do</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <Card key={i} style={{ transition: "all var(--tr)", cursor: "default" }}>
                <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--primary-fixed)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon name={f.icon} size={22} style={{ color: "var(--primary)" }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--on-surface)", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "var(--on-surface-variant)", lineHeight: 1.6 }}>{f.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "72px 40px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 14 }}>Ready to get started?</h2>
        <p style={{ fontSize: 15, color: "var(--on-surface-variant)", marginBottom: 32 }}>Login with Discord and configure your server's AI bot in minutes.</p>
        {user ? (
          <Btn onClick={onShowDashboard} style={{ fontSize: 15, padding: "13px 28px" }}><Icon name="dashboard" /> Open Dashboard</Btn>
        ) : (
          <Btn onClick={onLogin} variant="discord" style={{ fontSize: 15, padding: "13px 28px" }}>
            <DiscordIcon size={20} /> Get Started with Discord
          </Btn>
        )}
      </section>

      <footer style={{ padding: "28px 40px", textAlign: "center", color: "var(--on-surface-variant)", fontSize: 12.5, borderTop: "1px solid rgba(199,196,215,0.3)" }}>
        © 2025 WalluBot · Q-ARAG · Built with FastAPI + LangChain · Not affiliated with Discord Inc.
      </footer>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ guilds, discordGuilds, activeGuildId, user, onActivate, onRemove, onAdd, analytics }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addStatus, setAddStatus] = useState(null);
  const [serversWithStatus, setServersWithStatus] = useState([]); // ← NEW
  const [loadingServers, setLoadingServers] = useState(false);    // ← NEW
 
  const availableToAdd = discordGuilds.filter(g => g.owner && !guilds.find(r => r.id === g.id));
 
  // ← NEW: Load servers with config status from DB
  useEffect(() => {
    const loadServersStatus = async () => {
      setLoadingServers(true);
      try {
        const data = await API.listServersWithStatus();
        setServersWithStatus(data.servers || []);
      } catch (e) {
        console.error("Failed to load server status:", e);
      }
      setLoadingServers(false);
    };
    
    if (guilds.length > 0) {
      loadServersStatus();
    }
  }, [guilds.length]);
 
  const handleAdd = async () => {
    if (!selectedGuild) { setAddStatus({ ok: false, msg: "Please select a server" }); return; }
    if (guilds.find(g => g.id === selectedGuild.id)) { setAddStatus({ ok: false, msg: "Server already registered" }); return; }
    setAdding(true);
    try {
      await API.addServer(selectedGuild.id, selectedGuild.name);
      onAdd({ id: selectedGuild.id, name: selectedGuild.name, icon: selectedGuild.icon });
      setAddStatus({ ok: true, msg: "Server registered successfully" });
      setTimeout(() => { setShowAdd(false); setAddStatus(null); setSelectedGuild(null); }, 900);
    } catch (e) { setAddStatus({ ok: false, msg: e.message }); }
    setAdding(false);
  };
 
  const stats = [
    { n: guilds.length, label: "Registered Servers", icon: "dns", color: "var(--primary)", bg: "var(--primary-fixed)" },
    { n: analytics?.total_queries ?? "—", label: "Total Queries", icon: "forum", color: "#166534", bg: "rgba(34,197,94,0.1)" },
    { n: analytics?.total_uploads ?? "—", label: "Documents Ingested", icon: "storage", color: "var(--tertiary)", bg: "var(--surface-container)" },
  ];
 
  // ← NEW: Function to get config status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "configured":
        return { bg: "rgba(34,197,94,0.1)", color: "#166534", label: "Configured" };
      case "partial":
        return { bg: "rgba(234,179,8,0.1)", color: "#854d0e", label: "Partial" };
      case "unconfigured":
        return { bg: "var(--error-container)", color: "var(--error)", label: "Unconfigured" };
      default:
        return { bg: "var(--surface-container)", color: "var(--on-surface-variant)", label: "Unknown" };
    }
  };
 
  return (
    <div>
      <SectionHeader label="Dashboard" title="Overview" subtitle="Your bot's current status and quick stats." />
 
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} fill size={20} style={{ color: s.color }} />
              </div>
              <OnlineDot />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--on-surface)", letterSpacing: "-0.02em", marginBottom: 4 }}>{s.n}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
          </Card>
        ))}
      </div>
 
      {/* Servers with Config Status - ← NEW ← */}
      <Card pad="0" style={{ marginBottom: 20, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(199,196,215,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Registered Servers</span>
          <Btn onClick={() => setShowAdd(v => !v)} variant="ghost" style={{ padding: "7px 14px", fontSize: 13, minHeight: 36 }}>
            {showAdd ? <><Icon name="close" size={15} /> Cancel</> : <><Icon name="add" size={15} /> Add Server</>}
          </Btn>
        </div>
 
        {loadingServers ? (
          <div style={{ padding: "40px 20px", textAlign: "center", display: "flex", gap: 8, alignItems: "center", justifyContent: "center", color: "var(--on-surface-variant)" }}>
            <Spinner size={16} /> Loading server status…
          </div>
        ) : serversWithStatus.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--on-surface-variant)" }}>
            <Icon name="dns" size={40} style={{ opacity: .3, display: "block", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14 }}>No servers yet. Add one to get started.</div>
          </div>
        ) : (
          // ← UPDATED: Show server list from DB with config status
          serversWithStatus.map(server => {
            const statusStyle = getStatusColor(server.config_status);
            return (
              <div key={server.guild_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", borderBottom: "1px solid rgba(199,196,215,0.1)" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--primary-fixed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "var(--primary)", flexShrink: 0,
                }}>{server.name.slice(0, 2).toUpperCase()}</div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{server.name}</span>
                    {server.guild_id === activeGuildId && <Tag variant="success">Active</Tag>}
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "var(--on-surface-variant)", fontFamily: "monospace" }}>{server.guild_id}</span>
                    
                    {/* Config Status Badge - ← NEW */}
                    <Tag variant={server.config_status === "configured" ? "success" : server.config_status === "partial" ? "warn" : "neutral"}
                      style={{ 
                        background: statusStyle.bg, 
                        color: statusStyle.color,
                        fontSize: 10,
                        padding: "2px 8px"
                      }}>
                      {statusStyle.label}
                    </Tag>
                    
                    {/* Config Summary - ← NEW */}
                    <span style={{ fontSize: 10, color: "var(--on-surface-variant)" }}>
                      {server.channel_count} channel{server.channel_count !== 1 ? 's' : ''} 
                      {server.has_custom_prompt && ' • Prompt set'}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {server.guild_id !== activeGuildId && (
                    <Btn onClick={() => onActivate(server.guild_id)} variant="ghost" style={{ padding: "6px 12px", fontSize: 13, minHeight: 34 }}>
                      Activate
                    </Btn>
                  )}
                  <Btn onClick={() => onRemove(server.guild_id)} variant="danger" style={{ padding: "6px 10px", fontSize: 13, minHeight: 34 }}>
                    <Icon name="delete" size={15} />
                  </Btn>
                </div>
              </div>
            );
          })
        )}
 
        {showAdd && (
          <div style={{ padding: "20px", borderTop: "1px solid rgba(199,196,215,0.2)", background: "var(--surface-low)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Register New Server</div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Your Discord Server</label>
            <select className="kb-input" value={selectedGuild?.id || ""} onChange={e => setSelectedGuild(discordGuilds.find(g => g.id === e.target.value) || null)} style={{ marginBottom: 14 }}>
              <option value="">— choose a server —</option>
              {availableToAdd.length === 0 ? <option disabled>No new servers to add</option> : availableToAdd.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {addStatus && <div style={{ marginBottom: 12 }}><StatusBadge {...addStatus} /></div>}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={handleAdd} disabled={adding} style={{ flex: 1, justifyContent: "center" }}>
                {adding ? <><Spinner size={14} /> Registering…</> : <><Icon name="add" size={16} /> Add Server</>}
              </Btn>
              <Btn onClick={() => { setShowAdd(false); setAddStatus(null); }} variant="ghost">Cancel</Btn>
            </div>
          </div>
        )}
      </Card>
 
      {/* Quick start */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick Start Guide</div>
        {[
          ["Register your Discord server", "Click Add Server above and select your Discord server."],
          ["Configure RAG parameters", "Go to Server Config tab, select your server, and tune the sliders."],
          ["Upload your knowledge base", "Use the Knowledge Base tab to ingest PDFs, URLs, or XLSX files."],
          ["Set allowed channels", "Go to Channels tab and whitelist channels + set a mod channel."],
        ].map(([title, desc], i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < 3 ? "1px solid rgba(199,196,215,0.2)" : "none" }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, background: "var(--primary-fixed)",
              color: "var(--primary)", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--on-surface)", marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 12.5, color: "var(--on-surface-variant)", lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── SERVER CONFIG TAB ────────────────────────────────────────────────────────
const SLIDER_DEFS = [
  { field: "faiss_k",       label: "FAISS-K (vector results)",  min: 1,   max: 20,   step: 1,    api: "updateFaissK" },
  { field: "bm25_k",        label: "BM25-K (keyword results)",  min: 1,   max: 20,   step: 1,    api: "updateBm25K" },
  { field: "temperature",   label: "Temperature",               min: 0,   max: 1,    step: 0.05, api: "updateTemp" },
  { field: "max_tokens",    label: "Max Tokens",                min: 128, max: 4096, step: 64,   api: "updateMaxToken" },
  { field: "chunk_size",    label: "Chunk Size",                min: 100, max: 999,  step: 1,    api: "updateChunkSize" },
  { field: "chunk_overlap", label: "Chunk Overlap",             min: 100, max: 1000, step: 1,    api: "updateChunkOverlap" },
];

function ServerConfigTab({ guilds }) {
  const [selectedGuildId, setSelectedGuildId] = useState("");
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [prompt, setPrompt] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const PARAMETER_HINTS = {
    faiss_k: "Higher values increase retrieval diversity and context coverage, but can slightly increase latency and embedding costs.",
    bm25_k: "Controls how many keyword-matched chunks are considered. Higher values improve recall but may introduce noise.",
    temperature: "Higher temperature makes responses more creative and varied, while lower values keep answers more factual and consistent.",
    max_tokens: "Maximum number of tokens the model can generate in a single response. Higher values allow longer answers.",
    chunk_size: "Larger chunks preserve more context but increase token usage. Smaller chunks improve precision but may lose surrounding information.",
    chunk_overlap: "Overlap helps preserve continuity between chunks, improving retrieval quality at the cost of additional storage and embeddings.",
  };

  const loadConfig = async (gid) => {
    if (!gid) { setConfig(null); return; }
    setLoading(true); setStatus(null);
    try { const d = await API.getConfig(gid); setConfig(d); setPrompt(d.system_prompt || ""); }
    catch (e) { setStatus({ ok: false, msg: e.message }); setConfig(null); }
    setLoading(false);
  };

  const saveSlider = async (field, apiMethod, value) => {
    setSaving(s => ({ ...s, [field]: true })); setStatus(null);
    try { await API[apiMethod](selectedGuildId, value); setStatus({ ok: true, msg: `${field} saved successfully` }); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setSaving(s => ({ ...s, [field]: false }));
  };

  const savePrompt = async () => {
    setPromptSaving(true); setStatus(null);
    try { await API.updateSystemPrompt(selectedGuildId, prompt); setStatus({ ok: true, msg: "System prompt saved" }); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setPromptSaving(false);
  };

  return (
    <div>
      <SectionHeader label="Configuration" title="Server Config" subtitle="Select a server then tune all RAG parameters with live sliders." />

      {/* Server selector */}
      <Card style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Select Server</label>
        <select className="kb-input" value={selectedGuildId} onChange={e => { setSelectedGuildId(e.target.value); loadConfig(e.target.value); }}>
          <option value="">— choose a server —</option>
          {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </Card>

      {loading && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "20px 0", color: "var(--on-surface-variant)" }}>
          <Spinner /> Loading configuration…
        </div>
      )}

      {!loading && !selectedGuildId && (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--on-surface-variant)" }}>
          <Icon name="tune" size={48} style={{ opacity: .25, display: "block", margin: "0 auto 16px" }} />
          <div style={{ fontSize: 14 }}>Select a server above to configure its settings.</div>
        </div>
      )}

      {!loading && config && (
        /*
         * NEW TWO-COLUMN LAYOUT
         * Left  → Retrieval Parameters (sliders + hover hint)
         * Right → Server Info (top) + System Prompt (below)
         */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>

          {/* ── LEFT COLUMN: Retrieval Parameters ── */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <Icon name="tune" size={18} style={{ color: "var(--primary)" }} /> Retrieval Parameters
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {SLIDER_DEFS.map(s => (
                <div key={s.field}>
                  {/* Label row */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surface)", marginBottom: 2 }}>{s.label}</div>
                  {/* Inline hint — small muted text directly under the label */}
                  <div style={{ fontSize: 11, color: "var(--on-surface-variant)", lineHeight: 1.5, opacity: 0.75, marginBottom: 8 }}>
                    {PARAMETER_HINTS[s.field]}
                  </div>
                  <Slider
                    value={config[s.field] ?? Math.round((s.min + s.max) / 2)}
                    min={s.min} max={s.max} step={s.step}
                    onChange={v => setConfig(c => ({ ...c, [s.field]: v }))}
                    onSave={() => saveSlider(s.field, s.api, config[s.field])}
                    saving={saving[s.field]}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* ── RIGHT COLUMN: Server Info + System Prompt stacked ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Server Info */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="dns" size={18} style={{ color: "var(--primary)" }} /> Server Info
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Name",    config.name],
                  ["Guild ID", config.guild_id],
                  ["Added",   config.added_at   ? new Date(config.added_at).toLocaleString()   : "—"],
                  ["Updated", config.updated_at ? new Date(config.updated_at).toLocaleString() : "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "var(--surface-low)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--on-surface-variant)", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--on-surface)", wordBreak: "break-all" }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* System Prompt */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Icon name="edit_note" size={18} style={{ color: "var(--primary)" }} /> System Prompt
              </div>
              <textarea
                className="kb-input kb-mono"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={6}
                placeholder="You are a helpful assistant for this Discord server…"
                style={{ resize: "vertical", lineHeight: 1.6, fontFamily: "monospace", fontSize: 13 }}
              />
              {config.updated_at && (
                <div style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="schedule" size={14} /> Last updated: {new Date(config.updated_at).toLocaleString()}
                </div>
              )}
              <Btn onClick={savePrompt} disabled={promptSaving} style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>
                {promptSaving ? <><Spinner size={14} /> Saving…</> : <><Icon name="save" size={16} /> Save System Prompt</>}
              </Btn>
            </Card>

            {status && <StatusBadge {...status} />}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── CHANNELS TAB ─────────────────────────────────────────────────────────────
function ChannelsTab({ guilds }) {
  const [gid, setGid] = useState("");
  const [channels, setChannels] = useState([]);
  const [modChannel, setModChannel] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [discordChannels, setDiscordChannels] = useState([]);
  const [newChanId, setNewChanId] = useState("");
  const [newModId, setNewModId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (id) => {
    if (!id) { setLoaded(false); return; }
    setLoading(true);
    try {
      const [d, dc] = await Promise.allSettled([API.listChannels(id), API.getGuildChannels(id)]);
      if (d.status === "fulfilled") { setChannels(d.value.channel_ids || []); setModChannel(d.value.mod_channel || null); setLoaded(true); }
      if (dc.status === "fulfilled") setDiscordChannels(dc.value.channels || []);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setLoading(false);
  };

  const chanName = (id) => { const f = discordChannels.find(c => c.id === id); return f ? `#${f.name}` : id; };

  const addChan = async () => {
    if (!gid || !newChanId.trim()) return;
    try { await API.addChannel(gid, newChanId.trim()); setStatus({ ok: true, msg: "Channel added" }); setNewChanId(""); load(gid); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const removeChan = async (cid) => {
    try { await API.deleteChannel(gid, cid); setStatus({ ok: true, msg: "Channel removed" }); load(gid); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const setMod = async () => {
    if (!gid || !newModId.trim()) return;
    try { await API.addModChannel(gid, newModId.trim()); setStatus({ ok: true, msg: "Mod channel set" }); setNewModId(""); load(gid); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  return (
    <div>
      <SectionHeader label="Bot Configuration" title="Channel Management" subtitle="Control which Discord channels the bot responds in." />

      <Card style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Server</label>
        <select className="kb-input" value={gid} onChange={e => { setGid(e.target.value); setLoaded(false); setStatus(null); setDiscordChannels([]); load(e.target.value); }}>
          <option value="">— choose a server —</option>
          {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </Card>

      {loading && <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", color: "var(--on-surface-variant)" }}><Spinner /> Loading channels…</div>}

      {!loading && !gid && (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--on-surface-variant)" }}>
          <Icon name="tag" size={48} style={{ opacity: .25, display: "block", margin: "0 auto 16px" }} />
          <div style={{ fontSize: 14 }}>Select a server to manage its channels.</div>
        </div>
      )}

      {!loading && loaded && (
        <>
          <Card pad="0" style={{ marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(199,196,215,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Active Bot Channels</span>
              <Tag>{channels.length}</Tag>
            </div>
            {channels.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--on-surface-variant)", fontSize: 13.5 }}>No channels configured yet.</div>
            ) : channels.map(ch => (
              <div key={ch} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid rgba(199,196,215,0.1)" }}>
                <Icon name="tag" size={16} style={{ color: "var(--primary)", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{chanName(ch)}</span>
                <Btn onClick={() => removeChan(ch)} variant="danger" style={{ padding: "5px 10px", fontSize: 12, minHeight: 32 }}>
                  <Icon name="remove" size={14} /> Remove
                </Btn>
              </div>
            ))}
            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(199,196,215,0.15)", display: "flex", gap: 10 }}>
              {discordChannels.length > 0 ? (
                <select className="kb-input" value={newChanId} onChange={e => setNewChanId(e.target.value)} style={{ flex: 1, height: 40 }}>
                  <option value="">— select a channel —</option>
                  {discordChannels.filter(c => !channels.includes(c.id)).map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              ) : (
                <input className="kb-input" value={newChanId} onChange={e => setNewChanId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addChan()} placeholder="Channel ID" style={{ flex: 1, height: 40 }} />
              )}
              <Btn onClick={addChan} variant="outline" style={{ flexShrink: 0, minHeight: 40 }}>
                <Icon name="add" size={16} /> Add
              </Btn>
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Icon name="shield" size={18} style={{ color: "var(--primary)" }} /> Mod / Log Channel
            </div>
            {modChannel && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 14, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: "var(--r-md)" }}>
                <Icon name="tag" size={16} style={{ color: "#854d0e" }} />
                <span style={{ fontSize: 13.5, color: "#854d0e", fontWeight: 500, flex: 1 }}>{chanName(modChannel)}</span>
                <Tag variant="warn">Active</Tag>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              {discordChannels.length > 0 ? (
                <select className="kb-input" value={newModId} onChange={e => setNewModId(e.target.value)} style={{ flex: 1, height: 40 }}>
                  <option value="">— select mod channel —</option>
                  {discordChannels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              ) : (
                <input className="kb-input" value={newModId} onChange={e => setNewModId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setMod()} placeholder="Mod channel ID" style={{ flex: 1, height: 40 }} />
              )}
              <Btn onClick={setMod} variant="outline" style={{ flexShrink: 0, minHeight: 40 }}>Set</Btn>
            </div>
          </Card>

          {status && <StatusBadge {...status} />}
        </>
      )}
    </div>
  );
}

// ─── UPLOAD TAB ───────────────────────────────────────────────────────────────
function UploadTab({ guilds }) {
  const [gid, setGid] = useState("");
  const [urls, setUrls] = useState("");
  const [pdfFiles, setPdfFiles] = useState([]);
  const [xlsxFile, setXlsxFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [xlsxUploading, setXlsxUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const pdfRef = useRef(null);
  const xlsxRef = useRef(null);

  const loadUploads = useCallback(async (id) => {
    if (!id) return;
    setLoadingUploads(true);
    try { const d = await API.getAllUploads(id); setUploads(Array.isArray(d) ? d : d.uploads || []); }
    catch (_) {}
    setLoadingUploads(false);
  }, []);

  const doUpload = async () => {
    if (!gid) { setStatus({ ok: false, msg: "Select a server first" }); return; }
    if (!urls.trim() && !pdfFiles.length) { setStatus({ ok: false, msg: "Add URLs or PDFs first" }); return; }
    setUploading(true); setStatus(null);
    try {
      const d = await API.upload(gid, pdfFiles, urls.trim());
      setStatus({ ok: true, msg: `${d.urls_processed || 0} URL(s), ${d.pdfs_processed || 0} PDF(s) ingested successfully` });
      setUrls(""); setPdfFiles([]); loadUploads(gid);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setUploading(false);
  };

  const doXlsxUpload = async () => {
    if (!gid) { setStatus({ ok: false, msg: "Select a server first" }); return; }
    if (!xlsxFile) { setStatus({ ok: false, msg: "No .xlsx file selected" }); return; }
    setXlsxUploading(true); setStatus(null);
    try { const d = await API.uploadContacts(gid, xlsxFile); setStatus({ ok: true, msg: d.message }); setXlsxFile(null); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setXlsxUploading(false);
  };

  return (
    <div>
      <SectionHeader label="Knowledge Base" title="Upload Content" subtitle="Ingest PDFs, URLs, and structured data into your vector store." />

      <Card style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Server</label>
        <select className="kb-input" value={gid} onChange={e => { setGid(e.target.value); setUploads([]); loadUploads(e.target.value); }}>
          <option value="">— choose a server —</option>
          {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </Card>

      {/* URL upload */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--primary-fixed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="language" size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Web URLs</div>
            <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>One per line</div>
          </div>
        </div>
        <textarea className="kb-input kb-mono" value={urls} onChange={e => setUrls(e.target.value)}
          rows={4} placeholder={"https://docs.example.com\nhttps://yoursite.com/about"}
          style={{ resize: "vertical", lineHeight: 1.6, fontFamily: "monospace", fontSize: 13 }} />
      </Card>

      {/* PDF upload */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--primary-fixed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="description" size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>PDF Files</div>
        </div>
        <div className="drop-zone" onClick={() => pdfRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const dropped = [...e.dataTransfer.files].filter(f => f.type === "application/pdf"); setPdfFiles(p => [...p, ...dropped]); }}>
          <Icon name="upload_file" size={36} style={{ color: "var(--primary)", opacity: .6 }} />
          <p style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>Drop PDFs here or <span style={{ color: "var(--primary)", fontWeight: 600 }}>browse</span></p>
        </div>
        <input ref={pdfRef} type="file" accept=".pdf" multiple style={{ display: "none" }} onChange={e => setPdfFiles(p => [...p, ...[...e.target.files]])} />
        {pdfFiles.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {pdfFiles.map((f, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--primary-fixed)", borderRadius: "var(--r-sm)", fontSize: 12, color: "var(--primary)" }}>
                <Icon name="picture_as_pdf" size={13} />
                {f.name.length > 22 ? f.name.slice(0, 19) + "…" : f.name}
                <span onClick={() => setPdfFiles(p => p.filter((_, j) => j !== i))} style={{ cursor: "pointer", opacity: .6, fontWeight: 700 }}>✕</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* XLSX upload */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="table_chart" size={18} style={{ color: "#166534" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Structured Data (.xlsx)</div>
            <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>Contacts / Faculty</div>
          </div>
        </div>
        <div className="drop-zone" onClick={() => xlsxRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = [...e.dataTransfer.files].find(f => f.name.endsWith(".xlsx")); if (f) setXlsxFile(f); }}
          style={{ borderColor: xlsxFile ? "#166534" : undefined, background: xlsxFile ? "rgba(34,197,94,0.05)" : undefined }}>
          <Icon name={xlsxFile ? "check_circle" : "table_chart"} size={36} style={{ color: xlsxFile ? "#166534" : "var(--tertiary)", opacity: .7 }} />
          <p style={{ fontSize: 14, color: xlsxFile ? "#166534" : "var(--on-surface-variant)", fontWeight: xlsxFile ? 600 : 400 }}>
            {xlsxFile ? xlsxFile.name : <>Drop <strong>.xlsx</strong> or browse</>}
          </p>
        </div>
        <input ref={xlsxRef} type="file" accept=".xlsx" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) setXlsxFile(e.target.files[0]); }} />
      </Card>

      {status && <div style={{ marginBottom: 14 }}><StatusBadge {...status} /></div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <Btn onClick={doUpload} disabled={uploading} style={{ flex: 2, justifyContent: "center" }}>
          {uploading ? <><Spinner size={14} /> Ingesting…</> : <><Icon name="cloud_upload" size={16} /> Upload to Vector Store</>}
        </Btn>
        <Btn onClick={doXlsxUpload} disabled={xlsxUploading} variant="success" style={{ flex: 1, justifyContent: "center" }}>
          {xlsxUploading ? <><Spinner size={14} /> Uploading…</> : <><Icon name="table_chart" size={16} /> Upload .xlsx</>}
        </Btn>
      </div>

      {/* Uploads list */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Ingested Sources</span>
          <Btn onClick={() => loadUploads(gid)} disabled={loadingUploads} variant="ghost" style={{ padding: "6px 12px", fontSize: 13, minHeight: 34 }}>
            {loadingUploads ? <Spinner size={13} /> : <><Icon name="refresh" size={15} /> Refresh</>}
          </Btn>
        </div>
        <Card pad="0" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead><tr><th>Source</th><th>Type</th><th>Date</th></tr></thead>
            <tbody>
              {uploads.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "28px" }}>
                  {gid ? "No uploads yet" : "Select a server to view uploads"}
                </td></tr>
              ) : uploads.map((u, i) => (
                <tr key={i}>
                  <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--on-surface)" }}>{u.url || u.filename || u.source || "—"}</span>
                  </td>
                  <td><Tag variant="neutral">{u.type || "url"}</Tag></td>
                  <td style={{ color: "var(--on-surface-variant)", fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ─── CRAWLER TAB ──────────────────────────────────────────────────────────────
function CrawlerTab({ guilds }) {
  const [gid, setGid] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [allUrls, setAllUrls] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [hasResult, setHasResult] = useState(false);

  const doCrawl = async () => {
    if (!baseUrl.trim()) return;
    setCrawling(true); setStatus(null); setSelected(new Set()); setHasResult(false);
    try {
      const d = await API.getSubUrls(baseUrl.trim());
      if (d.error) throw new Error(d.error);
      setAllUrls(d.sub_urls || []); setHasResult(true);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setCrawling(false);
  };

  const filtered = filter ? allUrls.filter(u => u.toLowerCase().includes(filter.toLowerCase())) : allUrls;
  const toggle = (u) => setSelected(s => { const n = new Set(s); n.has(u) ? n.delete(u) : n.add(u); return n; });

  const ingest = async () => {
    if (!gid) { setStatus({ ok: false, msg: "Select a server first" }); return; }
    if (!selected.size) return;
    setIngesting(true); setStatus(null);
    try {
      const d = await API.upload(gid, [], [...selected].join("\n"));
      setStatus({ ok: true, msg: `${d.urls_processed || selected.size} URL(s) ingested` });
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setIngesting(false);
  };

  return (
    <div>
      <SectionHeader label="Discovery" title="URL Crawler" subtitle="Discover all linked pages of any site, select what to ingest, and bulk-import." />

      <Card style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Server</label>
        <select className="kb-input" value={gid} onChange={e => setGid(e.target.value)} style={{ marginBottom: 16 }}>
          <option value="">— choose a server —</option>
          {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Base URL to Crawl</label>
        <div style={{ display: "flex", gap: 12 }}>
          <input className="kb-input" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doCrawl()}
            placeholder="https://docs.example.com" style={{ flex: 1, fontFamily: "monospace", fontSize: 13 }} />
          <Btn onClick={doCrawl} disabled={crawling || !baseUrl.trim()} style={{ flexShrink: 0 }}>
            {crawling ? <><Spinner size={14} /> Scanning…</> : <><Icon name="travel_explore" size={16} /> Discover</>}
          </Btn>
        </div>
      </Card>

      {hasResult && (
        <Card pad="0" style={{ marginBottom: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(199,196,215,0.2)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Tag>{allUrls.length} URLs found</Tag>
            {selected.size > 0 && <Tag variant="success">{selected.size} selected</Tag>}
            <input className="kb-input" value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Filter URLs…" style={{ flex: 1, minWidth: 140, height: 34, padding: "5px 12px", fontSize: 13 }} />
            <Btn onClick={() => setSelected(new Set(filtered))} variant="ghost" style={{ padding: "5px 12px", fontSize: 13, minHeight: 34 }}>All</Btn>
            <Btn onClick={() => setSelected(new Set())} variant="ghost" style={{ padding: "5px 12px", fontSize: 13, minHeight: 34 }}>Clear</Btn>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {filtered.map((u, i) => {
              const sel = selected.has(u);
              return (
                <div key={i} onClick={() => toggle(u)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                  borderBottom: "1px solid rgba(199,196,215,0.08)", cursor: "pointer",
                  background: sel ? "rgba(70,72,212,0.04)" : "transparent", transition: "background var(--tr)",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${sel ? "var(--primary)" : "var(--outline-variant)"}`,
                    background: sel ? "var(--primary)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 11, fontWeight: 700, transition: "all var(--tr)",
                  }}>{sel ? "✓" : ""}</div>
                  <span style={{ fontSize: 12, color: "var(--on-surface-variant)", fontFamily: "monospace", wordBreak: "break-all", flex: 1, lineHeight: 1.5 }}>{u}</span>
                  <a href={u} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ color: "var(--on-surface-variant)", fontSize: 11, flexShrink: 0 }}>↗</a>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(199,196,215,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--on-surface-variant)" }}>
              {selected.size > 0 ? `${selected.size} URL${selected.size > 1 ? "s" : ""} queued` : "Select URLs to ingest"}
            </span>
            <Btn onClick={ingest} disabled={ingesting || !selected.size} style={{ minHeight: 36, padding: "8px 16px" }}>
              {ingesting ? <><Spinner size={14} /> Ingesting…</> : `Ingest (${selected.size})`}
            </Btn>
          </div>
        </Card>
      )}

      {status && <StatusBadge {...status} />}
    </div>
  );
}

// ─── CHAT WIDGET ──────────────────────────────────────────────────────────────
function ChatWidget({ guildId, guildName }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", text: `Hi! Ask me anything about ${guildName || "the knowledge base"}.` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const d = await API.query(q, guildId);
      setMessages(m => [...m, { role: "bot", text: d.answer || d.response || JSON.stringify(d) }]);
    } catch (e) {
      setMessages(m => [...m, { role: "bot", text: "Error: " + e.message, error: true }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Widget */}
      <div style={{
        position: "fixed", bottom: 88, right: 24, width: 380, height: 520,
        background: "var(--surface-lowest)", border: "1px solid rgba(199,196,215,0.4)",
        borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-md)", zIndex: 200,
        display: "flex", flexDirection: "column", overflow: "hidden",
        transform: open ? "scale(1) translateY(0)" : "scale(0.92) translateY(16px)",
        opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none",
        transition: "transform .3s cubic-bezier(0.16,1,0.3,1), opacity .2s ease",
        transformOrigin: "bottom right",
      }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(199,196,215,0.2)", display: "flex", alignItems: "center", gap: 10, background: "var(--surface-low)", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="hub" fill size={16} style={{ color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--on-surface)" }}>{guildName || "WalluBot"}</div>
            <div style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>RAG Assistant</div>
          </div>
          <OnlineDot />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "var(--primary)", borderRadius: "12px 4px 12px 12px", padding: "9px 14px", fontSize: 13.5, color: "#fff", maxWidth: 260, lineHeight: 1.5 }}>{msg.text}</div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--primary-fixed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="hub" size={14} style={{ color: "var(--primary)" }} />
                  </div>
                  <div style={{
                    background: msg.error ? "var(--error-container)" : "var(--surface-container)",
                    border: `1px solid ${msg.error ? "rgba(186,26,26,0.2)" : "rgba(199,196,215,0.3)"}`,
                    borderRadius: "4px 12px 12px 12px", padding: "10px 14px", fontSize: 13.5,
                    color: msg.error ? "var(--error)" : "var(--on-surface-variant)", maxWidth: 280, lineHeight: 1.6,
                  }}>{msg.text}</div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--primary-fixed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="hub" size={14} style={{ color: "var(--primary)" }} />
              </div>
              <div style={{ background: "var(--surface-container)", border: "1px solid rgba(199,196,215,0.3)", borderRadius: "4px 12px 12px 12px", padding: "12px 14px", display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "10px 12px 14px", borderTop: "1px solid rgba(199,196,215,0.2)", background: "var(--surface-low)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "var(--surface-lowest)", border: "1.5px solid var(--outline-variant)", borderRadius: "var(--r-md)", padding: "8px 8px 8px 14px", transition: "border-color var(--tr)", }}>
            <textarea ref={inputRef} value={input}
              onChange={e => { setInput(e.target.value); const el = e.target; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 80) + "px"; }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask a question…" rows={1} disabled={loading}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--on-surface)", fontSize: 14, lineHeight: 1.5, resize: "none", fontFamily: "'Inter',sans-serif", minHeight: 22, maxHeight: 80 }} />
            <button onClick={send} disabled={loading || !input.trim()} style={{
              width: 32, height: 32, borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
              background: input.trim() && !loading ? "var(--primary)" : "var(--surface-container)",
              color: input.trim() && !loading ? "#fff" : "var(--on-surface-variant)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all var(--tr)",
            }}>
              {loading ? <Spinner size={14} color="#fff" /> : <Icon name="send" size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 210,
        width: 54, height: 54, borderRadius: "50%",
        background: open ? "var(--surface-lowest)" : "var(--primary)",
        border: `1.5px solid ${open ? "rgba(199,196,215,0.4)" : "transparent"}`,
        cursor: "pointer",
        boxShadow: open ? "var(--shadow-sm)" : "0 8px 28px rgba(70,72,212,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .2s",
      }}>
        <Icon name={open ? "close" : "chat"} size={22} style={{ color: open ? "var(--on-surface)" : "#fff" }} />
      </button>
    </>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, guilds, discordGuilds, onGuildsChange, onLogout }) {
  const [tab, setTab] = useState("overview");
  const [activeGuildId, setActiveGuildId] = useState(LS.str("wb_active_guild") || guilds[0]?.id || null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (activeGuildId) API.getAnalytics(activeGuildId).then(setAnalytics).catch(() => {});
  }, [activeGuildId]);

  const handleActivate = (id) => { setActiveGuildId(id); LS.strSet("wb_active_guild", id); };
  const handleAdd = (g) => {
    const updated = [...guilds, g];
    onGuildsChange(updated);
    if (!activeGuildId) { setActiveGuildId(g.id); LS.strSet("wb_active_guild", g.id); }
  };
  const handleRemove = (id) => {
    const updated = guilds.filter(g => g.id !== id);
    onGuildsChange(updated);
    if (activeGuildId === id) { const next = updated[0]?.id || null; setActiveGuildId(next); LS.strSet("wb_active_guild", next || ""); }
  };

  const activeGuild = guilds.find(g => g.id === activeGuildId) || guilds[0];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar tab={tab} onTab={setTab} guilds={guilds} activeGuild={activeGuild} user={user} onLogout={onLogout} />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{
          height: 60, borderBottom: "1px solid rgba(199,196,215,0.25)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", background: "rgba(255,248,245,0.8)", backdropFilter: "blur(12px)",
          flexShrink: 0, zIndex: 10,
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--on-surface)" }}>
            {NAV_ITEMS.find(n => n.id === tab)?.label || "Overview"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>Server Status:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: "var(--r-full)", background: "rgba(34,197,94,0.1)", color: "#166534", fontSize: 11, fontWeight: 700 }}>
                <OnlineDot /> Active
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
          <div style={{ maxWidth: 760 }}>
            {tab === "overview"  && <OverviewTab guilds={guilds} discordGuilds={discordGuilds} activeGuildId={activeGuildId} user={user} analytics={analytics} onActivate={handleActivate} onRemove={handleRemove} onAdd={handleAdd} />}
            {tab === "config"    && <ServerConfigTab guilds={guilds} />}
            {tab === "channels"  && <ChannelsTab guilds={guilds} />}
            {tab === "upload"    && <UploadTab guilds={guilds} />}
            {tab === "crawler"   && <CrawlerTab guilds={guilds} />}
          </div>
        </div>
      </div>

      <ChatWidget guildId={activeGuild?.id} guildName={activeGuild?.name} />
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("landing");
  const [user, setUser] = useState(LS.get("wb_user", null));
  const [guilds, setGuilds] = useState(LS.get("wb_guilds", []));
  const [discordGuilds, setDiscordGuilds] = useState([]);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hashToken = hash.startsWith("#token=") ? hash.slice(7) : hash.startsWith("#access_token=") ? hash.slice(14) : null;
    const token = hashToken || params.get("token") || params.get("access_token");

    (async () => {
      if (token) {
        window.history.replaceState(null, "", window.location.pathname);
        setToken(token);
        try {
          const u = await API.getMe();
          setUser(u); LS.set("wb_user", u);
          try { const { guilds: dg } = await API.getGuilds(); setDiscordGuilds(dg || []); } catch (_) {}
          setView("dashboard");
        } catch (_) {
          setUser({ username: "Discord User", discord_id: "unknown" });
          setView("dashboard");
        }
        setBooting(false); return;
      }
      const storedToken = getToken();
      if (storedToken && !user) {
        try {
          const u = await API.getMe();
          setUser(u); LS.set("wb_user", u);
          try { const { guilds: dg } = await API.getGuilds(); setDiscordGuilds(dg || []); } catch (_) {}
        } catch (_) { setToken(null); LS.rm("wb_user"); }
      }
      setBooting(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuildsChange = (updated) => { setGuilds(updated); LS.set("wb_guilds", updated); };

  const handleLogout = async () => {
    try { await API.logout(); } catch (_) {}
    setToken(null); LS.rm("wb_user"); LS.rm("wb_guilds"); LS.rm("wb_active_guild");
    setUser(null); setGuilds([]); setView("landing");
  };

  const discordLogin = () => { window.location.href = `${API_BASE}/auth/discord`; };

  if (booting) {
    return (
      <>
        <GlobalStyles />
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: "var(--r-lg)", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="hub" fill size={28} style={{ color: "#fff" }} />
            </div>
            <div style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>Loading WalluBot…</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      {view === "landing" ? (
        <LandingPage user={user} onLogin={discordLogin} onShowDashboard={() => setView("dashboard")} />
      ) : (
        <Dashboard user={user} guilds={guilds} discordGuilds={discordGuilds} onGuildsChange={handleGuildsChange} onLogout={handleLogout} />
      )}
    </>
  );
}