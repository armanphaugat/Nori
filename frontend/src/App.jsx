import { useState, useEffect, useRef, useCallback } from "react";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { min-height: 100%; }
  body {
    font-family: 'DM Sans', sans-serif;
    background: #f5f0eb;
    color: #0f0f0f;
    -webkit-font-smoothing: antialiased;
  }

  :root {
    --bg: #f5f0eb;
    --bg-s: #ede8e1;
    --bg-e: #e4ddd4;
    --bg-o: #d9d0c5;
    --border: rgba(15,15,15,0.10);
    --border-a: rgba(15,15,15,0.22);
    --border-focus: rgba(196,30,30,0.50);
    --text: #0f0f0f;
    --text-s: rgba(15,15,15,0.62);
    --text-m: rgba(15,15,15,0.38);
    --accent: #c41e1e;
    --accent-l: rgba(196,30,30,0.08);
    --accent-g: rgba(196,30,30,0.18);
    --accent-h: #a01515;
    --success: #1a7a4a;
    --success-bg: rgba(26,122,74,0.08);
    --danger: #c41e1e;
    --danger-bg: rgba(196,30,30,0.08);
    --warning: #b35c00;
    --warning-bg: rgba(179,92,0,0.08);
    --discord: #5865f2;
    --r-xs: 4px; --r-sm: 8px; --r-md: 12px; --r-lg: 18px; --r-xl: 24px; --r-full: 999px;
    --tr: 0.18s cubic-bezier(0.4,0,0.2,1);
  }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes spin     { to { transform:rotate(360deg) } }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .au  { animation: fadeUp .5s cubic-bezier(0.16,1,0.3,1) both; }
  .ai  { animation: fadeIn .3s ease both; }
  .d1{animation-delay:.06s} .d2{animation-delay:.12s} .d3{animation-delay:.18s}
  .d4{animation-delay:.24s} .d5{animation-delay:.30s} .d6{animation-delay:.36s}

  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(15,15,15,0.15); border-radius:99px; }

  .field {
    width:100%; background:var(--bg); border:1.5px solid var(--border);
    color:var(--text); border-radius:var(--r-sm); padding:10px 14px;
    font-size:13.5px; font-family:'DM Sans',sans-serif; outline:none;
    transition:border-color var(--tr), box-shadow var(--tr);
  }
  .field::placeholder { color:var(--text-m); }
  .field:focus { border-color:var(--border-focus); box-shadow:0 0 0 3px var(--accent-g); }
  .field-mono { font-family:'DM Mono',monospace!important; font-size:12px!important; }

  input[type=range] {
    -webkit-appearance:none; width:100%; height:4px;
    background:var(--bg-o); border-radius:99px; outline:none; cursor:pointer;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance:none; width:16px; height:16px;
    background:var(--accent); border-radius:50%; cursor:pointer;
    box-shadow:0 0 8px var(--accent-g); border:2px solid #fff; transition:transform .1s;
  }
  input[type=range]::-webkit-slider-thumb:hover { transform:scale(1.2); }

  .data-table { width:100%; border-collapse:collapse; font-size:13px; }
  .data-table th {
    padding:9px 14px; text-align:left; color:var(--text-m); font-weight:700;
    font-size:10.5px; letter-spacing:.06em; text-transform:uppercase;
    border-bottom:1px solid var(--border);
  }
  .data-table td {
    padding:11px 14px; border-bottom:1px solid rgba(15,15,15,0.05);
    color:var(--text-s); vertical-align:middle;
  }
  .data-table tr:hover td { background:var(--bg-e); color:var(--text); }

  .drop-zone {
    border:1.5px dashed var(--border); border-radius:var(--r-md);
    padding:28px 20px; display:flex; flex-direction:column; align-items:center;
    gap:8px; cursor:pointer; transition:all var(--tr); text-align:center;
  }
  .drop-zone:hover { border-color:var(--accent); background:var(--accent-l); }

  .nav-link {
    padding:7px 14px; border-radius:var(--r-sm); font-size:13px; font-weight:500;
    color:var(--text-s); cursor:pointer; border:none; background:none;
    font-family:'DM Sans',sans-serif; transition:all var(--tr);
  }
  .nav-link:hover { color:var(--text); background:var(--bg-e); }

  .dash-tab {
    display:flex; align-items:center; gap:7px; padding:14px 16px;
    font-size:13px; font-weight:500; color:var(--text-s); cursor:pointer;
    border:none; background:none; font-family:'DM Sans',sans-serif;
    border-bottom:2px solid transparent; white-space:nowrap; transition:all var(--tr);
  }
  .dash-tab:hover { color:var(--text); }
  .dash-tab.active { color:var(--accent); border-bottom-color:var(--accent); }

  .feature-card {
    background:var(--bg); border:1px solid var(--border); border-radius:var(--r-md);
    padding:22px; transition:all var(--tr);
  }
  .feature-card:hover { border-color:var(--border-a); transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.07); }

  .card-hover { transition:all var(--tr); }
  .card-hover:hover { border-color:var(--border-a); transform:translateY(-1px); }

  @keyframes typing { 0%,100%{opacity:1} 50%{opacity:0.2} }
  .typing-dot {
    width:5px; height:5px; border-radius:50%;
    background:rgba(196,30,30,0.4); display:inline-block;
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
const API_BASE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "http://localhost:8000";

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const LS = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  str: (k) => { try { return localStorage.getItem(k) || null; } catch { return null; } },
  strSet: (k, v) => { try { localStorage.setItem(k, v || ""); } catch {} },
  rm: (k) => { try { localStorage.removeItem(k); } catch {} },
};

// ─── API CLIENT ───────────────────────────────────────────────────────────────
function getToken() { return LS.str("wb_token"); }
function setToken(t) { t ? LS.strSet("wb_token", t) : LS.rm("wb_token"); }

let _refreshPromise = null;

async function refreshOnce() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" })
    .then(async rr => {
      if (rr.ok) { const d = await rr.json(); if (d.access_token) { setToken(d.access_token); return d.access_token; } }
      return null;
    })
    .catch(() => null)
    .finally(() => { _refreshPromise = null; });
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
  addChannel:        (gid, cid)   => apiFetch("/channel/add",     { method: "PUT",    body: fd({ guild_id: gid, channel_id: cid }), isForm: true }),
  deleteChannel:     (gid, cid)   => apiFetch("/channel/delete",  { method: "DELETE", body: fd({ guild_id: gid, channel_id: cid }), isForm: true }),
  addModChannel:     (gid, cid)   => apiFetch("/channel/add-mod", { method: "PUT",    body: fd({ guild_id: gid, channel_id: cid }), isForm: true }),
  upload: (gid, files, urls) => {
    const f = new FormData(); f.append("guild_id", gid);
    files.forEach(fi => f.append("files", fi));
    if (urls) f.append("urls", urls);
    return apiFetch("/upload", { method: "PUT", body: f, isForm: true });
  },
  uploadContacts:  (gid, file)  => { const f = new FormData(); f.append("guild_id", gid); f.append("file", file); return apiFetch("/upload/contacts", { method: "PUT", body: f, isForm: true }); },
  getAllUploads:    (gid)        => apiFetch(`/upload/all?guild_id=${encodeURIComponent(gid)}`),
  getSubUrls:      (url)        => apiFetch(`/upload/sub-urls?url=${encodeURIComponent(url)}`),
  query:           (question, server) => apiFetch("/query", { method: "POST", body: { question, server } }),
  getAnalytics:    (gid)        => apiFetch(`/analytics/summary?guild_id=${encodeURIComponent(gid)}`),
};

