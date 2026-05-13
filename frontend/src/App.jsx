import { useState, useRef, useEffect, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:8000";

// ─── API CLIENT ───────────────────────────────────────────────────────────────
function getToken() { try { return localStorage.getItem("wb_token"); } catch { return null; } }
function setStoredToken(t) { try { if(t) localStorage.setItem("wb_token",t); else localStorage.removeItem("wb_token"); } catch{} }

async function apiFetch(path, opts = {}) {
  const { method = "GET", body, isForm = false } = opts;
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  if (!res.ok) {
    let err;
    try { err = await res.json(); } catch { err = {}; }
    throw new Error(err.detail || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// Typed API calls matching actual backend routes
const API = {
  // Auth
  discordLogin:    ()              => { window.location.href = `${API_BASE}/auth/discord`; },
  getMe:           ()              => apiFetch("/auth/me"),
  logout:          ()              => apiFetch("/auth/logout", { method: "POST" }),
  listSessions:    ()              => apiFetch("/auth/sessions"),
  revokeSession:   (id)            => apiFetch(`/auth/sessions/${id}/revoke`, { method: "POST" }),
  refresh:         ()              => apiFetch("/auth/refresh", { method: "POST" }),

  // Server config
  addServer:       (guild_id, name) => { const f=new FormData(); f.append("guild_id",guild_id); f.append("name",name); return apiFetch("/server/add",{method:"POST",body:f,isForm:true}); },
  getConfig:       (guild_id)       => apiFetch(`/server/config?guild_id=${encodeURIComponent(guild_id)}`),
  updateFaissK:    (guild_id, k)    => { const f=new FormData(); f.append("guild_id",guild_id); f.append("k",k); return apiFetch("/server/update-faiss-k",{method:"PATCH",body:f,isForm:true}); },
  updateBm25K:     (guild_id, k)    => { const f=new FormData(); f.append("guild_id",guild_id); f.append("k",k); return apiFetch("/server/update-bm25-k",{method:"PATCH",body:f,isForm:true}); },
  updateTemp:      (guild_id, k)    => { const f=new FormData(); f.append("guild_id",guild_id); f.append("k",k); return apiFetch("/server/update-temperature",{method:"PATCH",body:f,isForm:true}); },
  updateChunkSize: (guild_id, k)    => { const f=new FormData(); f.append("guild_id",guild_id); f.append("k",k); return apiFetch("/server/update-chunk-size",{method:"PATCH",body:f,isForm:true}); },
  updateChunkOverlap:(guild_id, k)  => { const f=new FormData(); f.append("guild_id",guild_id); f.append("k",k); return apiFetch("/server/update-chunk-overlap",{method:"PATCH",body:f,isForm:true}); },
  updateMaxToken:  (guild_id, k)    => { const f=new FormData(); f.append("guild_id",guild_id); f.append("k",k); return apiFetch("/server/update-max-token",{method:"PATCH",body:f,isForm:true}); },
  insertSystemPrompt:(guild_id,text) => { const f=new FormData(); f.append("guild_id",guild_id); f.append("text",text); return apiFetch("/server/insert-system-prompt",{method:"PUT",body:f,isForm:true}); },
  updateSystemPrompt:(guild_id,text) => { const f=new FormData(); f.append("guild_id",guild_id); f.append("text",text); return apiFetch("/server/update-system-prompt",{method:"PUT",body:f,isForm:true}); },

  // Channels
  addChannel:      (guild_id, channel_id) => { const f=new FormData(); f.append("guild_id",guild_id); f.append("channel_id",channel_id); return apiFetch("/channel/add",{method:"PUT",body:f,isForm:true}); },
  deleteChannel:   (guild_id, channel_id) => { const f=new FormData(); f.append("guild_id",guild_id); f.append("channel_id",channel_id); return apiFetch("/channel/delete",{method:"DELETE",body:f,isForm:true}); },
  addModChannel:   (guild_id, channel_id) => { const f=new FormData(); f.append("guild_id",guild_id); f.append("channel_id",channel_id); return apiFetch("/channel/add-mod",{method:"PUT",body:f,isForm:true}); },
  listChannels:    (guild_id)             => apiFetch(`/channel/list?guild_id=${encodeURIComponent(guild_id)}`),

  // Guilds (Discord)
  getGuilds:       ()              => apiFetch("/guilds"),
  getGuildChannels:(guild_id)      => apiFetch(`/guilds/${guild_id}/channels`),

  // Upload
  upload:          (guild_id, files, urls) => {
    const f=new FormData(); f.append("guild_id",guild_id);
    files.forEach(file=>f.append("files",file));
    if(urls) f.append("urls",urls);
    return apiFetch("/upload",{method:"PUT",body:f,isForm:true});
  },
  uploadContacts:  (guild_id, file) => { const f=new FormData(); f.append("guild_id",guild_id); f.append("file",file); return apiFetch("/upload/contacts",{method:"PUT",body:f,isForm:true}); },
  getAllUploads:    (guild_id)       => apiFetch(`/upload/all?guild_id=${encodeURIComponent(guild_id)}`),
  getSubUrls:      (url)            => apiFetch(`/upload/sub-urls?url=${encodeURIComponent(url)}`),

  // Query
  query:           (question, server) => apiFetch("/query",{method:"POST",body:{question,server}}),

  // Analytics
  getAnalytics:    (guild_id)       => apiFetch(`/analytics/summary?guild_id=${encodeURIComponent(guild_id)}`),
};

// ─── LOCAL STORAGE HELPERS ────────────────────────────────────────────────────
const DEFAULT_GUILD = { id: "1476466974098985067", name: "Main Server", createdAt: Date.now(), color: "#6366f1" };
const GUILD_COLORS  = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#10b981","#0ea5e9","#14b8a6"];

function ls(key, fallback) { try { const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; } catch { return fallback; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function lsStr(key) { try { return localStorage.getItem(key)||null; } catch { return null; } }
function lsStrSet(key, val) { try { localStorage.setItem(key, val); } catch {} }
function lsRemove(key) { try { localStorage.removeItem(key); } catch {} }

function getStoredGuilds()    { return ls("wb_guilds", [DEFAULT_GUILD]); }
function getStoredActiveId()  { return lsStr("wb_active_guild") || DEFAULT_GUILD.id; }
function getStoredUser()      { return ls("wb_user", null); }
function getStoredOnboarded() { return lsStr("wb_onboarded") === "true"; }

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'DM Sans', sans-serif; background: #07070f; color: #e2e8f0; -webkit-font-smoothing: antialiased; overflow: hidden; }

  :root {
    --bg-base: #07070f;
    --bg-surface: #0d0d1a;
    --bg-elevated: #161625;
    --bg-overlay: #1c1c2e;
    --border: rgba(255,255,255,0.055);
    --border-active: rgba(255,255,255,0.12);
    --border-focus: rgba(99,102,241,0.55);
    --text-primary: #f0f0f8;
    --text-secondary: rgba(240,240,248,0.58);
    --text-muted: rgba(240,240,248,0.28);
    --accent: #6366f1;
    --accent-light: rgba(99,102,241,0.1);
    --accent-glow: rgba(99,102,241,0.22);
    --accent-hover: #7c7ff5;
    --success: #22d3a0;
    --success-bg: rgba(34,211,160,0.08);
    --danger: #f16363;
    --danger-bg: rgba(241,99,99,0.08);
    --warning: #f5a623;
    --warning-bg: rgba(245,166,35,0.08);
    --radius-xs: 4px;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 18px;
    --radius-xl: 24px;
    --radius-full: 999px;
    --sidebar-w: 260px;
    --topbar-h: 54px;
    --tr: 0.18s cubic-bezier(0.4,0,0.2,1);
  }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }

  .anim-up    { animation: fadeUp .42s cubic-bezier(0.16,1,0.3,1) both; }
  .anim-in    { animation: fadeIn .28s ease both; }
  .d1{animation-delay:.05s} .d2{animation-delay:.10s} .d3{animation-delay:.15s}
  .d4{animation-delay:.20s} .d5{animation-delay:.25s} .d6{animation-delay:.30s}

  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:99px; }
  ::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.13); }

  .field {
    width:100%; background:var(--bg-base); border:1.5px solid var(--border);
    color:var(--text-primary); border-radius:var(--radius-sm); padding:10px 14px;
    font-size:13.5px; font-family:'DM Sans',sans-serif; outline:none;
    transition:border-color var(--tr), box-shadow var(--tr);
  }
  .field::placeholder { color:var(--text-muted); }
  .field:focus { border-color:var(--border-focus); box-shadow:0 0 0 3px var(--accent-glow); }
  .field-mono { font-family:'DM Mono',monospace !important; font-size:12px !important; }

  .btn { display:inline-flex; align-items:center; gap:7px; border:none; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-weight:500; border-radius:var(--radius-sm);
    transition:all var(--tr); white-space:nowrap; user-select:none; }
  .btn:disabled { opacity:.35; cursor:not-allowed; pointer-events:none; }

  .btn-primary { background:var(--accent); color:#fff; padding:10px 20px; font-size:13.5px;
    box-shadow:0 4px 20px var(--accent-glow); }
  .btn-primary:hover { background:var(--accent-hover); transform:translateY(-1px); box-shadow:0 8px 28px var(--accent-glow); }
  .btn-primary:active { transform:translateY(0); }

  .btn-ghost { background:transparent; color:var(--text-secondary); padding:8px 15px;
    font-size:13px; border:1.5px solid var(--border); }
  .btn-ghost:hover { background:var(--bg-elevated); color:var(--text-primary); border-color:var(--border-active); }

  .btn-danger { background:var(--danger-bg); color:var(--danger); padding:7px 13px;
    font-size:12.5px; border:1.5px solid rgba(241,99,99,0.18); }
  .btn-danger:hover { background:rgba(241,99,99,0.15); }

  .btn-success { background:var(--success-bg); color:var(--success); padding:10px 20px;
    font-size:13.5px; border:1.5px solid rgba(34,211,160,0.18); }
  .btn-success:hover { background:rgba(34,211,160,0.13); }

  .btn-icon { background:var(--bg-elevated); color:var(--text-secondary); padding:7px;
    border:1.5px solid var(--border); border-radius:var(--radius-sm); }
  .btn-icon:hover { color:var(--text-primary); border-color:var(--border-active); }

  .panel { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-lg); }
  .card-hover { transition:all var(--tr); }
  .card-hover:hover { border-color:var(--border-active); transform:translateY(-1px); }

  .tag { display:inline-flex; align-items:center; gap:4px; padding:3px 9px;
    border-radius:var(--radius-full); font-size:10.5px; font-weight:600; letter-spacing:.04em; }
  .tag-accent  { background:var(--accent-light); color:#818cf8; border:1px solid rgba(99,102,241,0.2); }
  .tag-success { background:var(--success-bg); color:var(--success); border:1px solid rgba(34,211,160,0.2); }
  .tag-danger  { background:var(--danger-bg); color:var(--danger); border:1px solid rgba(241,99,99,0.2); }
  .tag-warning { background:var(--warning-bg); color:var(--warning); border:1px solid rgba(245,166,35,0.2); }

  .nav-item { display:flex; align-items:center; gap:10px; padding:8px 10px;
    border-radius:var(--radius-sm); font-size:13px; font-weight:500;
    color:var(--text-secondary); cursor:pointer; transition:all var(--tr);
    border:none; background:none; font-family:'DM Sans',sans-serif; width:100%; text-align:left; }
  .nav-item:hover { background:var(--bg-elevated); color:var(--text-primary); }
  .nav-item.active { background:var(--accent-light); color:#818cf8; }
  .nav-icon { width:28px; height:28px; border-radius:var(--radius-xs); display:flex;
    align-items:center; justify-content:center; flex-shrink:0; font-size:13px; }
  .nav-item.active .nav-icon { background:rgba(99,102,241,0.2); }
  .nav-item:not(.active) .nav-icon { background:var(--bg-elevated); }

  .drop-zone { border:1.5px dashed var(--border); border-radius:var(--radius-md);
    padding:24px 20px; display:flex; flex-direction:column; align-items:center;
    gap:7px; cursor:pointer; transition:all var(--tr); text-align:center; }
  .drop-zone:hover { border-color:var(--accent); background:var(--accent-light); }

  .status-dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }
  .status-online  { background:var(--success); box-shadow:0 0 8px rgba(34,211,160,0.5); animation:pulse 2.5s ease infinite; }
  .status-offline { background:#4b5563; }

  .spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.1);
    border-top-color:currentColor; border-radius:50%; animation:spin .65s linear infinite; flex-shrink:0; }

  .data-table { width:100%; border-collapse:collapse; font-size:13px; }
  .data-table th { padding:9px 16px; text-align:left; color:var(--text-muted); font-weight:600;
    font-size:10.5px; letter-spacing:.06em; text-transform:uppercase; border-bottom:1px solid var(--border); }
  .data-table td { padding:11px 16px; border-bottom:1px solid rgba(255,255,255,0.035);
    color:var(--text-secondary); vertical-align:middle; }
  .data-table tr:hover td { background:var(--bg-elevated); color:var(--text-primary); }

  .mono { background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.15);
    border-radius:var(--radius-xs); padding:2px 6px;
    font-family:'DM Mono',monospace; font-size:11px; color:#a5b4fc; }

  .check-row { display:flex; align-items:center; gap:10px; padding:9px 16px;
    cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.035); transition:background var(--tr); }
  .check-row:hover { background:var(--bg-elevated); }
  .check-row.selected { background:rgba(99,102,241,0.05); }
  .custom-check { width:16px; height:16px; border-radius:4px; border:1.5px solid var(--border);
    flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all var(--tr); }
  .custom-check.checked { background:var(--accent); border-color:var(--accent); }

  .modal-bg  { animation:fadeIn .18s both; background:rgba(0,0,0,0.7); backdrop-filter:blur(12px); }
  .modal-box { animation:fadeUp .26s cubic-bezier(0.16,1,0.3,1) both; }

  .ob-progress-track { height:2px; background:rgba(255,255,255,0.06); border-radius:99px; overflow:hidden; }
  .ob-progress-fill  { height:100%; background:linear-gradient(90deg,#6366f1,#818cf8); border-radius:99px; transition:width 0.45s cubic-bezier(0.16,1,0.3,1); }

  .ob-step-dot { width:30px; height:30px; border-radius:50%; display:flex; align-items:center;
    justify-content:center; font-size:11.5px; font-weight:700; transition:all 0.28s; flex-shrink:0; }
  .ob-step-dot.done    { background:var(--success); color:#000; }
  .ob-step-dot.active  { background:var(--accent); color:#fff; box-shadow:0 0 18px var(--accent-glow); }
  .ob-step-dot.pending { background:var(--bg-elevated); color:var(--text-muted); border:1.5px solid var(--border); }
  .step-connector { flex:1; height:1px; background:var(--border); margin:0 5px; }
  .step-connector.done { background:var(--success); }

  .btn-discord { display:inline-flex; align-items:center; gap:10px; background:#5865f2; color:#fff;
    border:none; cursor:pointer; padding:12px 24px; border-radius:var(--radius-sm);
    font-size:14.5px; font-weight:600; font-family:'DM Sans',sans-serif; transition:all var(--tr);
    box-shadow:0 6px 24px rgba(88,101,242,0.3); }
  .btn-discord:hover { background:#4752c4; transform:translateY(-1px); }
  .btn-discord:active { transform:translateY(0); }

  .feature-card { background:var(--bg-surface); border:1px solid var(--border);
    border-radius:var(--radius-md); padding:18px; transition:all var(--tr); }
  .feature-card:hover { border-color:var(--border-active); background:var(--bg-elevated); transform:translateY(-2px); }

  .orb { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; }

  /* Slider styles */
  .slider-wrap { display:flex; flex-direction:column; gap:6px; }
  .slider-header { display:flex; justify-content:space-between; align-items:center; }
  .slider-label { font-size:11.5px; color:var(--text-muted); font-weight:600; letter-spacing:.05em; text-transform:uppercase; }
  .slider-value { font-family:'DM Mono',monospace; font-size:12px; color:#818cf8;
    background:var(--accent-light); border:1px solid rgba(99,102,241,0.18); border-radius:4px; padding:2px 8px; }
  input[type=range] {
    -webkit-appearance:none; width:100%; height:4px; background:var(--bg-overlay);
    border-radius:99px; outline:none; cursor:pointer;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance:none; width:16px; height:16px; background:var(--accent);
    border-radius:50%; cursor:pointer; box-shadow:0 0 8px var(--accent-glow); transition:transform .1s;
  }
  input[type=range]::-webkit-slider-thumb:hover { transform:scale(1.2); }
  input[type=range]::-webkit-slider-runnable-track { height:4px; border-radius:99px; }

  .channel-chip { display:inline-flex; align-items:center; gap:6px; padding:5px 10px;
    background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2);
    border-radius:var(--radius-xs); font-size:12px; color:#a5b4fc; font-family:'DM Mono',monospace; }
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

// ─── ICONS ────────────────────────────────────────────────────────────────────
const I = {
  Home:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Upload:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Globe:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Chat:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Database:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Settings:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M21 12h-1M4 12H3M12 21v-1M12 4V3"/></svg>,
  Plus:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Check:      () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Send:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  X:          () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevRight:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevDown:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Search:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  External:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Activity:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  User:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Bot:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  Logout:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Analytics:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Shield:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Discord:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>,
  Sparkle:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L9.75 9.75 3 12l6.75 2.25L12 21l2.25-6.75L21 12l-6.75-2.25z"/></svg>,
  ArrowRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Key:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  Edit:       () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Sheet:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>,
  Hash:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  Sliders:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  Save:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Refresh:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

// ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────
function inlineFormat(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} style={{color:"var(--text-primary)",fontWeight:600}}>{p.slice(2,-2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))   return <code key={i} className="mono">{p.slice(1,-1)}</code>;
    if (p.startsWith("*") && p.endsWith("*"))   return <em key={i}>{p.slice(1,-1)}</em>;
    return p;
  });
}
function MsgContent({ text }) {
  const lines = text.split("\n");
  const els = [];
  lines.forEach((line, i) => {
    if (line.startsWith("- ") || line.startsWith("* "))
      els.push(<div key={i} style={{display:"flex",gap:8,marginBottom:3}}><span style={{color:"#818cf8",flexShrink:0}}>›</span><span>{inlineFormat(line.slice(2))}</span></div>);
    else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      els.push(<div key={i} style={{display:"flex",gap:8,marginBottom:3}}><span style={{color:"#818cf8",minWidth:16,fontFamily:"'DM Mono',monospace",fontSize:11}}>{num}.</span><span>{inlineFormat(line.replace(/^\d+\.\s/,""))}</span></div>);
    } else if (line.startsWith("### "))
      els.push(<div key={i} style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginTop:8,marginBottom:3}}>{line.slice(4)}</div>);
    else if (line.trim()==="") els.push(<div key={i} style={{height:5}}/>);
    else els.push(<p key={i} style={{lineHeight:1.65,marginBottom:2}}>{inlineFormat(line)}</p>);
  });
  return <div style={{fontSize:13.5,color:"var(--text-secondary)",lineHeight:1.65}}>{els}</div>;
}
function TypingDots() {
  return <div style={{display:"flex",gap:4,alignItems:"center",padding:"4px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"rgba(129,140,248,0.45)",animation:`blink 1.2s ease ${i*0.2}s infinite`}}/>)}</div>;
}

// ─── SLIDER COMPONENT ─────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, unit = "", onChange, onSave, saving }) {
  return (
    <div className="slider-wrap">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value}{unit}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))} style={{flex:1}} />
        <button className="btn btn-ghost" onClick={onSave} disabled={saving} style={{padding:"5px 10px",fontSize:11.5,flexShrink:0}}>
          {saving ? <div className="spinner" style={{color:"var(--accent)"}} /> : <I.Save />}
        </button>
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:10.5,color:"var(--text-muted)"}}>{min}{unit}</span>
        <span style={{fontSize:10.5,color:"var(--text-muted)"}}>{max}{unit}</span>
      </div>
    </div>
  );
}