// ─── TINY COMPONENTS ─────────────────────────────────────────────────────────
const S = {
  // Layout tokens as inline style objects (avoids extra classes)
  panel:   { background:"var(--bg-s)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)" },
  card:    { background:"var(--bg-s)", border:"1px solid var(--border)", borderRadius:"var(--r-md)" },
  row:     { display:"flex", alignItems:"center", gap:10 },
};

function Spinner({ color = "var(--accent)", size = 14 }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid rgba(196,30,30,0.15)`,
      borderTopColor: color, borderRadius: "50%",
      animation: "spin .6s linear infinite", flexShrink: 0,
    }} />
  );
}

function StatusBadge({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: "10px 14px", borderRadius: "var(--r-sm)", fontSize: 13, fontWeight: 500,
      background: ok ? "var(--success-bg)" : "var(--danger-bg)",
      border: `1px solid ${ok ? "rgba(26,122,74,0.2)" : "rgba(196,30,30,0.2)"}`,
      color: ok ? "var(--success)" : "var(--danger)",
    }}>{msg}</div>
  );
}

function Tag({ children, variant = "accent" }) {
  const styles = {
    accent:  { background:"var(--accent-l)",  color:"var(--accent)",  border:"1px solid rgba(196,30,30,0.2)" },
    success: { background:"var(--success-bg)", color:"var(--success)", border:"1px solid rgba(26,122,74,0.2)" },
    warn:    { background:"var(--warning-bg)", color:"var(--warning)", border:"1px solid rgba(179,92,0,0.2)" },
    discord: { background:"rgba(88,101,242,0.1)", color:"var(--discord)", border:"1px solid rgba(88,101,242,0.25)" },
  };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px",
      borderRadius:"var(--r-full)", fontSize:10.5, fontWeight:600, letterSpacing:".04em",
      ...styles[variant],
    }}>{children}</span>
  );
}

function Mono({ children }) {
  return (
    <span style={{
      background:"rgba(196,30,30,0.07)", border:"1px solid rgba(196,30,30,0.15)",
      borderRadius:"var(--r-xs)", padding:"2px 6px",
      fontFamily:"'DM Mono',monospace", fontSize:11, color:"#a01515",
    }}>{children}</span>
  );
}

function OnlineDot() {
  return (
    <span style={{
      width:7, height:7, borderRadius:"50%", display:"inline-block", flexShrink:0,
      background:"var(--success)", boxShadow:"0 0 8px rgba(26,122,74,0.5)",
      animation:"pulse 2.5s ease infinite",
    }} />
  );
}

function Btn({ children, onClick, disabled, variant = "primary", style = {} }) {
  const base = {
    display:"inline-flex", alignItems:"center", gap:7, border:"none",
    cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600,
    borderRadius:"var(--r-sm)", transition:"all var(--tr)", whiteSpace:"nowrap",
    userSelect:"none", opacity: disabled ? .35 : 1,
    pointerEvents: disabled ? "none" : "auto",
  };
  const variants = {
    primary: { background:"var(--accent)", color:"#fff", padding:"10px 22px", fontSize:13.5, boxShadow:"0 4px 20px var(--accent-g)" },
    ghost:   { background:"transparent", color:"var(--text-s)", padding:"9px 16px", fontSize:13, border:"1.5px solid var(--border-a)" },
    danger:  { background:"var(--danger-bg)", color:"var(--danger)", padding:"6px 12px", fontSize:12, border:"1.5px solid rgba(196,30,30,0.2)" },
    success: { background:"var(--success-bg)", color:"var(--success)", padding:"10px 20px", fontSize:13.5, border:"1.5px solid rgba(26,122,74,0.18)" },
    discord: { background:"var(--discord)", color:"#fff", padding:"11px 22px", fontSize:14, boxShadow:"0 6px 24px rgba(88,101,242,0.3)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

// ─── SLIDER ───────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, onChange, onSave, saving }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"var(--text-m)", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase" }}>{label}</span>
        <span style={{
          fontFamily:"'DM Mono',monospace", fontSize:12, color:"var(--accent)",
          background:"var(--accent-l)", border:"1px solid rgba(196,30,30,0.18)",
          borderRadius:4, padding:"2px 8px",
        }}>{value}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
          style={{ flex:1 }} />
        <Btn onClick={onSave} disabled={saving} variant="ghost"
          style={{ padding:"5px 10px", fontSize:11.5, flexShrink:0, minWidth:36 }}>
          {saving ? <Spinner /> : "💾"}
        </Btn>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:10, color:"var(--text-m)" }}>{min}</span>
        <span style={{ fontSize:10, color:"var(--text-m)" }}>{max}</span>
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

// ─── NAV BAR ──────────────────────────────────────────────────────────────────
function NavBar({ user, view, onShowLanding, onShowDashboard, onLogin, onLogout }) {
  return (
    <nav style={{
      position:"sticky", top:0, zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 40px", height:60,
      background:"rgba(245,240,235,0.9)", backdropFilter:"blur(16px)",
      borderBottom:"1px solid var(--border)",
    }}>
      {/* Logo */}
      <button onClick={onShowLanding} style={{
        display:"flex", alignItems:"center", gap:10, background:"none", border:"none",
        cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, color:"var(--text)",
      }}>
        <div style={{
          width:32, height:32, borderRadius:"var(--r-sm)", background:"var(--accent)",
          display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16,
        }}>⚡</div>
        WalluBot
      </button>

      {/* Links + Auth */}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        {view === "landing" && (
          <>
            <button className="nav-link" onClick={() => document.getElementById("features-section")?.scrollIntoView({ behavior:"smooth" })}>Features</button>
            <button className="nav-link" onClick={() => document.getElementById("hiw-section")?.scrollIntoView({ behavior:"smooth" })}>How It Works</button>
          </>
        )}
        {user ? (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {view === "landing" && (
              <Btn onClick={onShowDashboard} variant="ghost" style={{ padding:"7px 14px", fontSize:12.5 }}>
                Dashboard →
              </Btn>
            )}
            {/* User chip */}
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              background:"var(--bg-e)", border:"1px solid var(--border-a)",
              borderRadius:"var(--r-full)", padding:"5px 14px 5px 5px",
            }}>
              <div style={{
                width:28, height:28, borderRadius:"50%",
                background:"linear-gradient(135deg,#c41e1e,#7a0000)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:700, color:"#fff", fontFamily:"'Syne',sans-serif",
              }}>{(user.username||"U").slice(0,1).toUpperCase()}</div>
              <span style={{ fontSize:12.5, fontWeight:600, color:"var(--text)" }}>{user.username || "Admin"}</span>
            </div>
            <Btn onClick={onLogout} variant="danger" style={{ padding:"7px 12px", fontSize:12 }}>
              ↩ Logout
            </Btn>
          </div>
        ) : (
          <Btn onClick={onLogin} variant="discord" style={{ gap:8 }}>
            <DiscordIcon /> Login with Discord
          </Btn>
        )}
      </div>
    </nav>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon:"🧠", title:"Hybrid RAG Retrieval", desc:"Combines FAISS vector search with BM25 keyword retrieval for precise, grounded answers every time." },
  { icon:"📄", title:"PDF & URL Ingestion", desc:"Upload PDFs or paste website URLs — content gets chunked, embedded, and stored in your vector store automatically." },
  { icon:"🌐", title:"Web Crawler", desc:"Discover all sub-pages of any website, select which ones to ingest, and bulk-import entire documentation sites." },
  { icon:"🎛️", title:"Live Tunable Parameters", desc:"Adjust FAISS-K, BM25-K, temperature, chunk size, chunk overlap, and max tokens — all with live sliders." },
  { icon:"#️⃣", title:"Channel Control", desc:"Whitelist exactly which Discord channels the bot listens in and set a dedicated mod/log channel." },
  { icon:"📊", title:"Analytics Dashboard", desc:"Track total queries, ingested documents, and bot activity across all registered servers." },
  { icon:"🗂️", title:"Structured Data (XLSX)", desc:"Upload Excel sheets for contacts, faculty data, and structured records alongside documents." },
  { icon:"🔐", title:"Discord OAuth Login", desc:"Secure admin access via Discord OAuth. Only verified server admins can configure and manage." },
  { icon:"💬", title:"System Prompt Editor", desc:"Customize the bot's persona and behavior with a full system prompt editor — make it truly yours." },
];

function LandingPage({ user, onLogin, onShowDashboard }) {
  return (
    <div>
      {/* ── HERO ── */}
      <section style={{
        padding:"88px 32px 72px", textAlign:"center", position:"relative", overflow:"hidden",
      }}>
        {/* Orbs */}
        <div style={{ position:"absolute", width:500, height:500, top:-200, right:-150, background:"rgba(196,30,30,0.07)", borderRadius:"50%", filter:"blur(90px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:350, height:350, bottom:-100, left:-100, background:"rgba(180,80,0,0.05)", borderRadius:"50%", filter:"blur(90px)", pointerEvents:"none" }} />

        <div style={{ position:"relative", zIndex:1 }}>
          <div className="au" style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:"var(--accent-l)", border:"1px solid rgba(196,30,30,0.2)",
            borderRadius:"var(--r-full)", padding:"7px 16px", marginBottom:28,
            fontSize:12.5, fontWeight:600, color:"var(--accent)",
          }}>⚡ RAG-Powered Discord AI Bot</div>

          <h1 className="au d1" style={{
            fontFamily:"'Syne',sans-serif", fontSize:"clamp(36px,6vw,64px)",
            fontWeight:800, lineHeight:1.05, letterSpacing:"-0.03em", marginBottom:20,
          }}>
            Give Your Discord<br />
            <span style={{ background:"linear-gradient(135deg,#c41e1e,#8b0000)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Server an AI Brain
            </span>
          </h1>

          <p className="au d2" style={{
            fontSize:"clamp(14px,2vw,17px)", color:"var(--text-s)", lineHeight:1.7,
            maxWidth:560, margin:"0 auto 36px",
          }}>
            WalluBot transforms your documents, PDFs, and websites into an intelligent Q&A assistant
            that lives directly inside your Discord server.
          </p>

          <div className="au d3" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
            {user ? (
              <Btn onClick={onShowDashboard} style={{ fontSize:15, padding:"13px 28px" }}>
                Open Dashboard →
              </Btn>
            ) : (
              <>
                <Btn onClick={onLogin} variant="discord" style={{ fontSize:15, padding:"13px 28px", gap:10 }}>
                  <DiscordIcon size={20} /> Get Started with Discord
                </Btn>
                <Btn onClick={onShowDashboard} variant="ghost" style={{ fontSize:14, padding:"13px 22px" }}>
                  Preview Dashboard
                </Btn>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features-section" style={{
        padding:"72px 32px", background:"var(--bg-s)",
        borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)",
      }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--accent)", marginBottom:10 }}>Capabilities</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(24px,4vw,36px)", fontWeight:800, letterSpacing:"-0.02em" }}>
              Everything Your Bot Can Do
            </div>
            <p style={{ fontSize:14.5, color:"var(--text-s)", lineHeight:1.65, marginTop:12, maxWidth:500, margin:"12px auto 0" }}>
              A full RAG pipeline with hybrid retrieval, configurable parameters, and a powerful admin dashboard.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:16, marginTop:40 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`feature-card au d${(i % 6) + 1}`}>
                <div style={{
                  fontSize:28, marginBottom:14, width:44, height:44, borderRadius:"var(--r-sm)",
                  background:"var(--accent-l)", border:"1px solid rgba(196,30,30,0.15)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>{f.icon}</div>
                <div style={{ fontSize:14, fontWeight:700, fontFamily:"'Syne',sans-serif", color:"var(--text)", marginBottom:6 }}>{f.title}</div>
                <div style={{ fontSize:12.5, color:"var(--text-s)", lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="hiw-section" style={{ padding:"72px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--accent)", marginBottom:10 }}>Setup Flow</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(24px,4vw,36px)", fontWeight:800, letterSpacing:"-0.02em" }}>Up & Running in 4 Steps</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:0 }}>
            {[
              { n:1, title:"Login with Discord", desc:"Sign in securely via Discord OAuth to verify your admin access." },
              { n:2, title:"Register Server", desc:"Add your Discord Server ID to link your knowledge base." },
              { n:3, title:"Upload Content", desc:"Ingest PDFs, URLs, or spreadsheets into the vector store." },
              { n:4, title:"Configure & Deploy", desc:"Tune parameters, set channels, and your bot is live." },
            ].map((s, i) => (
              <div key={i} style={{ padding:24, textAlign:"center", position:"relative" }}>
                {i < 3 && <span style={{ position:"absolute", right:-10, top:"50%", transform:"translateY(-50%)", fontSize:22, color:"var(--text-m)" }}>→</span>}
                <div style={{
                  width:44, height:44, borderRadius:"50%", background:"var(--accent)", color:"#fff",
                  fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16,
                  display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px",
                }}>{s.n}</div>
                <div style={{ fontSize:13.5, fontWeight:700, color:"var(--text)", marginBottom:6 }}>{s.title}</div>
                <div style={{ fontSize:12, color:"var(--text-s)", lineHeight:1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:"64px 32px", textAlign:"center", background:"var(--bg-s)", borderTop:"1px solid var(--border)" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(22px,4vw,32px)", fontWeight:800, marginBottom:16 }}>Ready to get started?</div>
        <p style={{ fontSize:15, color:"var(--text-s)", marginBottom:28 }}>Login with Discord and configure your server's AI bot in minutes.</p>
        {user ? (
          <Btn onClick={onShowDashboard} style={{ fontSize:15, padding:"13px 28px" }}>Open Dashboard →</Btn>
        ) : (
          <Btn onClick={onLogin} variant="discord" style={{ fontSize:15, padding:"13px 28px", gap:10 }}>
            <DiscordIcon size={20} /> Get Started with Discord
          </Btn>
        )}
      </section>

      <footer style={{ padding:"32px", textAlign:"center", color:"var(--text-m)", fontSize:12.5, borderTop:"1px solid var(--border)" }}>
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

  // Filter to only servers the user owns and hasn't registered yet
  const availableToAdd = discordGuilds.filter(g => g.owner && !guilds.find(r => r.id === g.id));

  const handleAdd = async () => {
    if (!selectedGuild) { setAddStatus({ ok:false, msg:"Please select a server" }); return; }
    if (guilds.find(g => g.id === selectedGuild.id)) { setAddStatus({ ok:false, msg:"Server already registered" }); return; }
    setAdding(true);
    try {
      await API.addServer(selectedGuild.id, selectedGuild.name);
      const newGuild = { id: selectedGuild.id, name: selectedGuild.name, icon: selectedGuild.icon };
      onAdd(newGuild);
      setAddStatus({ ok:true, msg:"✓ Server registered!" });
      setTimeout(() => { setShowAdd(false); setAddStatus(null); setSelectedGuild(null); }, 900);
    } catch (e) {
      setAddStatus({ ok:false, msg:"✗ " + e.message });
    }
    setAdding(false);
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--text-m)", marginBottom:6 }}>Dashboard</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:"var(--text)", marginBottom:4 }}>Overview</div>
        <div style={{ fontSize:13.5, color:"var(--text-s)" }}>Your bot's current status and quick stats.</div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[
          { n: guilds.length,            label:"Servers",       icon:"🗄️",  col:"#6366f1" },
          { n: analytics?.total_queries ?? "—", label:"Total Queries", icon:"📊",  col:"#1a7a4a" },
          { n: <span style={{ display:"flex", alignItems:"center", gap:6 }}><OnlineDot />Live</span>, label:"Bot Status", icon:"⚡", col:"#c41e1e" },
        ].map((s, i) => (
          <div key={i} style={{ ...S.card, padding:"20px" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:"var(--text)", letterSpacing:"-0.03em", marginBottom:3 }}>{s.n}</div>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--text-m)", textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Servers panel */}
      <div style={{ ...S.panel, overflow:"hidden", marginBottom:20 }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:13.5, fontWeight:600, color:"var(--text)" }}>Registered Servers</span>
          <Btn onClick={() => setShowAdd(v => !v)} variant="ghost" style={{ padding:"6px 13px", fontSize:12 }}>
            {showAdd ? "✕ Cancel" : "+ Add Server"}
          </Btn>
        </div>

        {guilds.length === 0 ? (
          <div style={{ padding:"22px 20px", color:"var(--text-m)", fontSize:13 }}>No servers yet. Add one to get started.</div>
        ) : guilds.map(g => (
          <div key={g.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", borderBottom:"1px solid rgba(15,15,15,0.05)" }}>
            <div style={{
              width:34, height:34, borderRadius:"var(--r-sm)", background:"var(--accent-l)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:700, color:"var(--accent)", fontFamily:"'Syne',sans-serif", flexShrink:0,
            }}>{g.name.slice(0,2).toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13.5, fontWeight:600, color:"var(--text)" }}>{g.name}</span>
                {g.id === activeGuildId && <Tag variant="success">ACTIVE</Tag>}
              </div>
              <Mono>{g.id}</Mono>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              {g.id !== activeGuildId && (
                <Btn onClick={() => onActivate(g.id)} variant="ghost" style={{ padding:"5px 10px", fontSize:12 }}>Activate</Btn>
              )}
              <Btn onClick={() => onRemove(g.id)} variant="danger" style={{ padding:"5px 8px", fontSize:13 }}>✕</Btn>
            </div>
          </div>
        ))}

        {showAdd && (
          <div style={{ padding:"18px 20px", borderTop:"1px solid var(--border)", background:"var(--bg-e)" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:12 }}>Register New Server</div>
            <label style={{ fontSize:11, color:"var(--text-m)", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:".05em" }}>Select Your Discord Server</label>
            <select className="field" value={selectedGuild?.id || ""} onChange={e => {
              const g = discordGuilds.find(g => g.id === e.target.value);
              setSelectedGuild(g || null);
            }} style={{ marginBottom:12 }}>
              <option value="">— choose a server —</option>
              {availableToAdd.length === 0
                ? <option disabled>No new servers to add</option>
                : availableToAdd.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))
              }
            </select>
            {addStatus && <div style={{ marginBottom:10 }}><StatusBadge {...addStatus} /></div>}
            <div style={{ display:"flex", gap:10 }}>
              <Btn onClick={handleAdd} disabled={adding} style={{ flex:2, justifyContent:"center", padding:"10px" }}>
                {adding ? <><Spinner />&nbsp;Registering…</> : "Add Server"}
              </Btn>
              <Btn onClick={() => { setShowAdd(false); setAddStatus(null); }} variant="ghost" style={{ flex:1, justifyContent:"center" }}>Cancel</Btn>
            </div>
          </div>
        )}
      </div>

      {/* Quick start */}
      <div style={{ ...S.panel, padding:"20px" }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text)", marginBottom:14 }}>Quick Start Guide</div>
        {[
          ["Register your Discord server", "Click  above and paste your Discord Server ID."],
          ["Configure RAG parameters", "Go to Server Config tab, select your server, and tune the sliders."],
          ["Upload your knowledge base", "Use the Upload tab to ingest PDFs, URLs, or XLSX files."],
          ["Set allowed channels", "Go to Channels tab and whitelist channels + set a mod channel."],
        ].map(([title, desc], i) => (
          <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
            <div style={{
              width:20, height:20, borderRadius:"var(--r-xs)", background:"var(--accent-l)",
              color:"var(--accent)", fontSize:10, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, fontFamily:"'DM Mono',monospace",
            }}>{i + 1}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"var(--text)", marginBottom:2 }}>{title}</div>
              <div style={{ fontSize:12, color:"var(--text-m)", lineHeight:1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SERVER CONFIG TAB ────────────────────────────────────────────────────────
const SLIDER_DEFS = [
  { field:"faiss_k",       label:"FAISS-K (vector results)",  min:1,   max:20,   step:1,    api:"updateFaissK" },
  { field:"bm25_k",        label:"BM25-K (keyword results)",  min:1,   max:20,   step:1,    api:"updateBm25K" },
  { field:"temperature",   label:"Temperature",               min:0,   max:1,    step:0.05, api:"updateTemp" },
  { field:"max_tokens",    label:"Max Tokens",                min:128, max:4096, step:64,   api:"updateMaxToken" },
  { field:"chunk_size",    label:"Chunk Size",                min:100, max:999,  step:1,    api:"updateChunkSize" },
  { field:"chunk_overlap", label:"Chunk Overlap",             min:100, max:1000, step:1,    api:"updateChunkOverlap" },
];

function ServerConfigTab({ guilds }) {
  const [selectedGuildId, setSelectedGuildId] = useState("");
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [prompt, setPrompt] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const loadConfig = async (gid) => {
    if (!gid) { setConfig(null); return; }
    setLoading(true); setStatus(null);
    try {
      const d = await API.getConfig(gid);
      setConfig(d); setPrompt(d.system_prompt || "");
    } catch (e) {
      setStatus({ ok:false, msg:"Failed to load: " + e.message });
      setConfig(null);
    }
    setLoading(false);
  };

  const handleSelect = (gid) => { setSelectedGuildId(gid); loadConfig(gid); };

  const saveSlider = async (field, apiMethod, value) => {
    setSaving(s => ({ ...s, [field]:true })); setStatus(null);
    try { await API[apiMethod](selectedGuildId, value); setStatus({ ok:true, msg:`✓ ${field} saved` }); }
    catch (e) { setStatus({ ok:false, msg:"✗ " + e.message }); }
    setSaving(s => ({ ...s, [field]:false }));
  };

  const savePrompt = async () => {
    setPromptSaving(true); setStatus(null);
    try { await API.updateSystemPrompt(selectedGuildId, prompt); setStatus({ ok:true, msg:"✓ System prompt saved" }); }
    catch (e) { setStatus({ ok:false, msg:"✗ " + e.message }); }
    setPromptSaving(false);
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--text-m)", marginBottom:6 }}>Configuration</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:"var(--text)", marginBottom:4 }}>Server Config</div>
        <div style={{ fontSize:13.5, color:"var(--text-s)" }}>Select a server then tune all RAG parameters with live sliders.</div>
      </div>

      {/* Server selector */}
      <div style={{ ...S.panel, padding:"18px 20px", marginBottom:20 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"var(--text-m)", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>
          Select Server to Configure
        </label>
        <select className="field" value={selectedGuildId} onChange={e => handleSelect(e.target.value)}>
          <option value="">— choose a server —</option>
          {guilds.map(g => <option key={g.id} value={g.id}>{g.name} ({g.id.slice(0,12)}…)</option>)}
        </select>
      </div>

      {loading && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 0", color:"var(--text-m)" }}>
          <Spinner /> Loading config…
        </div>
      )}

      {!loading && !config && !selectedGuildId && (
        <div style={{ padding:"48px", textAlign:"center", color:"var(--text-m)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⚙️</div>
          <div style={{ fontSize:14 }}>Select a server above to configure its settings.</div>
          <div style={{ fontSize:12.5, marginTop:6 }}>Add a server from the Overview tab if none appear.</div>
        </div>
      )}

      {!loading && config && (
        <>
          {/* Info grid */}
          <div style={{ ...S.panel, padding:"18px 20px", marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:12, display:"flex", alignItems:"center", gap:7 }}>
              🗄️ Server Info
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["Name", config.name], ["Guild ID", config.guild_id], ["Added", config.added_at ? new Date(config.added_at).toLocaleString() : "—"], ["Updated", config.updated_at ? new Date(config.updated_at).toLocaleString() : "—"]].map(([k,v]) => (
                <div key={k} style={{ background:"var(--bg-e)", borderRadius:"var(--r-sm)", padding:"10px 12px" }}>
                  <div style={{ fontSize:9.5, color:"var(--text-m)", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", marginBottom:4 }}>{k}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11.5, color:"var(--text)", wordBreak:"break-all" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div style={{ ...S.panel, padding:"20px 22px", marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:20, display:"flex", alignItems:"center", gap:7 }}>
              🎛️ Retrieval Parameters
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
              {SLIDER_DEFS.map(s => (
                <Slider
                  key={s.field}
                  label={s.label}
                  value={config[s.field] ?? Math.round((s.min + s.max) / 2)}
                  min={s.min} max={s.max} step={s.step}
                  onChange={v => setConfig(c => ({ ...c, [s.field]: v }))}
                  onSave={() => saveSlider(s.field, s.api, config[s.field])}
                  saving={saving[s.field]}
                />
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div style={{ ...S.panel, padding:"20px 22px", marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:12 }}>💬 System Prompt</div>
            <textarea
              className="field" value={prompt} onChange={e => setPrompt(e.target.value)}
              rows={5} placeholder="You are a helpful assistant for this Discord server…"
              style={{ resize:"vertical", lineHeight:1.6 }}
            />
            <Btn onClick={savePrompt} disabled={promptSaving} style={{ marginTop:10, width:"100%", justifyContent:"center", padding:"10px" }}>
              {promptSaving ? <><Spinner />&nbsp;Saving…</> : "💾 Save Prompt"}
            </Btn>
          </div>

          {status && <StatusBadge {...status} />}
        </>
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
  const [discordChannels, setDiscordChannels] = useState([]); // real channel names from Discord
  const [newChanId, setNewChanId] = useState("");
  const [newModId, setNewModId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (id) => {
    if (!id) { setLoaded(false); return; }
    setLoading(true);
    try {
      const [d, dc] = await Promise.allSettled([
        API.listChannels(id),
        API.getGuildChannels(id),
      ]);
      if (d.status === "fulfilled") {
        setChannels(d.value.channel_ids || []);
        setModChannel(d.value.mod_channel || null);
        setLoaded(true);
      }
      if (dc.status === "fulfilled") {
        setDiscordChannels(dc.value.channels || []);
      }
    } catch (e) { setStatus({ ok:false, msg:"✗ " + e.message }); }
    setLoading(false);
  };

  // Resolve a channel ID to its name if available
  const chanName = (id) => {
    const found = discordChannels.find(c => c.id === id);
    return found ? `#${found.name}` : id;
  };

  const handleSelect = (id) => { setGid(id); setLoaded(false); setStatus(null); setDiscordChannels([]); load(id); };

  const addChan = async () => {
    if (!gid || !newChanId.trim()) return;
    try { await API.addChannel(gid, newChanId.trim()); setStatus({ ok:true, msg:"✓ Channel added" }); setNewChanId(""); load(gid); }
    catch (e) { setStatus({ ok:false, msg:"✗ " + e.message }); }
  };

  const removeChan = async (cid) => {
    try { await API.deleteChannel(gid, cid); setStatus({ ok:true, msg:"✓ Channel removed" }); load(gid); }
    catch (e) { setStatus({ ok:false, msg:"✗ " + e.message }); }
  };

  const setMod = async () => {
    if (!gid || !newModId.trim()) return;
    try { await API.addModChannel(gid, newModId.trim()); setStatus({ ok:true, msg:"✓ Mod channel set" }); setNewModId(""); load(gid); }
    catch (e) { setStatus({ ok:false, msg:"✗ " + e.message }); }
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--text-m)", marginBottom:6 }}>Bot Configuration</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:"var(--text)", marginBottom:4 }}>Channel Management</div>
        <div style={{ fontSize:13.5, color:"var(--text-s)" }}>Control which Discord channels the bot responds in.</div>
      </div>

      <div style={{ ...S.panel, padding:"18px 20px", marginBottom:16 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"var(--text-m)", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>Server</label>
        <select className="field" value={gid} onChange={e => handleSelect(e.target.value)}>
          <option value="">— choose a server —</option>
          {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {loading && <div style={{ display:"flex", alignItems:"center", gap:10, color:"var(--text-m)", padding:"12px 0" }}><Spinner /> Loading channels…</div>}

      {!loading && !gid && (
        <div style={{ padding:"48px", textAlign:"center", color:"var(--text-m)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔊</div>
          <div style={{ fontSize:14 }}>Select a server to manage its channels.</div>
        </div>
      )}

      {!loading && loaded && (
        <>
          {/* Active channels */}
          <div style={{ ...S.panel, overflow:"hidden", marginBottom:14 }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>Active Bot Channels</span>
              <Tag variant="accent">{channels.length}</Tag>
            </div>
            {channels.length === 0 ? (
              <div style={{ padding:"22px", textAlign:"center", color:"var(--text-m)", fontSize:13 }}>No channels configured yet.</div>
            ) : channels.map(ch => (
              <div key={ch} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 18px", borderBottom:"1px solid rgba(15,15,15,0.05)" }}>
                <span style={{ color:"var(--accent)", fontWeight:700 }}>#</span>
                <span style={{ flex:1, fontSize:13, color:"var(--text)" }}>{chanName(ch)}</span>
                <Btn onClick={() => removeChan(ch)} variant="danger" style={{ padding:"5px 10px", fontSize:11.5 }}>✕ Remove</Btn>
              </div>
            ))}
            <div style={{ padding:"12px 18px", borderTop:"1px solid var(--border)", display:"flex", gap:10 }}>
              {discordChannels.length > 0 ? (
                <select className="field" value={newChanId} onChange={e => setNewChanId(e.target.value)} style={{ flex:1, height:36 }}>
                  <option value="">— select a channel —</option>
                  {discordChannels.filter(c => !channels.includes(c.id)).map(c => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              ) : (
                <input className="field field-mono" value={newChanId} onChange={e => setNewChanId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addChan()}
                  placeholder="Channel ID" style={{ flex:1, height:36 }} />
              )}
              <Btn onClick={addChan} variant="ghost" style={{ padding:"7px 14px", flexShrink:0 }}>+ Add</Btn>
            </div>
          </div>

          {/* Mod channel */}
          <div style={{ ...S.panel, padding:"18px 20px", marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:12, display:"flex", alignItems:"center", gap:7 }}>
              🛡️ Mod / Log Channel
            </div>
            {modChannel ? (
              <div style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 12px", marginBottom:10,
                background:"var(--warning-bg)", border:"1px solid rgba(179,92,0,0.2)", borderRadius:"var(--r-sm)",
              }}>
                <span style={{ fontWeight:700 }}>#</span>
                <span style={{ fontSize:13, color:"var(--warning)", flex:1 }}>{chanName(modChannel)}</span>
                <Tag variant="warn">ACTIVE</Tag>
              </div>
            ) : (
              <p style={{ fontSize:12.5, color:"var(--text-m)", marginBottom:10 }}>No mod channel set.</p>
            )}
            <div style={{ display:"flex", gap:10 }}>
              {discordChannels.length > 0 ? (
                <select className="field" value={newModId} onChange={e => setNewModId(e.target.value)} style={{ flex:1, height:36 }}>
                  <option value="">— select mod channel —</option>
                  {discordChannels.map(c => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              ) : (
                <input className="field field-mono" value={newModId} onChange={e => setNewModId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setMod()}
                  placeholder="Mod channel ID" style={{ flex:1, height:36 }} />
              )}
              <Btn onClick={setMod} variant="ghost" style={{ padding:"7px 14px", flexShrink:0 }}>Set</Btn>
            </div>
          </div>

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

  const handleSelect = (id) => { setGid(id); setUploads([]); loadUploads(id); };

  const handlePdfDrop = (e) => {
    e.preventDefault();
    const dropped = [...e.dataTransfer.files].filter(f => f.type === "application/pdf");
    setPdfFiles(p => [...p, ...dropped]);
  };

  const doUpload = async () => {
    if (!gid) { setStatus({ ok:false, msg:"Select a server first" }); return; }
    if (!urls.trim() && !pdfFiles.length) { setStatus({ ok:false, msg:"Add URLs or PDFs first" }); return; }
    setUploading(true); setStatus(null);
    try {
      const d = await API.upload(gid, pdfFiles, urls.trim());
      setStatus({ ok:true, msg:`✓ ${d.urls_processed||0} URL(s), ${d.pdfs_processed||0} PDF(s) ingested` });
      setUrls(""); setPdfFiles([]); loadUploads(gid);
    } catch (e) { setStatus({ ok:false, msg:"✗ " + e.message }); }
    setUploading(false);
  };

  const doXlsxUpload = async () => {
    if (!gid) { setStatus({ ok:false, msg:"Select a server first" }); return; }
    if (!xlsxFile) { setStatus({ ok:false, msg:"No .xlsx file selected" }); return; }
    setXlsxUploading(true); setStatus(null);
    try {
      const d = await API.uploadContacts(gid, xlsxFile);
      setStatus({ ok:true, msg:"✓ " + d.message }); setXlsxFile(null);
    } catch (e) { setStatus({ ok:false, msg:"✗ " + e.message }); }
    setXlsxUploading(false);
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--text-m)", marginBottom:6 }}>Knowledge Base</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:"var(--text)", marginBottom:4 }}>Upload Content</div>
        <div style={{ fontSize:13.5, color:"var(--text-s)" }}>Ingest PDFs, URLs, and structured data into your vector store.</div>
      </div>

      {/* Server select */}
      <div style={{ ...S.panel, padding:"18px 20px", marginBottom:16 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"var(--text-m)", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>Server</label>
        <select className="field" value={gid} onChange={e => handleSelect(e.target.value)}>
          <option value="">— choose a server —</option>
          {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* URL upload */}
      <div style={{ ...S.panel, padding:"18px 20px", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <span style={{ fontSize:18 }}>🌐</span>
          <span style={{ fontSize:13.5, fontWeight:600, color:"var(--text)" }}>Web URLs</span>
          <Tag style={{ marginLeft:"auto" }}>One per line</Tag>
        </div>
        <textarea className="field field-mono" value={urls} onChange={e => setUrls(e.target.value)}
          rows={4} placeholder={"https://docs.example.com\nhttps://yoursite.com/about"}
          style={{ resize:"vertical", lineHeight:1.6 }} />
      </div>

      {/* PDF upload */}
      <div style={{ ...S.panel, padding:"18px 20px", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <span style={{ fontSize:18 }}>📄</span>
          <span style={{ fontSize:13.5, fontWeight:600, color:"var(--text)" }}>PDF Files</span>
        </div>
        <div className="drop-zone" onClick={() => pdfRef.current?.click()}
          onDragOver={e => e.preventDefault()} onDrop={handlePdfDrop}>
          <span style={{ fontSize:28 }}>📥</span>
          <p style={{ fontSize:13.5, color:"var(--text-s)" }}>Drop PDFs here or <span style={{ color:"var(--accent)" }}>browse</span></p>
        </div>
        <input ref={pdfRef} type="file" accept=".pdf" multiple style={{ display:"none" }}
          onChange={e => setPdfFiles(p => [...p, ...[...e.target.files]])} />
        {pdfFiles.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
            {pdfFiles.map((f, i) => (
              <div key={i} style={{
                display:"inline-flex", alignItems:"center", gap:6, padding:"5px 10px",
                background:"rgba(196,30,30,0.07)", border:"1px solid rgba(196,30,30,0.2)",
                borderRadius:"var(--r-xs)", fontSize:12, color:"#a01515", fontFamily:"'DM Mono',monospace",
              }}>
                {f.name.length > 22 ? f.name.slice(0,19)+"…" : f.name}
                <span onClick={() => setPdfFiles(p => p.filter((_,j) => j !== i))} style={{ cursor:"pointer", opacity:.5 }}>✕</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* XLSX upload */}
      <div style={{ ...S.panel, padding:"18px 20px", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <span style={{ fontSize:18 }}>📊</span>
          <span style={{ fontSize:13.5, fontWeight:600, color:"var(--text)" }}>Structured Data (.xlsx)</span>
          <Tag variant="success" style={{ marginLeft:"auto" }}>Contacts / Faculty</Tag>
        </div>
        <div className="drop-zone"
          onClick={() => xlsxRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = [...e.dataTransfer.files].find(f => f.name.endsWith(".xlsx")); if (f) setXlsxFile(f); }}
          style={{ borderColor: xlsxFile ? "var(--success)" : undefined, background: xlsxFile ? "var(--success-bg)" : undefined }}>
          <span style={{ fontSize:28 }}>{xlsxFile ? "✅" : "📊"}</span>
          <p style={{ fontSize:13.5, color: xlsxFile ? "var(--success)" : "var(--text-s)", fontWeight: xlsxFile ? 600 : 400 }}>
            {xlsxFile ? xlsxFile.name : <>Drop <strong>.xlsx</strong> or browse</>}
          </p>
        </div>
        <input ref={xlsxRef} type="file" accept=".xlsx" style={{ display:"none" }} onChange={e => { if (e.target.files[0]) setXlsxFile(e.target.files[0]); }} />
      </div>

      {status && <div style={{ marginBottom:12 }}><StatusBadge {...status} /></div>}

      <div style={{ display:"flex", gap:10, marginBottom:28 }}>
        <Btn onClick={doUpload} disabled={uploading} style={{ flex:2, justifyContent:"center", padding:"11px" }}>
          {uploading ? <><Spinner />&nbsp;Ingesting…</> : "📤 Upload to Vector Store"}
        </Btn>
        <Btn onClick={doXlsxUpload} disabled={xlsxUploading} variant="success" style={{ flex:1, justifyContent:"center", padding:"11px" }}>
          {xlsxUploading ? <><Spinner />&nbsp;Uploading…</> : "Upload .xlsx"}
        </Btn>
      </div>

      {/* Uploads list */}
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <span style={{ fontSize:13.5, fontWeight:600, color:"var(--text)" }}>Ingested Sources</span>
          <Btn onClick={() => loadUploads(gid)} disabled={loadingUploads} variant="ghost" style={{ padding:"5px 10px", fontSize:11.5 }}>
            {loadingUploads ? <Spinner /> : "↻ Refresh"}
          </Btn>
        </div>
        <div style={{ ...S.panel, overflow:"hidden" }}>
          <table className="data-table">
            <thead><tr><th>Source</th><th>Type</th><th>Date</th></tr></thead>
            <tbody>
              {uploads.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign:"center", color:"var(--text-m)", padding:"20px" }}>
                  {gid ? "No uploads yet" : "Select a server to view uploads"}
                </td></tr>
              ) : uploads.map((u, i) => (
                <tr key={i}>
                  <td style={{ maxWidth:300, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    <Mono>{u.url || u.filename || u.source || "—"}</Mono>
                  </td>
                  <td><Tag>{u.type || "url"}</Tag></td>
                  <td style={{ color:"var(--text-m)" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── URL CRAWLER TAB ──────────────────────────────────────────────────────────
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
      setAllUrls(d.sub_urls || []); setHasResult(true);
    } catch (e) { setStatus({ ok:false, msg:"✗ " + e.message }); }
    setCrawling(false);
  };

  const filtered = filter ? allUrls.filter(u => u.toLowerCase().includes(filter.toLowerCase())) : allUrls;

  const toggle = (u) => setSelected(s => { const n = new Set(s); n.has(u) ? n.delete(u) : n.add(u); return n; });
  const selectAll = () => setSelected(new Set(filtered));
  const clearSel = () => setSelected(new Set());

  const ingest = async () => {
    if (!gid) { setStatus({ ok:false, msg:"Select a server first" }); return; }
    if (!selected.size) return;
    setIngesting(true); setStatus(null);
    try {
      const d = await API.upload(gid, [], [...selected].join("\n"));
      setStatus({ ok:true, msg:`✓ ${d.urls_processed || selected.size} URL(s) ingested` });
    } catch (e) { setStatus({ ok:false, msg:"✗ " + e.message }); }
    setIngesting(false);
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--text-m)", marginBottom:6 }}>Discovery</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:"var(--text)", marginBottom:4 }}>Sub-URL Crawler</div>
        <div style={{ fontSize:13.5, color:"var(--text-s)" }}>Discover all linked pages of any site, select what to ingest, and bulk-import.</div>
      </div>

      {/* Server + URL input */}
      <div style={{ ...S.panel, padding:"18px 20px", marginBottom:16 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"var(--text-m)", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>Server</label>
        <select className="field" value={gid} onChange={e => setGid(e.target.value)} style={{ marginBottom:14 }}>
          <option value="">— choose a server —</option>
          {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <label style={{ fontSize:11, fontWeight:700, color:"var(--text-m)", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>Base URL to Crawl</label>
        <div style={{ display:"flex", gap:10 }}>
          <input className="field field-mono" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doCrawl()}
            placeholder="https://docs.example.com" style={{ flex:1 }} />
          <Btn onClick={doCrawl} disabled={crawling || !baseUrl.trim()} style={{ padding:"10px 18px", flexShrink:0 }}>
            {crawling ? <><Spinner />&nbsp;Scanning…</> : "🔍 Discover"}
          </Btn>
        </div>
      </div>

      {hasResult && (
        <div style={{ ...S.panel, overflow:"hidden", marginBottom:16 }}>
          {/* Header */}
          <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <Tag>{allUrls.length} URLs found</Tag>
            {selected.size > 0 && <Tag variant="success">{selected.size} selected</Tag>}
            <input className="field" value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Filter URLs…" style={{ flex:1, minWidth:140, height:30, padding:"4px 10px", fontSize:12, fontFamily:"'DM Mono',monospace" }} />
            <Btn onClick={selectAll} variant="ghost" style={{ padding:"4px 11px", fontSize:12 }}>All</Btn>
            <Btn onClick={clearSel} variant="ghost" style={{ padding:"4px 11px", fontSize:12 }}>Clear</Btn>
          </div>

          {/* URL list */}
          <div style={{ maxHeight:280, overflowY:"auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding:"24px", textAlign:"center", color:"var(--text-m)", fontSize:13 }}>No URLs match filter</div>
            ) : filtered.map((u, i) => {
              const sel = selected.has(u);
              return (
                <div key={i} onClick={() => toggle(u)} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"9px 16px",
                  borderBottom:"1px solid rgba(15,15,15,0.05)", cursor:"pointer",
                  background: sel ? "rgba(196,30,30,0.04)" : "transparent",
                  transition:"background var(--tr)",
                }}>
                  <div style={{
                    width:16, height:16, borderRadius:4, flexShrink:0,
                    border:`1.5px solid ${sel ? "var(--accent)" : "var(--border-a)"}`,
                    background: sel ? "var(--accent)" : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontSize:10, transition:"all var(--tr)",
                  }}>{sel ? "✓" : ""}</div>
                  <span style={{
                    fontSize:11.5, color:"var(--text-s)", fontFamily:"'DM Mono',monospace",
                    wordBreak:"break-all", flex:1, lineHeight:1.5,
                  }}>{u}</span>
                  <a href={u} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ color:"var(--text-m)", fontSize:11, flexShrink:0 }}>↗</a>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding:"11px 16px", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
            <p style={{ fontSize:12.5, color:"var(--text-m)" }}>
              {selected.size > 0 ? `${selected.size} URL${selected.size > 1 ? "s" : ""} queued` : "Select URLs to ingest"}
            </p>
            <Btn onClick={ingest} disabled={ingesting || !selected.size} style={{ padding:"8px 16px" }}>
              {ingesting ? <><Spinner />&nbsp;Ingesting…</> : `Ingest (${selected.size})`}
            </Btn>
          </div>
        </div>
      )}

      {status && <StatusBadge {...status} />}
    </div>
  );
}

// ─── CHAT WIDGET ──────────────────────────────────────────────────────────────
function ChatWidget({ guildId, guildName }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role:"bot", text:`Hi! Ask me anything about ${guildName || "the knowledge base"}.` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setMessages(m => [...m, { role:"user", text:q }]);
    setLoading(true);
    try {
      const d = await API.query(q, guildId);
      const ans = d.answer || d.response || JSON.stringify(d);
      setMessages(m => [...m, { role:"bot", text:ans }]);
    } catch (e) {
      setMessages(m => [...m, { role:"bot", text:"Error: " + e.message, error:true }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Widget */}
      <div style={{
        position:"fixed", bottom:82, right:24, width:370, height:500,
        background:"var(--bg-s)", border:"1px solid var(--border-a)", borderRadius:"var(--r-xl)",
        boxShadow:"0 40px 100px rgba(0,0,0,0.2)", zIndex:200,
        display:"flex", flexDirection:"column", overflow:"hidden",
        transform: open ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "all" : "none",
        transition:"transform .32s cubic-bezier(0.16,1,0.3,1), opacity .2s ease",
        transformOrigin:"bottom right",
      }}>
        {/* Header */}
        <div style={{ padding:"12px 15px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, background:"var(--bg-e)", flexShrink:0 }}>
          <div style={{ width:30, height:30, borderRadius:"var(--r-sm)", background:"var(--accent-l)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⚡</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", fontFamily:"'Syne',sans-serif" }}>{guildName || "WalluBot"}</div>
            <div style={{ fontSize:10.5, color:"var(--text-m)" }}>RAG Assistant</div>
          </div>
          <OnlineDot />
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"14px", display:"flex", flexDirection:"column", gap:10 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ animation:"fadeUp .3s both" }}>
              {msg.role === "user" ? (
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <div style={{
                    background:"var(--accent)", borderRadius:"10px 4px 10px 10px",
                    padding:"8px 12px", fontSize:13, color:"#fff", maxWidth:250, lineHeight:1.5,
                  }}>{msg.text}</div>
                </div>
              ) : (
                <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ width:24, height:24, borderRadius:"var(--r-xs)", background:"var(--accent-l)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12 }}>⚡</div>
                  <div style={{
                    background: msg.error ? "var(--danger-bg)" : "var(--bg-e)",
                    border:`1px solid ${msg.error ? "rgba(196,30,30,0.2)" : "var(--border)"}`,
                    borderRadius:"4px 10px 10px 10px", padding:"9px 12px", fontSize:13,
                    color: msg.error ? "var(--danger)" : "var(--text-s)", maxWidth:270, lineHeight:1.6,
                  }}>{msg.text}</div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <div style={{ width:24, height:24, borderRadius:"var(--r-xs)", background:"var(--accent-l)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12 }}>⚡</div>
              <div style={{ background:"var(--bg-e)", border:"1px solid var(--border)", borderRadius:"4px 10px 10px 10px", padding:"10px 12px", display:"flex", gap:4, alignItems:"center" }}>
                {[0,1,2].map(i => <span key={i} className="typing-dot" style={{ animationDelay:`${i*0.2}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:"9px 10px 12px", borderTop:"1px solid var(--border)", background:"var(--bg-e)", flexShrink:0 }}>
          <div style={{
            display:"flex", alignItems:"flex-end", gap:8, background:"var(--bg)",
            border:"1.5px solid var(--border)", borderRadius:"var(--r-sm)", padding:"6px 6px 6px 11px",
          }}>
            <textarea ref={inputRef} value={input}
              onChange={e => { setInput(e.target.value); const el=e.target; el.style.height="auto"; el.style.height=Math.min(el.scrollHeight,80)+"px"; }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask a question…" rows={1} disabled={loading}
              style={{
                flex:1, background:"transparent", border:"none", outline:"none",
                color:"var(--text)", fontSize:13.5, lineHeight:1.5, resize:"none",
                fontFamily:"'DM Sans',sans-serif", minHeight:22, maxHeight:80,
              }} />
            <button onClick={() => send()} disabled={loading || !input.trim()} style={{
              width:28, height:28, borderRadius:"var(--r-xs)", border:"none", cursor:"pointer",
              background: input.trim() && !loading ? "var(--accent)" : "var(--bg-e)",
              color: input.trim() && !loading ? "#fff" : "var(--text-m)",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, fontSize:13, transition:"all var(--tr)",
            }}>
              {loading ? <Spinner color="var(--accent)" /> : "➤"}
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setOpen(o => !o)} style={{
        position:"fixed", bottom:22, right:24, zIndex:210,
        width:50, height:50, borderRadius:"50%",
        background: open ? "var(--bg-e)" : "var(--accent)",
        border:`1.5px solid ${open ? "var(--border-a)" : "transparent"}`,
        cursor:"pointer",
        boxShadow:`0 8px 28px ${open ? "rgba(0,0,0,0.15)" : "var(--accent-g)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff", fontSize:20, transition:"all .2s",
      }}>
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const TABS = [
  { id:"overview",  label:"📊 Overview" },
  { id:"config",    label:"⚙️ Server Config" },
  { id:"channels",  label:"🔊 Channels" },
  { id:"upload",    label:"📤 Upload" },
  { id:"crawler",   label:"🌐 URL Crawler" },
];

function Dashboard({ user, guilds, discordGuilds, onGuildsChange }) {
  const [tab, setTab] = useState("overview");
  const [activeGuildId, setActiveGuildId] = useState(LS.str("wb_active_guild") || guilds[0]?.id || null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (activeGuildId) {
      API.getAnalytics(activeGuildId).then(setAnalytics).catch(() => {});
    }
  }, [activeGuildId]);

  const handleActivate = (id) => {
    setActiveGuildId(id);
    LS.strSet("wb_active_guild", id);
  };

  const handleAdd = (g) => {
    const updated = [...guilds, g];
    onGuildsChange(updated);
    if (!activeGuildId) { setActiveGuildId(g.id); LS.strSet("wb_active_guild", g.id); }
  };

  const handleRemove = (id) => {
    const updated = guilds.filter(g => g.id !== id);
    onGuildsChange(updated);
    if (activeGuildId === id) {
      const next = updated[0]?.id || null;
      setActiveGuildId(next); LS.strSet("wb_active_guild", next || "");
    }
  };

  const activeGuild = guilds.find(g => g.id === activeGuildId) || guilds[0];

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"calc(100vh - 60px)" }}>
      {/* Tab nav */}
      <div style={{
        display:"flex", alignItems:"center", gap:4, padding:"0 32px",
        background:"var(--bg-s)", borderBottom:"1px solid var(--border)",
        overflowX:"auto", flexShrink:0,
      }}>
        {TABS.map(t => (
          <button key={t.id} className={`dash-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ maxWidth:740, padding:"36px 40px" }}>
          {tab === "overview"  && <OverviewTab guilds={guilds} discordGuilds={discordGuilds} activeGuildId={activeGuildId} user={user} analytics={analytics} onActivate={handleActivate} onRemove={handleRemove} onAdd={handleAdd} />}
          {tab === "config"    && <ServerConfigTab guilds={guilds} />}
          {tab === "channels"  && <ChannelsTab guilds={guilds} />}
          {tab === "upload"    && <UploadTab guilds={guilds} />}
          {tab === "crawler"   && <CrawlerTab guilds={guilds} />}
        </div>
      </div>

      {/* Chat widget */}
      <ChatWidget guildId={activeGuild?.id} guildName={activeGuild?.name} />
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "dashboard"
  const [user, setUser] = useState(LS.get("wb_user", null));
  const [guilds, setGuilds] = useState(LS.get("wb_guilds", []));         // DB-registered servers only
  const [discordGuilds, setDiscordGuilds] = useState([]);                 // all Discord guilds for dropdowns
  const [booting, setBooting] = useState(true);

  // ── OAuth redirect handler ─────────────────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hashToken = hash.startsWith("#token=") ? hash.slice(7)
      : hash.startsWith("#access_token=") ? hash.slice(14) : null;
    const token = hashToken || params.get("token") || params.get("access_token");

    (async () => {
      if (token) {
        window.history.replaceState(null, "", window.location.pathname);
        setToken(token);
        try {
          const u = await API.getMe();
          setUser(u); LS.set("wb_user", u);
          // Load Discord guilds for dropdowns (not registered servers)
          try {
            const { guilds: dg } = await API.getGuilds();
            setDiscordGuilds(dg || []);
          } catch (_) {}
          // wb_guilds stays as-is (only DB-registered servers added via "Add Server")
          setView("dashboard");
        } catch (_) {
          const u = { username:"Discord User", discord_id:"unknown" };
          setUser(u); LS.set("wb_user", u);
          setView("dashboard");
        }
        setBooting(false); return;
      }
      // Try restoring session
      const storedToken = getToken();
      if (storedToken && !user) {
        try {
          const u = await API.getMe();
          setUser(u); LS.set("wb_user", u);
          try {
            const { guilds: dg } = await API.getGuilds();
            setDiscordGuilds(dg || []);
          } catch (_) {}
        } catch (_) { setToken(null); LS.rm("wb_user"); }
      }
      setBooting(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuildsChange = (updated) => {
    setGuilds(updated);
    LS.set("wb_guilds", updated);
  };

  const handleLogout = async () => {
    try { await API.logout(); } catch (_) {}
    setToken(null); LS.rm("wb_user"); LS.rm("wb_guilds"); LS.rm("wb_active_guild");
    setUser(null); setGuilds([]);
    setView("landing");
  };

  const discordLogin = () => { window.location.href = `${API_BASE}/auth/discord`; };

  if (booting) {
    return (
      <>
        <GlobalStyles />
        <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:"var(--r-md)", background:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:20, animation:"float 2s ease-in-out infinite" }}>⚡</div>
            <div style={{ fontSize:14, color:"var(--text-m)" }}>Loading WalluBot…</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <NavBar
        user={user}
        view={view}
        onShowLanding={() => setView("landing")}
        onShowDashboard={() => setView("dashboard")}
        onLogin={discordLogin}
        onLogout={handleLogout}
      />
      {view === "landing" ? (
        <LandingPage user={user} onLogin={discordLogin} onShowDashboard={() => setView("dashboard")} />
      ) : (
        <Dashboard user={user} guilds={guilds} discordGuilds={discordGuilds} onGuildsChange={handleGuildsChange} />
      )}
    </>
  );
}