// ─── STATUS MESSAGE ───────────────────────────────────────────────────────────
function StatusMsg({ status }) {
  if (!status) return null;
  return <div style={{padding:"10px 14px",borderRadius:"var(--radius-sm)",fontSize:13.5,background:status.ok?"var(--success-bg)":"var(--danger-bg)",border:`1px solid ${status.ok?"rgba(34,211,160,0.2)":"rgba(241,99,99,0.2)"}`,color:status.ok?"var(--success)":"var(--danger)"}}>{status.msg}</div>;
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
const OB_STEPS = [
  { id:"welcome", label:"Welcome",     icon:<I.Sparkle /> },
  { id:"connect", label:"Connect",     icon:<I.Discord /> },
  { id:"server",  label:"Add Server",  icon:<I.Database /> },
  { id:"config",  label:"Configure",   icon:<I.Sliders /> },
  { id:"upload",  label:"Add Content", icon:<I.Upload /> },
  { id:"launch",  label:"Launch",      icon:<I.Bot /> },
];

function OBWelcome({ onNext }) {
  const features = [
    { icon:<I.Database />, title:"RAG Knowledge Base", desc:"Upload PDFs & URLs into a vector store that powers precise, cited answers." },
    { icon:<I.Bot />, title:"Discord AI Bot", desc:"Your bot answers questions from docs directly inside any Discord channel." },
    { icon:<I.Sliders />, title:"Tunable Parameters", desc:"Adjust FAISS-k, BM25-k, temperature, chunk sizes — all with live sliders." },
    { icon:<I.Hash />, title:"Channel Control", desc:"Configure which Discord channels the bot listens and logs to." },
  ];
  return (
    <div className="anim-up" style={{maxWidth:580,margin:"0 auto",textAlign:"center",padding:"0 24px"}}>
      <div style={{marginBottom:28,display:"inline-flex",alignItems:"center",gap:10,background:"var(--accent-light)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"var(--radius-full)",padding:"8px 18px"}}>
        <I.Sparkle /><span style={{fontSize:13,fontWeight:600,color:"#818cf8"}}>WalluBot Admin</span>
      </div>
      <h1 style={{fontSize:38,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",lineHeight:1.1,marginBottom:14,letterSpacing:"-0.03em"}}>
        Your Discord's<br /><span style={{background:"linear-gradient(135deg,#6366f1,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AI Brain</span>
      </h1>
      <p style={{fontSize:15.5,color:"var(--text-secondary)",lineHeight:1.65,marginBottom:32,maxWidth:460,margin:"0 auto 32px"}}>
        Build an intelligent Q&A bot from your documents. Setup takes &lt;5 minutes.
      </p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32,textAlign:"left"}}>
        {features.map((f,i)=>(
          <div key={i} className={`feature-card anim-up d${i+1}`}>
            <div style={{color:"#818cf8",marginBottom:8}}>{f.icon}</div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:4}}>{f.title}</div>
            <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.55}}>{f.desc}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary anim-up d5" onClick={onNext} style={{width:"100%",padding:"13px",justifyContent:"center",fontSize:15,fontFamily:"'Syne',sans-serif"}}>
        Get Started <I.ArrowRight />
      </button>
    </div>
  );
}

function OBConnect({ user, onNext, onLogin }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleRealDiscord = () => { API.discordLogin(); };

  const handleMockDiscord = () => {
    setLoading(true); setErr("");
    setTimeout(() => {
      const u = { discord_id:"123456789012345678", username:"ServerAdmin#0001", avatar:null, email:"admin@example.com" };
      onLogin(u, "mock_token_" + Date.now());
      setLoading(false);
      onNext();
    }, 900);
  };

  if (user) return (
    <div className="anim-up" style={{maxWidth:480,margin:"0 auto",textAlign:"center",padding:"0 24px"}}>
      <div style={{width:68,height:68,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:26,fontWeight:700,color:"#fff"}}>
        {user.username?.slice(0,1).toUpperCase()||"U"}
      </div>
      <h2 style={{fontSize:26,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:6}}>Connected!</h2>
      <p style={{color:"var(--text-secondary)",marginBottom:24,fontSize:15}}>Signed in as <strong style={{color:"var(--text-primary)"}}>{user.username}</strong></p>
      <button className="btn btn-primary" onClick={onNext} style={{width:"100%",padding:"13px",justifyContent:"center"}}>
        Continue <I.ArrowRight />
      </button>
    </div>
  );

  return (
    <div className="anim-up" style={{maxWidth:480,margin:"0 auto",textAlign:"center",padding:"0 24px"}}>
      <div style={{width:60,height:60,borderRadius:"var(--radius-md)",background:"rgba(88,101,242,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px",border:"1px solid rgba(88,101,242,0.25)"}}>
        <I.Discord />
      </div>
      <h2 style={{fontSize:28,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:10}}>Connect Discord</h2>
      <p style={{color:"var(--text-secondary)",lineHeight:1.65,marginBottom:24,fontSize:14.5}}>
        Login with your Discord account so we can verify server admin access.
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
        <button className="btn-discord" onClick={handleRealDiscord} style={{width:"100%",justifyContent:"center",fontSize:14.5,padding:"13px 24px"}}>
          <I.Discord /> Sign in with Discord (Production)
        </button>
        <button className="btn btn-ghost" onClick={handleMockDiscord} disabled={loading} style={{width:"100%",justifyContent:"center",padding:"11px"}}>
          {loading ? <><div className="spinner"/>Connecting…</> : "Continue without Discord (Dev)"}
        </button>
      </div>
      {err && <p style={{fontSize:12.5,color:"var(--danger)"}}>{err}</p>}
      <p style={{fontSize:11.5,color:"var(--text-muted)"}}>We read your username & avatar only — we never post on your behalf.</p>
    </div>
  );
}

function OBServer({ guilds, activeId, onSelect, onCreate, onNext }) {
  const [guildId, setGuildId]   = useState("");
  const [guildName, setGuildName] = useState("");
  const [color, setColor]       = useState(GUILD_COLORS[0]);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");

  const create = async () => {
    const tid = guildId.trim(), tname = guildName.trim();
    if (!tid) { setErr("Guild ID is required"); return; }
    if (guilds.find(g=>g.id===tid)) { setErr("Guild ID already exists"); return; }
    setLoading(true); setErr("");
    try {
      await API.addServer(tid, tname || `Server ${tid.slice(0,8)}`);
    } catch (_) { /* if backend not ready, still add locally */ }
    onCreate({ id:tid, name:tname||`Server ${tid.slice(0,8)}`, createdAt:Date.now(), color });
    setGuildId(""); setGuildName(""); setLoading(false);
  };

  return (
    <div className="anim-up" style={{maxWidth:520,margin:"0 auto",padding:"0 24px"}}>
      <h2 style={{fontSize:26,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:8}}>Add Your Discord Server</h2>
      <p style={{color:"var(--text-secondary)",marginBottom:22,fontSize:14.5,lineHeight:1.6}}>
        Enter your Discord Server ID to register it. Find it in Server Settings → Widget.
      </p>

      {guilds.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10.5,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:8}}>Registered Servers</div>
          {guilds.map(g=>(
            <div key={g.id} onClick={()=>onSelect(g.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:"var(--radius-md)",border:`1.5px solid ${g.id===activeId?"var(--border-focus)":"var(--border)"}`,marginBottom:8,cursor:"pointer",background:g.id===activeId?"var(--accent-light)":"var(--bg-surface)"}}>
              <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:`${g.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:g.color,fontFamily:"'Syne',sans-serif"}}>
                {g.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:500,color:"var(--text-primary)"}}>{g.name}</div>
                <span className="mono" style={{fontSize:10.5,marginTop:2,display:"inline-block"}}>{g.id.slice(0,16)}…</span>
              </div>
              {g.id===activeId && <span className="tag tag-success">Selected</span>}
            </div>
          ))}
        </div>
      )}

      <div className="panel" style={{padding:"18px",marginBottom:18}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:14}}>Register New Server</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div>
            <label style={{fontSize:11,color:"var(--text-muted)",fontWeight:700,display:"block",marginBottom:5,letterSpacing:".05em",textTransform:"uppercase"}}>Discord Server ID *</label>
            <input value={guildId} onChange={e=>{setGuildId(e.target.value);setErr("");}} placeholder="e.g. 1476466974098985067" className="field field-mono" />
          </div>
          <div>
            <label style={{fontSize:11,color:"var(--text-muted)",fontWeight:700,display:"block",marginBottom:5,letterSpacing:".05em",textTransform:"uppercase"}}>Display Name</label>
            <input value={guildName} onChange={e=>setGuildName(e.target.value)} placeholder="My Server" className="field" />
          </div>
          <div>
            <label style={{fontSize:11,color:"var(--text-muted)",fontWeight:700,display:"block",marginBottom:8,letterSpacing:".05em",textTransform:"uppercase"}}>Color</label>
            <div style={{display:"flex",gap:8}}>{GUILD_COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:`2.5px solid ${color===c?"#fff":"transparent"}`,transition:"border var(--tr)"}}/>)}</div>
          </div>
          {err && <p style={{fontSize:12.5,color:"var(--danger)"}}>{err}</p>}
          <button className="btn btn-ghost" onClick={create} disabled={loading} style={{justifyContent:"center"}}>
            {loading?<><div className="spinner"/>Registering…</>:<><I.Plus/>Register Server</>}
          </button>
        </div>
      </div>

      <button className="btn btn-primary" onClick={onNext} disabled={!activeId} style={{width:"100%",padding:"12px",justifyContent:"center",fontSize:14.5}}>
        Continue <I.ArrowRight />
      </button>
    </div>
  );
}

function OBConfig({ guildId, onNext, onSkip }) {
  const [config, setConfig] = useState({ faiss_k:5, bm25_k:5, temperature:0.7, chunk_size:500, chunk_overlap:100, max_tokens:512 });
  const [prompt, setPrompt]   = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState({});
  const [status, setStatus]   = useState(null);

  useEffect(() => {
    API.getConfig(guildId).then(d => {
      setConfig(c=>({...c,...d}));
      setPrompt(d.system_prompt||"");
    }).catch(()=>{});
  }, [guildId]);

  const save = async (field, apiCall) => {
    setSaving(s=>({...s,[field]:true}));
    try { await apiCall(); setStatus({ok:true,msg:`✓ ${field} saved`}); }
    catch(e) { setStatus({ok:false,msg:`✗ ${e.message}`}); }
    finally { setSaving(s=>({...s,[field]:false})); }
  };

  return (
    <div className="anim-up" style={{maxWidth:540,margin:"0 auto",padding:"0 24px"}}>
      <h2 style={{fontSize:26,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:8}}>Configure RAG Settings</h2>
      <p style={{color:"var(--text-secondary)",marginBottom:24,fontSize:14.5,lineHeight:1.6}}>
        Tune retrieval and generation parameters. These can be changed anytime.
      </p>

      <div className="panel" style={{padding:"20px 22px",marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:18,display:"flex",alignItems:"center",gap:8}}><I.Sliders/> Retrieval Parameters</div>
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <Slider label="FAISS-K (vector results)" value={config.faiss_k} min={1} max={20}
            onChange={v=>setConfig(c=>({...c,faiss_k:v}))}
            onSave={()=>save("faiss_k",()=>API.updateFaissK(guildId,config.faiss_k))}
            saving={saving.faiss_k} />
          <Slider label="BM25-K (keyword results)" value={config.bm25_k} min={1} max={20}
            onChange={v=>setConfig(c=>({...c,bm25_k:v}))}
            onSave={()=>save("bm25_k",()=>API.updateBm25K(guildId,config.bm25_k))}
            saving={saving.bm25_k} />
          <Slider label="Temperature" value={config.temperature} min={0} max={1} step={0.05}
            onChange={v=>setConfig(c=>({...c,temperature:v}))}
            onSave={()=>save("temperature",()=>API.updateTemp(guildId,config.temperature))}
            saving={saving.temperature} />
          <Slider label="Max Tokens" value={config.max_tokens} min={128} max={4096} step={64}
            onChange={v=>setConfig(c=>({...c,max_tokens:v}))}
            onSave={()=>save("max_tokens",()=>API.updateMaxToken(guildId,config.max_tokens))}
            saving={saving.max_tokens} />
          <Slider label="Chunk Size" value={config.chunk_size} min={100} max={999}
            onChange={v=>setConfig(c=>({...c,chunk_size:v}))}
            onSave={()=>save("chunk_size",()=>API.updateChunkSize(guildId,config.chunk_size))}
            saving={saving.chunk_size} />
          <Slider label="Chunk Overlap" value={config.chunk_overlap} min={100} max={1000}
            onChange={v=>setConfig(c=>({...c,chunk_overlap:v}))}
            onSave={()=>save("chunk_overlap",()=>API.updateChunkOverlap(guildId,config.chunk_overlap))}
            saving={saving.chunk_overlap} />
        </div>
      </div>

      <div className="panel" style={{padding:"20px 22px",marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:12}}>System Prompt</div>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4} className="field"
          placeholder="You are a helpful assistant for this Discord server..." style={{resize:"vertical",lineHeight:1.6}} />
        <button className="btn btn-ghost" onClick={()=>save("system_prompt",()=>API.updateSystemPrompt(guildId,prompt))} disabled={saving.system_prompt}
          style={{marginTop:10,width:"100%",justifyContent:"center"}}>
          {saving.system_prompt?<><div className="spinner"/>Saving…</>:<><I.Save/>Save Prompt</>}
        </button>
      </div>

      {status && <div style={{marginBottom:12}}><StatusMsg status={status}/></div>}
      <div style={{display:"flex",gap:10}}>
        <button className="btn btn-ghost" onClick={onSkip} style={{flex:1,justifyContent:"center"}}>Skip for now</button>
        <button className="btn btn-primary" onClick={onNext} style={{flex:2,padding:"12px",justifyContent:"center"}}>Continue <I.ArrowRight /></button>
      </div>
    </div>
  );
}

function OBUpload({ guildId, onNext, onSkip }) {
  const [urls, setUrls]   = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState(null);
  const fileRef = useRef(null);

  const upload = async () => {
    if (!urls.trim() && !files.length) return;
    setLoading(true); setStatus(null);
    try {
      const d = await API.upload(guildId, files, urls.trim());
      setStatus({ok:true,msg:`✓ ${d.urls_processed||0} URL(s), ${d.pdfs_processed||0} PDF(s) ingested`});
      setUrls(""); setFiles([]);
    } catch(e) { setStatus({ok:false,msg:"✗ "+e.message}); }
    finally { setLoading(false); }
  };

  return (
    <div className="anim-up" style={{maxWidth:520,margin:"0 auto",padding:"0 24px"}}>
      <h2 style={{fontSize:26,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:8}}>Add Content</h2>
      <p style={{color:"var(--text-secondary)",marginBottom:22,fontSize:14.5,lineHeight:1.6}}>
        Ingest PDFs or URLs into your knowledge base vector store.
      </p>

      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
        <div className="panel" style={{padding:"18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{color:"#818cf8"}}><I.Globe/></div>
            <span style={{fontSize:13.5,fontWeight:600,color:"var(--text-primary)"}}>Website URLs</span>
            <span className="tag tag-accent" style={{marginLeft:"auto",fontSize:9.5}}>One per line</span>
          </div>
          <textarea value={urls} onChange={e=>setUrls(e.target.value)} rows={3} className="field"
            placeholder={"https://docs.example.com\nhttps://yoursite.com/about"}
            style={{resize:"vertical",fontFamily:"'DM Mono',monospace",fontSize:12,lineHeight:1.6}} />
        </div>

        <div className="panel" style={{padding:"18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{color:"#818cf8"}}><I.Upload/></div>
            <span style={{fontSize:13.5,fontWeight:600,color:"var(--text-primary)"}}>PDF Documents</span>
          </div>
          <div className="drop-zone" onClick={()=>fileRef.current?.click()}
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{e.preventDefault();setFiles(p=>[...p,...[...e.dataTransfer.files].filter(f=>f.type==="application/pdf")]);}}>
            <I.Upload /><p style={{fontSize:13.5,color:"var(--text-secondary)"}}>Drop PDFs or <span style={{color:"#818cf8"}}>browse</span></p>
            <input ref={fileRef} type="file" accept=".pdf" multiple style={{display:"none"}} onChange={e=>setFiles(p=>[...p,...[...e.target.files]])} />
          </div>
          {files.length>0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
              {files.map((f,i)=>(
                <div key={i} className="channel-chip">
                  {f.name.length>22?f.name.slice(0,19)+"…":f.name}
                  <span onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{cursor:"pointer",opacity:.5,display:"flex"}}><I.X/></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {status && <div style={{marginBottom:12}}><StatusMsg status={status}/></div>}

      <div style={{display:"flex",gap:10}}>
        <button className="btn btn-ghost" onClick={onSkip} style={{flex:1,justifyContent:"center"}}>Skip</button>
        {status?.ok
          ? <button className="btn btn-primary" onClick={onNext} style={{flex:2,padding:"12px",justifyContent:"center"}}>Continue <I.ArrowRight /></button>
          : <button className="btn btn-primary" onClick={upload} disabled={loading||(!urls.trim()&&!files.length)} style={{flex:2,padding:"12px",justifyContent:"center"}}>
              {loading?<><div className="spinner"/>Ingesting…</>:<><I.Upload/>Ingest Content</>}
            </button>
        }
      </div>
    </div>
  );
}

function OBLaunch({ user, guilds, activeId, onFinish }) {
  const g = guilds.find(x=>x.id===activeId)||guilds[0];
  const steps = [
    { label:"Discord account connected", done:!!user },
    { label:"Server registered", done:!!g },
    { label:"RAG parameters configured", done:true },
    { label:"Knowledge base ready", done:true },
  ];
  return (
    <div className="anim-up" style={{maxWidth:500,margin:"0 auto",textAlign:"center",padding:"0 24px"}}>
      <div style={{width:78,height:78,borderRadius:"50%",background:"linear-gradient(135deg,#22d3a0,#059669)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px",animation:"float 3s ease-in-out infinite"}}>
        <I.Bot />
      </div>
      <h2 style={{fontSize:30,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:8}}>You're All Set! 🎉</h2>
      <p style={{color:"var(--text-secondary)",fontSize:14.5,lineHeight:1.65,marginBottom:26}}>
        WalluBot is configured for <strong style={{color:"var(--text-primary)"}}>{g?.name}</strong>.
      </p>
      <div className="panel" style={{padding:"16px",marginBottom:22,textAlign:"left"}}>
        {steps.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<steps.length-1?"1px solid var(--border)":"none"}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:s.done?"var(--success-bg)":"var(--bg-elevated)",border:`1px solid ${s.done?"rgba(34,211,160,0.3)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:s.done?"var(--success)":"var(--text-muted)"}}>
              {s.done?<I.Check/>:<span style={{fontSize:9}}>○</span>}
            </div>
            <span style={{fontSize:13.5,color:s.done?"var(--text-primary)":"var(--text-muted)"}}>{s.label}</span>
            {s.done && <span className="tag tag-success" style={{marginLeft:"auto",fontSize:9.5}}>DONE</span>}
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={onFinish} style={{width:"100%",padding:"13px",justifyContent:"center",fontSize:15,fontFamily:"'Syne',sans-serif"}}>
        Open Dashboard <I.ArrowRight />
      </button>
    </div>
  );
}

function OnboardingFlow({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [user, setUser]     = useState(getStoredUser());
  const [guilds, setGuilds] = useState(getStoredGuilds());
  const [activeId, setActiveId] = useState(getStoredActiveId());
  const progress = Math.round((step / (OB_STEPS.length-1)) * 100);
  const next = () => setStep(s=>Math.min(s+1,OB_STEPS.length-1));

  const handleLogin = (u, token) => {
    lsSet("wb_user",u); setStoredToken(token); setUser(u);
  };
  const createGuild = g => {
    const updated=[...guilds,g]; setGuilds(updated); lsSet("wb_guilds",updated);
    setActiveId(g.id); lsStrSet("wb_active_guild",g.id);
  };
  const selectGuild = id => { setActiveId(id); lsStrSet("wb_active_guild",id); };

  return (
    <div style={{position:"fixed",inset:0,background:"var(--bg-base)",display:"flex",flexDirection:"column",overflow:"auto",zIndex:1000}}>
      <div className="orb orb-purple" style={{width:600,height:600,top:-200,right:-200,background:"rgba(99,102,241,0.12)"}}/>
      <div className="orb" style={{width:350,height:350,bottom:-100,left:-100,background:"rgba(139,92,246,0.08)"}}/>

      <div style={{position:"relative",padding:"20px 32px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:"var(--radius-sm)",background:"var(--accent-light)",display:"flex",alignItems:"center",justifyContent:"center",color:"#818cf8"}}><I.Bot/></div>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"var(--text-primary)"}}>WalluBot</span>
          </div>
          <button className="btn btn-ghost" onClick={onSkip} style={{padding:"5px 13px",fontSize:12}}>Skip Setup</button>
        </div>

        <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
          {OB_STEPS.map((s,i)=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",flex:i<OB_STEPS.length-1?1:"none"}}>
              <div className={`ob-step-dot ${i<step?"done":i===step?"active":"pending"}`}>
                {i<step?<I.Check/>:<span style={{fontSize:11}}>{i+1}</span>}
              </div>
              {i<OB_STEPS.length-1&&<div className={`step-connector ${i<step?"done":""}`}/>}
            </div>
          ))}
        </div>
        <div className="ob-progress-track" style={{marginBottom:6}}><div className="ob-progress-fill" style={{width:`${progress}%`}}/></div>
        <div style={{fontSize:11.5,color:"var(--text-muted)"}}>Step {step+1} of {OB_STEPS.length} · {OB_STEPS[step].label}</div>
      </div>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"36px 24px",position:"relative"}}>
        {step===0 && <OBWelcome onNext={next}/>}
        {step===1 && <OBConnect user={user} onNext={next} onLogin={handleLogin}/>}
        {step===2 && <OBServer guilds={guilds} activeId={activeId} onSelect={selectGuild} onCreate={createGuild} onNext={next}/>}
        {step===3 && <OBConfig guildId={activeId} onNext={next} onSkip={next}/>}
        {step===4 && <OBUpload guildId={activeId} onNext={next} onSkip={next}/>}
        {step===5 && <OBLaunch user={user} guilds={guilds} activeId={activeId} onFinish={()=>{lsStrSet("wb_onboarded","true");onComplete(user,guilds,activeId);}}/>}
      </div>
    </div>
  );
}

// ─── CHAT PANEL ───────────────────────────────────────────────────────────────
const CHAT_SUGGESTIONS = ["What documents are available?","Summarize the knowledge base","What topics can you help with?","How do I add more content?"];

function ChatPanel({ isOpen, guildId, guildName }) {
  const [messages, setMessages] = useState([]);
  const [history, setHistory]   = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showSugg, setShowSugg] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);
  useEffect(()=>{ if(isOpen) setTimeout(()=>inputRef.current?.focus(),250); },[isOpen]);

  const callAPI = useCallback(async (question, hist) => {
    setLoading(true);
    try {
      const d = await API.query(question, guildId);
      const text = d.answer || d.response || JSON.stringify(d);
      setMessages(p=>[...p,{role:"assistant",content:text,id:Date.now()}]);
      setHistory(p=>[...p,{role:"assistant",content:text}]);
    } catch(e) {
      setMessages(p=>[...p,{role:"assistant",content:"Error: "+e.message,id:Date.now(),error:true}]);
    } finally { setLoading(false); }
  },[guildId]);

  const send = useCallback((text) => {
    const q=(text||input).trim();
    if(!q||loading) return;
    setShowSugg(false); setInput("");
    if(inputRef.current) inputRef.current.style.height="auto";
    const hist=[...history,{role:"user",content:q}];
    setMessages(p=>[...p,{role:"user",content:q,id:Date.now()}]);
    setHistory(hist);
    callAPI(q, hist);
  },[input,loading,history,callAPI]);

  return (
    <div style={{position:"fixed",bottom:82,right:22,width:385,height:530,background:"var(--bg-surface)",border:"1px solid var(--border-active)",borderRadius:"var(--radius-xl)",boxShadow:"0 40px 100px rgba(0,0,0,0.7)",zIndex:500,display:"flex",flexDirection:"column",overflow:"hidden",transition:"transform .32s cubic-bezier(0.16,1,0.3,1), opacity .18s ease",transform:isOpen?"scale(1) translateY(0)":"scale(0.9) translateY(22px)",opacity:isOpen?1:0,pointerEvents:isOpen?"all":"none",transformOrigin:"bottom right"}}>
      <div style={{padding:"12px 15px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,background:"var(--bg-elevated)",flexShrink:0}}>
        <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:"var(--accent-light)",display:"flex",alignItems:"center",justifyContent:"center"}}><I.Bot/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",fontFamily:"'Syne',sans-serif"}}>{guildName}</div>
          <div style={{fontSize:10.5,color:"var(--text-muted)"}}>RAG Assistant</div>
        </div>
        <span className="status-dot status-online"/>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
          <div style={{width:24,height:24,borderRadius:"var(--radius-xs)",background:"var(--accent-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><I.Bot/></div>
          <div>
            <div style={{background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:"4px 10px 10px 10px",padding:"9px 13px",fontSize:13.5,color:"var(--text-secondary)",lineHeight:1.6,maxWidth:290}}>
              Hello! Ask me anything about <strong style={{color:"var(--text-primary)"}}>{guildName}</strong>.
            </div>
            {showSugg && (
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:7}}>
                {CHAT_SUGGESTIONS.map((s,i)=>(
                  <button key={i} onClick={()=>send(s)} style={{padding:"4px 10px",borderRadius:"var(--radius-full)",border:"1px solid var(--border)",background:"var(--bg-elevated)",color:"var(--text-muted)",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all var(--tr)"}}
                    onMouseEnter={e=>{e.target.style.borderColor="var(--accent)";e.target.style.color="var(--text-primary)";}}
                    onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--text-muted)";}}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {messages.map(msg=>(
          <div key={msg.id} className="anim-up">
            {msg.role==="user"?(
              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <div style={{background:"var(--accent)",borderRadius:"10px 4px 10px 10px",padding:"8px 13px",fontSize:13.5,color:"#fff",maxWidth:270,lineHeight:1.55}}>{msg.content}</div>
              </div>
            ):(
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <div style={{width:24,height:24,borderRadius:"var(--radius-xs)",background:"var(--accent-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><I.Bot/></div>
                <div style={{background:msg.error?"var(--danger-bg)":"var(--bg-elevated)",border:`1px solid ${msg.error?"rgba(241,99,99,0.2)":"var(--border)"}`,borderRadius:"4px 10px 10px 10px",padding:"9px 13px",maxWidth:290}}>
                  {msg.error?<span style={{fontSize:12,color:"var(--danger)"}}>{msg.content}</span>:<MsgContent text={msg.content}/>}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:8,alignItems:"flex-start"}}><div style={{width:24,height:24,borderRadius:"var(--radius-xs)",background:"var(--accent-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><I.Bot/></div><div style={{background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:"4px 10px 10px 10px",padding:"10px 13px"}}><TypingDots/></div></div>}
        <div ref={bottomRef}/>
      </div>

      <div style={{padding:"9px 11px 12px",borderTop:"1px solid var(--border)",background:"var(--bg-elevated)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:8,background:"var(--bg-base)",border:"1.5px solid var(--border)",borderRadius:"var(--radius-sm)",padding:"6px 6px 6px 11px",transition:"border-color var(--tr)"}}
          onFocusCapture={e=>e.currentTarget.style.borderColor="var(--border-focus)"}
          onBlurCapture={e=>e.currentTarget.style.borderColor="var(--border)"}>
          <textarea ref={inputRef} value={input}
            onChange={e=>{setInput(e.target.value);const el=e.target;el.style.height="auto";el.style.height=Math.min(el.scrollHeight,90)+"px";}}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder="Ask a question…" rows={1} disabled={loading}
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:"var(--text-primary)",fontSize:13.5,lineHeight:1.5,resize:"none",fontFamily:"'DM Sans',sans-serif",minHeight:22,maxHeight:90}}/>
          <button onClick={()=>send()} disabled={loading||!input.trim()} className="btn-icon"
            style={{width:28,height:28,borderRadius:"var(--radius-xs)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:input.trim()&&!loading?"var(--accent)":undefined,color:input.trim()&&!loading?"#fff":undefined,borderColor:input.trim()&&!loading?"var(--accent)":undefined}}>
            {loading?<div className="spinner" style={{color:"var(--accent)"}}/>:<I.Send/>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD TABS ───────────────────────────────────────────────────────────
function OverviewTab({ guilds, activeGuild, user }) {
  const [analytics, setAnalytics] = useState(null);
  useEffect(() => {
    API.getAnalytics(activeGuild.id).then(setAnalytics).catch(()=>{});
  }, [activeGuild.id]);

  return (
    <div style={{padding:"28px 32px",overflowY:"auto",flex:1}}>
      {user && (
        <div className="panel anim-up" style={{padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:"#fff",fontFamily:"'Syne',sans-serif",flexShrink:0}}>
            {user.username?.slice(0,1).toUpperCase()||"U"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:600,color:"var(--text-primary)"}}>{user.username||"Admin"}</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{user.email||user.discord_id}</div>
          </div>
          <span className="tag tag-success">Admin</span>
        </div>
      )}

      <div style={{marginBottom:22}}>
        <div style={{fontSize:10.5,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:5}}>Dashboard</div>
        <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",letterSpacing:"-0.02em"}}>{activeGuild.name}</h1>
        <p style={{fontSize:13.5,color:"var(--text-secondary)",marginTop:4}}>Guild ID: <span className="mono">{activeGuild.id}</span></p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        {[
          { label:"Guilds", value:guilds.length, sub:"Knowledge bases", icon:<I.Database/>, col:"#6366f1" },
          { label:"Total Queries", value:analytics?.total_queries??"-", sub:"All time", icon:<I.Activity/>, col:"#22d3a0" },
          { label:"Status", value:"Online", sub:"All systems go", icon:<I.Shield/>, col:"#f5a623" },
        ].map((s,i)=>(
          <div key={i} className={`panel card-hover anim-up d${i+1}`} style={{padding:"18px 20px"}}>
            <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:`${s.col}18`,display:"flex",alignItems:"center",justifyContent:"center",color:s.col,marginBottom:12}}>{s.icon}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,color:"var(--text-primary)",letterSpacing:"-0.03em",marginBottom:3}}>{s.value}</div>
            <div style={{fontSize:12,color:"var(--text-muted)"}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="panel anim-up d3" style={{overflow:"hidden",marginBottom:18}}>
        <div style={{padding:"12px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:13.5,fontWeight:600,color:"var(--text-primary)"}}>All Knowledge Bases</span>
          <span className="tag tag-accent">{guilds.length}</span>
        </div>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Guild ID</th><th>Created</th><th>Status</th></tr></thead>
          <tbody>
            {guilds.map(g=>(
              <tr key={g.id}>
                <td><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:7,height:7,borderRadius:"50%",background:g.color||"#6366f1"}}/><span style={{fontWeight:500,color:g.id===activeGuild.id?"var(--text-primary)":undefined}}>{g.name}</span>{g.id===activeGuild.id&&<span className="tag tag-success" style={{fontSize:9}}>ACTIVE</span>}</div></td>
                <td><span className="mono">{g.id.slice(0,14)}…</span></td>
                <td style={{color:"var(--text-muted)"}}>{g.createdAt?new Date(g.createdAt).toLocaleDateString():"—"}</td>
                <td><span className="status-dot status-online" style={{display:"inline-block"}}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel anim-up d4" style={{padding:"18px 20px"}}>
        <div style={{fontSize:13.5,fontWeight:600,color:"var(--text-primary)",marginBottom:14}}>Quick Start</div>
        {[
          ["Register & configure your server","Head to Server Config to fine-tune RAG parameters."],
          ["Set allowed channels","Under Channels, choose which channels the bot responds in."],
          ["Ingest documents","Upload PDFs or paste URLs in the Knowledge Base tab."],
          ["Test with chat","Use the chat widget (bottom-right) to verify answers."],
        ].map(([title,desc],i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"9px 0",borderBottom:i<3?"1px solid var(--border)":"none"}}>
            <div style={{width:20,height:20,borderRadius:"var(--radius-xs)",background:"var(--accent-light)",color:"#818cf8",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'DM Mono',monospace"}}>{i+1}</div>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:"var(--text-primary)",marginBottom:2}}>{title}</div>
              <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.5}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadTab({ guildId }) {
  const [urls, setUrls]         = useState("");
  const [files, setFiles]       = useState([]);
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [allUploads, setAllUploads] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [sheetFile, setSheetFile] = useState(null);
  const [sheetStatus, setSheetStatus] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const fileRef  = useRef(null);
  const sheetRef = useRef(null);

  const loadUploads = useCallback(() => {
    setLoadingList(true);
    API.getAllUploads(guildId).then(d=>setAllUploads(Array.isArray(d)?d:d.uploads||[])).catch(()=>{}).finally(()=>setLoadingList(false));
  },[guildId]);

  useEffect(()=>{ loadUploads(); },[loadUploads]);

  const handleUpload = async () => {
    if (!urls.trim() && !files.length) return;
    setLoading(true); setStatus(null);
    try {
      const d = await API.upload(guildId, files, urls.trim());
      setStatus({ok:true,msg:`✓ ${d.urls_processed||0} URL(s), ${d.pdfs_processed||0} PDF(s) ingested`});
      setUrls(""); setFiles([]); loadUploads();
    } catch(e) { setStatus({ok:false,msg:"✗ "+e.message}); }
    finally { setLoading(false); }
  };

  const handleSheet = async () => {
    if (!sheetFile) return;
    setSheetLoading(true); setSheetStatus(null);
    try {
      const d = await API.uploadContacts(guildId, sheetFile);
      setSheetStatus({ok:true,msg:"✓ "+d.message}); setSheetFile(null);
    } catch(e) { setSheetStatus({ok:false,msg:"✗ "+e.message}); }
    finally { setSheetLoading(false); }
  };

  return (
    <div style={{padding:"28px 32px",overflowY:"auto",flex:1}}>
      <div style={{maxWidth:640}}>
        <div style={{fontSize:10.5,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:5}}>Knowledge Base</div>
        <h1 style={{fontSize:22,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:4}}>Upload Content</h1>
        <p style={{fontSize:13.5,color:"var(--text-secondary)",marginBottom:24,lineHeight:1.6}}>Ingest URLs and PDFs into the active vector store via <code className="mono">/upload</code>.</p>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="panel anim-up" style={{padding:"18px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{color:"#818cf8"}}><I.Globe/></div>
              <span style={{fontSize:13.5,fontWeight:600,color:"var(--text-primary)"}}>Web URLs</span>
              <span className="tag tag-accent" style={{marginLeft:"auto",fontSize:9.5}}>One per line</span>
            </div>
            <textarea value={urls} onChange={e=>setUrls(e.target.value)} placeholder={"https://example.com/docs\nhttps://another.com"} rows={4} className="field"
              style={{resize:"vertical",lineHeight:1.6,fontFamily:"'DM Mono',monospace",fontSize:12}} />
          </div>

          <div className="panel anim-up d1" style={{padding:"18px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{color:"#818cf8"}}><I.Upload/></div>
              <span style={{fontSize:13.5,fontWeight:600,color:"var(--text-primary)"}}>PDF Files</span>
            </div>
            <div className="drop-zone" onClick={()=>fileRef.current?.click()}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();setFiles(p=>[...p,...[...e.dataTransfer.files].filter(f=>f.type==="application/pdf")]);}}>
              <I.Upload/><p style={{fontSize:13.5,color:"var(--text-secondary)"}}>Drop PDFs here or <span style={{color:"#818cf8"}}>browse</span></p>
              <input ref={fileRef} type="file" accept=".pdf" multiple style={{display:"none"}} onChange={e=>setFiles(p=>[...p,...[...e.target.files]])}/>
            </div>
            {files.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>{files.map((f,i)=><div key={i} className="channel-chip">{f.name.length>24?f.name.slice(0,21)+"…":f.name}<span onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{cursor:"pointer",opacity:.5,display:"flex"}}><I.X/></span></div>)}</div>}
          </div>

          {status&&<StatusMsg status={status}/>}
          <button className="btn btn-primary anim-up d2" onClick={handleUpload} disabled={loading||(!urls.trim()&&!files.length)} style={{width:"100%",padding:"12px",justifyContent:"center"}}>
            {loading?<><div className="spinner"/>Ingesting…</>:<><I.Upload/>Upload to Vector Store</>}
          </button>

          {/* Contacts sheet */}
          <div style={{borderTop:"1px dashed var(--border)",paddingTop:22,marginTop:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{color:"var(--success)"}}><I.Sheet/></div>
              <span style={{fontSize:13.5,fontWeight:600,color:"var(--text-primary)"}}>Structured Data (.xlsx)</span>
              <span className="tag tag-success" style={{marginLeft:"auto",fontSize:9.5}}>Contacts / Structured</span>
            </div>
            <div className="drop-zone" style={{borderColor:sheetFile?"var(--success)":undefined,background:sheetFile?"var(--success-bg)":undefined}}
              onClick={()=>sheetRef.current?.click()}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();const f=[...e.dataTransfer.files].find(f=>f.name.endsWith(".xlsx"));if(f)setSheetFile(f);}}>
              {sheetFile?(<><div style={{color:"var(--success)"}}><I.Check/></div><p style={{fontSize:13,fontWeight:600,color:"var(--success)"}}>{sheetFile.name}</p></>):(<><I.Sheet/><p style={{fontSize:13.5,color:"var(--text-secondary)"}}>Drop <strong>.xlsx</strong> or browse</p></>)}
              <input ref={sheetRef} type="file" accept=".xlsx" style={{display:"none"}} onChange={e=>{if(e.target.files[0])setSheetFile(e.target.files[0]);}}/>
            </div>
            {sheetStatus&&<div style={{marginTop:10}}><StatusMsg status={sheetStatus}/></div>}
            <button onClick={handleSheet} disabled={sheetLoading||!sheetFile} className="btn btn-success" style={{marginTop:10,width:"100%",padding:"11px",justifyContent:"center"}}>
              {sheetLoading?<><div className="spinner"/>Uploading…</>:<>Upload Structured Data</>}
            </button>
          </div>

          {/* Existing uploads list */}
          <div style={{borderTop:"1px solid var(--border)",paddingTop:22,marginTop:6}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontSize:13.5,fontWeight:600,color:"var(--text-primary)"}}>Ingested Sources</span>
              <button className="btn btn-ghost" onClick={loadUploads} disabled={loadingList} style={{padding:"4px 10px",fontSize:11.5}}>
                {loadingList?<div className="spinner"/>:<I.Refresh/>}
              </button>
            </div>
            {allUploads.length===0?(
              <div style={{padding:"20px",textAlign:"center",color:"var(--text-muted)",fontSize:13}}>
                {loadingList?"Loading uploads…":"No uploads yet"}
              </div>
            ):(
              <div className="panel" style={{overflow:"hidden"}}>
                <table className="data-table">
                  <thead><tr><th>Source</th><th>Type</th><th>Ingested</th></tr></thead>
                  <tbody>
                    {allUploads.map((u,i)=>(
                      <tr key={i}>
                        <td style={{maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          <span className="mono" style={{fontSize:11}}>{u.url||u.filename||u.source||"—"}</span>
                        </td>
                        <td><span className="tag tag-accent">{u.type||"url"}</span></td>
                        <td style={{color:"var(--text-muted)"}}>{u.created_at?new Date(u.created_at).toLocaleDateString():"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubUrlsTab({ guildId }) {
  const [baseUrl, setBaseUrl] = useState("");
  const [results, setResults] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState("");
  const [ingestStatus, setIngestStatus] = useState(null);
  const [ingesting, setIngesting] = useState(false);

  const fetchUrls = async () => {
    const url = baseUrl.trim(); if (!url) return;
    setFetching(true); setResults(null); setSelected(new Set()); setFilter(""); setIngestStatus(null);
    try { setResults(await API.getSubUrls(url)); }
    catch(e) { setResults({base_url:url,sub_urls:[],count:0,error:e.message}); }
    finally { setFetching(false); }
  };

  const toggle = u => setSelected(p=>{const n=new Set(p);n.has(u)?n.delete(u):n.add(u);return n;});
  const filtered = results ? results.sub_urls.filter(u=>!filter||u.toLowerCase().includes(filter.toLowerCase())) : [];

  const ingest = async () => {
    if (!selected.size) return;
    setIngesting(true); setIngestStatus(null);
    try {
      const d = await API.upload(guildId, [], [...selected].join("\n"));
      setIngestStatus({ok:true,msg:`✓ ${d.urls_processed||selected.size} URL(s) ingested`});
    } catch(e) { setIngestStatus({ok:false,msg:"✗ "+e.message}); }
    finally { setIngesting(false); }
  };

  return (
    <div style={{padding:"28px 32px",overflowY:"auto",flex:1}}>
      <div style={{maxWidth:700}}>
        <div style={{fontSize:10.5,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:5}}>Discovery</div>
        <h1 style={{fontSize:22,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:4}}>Sub-URL Crawler</h1>
        <p style={{fontSize:13.5,color:"var(--text-secondary)",marginBottom:24,lineHeight:1.6}}>Discover all linked pages of a site via <code className="mono">/upload/sub-urls</code>, select, and ingest.</p>

        <div className="panel anim-up" style={{padding:"18px 20px",marginBottom:14}}>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1,position:"relative"}}>
              <div style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}><I.Search/></div>
              <input value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchUrls()} placeholder="https://example.com" className="field" style={{paddingLeft:34,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
            </div>
            <button className="btn btn-primary" onClick={fetchUrls} disabled={fetching||!baseUrl.trim()} style={{padding:"10px 18px"}}>
              {fetching?<><div className="spinner"/>Scanning…</>:<><I.Search/>Discover</>}
            </button>
          </div>
        </div>

        {results && (results.error ? (
          <div style={{padding:"12px 14px",borderRadius:"var(--radius-sm)",background:"var(--danger-bg)",border:"1px solid rgba(241,99,99,0.2)",color:"var(--danger)",fontSize:13}}>✗ {results.error}</div>
        ) : (
          <div className="panel anim-up" style={{overflow:"hidden"}}>
            <div style={{padding:"11px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span className="tag tag-accent">{results.count} URLs</span>
              {selected.size>0&&<span className="tag tag-success">{selected.size} selected</span>}
              <div style={{flex:1,minWidth:150,position:"relative"}}>
                <div style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}><I.Search/></div>
                <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter…" className="field" style={{paddingLeft:28,height:30,fontSize:12,fontFamily:"'DM Mono',monospace"}}/>
              </div>
              <button className="btn btn-ghost" onClick={()=>setSelected(new Set(filtered))} style={{padding:"4px 11px",fontSize:12}}>All</button>
              <button className="btn btn-ghost" onClick={()=>setSelected(new Set())} style={{padding:"4px 11px",fontSize:12}}>Clear</button>
            </div>
            <div style={{maxHeight:300,overflowY:"auto"}}>
              {filtered.length===0?<div style={{padding:"24px",textAlign:"center",color:"var(--text-muted)",fontSize:13}}>No URLs match filter</div>
               :filtered.map((u,i)=>{const sel=selected.has(u);return(
                <div key={i} className={`check-row${sel?" selected":""}`} onClick={()=>toggle(u)}>
                  <div className={`custom-check${sel?" checked":""}`}>{sel&&<I.Check/>}</div>
                  <span style={{fontSize:11.5,color:sel?"#a5b4fc":"var(--text-muted)",fontFamily:"'DM Mono',monospace",wordBreak:"break-all",flex:1,lineHeight:1.5}}>{u}</span>
                  <a href={u} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"var(--text-muted)",display:"flex",flexShrink:0}}><I.External/></a>
                </div>
               );})}
            </div>
            <div style={{padding:"11px 16px",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <p style={{fontSize:12,color:"var(--text-muted)"}}>{selected.size>0?`${selected.size} URL${selected.size>1?"s":""} queued`:"Select URLs to ingest"}</p>
              <button className="btn btn-primary" onClick={ingest} disabled={ingesting||selected.size===0} style={{padding:"7px 16px"}}>
                {ingesting?<><div className="spinner"/>Ingesting…</>:<>Ingest ({selected.size})</>}
              </button>
            </div>
          </div>
        ))}
        {ingestStatus&&<div style={{marginTop:12}}><StatusMsg status={ingestStatus}/></div>}
      </div>
    </div>
  );
}

// ─── SERVER CONFIG TAB ────────────────────────────────────────────────────────
function ServerConfigTab({ guildId }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState({});
  const [status, setStatus]   = useState(null);
  const [prompt, setPrompt]   = useState("");
  const [promptSaving, setPromptSaving] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [addingServer, setAddingServer] = useState(false);

  const loadConfig = useCallback(()=>{
    setLoading(true);
    API.getConfig(guildId).then(d=>{
      setConfig(d); setPrompt(d.system_prompt||""); setGuildName(d.name||"");
    }).catch(()=>setConfig(null)).finally(()=>setLoading(false));
  },[guildId]);

  useEffect(()=>{ loadConfig(); },[loadConfig]);

  const save = async (field, apiCall) => {
    setSaving(s=>({...s,[field]:true})); setStatus(null);
    try { await apiCall(); setStatus({ok:true,msg:`✓ ${field} updated`}); loadConfig(); }
    catch(e) { setStatus({ok:false,msg:`✗ ${e.message}`}); }
    finally { setSaving(s=>({...s,[field]:false})); }
  };

  const addServer = async () => {
    setAddingServer(true); setStatus(null);
    try { await API.addServer(guildId, guildName||guildId); setStatus({ok:true,msg:"✓ Server registered"}); loadConfig(); }
    catch(e) { setStatus({ok:false,msg:"✗ "+e.message}); }
    finally { setAddingServer(false); }
  };

  if (loading) return <div style={{padding:"28px 32px",color:"var(--text-muted)",display:"flex",alignItems:"center",gap:8}}><div className="spinner" style={{color:"var(--accent)"}}/>Loading config…</div>;

  return (
    <div style={{padding:"28px 32px",overflowY:"auto",flex:1}}>
      <div style={{maxWidth:600}}>
        <div style={{fontSize:10.5,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:5}}>Configuration</div>
        <h1 style={{fontSize:22,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:4}}>Server Config</h1>
        <p style={{fontSize:13.5,color:"var(--text-secondary)",marginBottom:24,lineHeight:1.6}}>
          Tune RAG parameters for <span className="mono">{guildId}</span>. Changes apply immediately.
        </p>

        {!config && (
          <div className="panel anim-up" style={{padding:"20px",marginBottom:18}}>
            <div style={{fontSize:13.5,fontWeight:600,color:"var(--text-primary)",marginBottom:10}}>Register this Server</div>
            <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:14,lineHeight:1.6}}>This guild hasn't been registered yet. Register it to enable configuration.</p>
            <input value={guildName} onChange={e=>setGuildName(e.target.value)} placeholder="Server display name" className="field" style={{marginBottom:10}}/>
            <button className="btn btn-primary" onClick={addServer} disabled={addingServer} style={{width:"100%",padding:"11px",justifyContent:"center"}}>
              {addingServer?<><div className="spinner"/>Registering…</>:<>Register Server</>}
            </button>
            {status&&<div style={{marginTop:10}}><StatusMsg status={status}/></div>}
          </div>
        )}

        {config && (<>
          <div className="panel anim-up" style={{padding:"20px 22px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:6,display:"flex",alignItems:"center",gap:8}}><I.Database/>Server Info</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12.5}}>
              {[["Name",config.name],["Guild ID",config.guild_id],["Registered",config.added_at?new Date(config.added_at).toLocaleString():"—"],["Last Updated",config.updated_at?new Date(config.updated_at).toLocaleString():"—"]].map(([k,v],i)=>(
                <div key={i} style={{background:"var(--bg-elevated)",borderRadius:"var(--radius-sm)",padding:"10px 12px"}}>
                  <div style={{fontSize:10,color:"var(--text-muted)",fontWeight:700,letterSpacing:".05em",textTransform:"uppercase",marginBottom:4}}>{k}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:11.5,color:"var(--text-primary)"}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel anim-up d1" style={{padding:"20px 22px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:18,display:"flex",alignItems:"center",gap:8}}><I.Sliders/>Retrieval Parameters</div>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <Slider label="FAISS-K" value={config.faiss_k} min={1} max={20}
                onChange={v=>setConfig(c=>({...c,faiss_k:v}))}
                onSave={()=>save("faiss_k",()=>API.updateFaissK(guildId,config.faiss_k))}
                saving={saving.faiss_k}/>
              <Slider label="BM25-K" value={config.bm25_k} min={1} max={20}
                onChange={v=>setConfig(c=>({...c,bm25_k:v}))}
                onSave={()=>save("bm25_k",()=>API.updateBm25K(guildId,config.bm25_k))}
                saving={saving.bm25_k}/>
              <Slider label="Temperature" value={config.temperature} min={0} max={1} step={0.05} unit=""
                onChange={v=>setConfig(c=>({...c,temperature:v}))}
                onSave={()=>save("temperature",()=>API.updateTemp(guildId,config.temperature))}
                saving={saving.temperature}/>
              <Slider label="Max Tokens" value={config.max_tokens} min={128} max={4096} step={64}
                onChange={v=>setConfig(c=>({...c,max_tokens:v}))}
                onSave={()=>save("max_tokens",()=>API.updateMaxToken(guildId,config.max_tokens))}
                saving={saving.max_tokens}/>
              <Slider label="Chunk Size" value={config.chunk_size} min={100} max={999}
                onChange={v=>setConfig(c=>({...c,chunk_size:v}))}
                onSave={()=>save("chunk_size",()=>API.updateChunkSize(guildId,config.chunk_size))}
                saving={saving.chunk_size}/>
              <Slider label="Chunk Overlap" value={config.chunk_overlap} min={100} max={1000}
                onChange={v=>setConfig(c=>({...c,chunk_overlap:v}))}
                onSave={()=>save("chunk_overlap",()=>API.updateChunkOverlap(guildId,config.chunk_overlap))}
                saving={saving.chunk_overlap}/>
            </div>
          </div>

          <div className="panel anim-up d2" style={{padding:"20px 22px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:12}}>System Prompt</div>
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={5} className="field"
              placeholder="You are a helpful assistant for this Discord server's knowledge base..." style={{resize:"vertical",lineHeight:1.6}}/>
            <button className="btn btn-primary" onClick={async()=>{setPromptSaving(true);setStatus(null);try{await API.updateSystemPrompt(guildId,prompt);setStatus({ok:true,msg:"✓ System prompt saved"});}catch(e){setStatus({ok:false,msg:"✗ "+e.message});}finally{setPromptSaving(false);}}} disabled={promptSaving} style={{marginTop:10,width:"100%",padding:"11px",justifyContent:"center"}}>
              {promptSaving?<><div className="spinner"/>Saving…</>:<><I.Save/>Save Prompt</>}
            </button>
          </div>

          {status&&<StatusMsg status={status}/>}
        </>)}
      </div>
    </div>
  );
}

// ─── CHANNELS TAB ─────────────────────────────────────────────────────────────
function ChannelsTab({ guildId }) {
  const [channels, setChannels]     = useState([]);
  const [modChannel, setModChannel] = useState(null);
  const [discordChans, setDiscordChans] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [newChanId, setNewChanId]   = useState("");
  const [newModId, setNewModId]     = useState("");
  const [saving, setSaving]         = useState({});
  const [status, setStatus]         = useState(null);

  const loadChannels = useCallback(()=>{
    setLoading(true);
    Promise.all([
      API.listChannels(guildId).catch(()=>({channel_ids:[],mod_channel:null})),
      API.getGuildChannels(guildId).catch(()=>[]),
    ]).then(([local,discord])=>{
      setChannels(local.channel_ids||[]);
      setModChannel(local.mod_channel||null);
      setDiscordChans(Array.isArray(discord)?discord:discord.channels||[]);
    }).finally(()=>setLoading(false));
  },[guildId]);

  useEffect(()=>{ loadChannels(); },[loadChannels]);

  const addChan = async () => {
    const id = newChanId.trim(); if(!id) return;
    setSaving(s=>({...s,add:true})); setStatus(null);
    try { await API.addChannel(guildId,id); setStatus({ok:true,msg:`✓ Channel #${id} added`}); setNewChanId(""); loadChannels(); }
    catch(e) { setStatus({ok:false,msg:"✗ "+e.message}); }
    finally { setSaving(s=>({...s,add:false})); }
  };

  const removeChan = async (id) => {
    setSaving(s=>({...s,[id]:true})); setStatus(null);
    try { await API.deleteChannel(guildId,id); setStatus({ok:true,msg:`✓ Channel removed`}); loadChannels(); }
    catch(e) { setStatus({ok:false,msg:"✗ "+e.message}); }
    finally { setSaving(s=>({...s,[id]:false})); }
  };

  const setMod = async () => {
    const id = newModId.trim(); if(!id) return;
    setSaving(s=>({...s,mod:true})); setStatus(null);
    try { await API.addModChannel(guildId,id); setStatus({ok:true,msg:`✓ Mod channel set`}); setNewModId(""); loadChannels(); }
    catch(e) { setStatus({ok:false,msg:"✗ "+e.message}); }
    finally { setSaving(s=>({...s,mod:false})); }
  };

  if (loading) return <div style={{padding:"28px 32px",color:"var(--text-muted)",display:"flex",alignItems:"center",gap:8}}><div className="spinner" style={{color:"var(--accent)"}}/>Loading channels…</div>;

  return (
    <div style={{padding:"28px 32px",overflowY:"auto",flex:1}}>
      <div style={{maxWidth:580}}>
        <div style={{fontSize:10.5,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:5}}>Bot Configuration</div>
        <h1 style={{fontSize:22,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:4}}>Channel Management</h1>
        <p style={{fontSize:13.5,color:"var(--text-secondary)",marginBottom:24,lineHeight:1.6}}>
          Control which Discord channels the bot responds in and where it logs to.
        </p>

        {/* Active channels */}
        <div className="panel anim-up" style={{overflow:"hidden",marginBottom:14}}>
          <div style={{padding:"12px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>Active Bot Channels</span>
            <span className="tag tag-accent">{channels.length}</span>
          </div>
          {channels.length===0?(
            <div style={{padding:"22px",textAlign:"center",color:"var(--text-muted)",fontSize:13}}>No channels configured yet</div>
          ):(
            channels.map(ch=>(
              <div key={ch} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 20px",borderBottom:"1px solid rgba(255,255,255,0.035)"}}>
                <div style={{color:"#818cf8"}}><I.Hash/></div>
                <span style={{flex:1,fontFamily:"'DM Mono',monospace",fontSize:12.5,color:"var(--text-primary)"}}>{ch}</span>
                <button className="btn btn-danger" onClick={()=>removeChan(ch)} disabled={saving[ch]} style={{padding:"5px 10px",fontSize:11.5}}>
                  {saving[ch]?<div className="spinner"/>:<I.Trash/>}
                </button>
              </div>
            ))
          )}
          <div style={{padding:"12px 20px",borderTop:"1px solid var(--border)",display:"flex",gap:10}}>
            <input value={newChanId} onChange={e=>setNewChanId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addChan()}
              placeholder="Channel ID (e.g. 123456789012345678)" className="field field-mono" style={{flex:1,height:36}}/>
            <button className="btn btn-ghost" onClick={addChan} disabled={saving.add||!newChanId.trim()} style={{padding:"7px 14px",flexShrink:0}}>
              {saving.add?<div className="spinner"/>:<><I.Plus/>Add</>}
            </button>
          </div>
        </div>

        {/* Mod channel */}
        <div className="panel anim-up d1" style={{padding:"18px 20px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{color:"var(--warning)"}}><I.Shield/></div>
            <span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>Mod / Log Channel</span>
          </div>
          {modChannel && (
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"var(--warning-bg)",border:"1px solid rgba(245,166,35,0.2)",borderRadius:"var(--radius-sm)",marginBottom:12}}>
              <I.Hash/>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:12.5,color:"var(--warning)",flex:1}}>{modChannel}</span>
              <span className="tag tag-warning">ACTIVE</span>
            </div>
          )}
          <div style={{display:"flex",gap:10}}>
            <input value={newModId} onChange={e=>setNewModId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setMod()}
              placeholder="Mod channel ID" className="field field-mono" style={{flex:1,height:36}}/>
            <button className="btn btn-ghost" onClick={setMod} disabled={saving.mod||!newModId.trim()} style={{padding:"7px 14px",flexShrink:0}}>
              {saving.mod?<div className="spinner"/>:<><I.Save/>Set</>}
            </button>
          </div>
        </div>

        {/* Discord channels from API */}
        {discordChans.length > 0 && (
          <div className="panel anim-up d2" style={{overflow:"hidden",marginBottom:14}}>
            <div style={{padding:"12px 20px",borderBottom:"1px solid var(--border)"}}>
              <span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>Available Discord Channels</span>
              <p style={{fontSize:12,color:"var(--text-muted)",marginTop:3}}>Fetched live from Discord via /guilds/{"{id}"}/channels</p>
            </div>
            {discordChans.slice(0,12).map((ch,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 20px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                <div style={{color:"var(--text-muted)"}}><I.Hash/></div>
                <span style={{flex:1,fontSize:13,color:"var(--text-secondary)"}}>{ch.name||ch.channel_id||ch}</span>
                <span className="mono" style={{fontSize:10.5}}>{ch.id||ch.channel_id||ch}</span>
                <button className="btn btn-ghost" onClick={()=>{ setNewChanId(ch.id||ch.channel_id||ch); }} style={{padding:"4px 10px",fontSize:11}}>Copy ID</button>
              </div>
            ))}
          </div>
        )}

        {status && <StatusMsg status={status}/>}
      </div>
    </div>
  );
}

function GuildSettingsTab({ guilds, activeId, onSelect, onCreate, onDelete, onRename, user, onLogout }) {
  const [newName, setNewName] = useState("");
  const [newId, setNewId]     = useState("");
  const [color, setColor]     = useState(GUILD_COLORS[0]);
  const [error, setError]     = useState("");
  const [editId, setEditId]   = useState(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding]   = useState(false);

  const create = async () => {
    const tid=newId.trim(), tname=newName.trim();
    if (!tid) { setError("Guild ID is required."); return; }
    if (guilds.find(g=>g.id===tid)) { setError("This ID already exists."); return; }
    setAdding(true);
    try { await API.addServer(tid, tname||`Guild ${tid.slice(0,6)}`); } catch(_) {}
    onCreate({id:tid,name:tname||`Guild ${tid.slice(0,6)}`,createdAt:Date.now(),color});
    setNewId(""); setNewName(""); setError(""); setAdding(false);
  };

  return (
    <div style={{padding:"28px 32px",overflowY:"auto",flex:1}}>
      <div style={{maxWidth:600}}>
        <div style={{fontSize:10.5,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:5}}>Management</div>
        <h1 style={{fontSize:22,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text-primary)",marginBottom:4}}>Guild Settings</h1>
        <p style={{fontSize:13.5,color:"var(--text-secondary)",marginBottom:24,lineHeight:1.6}}>Manage registered guilds and your Discord account.</p>

        {user && (
          <div className="panel anim-up" style={{padding:"16px 20px",marginBottom:16}}>
            <div style={{fontSize:12.5,fontWeight:600,color:"var(--text-primary)",marginBottom:12}}>Discord Account</div>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff",fontFamily:"'Syne',sans-serif"}}>
                {user.username?.slice(0,1).toUpperCase()||"U"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:600,color:"var(--text-primary)"}}>{user.username||"Admin"}</div>
                <div style={{fontSize:11.5,color:"var(--text-muted)",marginTop:2,fontFamily:"'DM Mono',monospace"}}>{user.discord_id||user.email}</div>
              </div>
              <button className="btn btn-danger" onClick={onLogout} style={{padding:"7px 12px"}}><I.Logout/> Logout</button>
            </div>
          </div>
        )}

        <div className="panel anim-up d1" style={{overflow:"hidden",marginBottom:16}}>
          <div style={{padding:"12px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>Registered Guilds</span>
            <span className="tag tag-accent">{guilds.length}</span>
          </div>
          {guilds.map(g=>(
            <div key={g.id} style={{padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.03)",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:34,height:34,borderRadius:"var(--radius-sm)",background:`${g.color||"#6366f1"}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:g.color||"#6366f1",fontFamily:"'Syne',sans-serif",flexShrink:0}}>
                {g.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                {editId===g.id?(
                  <input autoFocus value={editName} onChange={e=>setEditName(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"){onRename(g.id,editName);setEditId(null);}if(e.key==="Escape")setEditId(null);}}
                    className="field" style={{height:30,fontSize:13,padding:"3px 9px"}}/>
                ):(
                  <>
                    <div style={{fontSize:13,fontWeight:500,color:"var(--text-primary)",display:"flex",alignItems:"center",gap:8}}>
                      {g.name}{g.id===activeId&&<span className="tag tag-success" style={{fontSize:9}}>ACTIVE</span>}
                    </div>
                    <span className="mono" style={{fontSize:10.5,marginTop:2,display:"inline-block"}}>{g.id.slice(0,16)}…</span>
                  </>
                )}
              </div>
              <div style={{display:"flex",gap:5,flexShrink:0}}>
                {g.id!==activeId&&<button className="btn btn-ghost" style={{padding:"4px 10px",fontSize:11.5}} onClick={()=>onSelect(g.id)}>Activate</button>}
                <button className="btn btn-ghost" style={{padding:"5px 8px"}} onClick={()=>{setEditId(g.id===editId?null:g.id);setEditName(g.name);}} title="Rename"><I.Edit/></button>
                {guilds.length>1&&<button className="btn btn-danger" style={{padding:"5px 8px"}} onClick={()=>onDelete(g.id)}><I.Trash/></button>}
              </div>
            </div>
          ))}
        </div>

        <div className="panel anim-up d2" style={{padding:"18px 20px"}}>
          <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:14}}>Add New Guild</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <label style={{fontSize:10.5,color:"var(--text-muted)",fontWeight:700,display:"block",marginBottom:5,letterSpacing:".05em",textTransform:"uppercase"}}>Guild ID *</label>
              <input value={newId} onChange={e=>{setNewId(e.target.value);setError("");}} placeholder="e.g. 1234567890123456789" className="field field-mono"/>
            </div>
            <div>
              <label style={{fontSize:10.5,color:"var(--text-muted)",fontWeight:700,display:"block",marginBottom:5,letterSpacing:".05em",textTransform:"uppercase"}}>Display Name</label>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="My Knowledge Base" className="field"/>
            </div>
            <div>
              <label style={{fontSize:10.5,color:"var(--text-muted)",fontWeight:700,display:"block",marginBottom:8,letterSpacing:".05em",textTransform:"uppercase"}}>Color</label>
              <div style={{display:"flex",gap:8}}>{GUILD_COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:`2.5px solid ${color===c?"#fff":"transparent"}`,transition:"border var(--tr)"}}/>)}</div>
            </div>
            {error&&<p style={{fontSize:12,color:"var(--danger)"}}>{error}</p>}
            <button className="btn btn-primary" onClick={create} disabled={adding} style={{marginTop:2,padding:"11px",justifyContent:"center"}}>
              {adding?<><div className="spinner"/>Registering…</>:<><I.Plus/>Create Guild</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
const TABS = [
  { id:"overview",  label:"Overview",       icon:<I.Home/> },
  { id:"upload",    label:"Knowledge Base", icon:<I.Upload/> },
  { id:"suburls",   label:"URL Crawler",    icon:<I.Globe/> },
  { id:"config",    label:"Server Config",  icon:<I.Sliders/> },
  { id:"channels",  label:"Channels",       icon:<I.Hash/> },
  { id:"settings",  label:"Guild Settings", icon:<I.Settings/> },
];

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(!getStoredOnboarded());
  const [user, setUser]       = useState(getStoredUser());
  const [guilds, setGuilds]   = useState(getStoredGuilds());
  const [activeId, setActiveId] = useState(getStoredActiveId());
  const [tab, setTab]         = useState("overview");
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle Discord OAuth token in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#token=")) {
      const token = hash.slice(7);
      setStoredToken(token);
      window.history.replaceState(null,"",window.location.pathname);
      // Fetch user profile
      API.getMe().then(u=>{ lsSet("wb_user",u); setUser(u); }).catch(()=>{});
    }
  },[]);

  const activeGuild = guilds.find(g=>g.id===activeId)||guilds[0];

  const selectGuild = id => { setActiveId(id); lsStrSet("wb_active_guild",id); };
  const createGuild = g  => { const u=[...guilds,g]; setGuilds(u); l