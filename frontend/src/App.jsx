import { useState, useRef, useEffect, useCallback } from "react";

// ─── STORAGE HELPERS ───────────────────────────────────────────────────────────
const DEFAULT_GUILDS = [{ id: "1476466974098985067", name: "Main Server", createdAt: Date.now(), color: "#6366f1" }];
const GUILD_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#10b981","#0ea5e9","#14b8a6"];

function getStoredGuilds() {
  try { return JSON.parse(localStorage.getItem("wb_guilds") || "null") || DEFAULT_GUILDS; }
  catch { return DEFAULT_GUILDS; }
}
function getStoredActiveId() { return localStorage.getItem("wb_active_guild") || DEFAULT_GUILDS[0].id; }
function getStoredToken() { return localStorage.getItem("wb_token") || null; }
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("wb_user") || "null"); }
  catch { return null; }
}
function getStoredOnboarded() { return localStorage.getItem("wb_onboarded") === "true"; }
function saveGuilds(g) { localStorage.setItem("wb_guilds", JSON.stringify(g)); }
function saveActiveId(id) { localStorage.setItem("wb_active_guild", id); }
function saveToken(t) { localStorage.setItem("wb_token", t); }
function saveUser(u) { localStorage.setItem("wb_user", JSON.stringify(u)); }
function saveOnboarded() { localStorage.setItem("wb_onboarded", "true"); }

function makeSystemPrompt(guildId) {
  return `You are an AI assistant for the knowledge base with vector store ID: ${guildId}.\nAnswer questions based on uploaded documents and your available knowledge.\nBe concise, accurate, and helpful. Use markdown formatting when appropriate.\nIf information is unavailable, provide the best answer you can and indicate uncertainty.`;
}

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body {
    font-family: 'DM Sans', sans-serif;
    background: #080810;
    color: #e2e8f0;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  :root {
    --bg-base: #080810;
    --bg-surface: #0f0f1a;
    --bg-elevated: #181825;
    --bg-overlay: #1e1e2e;
    --bg-glass: rgba(15,15,26,0.85);
    --border: rgba(255,255,255,0.06);
    --border-active: rgba(255,255,255,0.14);
    --border-focus: rgba(99,102,241,0.6);
    --text-primary: #f0f0f8;
    --text-secondary: rgba(240,240,248,0.6);
    --text-muted: rgba(240,240,248,0.3);
    --accent: #6366f1;
    --accent-light: rgba(99,102,241,0.12);
    --accent-glow: rgba(99,102,241,0.2);
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
    --sidebar-w: 256px;
    --topbar-h: 56px;
    --transition: 0.18s cubic-bezier(0.4,0,0.2,1);
  }

  /* ── Animations ── */
  @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes slideIn  { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
  @keyframes spin     { to { transform:rotate(360deg); } }
  @keyframes blink    { 0%,100%{opacity:1;} 50%{opacity:0.2;} }
  @keyframes pulse    { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes progressFill { from{width:0} to{width:var(--target)} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

  .anim-up    { animation: fadeUp .45s cubic-bezier(0.16,1,0.3,1) both; }
  .anim-in    { animation: fadeIn .3s ease both; }
  .anim-scale { animation: scaleIn .3s cubic-bezier(0.16,1,0.3,1) both; }
  .d1  { animation-delay:0.06s; } .d2 { animation-delay:0.12s; }
  .d3  { animation-delay:0.18s; } .d4 { animation-delay:0.24s; }
  .d5  { animation-delay:0.30s; } .d6 { animation-delay:0.36s; }

  /* ── Scrollbars ── */
  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:99px; }
  ::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.14); }

  /* ── Form Fields ── */
  .field {
    width:100%; background:var(--bg-base);
    border:1.5px solid var(--border);
    color:var(--text-primary); border-radius:var(--radius-sm);
    padding:10px 14px; font-size:14px;
    font-family:'DM Sans',sans-serif; outline:none;
    transition:border-color var(--transition), box-shadow var(--transition);
  }
  .field::placeholder { color:var(--text-muted); }
  .field:focus { border-color:var(--border-focus); box-shadow:0 0 0 3px var(--accent-glow); }
  .field-mono { font-family:'DM Mono',monospace !important; font-size:12.5px !important; }

  /* ── Buttons ── */
  .btn { display:inline-flex; align-items:center; gap:7px; border:none; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-weight:500; border-radius:var(--radius-sm);
    transition:all var(--transition); white-space:nowrap; user-select:none; }
  .btn:disabled { opacity:.35; cursor:not-allowed; pointer-events:none; }

  .btn-primary { background:var(--accent); color:#fff; padding:10px 20px; font-size:14px;
    box-shadow:0 4px 20px var(--accent-glow); }
  .btn-primary:hover { background:var(--accent-hover); transform:translateY(-1px);
    box-shadow:0 8px 28px var(--accent-glow); }
  .btn-primary:active { transform:translateY(0); }

  .btn-ghost { background:transparent; color:var(--text-secondary); padding:9px 16px;
    font-size:13.5px; border:1.5px solid var(--border); }
  .btn-ghost:hover { background:var(--bg-elevated); color:var(--text-primary); border-color:var(--border-active); }

  .btn-danger { background:var(--danger-bg); color:var(--danger); padding:7px 14px;
    font-size:12.5px; border:1.5px solid rgba(241,99,99,0.18); }
  .btn-danger:hover { background:rgba(241,99,99,0.16); }

  .btn-success { background:var(--success-bg); color:var(--success); padding:10px 20px;
    font-size:14px; border:1.5px solid rgba(34,211,160,0.2); }
  .btn-success:hover { background:rgba(34,211,160,0.14); }

  .btn-icon { background:var(--bg-elevated); color:var(--text-secondary); padding:8px;
    border:1.5px solid var(--border); border-radius:var(--radius-sm); }
  .btn-icon:hover { color:var(--text-primary); border-color:var(--border-active); }

  /* ── Cards / Panels ── */
  .panel {
    background:var(--bg-surface);
    border:1px solid var(--border);
    border-radius:var(--radius-lg);
  }
  .card-hover { transition:all var(--transition); }
  .card-hover:hover { border-color:var(--border-active); transform:translateY(-1px); }

  /* ── Tags / Badges ── */
  .tag { display:inline-flex; align-items:center; gap:5px; padding:3px 10px;
    border-radius:var(--radius-full); font-size:11px; font-weight:600; letter-spacing:.04em; }
  .tag-accent  { background:var(--accent-light); color:#818cf8; border:1px solid rgba(99,102,241,0.2); }
  .tag-success { background:var(--success-bg); color:var(--success); border:1px solid rgba(34,211,160,0.2); }
  .tag-danger  { background:var(--danger-bg); color:var(--danger); border:1px solid rgba(241,99,99,0.2); }
  .tag-warning { background:var(--warning-bg); color:var(--warning); border:1px solid rgba(245,166,35,0.2); }

  /* ── Nav ── */
  .nav-item {
    display:flex; align-items:center; gap:10px;
    padding:8px 10px; border-radius:var(--radius-sm);
    font-size:13.5px; font-weight:500; color:var(--text-secondary);
    cursor:pointer; transition:all var(--transition);
    border:none; background:none;
    font-family:'DM Sans',sans-serif; width:100%; text-align:left;
  }
  .nav-item:hover { background:var(--bg-elevated); color:var(--text-primary); }
  .nav-item.active { background:var(--accent-light); color:#818cf8; }
  .nav-icon { width:30px; height:30px; border-radius:var(--radius-xs); display:flex;
    align-items:center; justify-content:center; flex-shrink:0; font-size:13px; }
  .nav-item.active .nav-icon { background:rgba(99,102,241,0.2); }
  .nav-item:not(.active) .nav-icon { background:var(--bg-elevated); }

  /* ── Drop Zone ── */
  .drop-zone {
    border:1.5px dashed var(--border);
    border-radius:var(--radius-md); padding:28px 20px;
    display:flex; flex-direction:column; align-items:center; gap:8px;
    cursor:pointer; transition:all var(--transition); text-align:center;
  }
  .drop-zone:hover { border-color:var(--accent); background:var(--accent-light); }

  /* ── Status ── */
  .status-dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }
  .status-online  { background:var(--success); box-shadow:0 0 8px rgba(34,211,160,0.5); animation:pulse 2.5s ease infinite; }
  .status-offline { background:#4b5563; }

  .spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.12);
    border-top-color:currentColor; border-radius:50%; animation:spin .65s linear infinite; }

  /* ── Table ── */
  .data-table { width:100%; border-collapse:collapse; font-size:13px; }
  .data-table th { padding:10px 16px; text-align:left; color:var(--text-muted);
    font-weight:600; font-size:11px; letter-spacing:.06em; text-transform:uppercase;
    border-bottom:1px solid var(--border); }
  .data-table td { padding:11px 16px; border-bottom:1px solid rgba(255,255,255,0.04);
    color:var(--text-secondary); vertical-align:middle; }
  .data-table tr:hover td { background:var(--bg-elevated); color:var(--text-primary); }

  /* ── Code ── */
  .mono { background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.15);
    border-radius:var(--radius-xs); padding:2px 7px;
    font-family:'DM Mono',monospace; font-size:11.5px; color:#a5b4fc; }

  /* ── Checkbox Row ── */
  .check-row { display:flex; align-items:center; gap:10px; padding:10px 16px;
    cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.04); transition:background var(--transition); }
  .check-row:hover { background:var(--bg-elevated); }
  .check-row.selected { background:rgba(99,102,241,0.06); }
  .custom-check { width:16px; height:16px; border-radius:4px; border:1.5px solid var(--border);
    flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all var(--transition); }
  .custom-check.checked { background:var(--accent); border-color:var(--accent); }

  /* ── Modal ── */
  .modal-bg  { animation:fadeIn .2s both; background:rgba(0,0,0,0.65); backdrop-filter:blur(10px); }
  .modal-box { animation:fadeUp .28s cubic-bezier(0.16,1,0.3,1) both; }

  /* ── Onboarding specific ── */
  .ob-progress-track { height:3px; background:rgba(255,255,255,0.06); border-radius:99px; overflow:hidden; }
  .ob-progress-fill { height:100%; background:linear-gradient(90deg,#6366f1,#818cf8); border-radius:99px;
    transition:width 0.5s cubic-bezier(0.16,1,0.3,1); }

  .ob-step-dot { width:32px; height:32px; border-radius:50%; display:flex; align-items:center;
    justify-content:center; font-size:12px; font-weight:700; transition:all 0.3s; flex-shrink:0; }
  .ob-step-dot.done    { background:var(--success); color:#000; }
  .ob-step-dot.active  { background:var(--accent); color:#fff; box-shadow:0 0 20px var(--accent-glow); }
  .ob-step-dot.pending { background:var(--bg-elevated); color:var(--text-muted); border:1.5px solid var(--border); }

  /* ── Discord button ── */
  .btn-discord { display:inline-flex; align-items:center; gap:10px;
    background:#5865f2; color:#fff; border:none; cursor:pointer;
    padding:12px 24px; border-radius:var(--radius-sm); font-size:14.5px; font-weight:600;
    font-family:'DM Sans',sans-serif; transition:all var(--transition);
    box-shadow:0 6px 24px rgba(88,101,242,0.35); }
  .btn-discord:hover { background:#4752c4; transform:translateY(-1px); box-shadow:0 10px 32px rgba(88,101,242,0.4); }
  .btn-discord:active { transform:translateY(0); }

  /* ── Gradient hero ── */
  .hero-gradient {
    background:radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%);
    position:absolute; inset:0; pointer-events:none;
  }

  /* ── Feature card ── */
  .feature-card {
    background:var(--bg-surface); border:1px solid var(--border);
    border-radius:var(--radius-md); padding:20px;
    transition:all var(--transition); cursor:default;
  }
  .feature-card:hover { border-color:var(--border-active); background:var(--bg-elevated); transform:translateY(-2px); }

  /* ── Avatar ring ── */
  .avatar-ring { border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6);
    padding:2px; display:inline-flex; }
  .avatar-inner { border-radius:50%; background:var(--bg-surface); overflow:hidden;
    display:flex; align-items:center; justify-content:center; }

  /* ── Glow orb background decorations ── */
  .orb { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; opacity:0.25; }
  .orb-purple { background:rgba(99,102,241,0.6); }
  .orb-pink   { background:rgba(236,72,153,0.4); }
  .orb-cyan   { background:rgba(14,165,233,0.4); }

  /* ── Step connector ── */
  .step-connector { flex:1; height:1px; background:var(--border); margin:0 6px; }
  .step-connector.done { background:var(--success); }
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

// ─── ICONS ─────────────────────────────────────────────────────────────────────
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
  Folder:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Activity:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  User:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Bot:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  Logout:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Analytics:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Shield:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Discord:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>,
  Sparkle:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L9.75 9.75 3 12l6.75 2.25L12 21l2.25-6.75L21 12l-6.75-2.25z"/></svg>,
  ArrowRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Key:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  Edit:       () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Sheet:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>,
};

// ─── MARKDOWN RENDERER ─────────────────────────────────────────────────────────
function inlineFormat(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} style={{ color:"var(--text-primary)", fontWeight:600 }}>{p.slice(2,-2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="mono">{p.slice(1,-1)}</code>;
    if (p.startsWith("*") && p.endsWith("*"))
      return <em key={i}>{p.slice(1,-1)}</em>;
    return p;
  });
}
function MsgContent({ text }) {
  const lines = text.split("\n");
  const els = [];
  lines.forEach((line, i) => {
    if (line.startsWith("- ") || line.startsWith("* "))
      els.push(<div key={i} style={{ display:"flex", gap:8, marginBottom:3 }}><span style={{ color:"#818cf8", flexShrink:0 }}>›</span><span>{inlineFormat(line.slice(2))}</span></div>);
    else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      els.push(<div key={i} style={{ display:"flex", gap:8, marginBottom:3 }}><span style={{ color:"#818cf8", minWidth:16, flexShrink:0, fontFamily:"'DM Mono',monospace", fontSize:11 }}>{num}.</span><span>{inlineFormat(line.replace(/^\d+\.\s/, ""))}</span></div>);
    } else if (line.startsWith("### "))
      els.push(<div key={i} style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginTop:8, marginBottom:3 }}>{line.slice(4)}</div>);
    else if (line.trim() === "")
      els.push(<div key={i} style={{ height:5 }} />);
    else
      els.push(<p key={i} style={{ lineHeight:1.65, marginBottom:2 }}>{inlineFormat(line)}</p>);
  });
  return <div style={{ fontSize:13.5, color:"var(--text-secondary)", lineHeight:1.65 }}>{els}</div>;
}
function TypingDots() {
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center", padding:"4px 0" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:"rgba(129,140,248,0.45)", animation:`blink 1.2s ease ${i*0.2}s infinite` }} />
      ))}
    </div>
  );
}

// ─── DISCORD OAUTH BUTTON ──────────────────────────────────────────────────────
function DiscordLoginButton({ onSuccess }) {
  const handleLogin = () => {
    // Simulate Discord OAuth - in production redirect to /auth/discord
    const mockUser = {
      discord_id: "123456789",
      username: "User#0001",
      avatar: null,
      email: "user@example.com",
      guilds: ["1476466974098985067", "9876543210987654321"]
    };
    // In prod: window.location.href = `${API_BASE}/auth/discord`;
    // Here we simulate the login
    setTimeout(() => { onSuccess(mockUser, "mock_access_token_" + Date.now()); }, 800);
  };
  return (
    <button className="btn-discord" onClick={handleLogin}>
      <I.Discord />
      Continue with Discord
    </button>
  );
}

// ─── ONBOARDING FLOW ───────────────────────────────────────────────────────────
const OB_STEPS = [
  { id:"welcome",  label:"Welcome",     icon:<I.Sparkle /> },
  { id:"connect",  label:"Connect",     icon:<I.Discord /> },
  { id:"guild",    label:"Your Guild",  icon:<I.Database /> },
  { id:"upload",   label:"Add Content", icon:<I.Upload /> },
  { id:"launch",   label:"Launch",      icon:<I.Bot /> },
];

function OnboardingWelcome({ onNext }) {
  const features = [
    { icon:<I.Database />, title:"RAG Knowledge Base", desc:"Upload PDFs and URLs to build a searchable vector store for your Discord server." },
    { icon:<I.Bot />, title:"AI Discord Bot", desc:"Your bot answers questions with citations from your documents, right in Discord channels." },
    { icon:<I.Shield />, title:"Discord OAuth", desc:"Secure login — only admins of your Discord server can manage your knowledge base." },
    { icon:<I.Analytics />, title:"Analytics Ready", desc:"Track queries, monitor usage, and keep your knowledge base fresh and accurate." },
  ];
  return (
    <div className="anim-up" style={{ maxWidth:580, margin:"0 auto", textAlign:"center", padding:"0 24px" }}>
      <div style={{ marginBottom:28, display:"inline-flex", alignItems:"center", gap:10, background:"var(--accent-light)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"var(--radius-full)", padding:"8px 18px" }}>
        <I.Sparkle />
        <span style={{ fontSize:13, fontWeight:600, color:"#818cf8" }}>WalluBot Admin</span>
      </div>
      <h1 style={{ fontSize:40, fontWeight:800, fontFamily:"'Syne',sans-serif", color:"var(--text-primary)", lineHeight:1.1, marginBottom:16, letterSpacing:"-0.03em" }}>
        Your Discord Server's<br />
        <span style={{ background:"linear-gradient(135deg,#6366f1,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>AI Brain</span>
      </h1>
      <p style={{ fontSize:16, color:"var(--text-secondary)", lineHeight:1.65, marginBottom:36, maxWidth:480, margin:"0 auto 36px" }}>
        Turn your documents and websites into an intelligent Q&A bot that lives inside your Discord server. Setup takes less than 5 minutes.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:36, textAlign:"left" }}>
        {features.map((f, i) => (
          <div key={i} className={`feature-card anim-up d${i+1}`}>
            <div style={{ color:"#818cf8", marginBottom:10 }}>{f.icon}</div>
            <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text-primary)", marginBottom:5 }}>{f.title}</div>
            <div style={{ fontSize:12.5, color:"var(--text-muted)", lineHeight:1.55 }}>{f.desc}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary anim-up d5" onClick={onNext} style={{ width:"100%", padding:"13px", justifyContent:"center", fontSize:15, fontFamily:"'Syne',sans-serif" }}>
        Get Started <I.ArrowRight />
      </button>
      <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:14 }}>Free to use · No credit card required</p>
    </div>
  );
}

function OnboardingConnect({ user, onNext, onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleDiscord = () => {
    setLoading(true);
    const mockUser = {
      discord_id: "123456789012345678",
      username: "ServerAdmin#0001",
      avatar: null,
      email: "admin@example.com",
      guilds: ["1476466974098985067"]
    };
    setTimeout(() => {
      setLoading(false);
      onLogin(mockUser, "mock_token_" + Date.now());
      onNext();
    }, 1200);
  };

  if (user) {
    return (
      <div className="anim-up" style={{ maxWidth:480, margin:"0 auto", textAlign:"center", padding:"0 24px" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:28 }}>
          {user.username?.slice(0,1).toUpperCase() || "U"}
        </div>
        <h2 style={{ fontSize:26, fontWeight:700, fontFamily:"'Syne',sans-serif", color:"var(--text-primary)", marginBottom:8 }}>Connected!</h2>
        <p style={{ color:"var(--text-secondary)", marginBottom:6, fontSize:15 }}>
          Signed in as <strong style={{ color:"var(--text-primary)" }}>{user.username}</strong>
        </p>
        <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:28 }}>{user.email}</p>
        <div style={{ background:"var(--success-bg)", border:"1px solid rgba(34,211,160,0.2)", borderRadius:"var(--radius-md)", padding:"12px 16px", marginBottom:32, display:"flex", alignItems:"center", gap:10 }}>
          <span className="status-dot status-online" />
          <span style={{ fontSize:13, color:"var(--success)", fontWeight:500 }}>Discord account verified — {user.guilds?.length || 0} guilds accessible</span>
        </div>
        <button className="btn btn-primary" onClick={onNext} style={{ width:"100%", padding:"13px", justifyContent:"center", fontSize:15 }}>
          Continue to Guild Setup <I.ArrowRight />
        </button>
      </div>
    );
  }

  return (
    <div className="anim-up" style={{ maxWidth:480, margin:"0 auto", textAlign:"center", padding:"0 24px" }}>
      <div style={{ width:64, height:64, borderRadius:"var(--radius-md)", background:"rgba(88,101,242,0.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", border:"1px solid rgba(88,101,242,0.3)" }}>
        <I.Discord />
      </div>
      <h2 style={{ fontSize:28, fontWeight:700, fontFamily:"'Syne',sans-serif", color:"var(--text-primary)", marginBottom:10 }}>Connect Discord</h2>
      <p style={{ color:"var(--text-secondary)", lineHeight:1.65, marginBottom:12, fontSize:15 }}>
        Login with your Discord account to manage your server's knowledge base. We'll verify you have admin access.
      </p>
      <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"14px 16px", marginBottom:28, textAlign:"left" }}>
        {[
          "Read your Discord username & avatar",
          "See which servers you manage",
          "Never post on your behalf",
        ].map((p, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom: i<2 ? "1px solid var(--border)" : "none" }}>
            <div style={{ width:18, height:18, borderRadius:"50%", background:"var(--success-bg)", border:"1px solid rgba(34,211,160,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <I.Check />
            </div>
            <span style={{ fontSize:13, color:"var(--text-secondary)" }}>{p}</span>
          </div>
        ))}
      </div>
      <button className="btn-discord" onClick={handleDiscord} disabled={loading} style={{ width:"100%", justifyContent:"center", fontSize:15, padding:"13px 24px" }}>
        {loading ? <><div className="spinner" style={{ borderTopColor:"#fff" }} /> Connecting…</> : <><I.Discord /> Sign in with Discord</>}
      </button>
      <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:12 }}>By continuing you accept our Terms of Service</p>
    </div>
  );
}

function OnboardingGuild({ guilds, activeId, onSelect, onCreate, onNext }) {
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [color, setColor] = useState(GUILD_COLORS[0]);
  const [err, setErr] = useState("");

  const create = () => {
    const tid = newId.trim(), tname = newName.trim();
    if (!tid) { setErr("Guild ID is required"); return; }
    if (guilds.find(g => g.id === tid)) { setErr("This Guild ID already exists"); return; }
    onCreate({ id:tid, name:tname || `Guild ${tid.slice(0,8)}`, createdAt:Date.now(), color });
    setNewId(""); setNewName(""); setErr("");
  };

  return (
    <div className="anim-up" style={{ maxWidth:520, margin:"0 auto", padding:"0 24px" }}>
      <h2 style={{ fontSize:28, fontWeight:700, fontFamily:"'Syne',sans-serif", color:"var(--text-primary)", marginBottom:8 }}>Connect Your Guild</h2>
      <p style={{ color:"var(--text-secondary)", marginBottom:24, fontSize:15, lineHeight:1.6 }}>
        Add your Discord Server ID to connect it to the knowledge base. You can manage multiple servers.
      </p>

      {guilds.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:10 }}>Your Guilds</div>
          {guilds.map(g => (
            <div key={g.id} onClick={() => onSelect(g.id)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:"var(--radius-md)", border:`1.5px solid ${g.id===activeId?"var(--border-focus)":"var(--border)"}`, marginBottom:8, cursor:"pointer", background: g.id===activeId ? "var(--accent-light)" : "var(--bg-surface)", transition:"all var(--transition)" }}>
              <div style={{ width:36, height:36, borderRadius:"var(--radius-sm)", background:`${g.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:g.color, fontFamily:"'Syne',sans-serif", flexShrink:0 }}>
                {g.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, color:"var(--text-primary)" }}>{g.name}</div>
                <div className="mono" style={{ display:"inline-block", fontSize:11, marginTop:2 }}>{g.id.slice(0,16)}…</div>
              </div>
              {g.id===activeId && <span className="tag tag-success">Selected</span>}
            </div>
          ))}
        </div>
      )}

      <div className="panel" style={{ padding:"18px", marginBottom:20 }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text-primary)", marginBottom:14 }}>Add a New Guild</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div>
            <label style={{ fontSize:11.5, color:"var(--text-muted)", fontWeight:600, display:"block", marginBottom:5 }}>DISCORD SERVER ID *</label>
            <input value={newId} onChange={e => { setNewId(e.target.value); setErr(""); }}
              placeholder="e.g. 1476466974098985067" className="field field-mono" />
            <p style={{ fontSize:11.5, color:"var(--text-muted)", marginTop:5 }}>Found in Server Settings → Widget → Server ID</p>
          </div>
          <div>
            <label style={{ fontSize:11.5, color:"var(--text-muted)", fontWeight:600, display:"block", marginBottom:5 }}>DISPLAY NAME</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="My Server" className="field" />
          </div>
          <div>
            <label style={{ fontSize:11.5, color:"var(--text-muted)", fontWeight:600, display:"block", marginBottom:8 }}>ACCENT COLOR</label>
            <div style={{ display:"flex", gap:8 }}>
              {GUILD_COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{ width:24, height:24, borderRadius:"50%", background:c, cursor:"pointer", border:`2.5px solid ${color===c?"#fff":"transparent"}`, transition:"border var(--transition)", boxSizing:"border-box" }} />
              ))}
            </div>
          </div>
          {err && <p style={{ fontSize:12.5, color:"var(--danger)" }}>{err}</p>}
          <button className="btn btn-ghost" onClick={create} style={{ justifyContent:"center" }}>
            <I.Plus /> Add Guild
          </button>
        </div>
      </div>

      <button className="btn btn-primary" onClick={onNext} disabled={!activeId} style={{ width:"100%", padding:"13px", justifyContent:"center", fontSize:15 }}>
        Continue <I.ArrowRight />
      </button>
    </div>
  );
}

function OnboardingUpload({ guildId, onNext, onSkip }) {
  const [urls, setUrls] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const fileRef = useRef(null);

  const upload = async () => {
    if (!urls.trim() && !files.length) return;
    setLoading(true); setStatus(null);
    // Simulate upload
    setTimeout(() => {
      setStatus({ ok:true, msg:`✓ Success — ${urls.trim().split("\n").filter(Boolean).length} URL(s), ${files.length} PDF(s) queued for processing` });
      setLoading(false);
    }, 1800);
  };

  return (
    <div className="anim-up" style={{ maxWidth:520, margin:"0 auto", padding:"0 24px" }}>
      <h2 style={{ fontSize:28, fontWeight:700, fontFamily:"'Syne',sans-serif", color:"var(--text-primary)", marginBottom:8 }}>Add Your Content</h2>
      <p style={{ color:"var(--text-secondary)", marginBottom:24, fontSize:15, lineHeight:1.6 }}>
        Upload PDFs or paste website URLs to build your knowledge base. You can always add more later.
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
        <div className="panel" style={{ padding:"18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <div style={{ color:"#818cf8" }}><I.Globe /></div>
            <span style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>Website URLs</span>
            <span className="tag tag-accent" style={{ marginLeft:"auto", fontSize:10 }}>One per line</span>
          </div>
          <textarea value={urls} onChange={e => setUrls(e.target.value)} rows={3} className="field"
            placeholder={"https://docs.example.com\nhttps://yoursite.com/about"}
            style={{ resize:"vertical", fontFamily:"'DM Mono',monospace", fontSize:12, lineHeight:1.6 }} />
        </div>

        <div className="panel" style={{ padding:"18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <div style={{ color:"#818cf8" }}><I.Upload /></div>
            <span style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>PDF Documents</span>
          </div>
          <div className="drop-zone" onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setFiles(p => [...p, ...[...e.dataTransfer.files].filter(f => f.type==="application/pdf")]); }}>
            <I.Upload />
            <p style={{ fontSize:13.5, color:"var(--text-secondary)" }}>Drop PDFs here or <span style={{ color:"#818cf8" }}>browse</span></p>
            <p style={{ fontSize:12, color:"var(--text-muted)" }}>Multiple files supported</p>
            <input ref={fileRef} type="file" accept=".pdf" multiple style={{ display:"none" }} onChange={e => setFiles(p => [...p, ...[...e.target.files]])} />
          </div>
          {files.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
              {files.map((f,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"var(--radius-xs)", padding:"4px 10px", fontSize:11.5, color:"#a5b4fc" }}>
                  {f.name.length>24 ? f.name.slice(0,21)+"…" : f.name}
                  <span onClick={() => setFiles(p => p.filter((_,j) => j!==i))} style={{ cursor:"pointer", opacity:.5, display:"flex" }}><I.X /></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {status && (
        <div style={{ padding:"12px 16px", borderRadius:"var(--radius-md)", fontSize:13.5, background:status.ok?"var(--success-bg)":"var(--danger-bg)", border:`1px solid ${status.ok?"rgba(34,211,160,0.2)":"rgba(241,99,99,0.2)"}`, color:status.ok?"var(--success)":"var(--danger)", marginBottom:16 }}>
          {status.msg}
        </div>
      )}

      <div style={{ display:"flex", gap:10 }}>
        <button className="btn btn-ghost" onClick={onSkip} style={{ flex:1, justifyContent:"center" }}>Skip for now</button>
        {status?.ok
          ? <button className="btn btn-primary" onClick={onNext} style={{ flex:2, padding:"12px", justifyContent:"center" }}>Continue <I.ArrowRight /></button>
          : <button className="btn btn-primary" onClick={upload} disabled={loading || (!urls.trim() && !files.length)} style={{ flex:2, padding:"12px", justifyContent:"center" }}>
              {loading ? <><div className="spinner" />Uploading…</> : <><I.Upload /> Upload Content</>}
            </button>
        }
      </div>
    </div>
  );
}

function OnboardingLaunch({ user, guilds, activeId, onFinish }) {
  const activeGuild = guilds.find(g => g.id===activeId) || guilds[0];
  const steps = [
    { label:"Discord account connected", done:!!user },
    { label:"Guild registered", done:!!activeGuild },
    { label:"Knowledge base ready", done:true },
    { label:"Bot configuration saved", done:true },
  ];
  return (
    <div className="anim-up" style={{ maxWidth:500, margin:"0 auto", textAlign:"center", padding:"0 24px" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#22d3a0,#059669)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", animation:"float 3s ease-in-out infinite" }}>
        <I.Bot />
      </div>
      <h2 style={{ fontSize:30, fontWeight:800, fontFamily:"'Syne',sans-serif", color:"var(--text-primary)", marginBottom:10 }}>You're All Set! 🎉</h2>
      <p style={{ color:"var(--text-secondary)", fontSize:15, lineHeight:1.65, marginBottom:28 }}>
        WalluBot is configured for <strong style={{ color:"var(--text-primary)" }}>{activeGuild?.name}</strong>. Your AI knowledge base is ready to answer questions in Discord.
      </p>

      <div className="panel" style={{ padding:"18px", marginBottom:24, textAlign:"left" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom: i<steps.length-1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:s.done?"var(--success-bg)":"var(--bg-elevated)", border:`1px solid ${s.done?"rgba(34,211,160,0.3)":"var(--border)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:s.done?"var(--success)":"var(--text-muted)" }}>
              {s.done ? <I.Check /> : <span style={{ fontSize:10 }}>○</span>}
            </div>
            <span style={{ fontSize:13.5, color:s.done?"var(--text-primary)":"var(--text-muted)" }}>{s.label}</span>
            {s.done && <span className="tag tag-success" style={{ marginLeft:"auto", fontSize:10 }}>DONE</span>}
          </div>
        ))}
      </div>

      <div style={{ background:"var(--accent-light)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"var(--radius-md)", padding:"14px 16px", marginBottom:24, textAlign:"left" }}>
        <div style={{ fontSize:12.5, fontWeight:600, color:"#818cf8", marginBottom:6 }}>NEXT STEPS</div>
        <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6 }}>Invite the WalluBot to your Discord server, then members can ask questions using <span className="mono">/ask</span> or by mentioning the bot.</p>
      </div>

      <button className="btn btn-primary" onClick={onFinish} style={{ width:"100%", padding:"14px", justifyContent:"center", fontSize:15, fontFamily:"'Syne',sans-serif" }}>
        Open Dashboard <I.ArrowRight />
      </button>
    </div>
  );
}

function OnboardingFlow({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(getStoredUser());
  const [guilds, setGuilds] = useState(getStoredGuilds());
  const [activeId, setActiveId] = useState(getStoredActiveId());
  const progress = Math.round(((step) / (OB_STEPS.length - 1)) * 100);

  const next = () => setStep(s => Math.min(s + 1, OB_STEPS.length - 1));

  const handleLogin = (u, token) => {
    saveUser(u); saveToken(token); setUser(u);
  };
  const createGuild = (g) => {
    const updated = [...guilds, g];
    setGuilds(updated); saveGuilds(updated);
    setActiveId(g.id); saveActiveId(g.id);
  };
  const selectGuild = (id) => { setActiveId(id); saveActiveId(id); };

  return (
    <div style={{ position:"fixed", inset:0, background:"var(--bg-base)", display:"flex", flexDirection:"column", overflow:"auto", zIndex:1000 }}>
      {/* Background orbs */}
      <div className="orb orb-purple" style={{ width:600, height:600, top:-200, right:-200 }} />
      <div className="orb orb-pink" style={{ width:400, height:400, bottom:-100, left:-100 }} />

      {/* Progress header */}
      <div style={{ position:"relative", padding:"20px 32px 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:"var(--radius-sm)", background:"var(--accent-light)", display:"flex", alignItems:"center", justifyContent:"center", color:"#818cf8" }}>
              <I.Bot />
            </div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:"var(--text-primary)" }}>WalluBot</span>
          </div>
          <button className="btn btn-ghost" onClick={onSkip} style={{ padding:"6px 14px", fontSize:12.5 }}>
            Skip Setup
          </button>
        </div>

        {/* Step indicators */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:8 }}>
          {OB_STEPS.map((s, i) => (
            <div key={s.id} style={{ display:"flex", alignItems:"center", flex: i < OB_STEPS.length-1 ? 1 : "none" }}>
              <div className={`ob-step-dot ${i<step?"done":i===step?"active":"pending"}`}>
                {i < step ? <I.Check /> : <span style={{ fontSize:11 }}>{i+1}</span>}
              </div>
              {i < OB_STEPS.length-1 && <div className={`step-connector ${i<step?"done":""}`} />}
            </div>
          ))}
        </div>
        <div className="ob-progress-track" style={{ marginBottom:8 }}>
          <div className="ob-progress-fill" style={{ width:`${progress}%` }} />
        </div>
        <div style={{ fontSize:12, color:"var(--text-muted)" }}>Step {step+1} of {OB_STEPS.length} · {OB_STEPS[step].label}</div>
      </div>

      {/* Step content */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px", position:"relative" }}>
        {step === 0 && <OnboardingWelcome onNext={next} />}
        {step === 1 && <OnboardingConnect user={user} onNext={next} onLogin={handleLogin} />}
        {step === 2 && <OnboardingGuild guilds={guilds} activeId={activeId} onSelect={selectGuild} onCreate={createGuild} onNext={next} />}
        {step === 3 && <OnboardingUpload guildId={activeId} onNext={next} onSkip={next} />}
        {step === 4 && <OnboardingLaunch user={user} guilds={guilds} activeId={activeId} onFinish={() => { saveOnboarded(); onComplete(user, guilds, activeId); }} />}
      </div>
    </div>
  );
}

// ─── CHAT PANEL ────────────────────────────────────────────────────────────────
const CHAT_SUGGESTIONS = [
  "What documents are available?",
  "Summarize the knowledge base",
  "What topics can you help with?",
  "How do I add more documents?",
];

function ChatPanel({ isOpen, guildId, guildName }) {
  const SYSTEM = makeSystemPrompt(guildId);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSugg, setShowSugg] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 250); }, [isOpen]);

  const callAPI = useCallback(async (question, hist) => {
    setLoading(true);
    try {
      let text = "";
      try {
        const r = await fetch("http://localhost:8000/query", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ question, server:guildId }) });
        if (r.ok) { const d = await r.json(); if (d.answer) text = d.answer; }
      } catch (_) {}
      if (!text) {
        const r = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:SYSTEM, messages:hist }) });
        if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e?.error?.message||`HTTP ${r.status}`); }
        const d = await r.json();
        text = d.content.filter(b=>b.type==="text").map(b=>b.text).join("\n").trim();
        if (!text) throw new Error("No response received.");
      }
      setMessages(p => [...p, { role:"assistant", content:text, id:Date.now() }]);
      setHistory(p => [...p, { role:"assistant", content:text }]);
    } catch(e) {
      setMessages(p => [...p, { role:"assistant", content:"Error: "+e.message, id:Date.now(), error:true }]);
    } finally { setLoading(false); }
  }, [guildId, SYSTEM]);

  const send = useCallback((text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setShowSugg(false); setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    const hist = [...history, { role:"user", content:q }];
    setMessages(p => [...p, { role:"user", content:q, id:Date.now() }]);
    setHistory(hist);
    callAPI(q, hist);
  }, [input, loading, history, callAPI]);

  return (
    <div style={{
      position:"fixed", bottom:88, right:24,
      width:390, height:540,
      background:"var(--bg-surface)",
      border:"1px solid var(--border-active)",
      borderRadius:"var(--radius-xl)",
      boxShadow:"0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
      zIndex:500, display:"flex", flexDirection:"column", overflow:"hidden",
      transition:"transform .35s cubic-bezier(0.16,1,0.3,1), opacity .2s ease",
      transform: isOpen ? "scale(1) translateY(0)" : "scale(0.9) translateY(24px)",
      opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "all" : "none",
      transformOrigin:"bottom right",
    }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, background:"var(--bg-elevated)", flexShrink:0 }}>
        <div style={{ width:34, height:34, borderRadius:"var(--radius-sm)", background:"var(--accent-light)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <I.Bot />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Syne',sans-serif" }}>{guildName}</div>
          <div style={{ fontSize:11, color:"var(--text-muted)" }}>Knowledge Base Assistant</div>
        </div>
        <span className="status-dot status-online" />
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
          <div style={{ width:26, height:26, borderRadius:"var(--radius-xs)", background:"var(--accent-light)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}><I.Bot /></div>
          <div>
            <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"4px 12px 12px 12px", padding:"10px 14px", fontSize:13.5, color:"var(--text-secondary)", lineHeight:1.6, maxWidth:295 }}>
              Hello! Ask me anything about the <strong style={{ color:"var(--text-primary)" }}>{guildName}</strong> knowledge base.
            </div>
            {showSugg && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
                {CHAT_SUGGESTIONS.map((s,i) => (
                  <button key={i} onClick={() => send(s)}
                    style={{ padding:"5px 11px", borderRadius:"var(--radius-full)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-muted)", fontSize:11.5, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all var(--transition)" }}
                    onMouseEnter={e => { e.target.style.borderColor="var(--accent)"; e.target.style.color="var(--text-primary)"; }}
                    onMouseLeave={e => { e.target.style.borderColor="var(--border)"; e.target.style.color="var(--text-muted)"; }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {messages.map(msg => (
          <div key={msg.id} className="anim-up">
            {msg.role==="user" ? (
              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <div style={{ background:"var(--accent)", borderRadius:"12px 4px 12px 12px", padding:"9px 14px", fontSize:13.5, color:"#fff", maxWidth:275, lineHeight:1.55 }}>{msg.content}</div>
              </div>
            ) : (
              <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                <div style={{ width:26, height:26, borderRadius:"var(--radius-xs)", background:"var(--accent-light)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}><I.Bot /></div>
                <div style={{ background:msg.error?"var(--danger-bg)":"var(--bg-elevated)", border:`1px solid ${msg.error?"rgba(241,99,99,0.2)":"var(--border)"}`, borderRadius:"4px 12px 12px 12px", padding:"10px 14px", maxWidth:295 }}>
                  {msg.error ? <span style={{ fontSize:12.5, color:"var(--danger)" }}>{msg.content}</span> : <MsgContent text={msg.content} />}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
            <div style={{ width:26, height:26, borderRadius:"var(--radius-xs)", background:"var(--accent-light)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}><I.Bot /></div>
            <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"4px 12px 12px 12px", padding:"12px 14px" }}><TypingDots /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding:"10px 12px 14px", borderTop:"1px solid var(--border)", background:"var(--bg-elevated)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:8, background:"var(--bg-base)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"7px 7px 7px 12px", transition:"border-color var(--transition)" }}
          onFocusCapture={e => e.currentTarget.style.borderColor="var(--border-focus)"}
          onBlurCapture={e => e.currentTarget.style.borderColor="var(--border)"}>
          <textarea ref={inputRef} value={input}
            onChange={e => { setInput(e.target.value); const el=e.target; el.style.height="auto"; el.style.height=Math.min(el.scrollHeight,96)+"px"; }}
            onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
            placeholder="Ask a question…" rows={1} disabled={loading}
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--text-primary)", fontSize:13.5, lineHeight:1.5, resize:"none", fontFamily:"'DM Sans',sans-serif", minHeight:22, maxHeight:96 }} />
          <button onClick={() => send()} disabled={loading||!input.trim()} className="btn-icon"
            style={{ width:30, height:30, borderRadius:"var(--radius-xs)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background:input.trim()&&!loading?"var(--accent)":undefined, color:input.trim()&&!loading?"#fff":undefined, borderColor:input.trim()&&!loading?"var(--accent)":undefined }}>
            {loading ? <div className="spinner" style={{ color:"var(--accent)" }} /> : <I.Send />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD TABS ────────────────────────────────────────────────────────────
function OverviewTab({ guilds, activeGuild, user }) {
  const stats = [
    { label:"Total Guilds", value:guilds.length, sub:"Knowledge bases", icon:<I.Database />, col:"#6366f1" },
    { label:"Active Guild", value:activeGuild.name, sub:"Currently selected", icon:<I.Activity />, col:"#22d3a0", mono:true, truncate:true },
    { label:"Vector Store ID", value:activeGuild.id.slice(0,10)+"…", sub:"Guild identifier", icon:<I.Key />, col:"#f5a623", mono:true },
    { label:"Status", value:"Online", sub:"All systems operational", icon:<I.Shield />, col:"#22d3a0" },
  ];
  return (
    <div style={{ padding:"32px 36px", overflowY:"auto", flex:1 }}>
      {user && (
        <div className="panel anim-up" style={{ padding:"18px 22px", marginBottom:24, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:"#fff", fontFamily:"'Syne',sans-serif", flexShrink:0 }}>
            {user.username?.slice(0,1).toUpperCase() || "U"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14.5, fontWeight:600, color:"var(--text-primary)" }}>{user.username || "Admin"}</div>
            <div style={{ fontSize:12.5, color:"var(--text-muted)", marginTop:2 }}>{user.email}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span className="status-dot status-online" />
            <span className="tag tag-success">Admin</span>
          </div>
        </div>
      )}

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:6 }}>Dashboard</div>
        <h1 style={{ fontSize:26, fontWeight:700, fontFamily:"'Syne',sans-serif", color:"var(--text-primary)", letterSpacing:"-0.02em" }}>
          {activeGuild.name}
        </h1>
        <p style={{ fontSize:14, color:"var(--text-secondary)", marginTop:4 }}>
          Vector Store: <span className="mono">{activeGuild.id}</span>
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginBottom:24 }}>
        {stats.map((s,i) => (
          <div key={i} className={`panel card-hover anim-up d${i+1}`} style={{ padding:"20px 22px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:"var(--radius-sm)", background:`${s.col}18`, display:"flex", alignItems:"center", justifyContent:"center", color:s.col }}>
                {s.icon}
              </div>
              <span className="tag tag-accent" style={{ fontSize:10 }}>LIVE</span>
            </div>
            <div style={{ fontFamily:s.mono?"'DM Mono',monospace":"'Syne',sans-serif", fontSize:s.mono?12:22, fontWeight:700, color:"var(--text-primary)", letterSpacing:s.mono?"-0.01em":"-0.03em", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.value}</div>
            <div style={{ fontSize:12.5, color:"var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="panel anim-up d3" style={{ overflow:"hidden", marginBottom:20 }}>
        <div style={{ padding:"14px 22px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>All Knowledge Bases</div>
          <span className="tag tag-accent">{guilds.length}</span>
        </div>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Guild ID</th><th>Created</th><th>Status</th></tr></thead>
          <tbody>
            {guilds.map(g => (
              <tr key={g.id}>
                <td>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:g.color||"#6366f1", flexShrink:0 }} />
                    <span style={{ fontWeight:500, color:g.id===activeGuild.id?"var(--text-primary)":undefined }}>{g.name}</span>
                    {g.id===activeGuild.id && <span className="tag tag-success" style={{ fontSize:9 }}>ACTIVE</span>}
                  </div>
                </td>
                <td><span className="mono">{g.id.slice(0,14)}…</span></td>
                <td style={{ color:"var(--text-muted)" }}>{g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "—"}</td>
                <td><span className="status-dot status-online" style={{ display:"inline-block" }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel anim-up d4" style={{ padding:"20px 22px" }}>
        <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", marginBottom:14 }}>Quick Start Guide</div>
        {[
          ["Upload PDFs or paste URLs", "Use the Knowledge Base tab to ingest your content."],
          ["Discover sub-pages", "Use the Sub-URL Crawler to crawl entire websites."],
          ["Test with Chat", "Use the chat widget to verify your knowledge base."],
          ["Manage guilds", "Switch or create guilds from the Guild Settings tab."],
        ].map(([title, desc], i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 0", borderBottom:i<3?"1px solid var(--border)":"none" }}>
            <div style={{ width:22, height:22, borderRadius:"var(--radius-xs)", background:"var(--accent-light)", color:"#818cf8", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:"'DM Mono',monospace" }}>{i+1}</div>
            <div>
              <div style={{ fontSize:13.5, fontWeight:500, color:"var(--text-primary)", marginBottom:2 }}>{title}</div>
              <div style={{ fontSize:12.5, color:"var(--text-muted)", lineHeight:1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadTab({ guildId }) {
  const [urls, setUrls] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sheetFile, setSheetFile] = useState(null);
  const [sheetStatus, setSheetStatus] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const fileRef = useRef(null);
  const sheetRef = useRef(null);

  const handleUpload = async () => {
    if (!urls.trim() && !files.length) return;
    setLoading(true); setStatus(null);
    const fd = new FormData();
    fd.append("guild_id", guildId);
    if (urls.trim()) fd.append("urls", urls.trim());
    files.forEach(f => fd.append("files", f));
    try {
      const r = await fetch("http://localhost:8000/upload", { method:"PUT", body:fd });
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      const d = await r.json();
      setStatus({ ok:true, msg:`✓ Uploaded — ${d.urls_processed||0} URL(s), ${d.pdfs_processed||0} PDF(s) processed` });
      setUrls(""); setFiles([]);
    } catch(e) { setStatus({ ok:false, msg:"✗ "+e.message }); }
    finally { setLoading(false); }
  };

  const handleSheet = async () => {
    if (!sheetFile) return;
    setSheetLoading(true); setSheetStatus(null);
    const fd = new FormData();
    fd.append("guild_id", guildId); fd.append("file", sheetFile);
    try {
      const r = await fetch("http://localhost:8000/upload-contacts", { method:"PUT", body:fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail||`Error ${r.status}`);
      setSheetStatus({ ok:true, msg:"✓ "+d.message }); setSheetFile(null);
    } catch(e) { setSheetStatus({ ok:false, msg:"✗ "+e.message }); }
    finally { setSheetLoading(false); }
  };

  return (
    <div style={{ padding:"32px 36px", overflowY:"auto", flex:1 }}>
      <div style={{ maxWidth:640 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:6 }}>Knowledge Base</div>
        <h1 style={{ fontSize:24, fontWeight:700, fontFamily:"'Syne',sans-serif", color:"var(--text-primary)", marginBottom:4 }}>Upload Content</h1>
        <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:28, lineHeight:1.6 }}>Ingest URLs and PDF documents into the active vector store.</p>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="panel anim-up" style={{ padding:"20px 22px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ color:"#818cf8" }}><I.Globe /></div>
              <span style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>Web URLs</span>
              <span className="tag tag-accent" style={{ marginLeft:"auto", fontSize:10 }}>One per line</span>
            </div>
            <textarea value={urls} onChange={e => setUrls(e.target.value)} placeholder={"https://example.com/docs\nhttps://another.com/page"} rows={4} className="field"
              style={{ resize:"vertical", lineHeight:1.6, fontFamily:"'DM Mono',monospace", fontSize:12.5 }} />
          </div>

          <div className="panel anim-up d1" style={{ padding:"20px 22px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ color:"#818cf8" }}><I.Upload /></div>
              <span style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>PDF Files</span>
            </div>
            <div className="drop-zone" onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setFiles(p => [...p, ...[...e.dataTransfer.files].filter(f => f.type==="application/pdf")]); }}>
              <I.Upload />
              <p style={{ fontSize:14, color:"var(--text-secondary)" }}>Drop PDFs here or <span style={{ color:"#818cf8" }}>browse</span></p>
              <p style={{ fontSize:12, color:"var(--text-muted)" }}>Multiple files supported</p>
              <input ref={fileRef} type="file" accept=".pdf" multiple style={{ display:"none" }} onChange={e => setFiles(p => [...p, ...[...e.target.files]])} />
            </div>
            {files.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:12 }}>
                {files.map((f,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"var(--radius-xs)", padding:"4px 10px", fontSize:12, color:"#a5b4fc" }}>
                    {f.name.length>24?f.name.slice(0,21)+"…":f.name}
                    <span onClick={() => setFiles(p => p.filter((_,j) => j!==i))} style={{ cursor:"pointer", opacity:.5, display:"flex" }}><I.X /></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {status && <div style={{ padding:"12px 16px", borderRadius:"var(--radius-sm)", fontSize:13.5, background:status.ok?"var(--success-bg)":"var(--danger-bg)", border:`1px solid ${status.ok?"rgba(34,211,160,0.2)":"rgba(241,99,99,0.2)"}`, color:status.ok?"var(--success)":"var(--danger)" }}>{status.msg}</div>}

          <button className="btn btn-primary anim-up d2" onClick={handleUpload} disabled={loading||(!urls.trim()&&!files.length)} style={{ width:"100%", padding:"12px", justifyContent:"center" }}>
            {loading ? <><div className="spinner" />Ingesting…</> : <><I.Upload />Upload to Vector Store</>}
          </button>

          <div style={{ borderTop:"1px dashed var(--border)", paddingTop:24, marginTop:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ color:"var(--success)" }}><I.Sheet /></div>
              <span style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>Structured Data Sheet</span>
              <span className="tag tag-success" style={{ marginLeft:"auto", fontSize:10 }}>Priority Source</span>
            </div>
            <p style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:14, lineHeight:1.6 }}>Upload an <span className="mono">.xlsx</span> file for structured data like contacts, faculty, or product info.</p>
            <div className="drop-zone" style={{ borderColor:sheetFile?"var(--success)":undefined, background:sheetFile?"var(--success-bg)":undefined }}
              onClick={() => sheetRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f=[...e.dataTransfer.files].find(f=>f.name.endsWith(".xlsx")); if(f) setSheetFile(f); }}>
              {sheetFile ? (
                <><div style={{ color:"var(--success)" }}><I.Check /></div><p style={{ fontSize:13.5, fontWeight:600, color:"var(--success)" }}>{sheetFile.name}</p><p style={{ fontSize:11.5, color:"var(--text-muted)" }}>{(sheetFile.size/1024).toFixed(1)} KB · Click to replace</p></>
              ) : (
                <><I.Sheet /><p style={{ fontSize:13.5, color:"var(--text-secondary)" }}>Drop <strong style={{ color:"var(--text-primary)" }}>.xlsx</strong> here or browse</p></>
              )}
              <input ref={sheetRef} type="file" accept=".xlsx" style={{ display:"none" }} onChange={e => { if(e.target.files[0]) setSheetFile(e.target.files[0]); }} />
            </div>
            {sheetStatus && <div style={{ marginTop:10, padding:"11px 14px", borderRadius:"var(--radius-sm)", fontSize:13.5, background:sheetStatus.ok?"var(--success-bg)":"var(--danger-bg)", border:`1px solid ${sheetStatus.ok?"rgba(34,211,160,0.2)":"rgba(241,99,99,0.2)"}`, color:sheetStatus.ok?"var(--success)":"var(--danger)" }}>{sheetStatus.msg}</div>}
            <button onClick={handleSheet} disabled={sheetLoading||!sheetFile} className="btn btn-success" style={{ marginTop:12, width:"100%", padding:"12px", justifyContent:"center" }}>
              {sheetLoading ? <><div className="spinner" />Uploading…</> : <>Save Structured Data</>}
            </button>
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
    const url = baseUrl.trim();
    if (!url) return;
    setFetching(true); setResults(null); setSelected(new Set()); setFilter(""); setIngestStatus(null);
    try {
      const r = await fetch(`http://localhost:8000/sub-urls?url=${encodeURIComponent(url)}`);
      if (!r.ok) { const e = await r.json().catch(()=>{}); throw new Error(e?.detail||`HTTP ${r.status}`); }
      setResults(await r.json());
    } catch(e) { setResults({ base_url:url, sub_urls:[], count:0, error:e.message }); }
    finally { setFetching(false); }
  };

  const toggle = (u) => setSelected(p => { const n=new Set(p); n.has(u)?n.delete(u):n.add(u); return n; });
  const filtered = results ? results.sub_urls.filter(u => !filter || u.toLowerCase().includes(filter.toLowerCase())) : [];

  const ingest = async () => {
    if (!selected.size) return;
    setIngesting(true); setIngestStatus(null);
    const fd = new FormData();
    fd.append("guild_id", guildId); fd.append("urls", [...selected].join("\n"));
    try {
      const r = await fetch("http://localhost:8000/upload", { method:"PUT", body:fd });
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      const d = await r.json();
      setIngestStatus({ ok:true, msg:`✓ ${d.message} — ${d.urls_processed} URL(s) ingested` });
    } catch(e) { setIngestStatus({ ok:false, msg:"✗ "+e.message }); }
    finally { setIngesting(false); }
  };

  return (
    <div style={{ padding:"32px 36px", overflowY:"auto", flex:1 }}>
      <div style={{ maxWidth:700 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:6 }}>Discovery</div>
        <h1 style={{ fontSize:24, fontWeight:700, fontFamily:"'Syne',sans-serif", color:"var(--text-primary)", marginBottom:4 }}>Sub-URL Crawler</h1>
        <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:28, lineHeight:1.6 }}>Crawl a website to discover all linked pages, select the ones you need, and ingest them.</p>

        <div className="panel anim-up" style={{ padding:"20px 22px", marginBottom:16 }}>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1, position:"relative" }}>
              <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }}><I.Search /></div>
              <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} onKeyDown={e => e.key==="Enter"&&fetchUrls()} placeholder="https://example.com" className="field" style={{ paddingLeft:36, fontFamily:"'DM Mono',monospace", fontSize:12.5 }} />
            </div>
            <button className="btn btn-primary" onClick={fetchUrls} disabled={fetching||!baseUrl.trim()} style={{ padding:"10px 20px" }}>
              {fetching ? <><div className="spinner" />Scanning…</> : <><I.Search />Discover</>}
            </button>
          </div>
        </div>

        {results && (
          <div className="anim-up">
            {results.error ? (
              <div style={{ padding:"14px 16px", borderRadius:"var(--radius-sm)", background:"var(--danger-bg)", border:"1px solid rgba(241,99,99,0.2)", color:"var(--danger)", fontSize:13.5 }}>✗ {results.error}</div>
            ) : (
              <div className="panel" style={{ overflow:"hidden" }}>
                <div style={{ padding:"12px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span className="tag tag-accent">{results.count} URLs</span>
                  {selected.size>0 && <span className="tag tag-success">{selected.size} selected</span>}
                  <div style={{ flex:1, minWidth:160, position:"relative" }}>
                    <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }}><I.Search /></div>
                    <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…" className="field" style={{ paddingLeft:30, height:32, fontSize:12.5, fontFamily:"'DM Mono',monospace" }} />
                  </div>
                  <button className="btn btn-ghost" onClick={() => setSelected(new Set(filtered))} style={{ padding:"5px 12px", fontSize:12.5 }}>All</button>
                  <button className="btn btn-ghost" onClick={() => setSelected(new Set())} style={{ padding:"5px 12px", fontSize:12.5 }}>Clear</button>
                </div>
                <div style={{ maxHeight:320, overflowY:"auto" }}>
                  {filtered.length===0
                    ? <div style={{ padding:"28px", textAlign:"center", color:"var(--text-muted)", fontSize:13.5 }}>No URLs match filter</div>
                    : filtered.map((u,i) => {
                        const sel = selected.has(u);
                        return (
                          <div key={i} className={`check-row${sel?" selected":""}`} onClick={() => toggle(u)}>
                            <div className={`custom-check${sel?" checked":""}`}>{sel && <I.Check />}</div>
                            <span style={{ fontSize:12, color:sel?"#a5b4fc":"var(--text-muted)", fontFamily:"'DM Mono',monospace", wordBreak:"break-all", flex:1, lineHeight:1.5 }}>{u}</span>
                            <a href={u} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ color:"var(--text-muted)", display:"flex", flexShrink:0 }}><I.External /></a>
                          </div>
                        );
                      })
                  }
                </div>
                <div style={{ padding:"12px 18px", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
                  <p style={{ fontSize:12.5, color:"var(--text-muted)" }}>{selected.size>0?`${selected.size} URL${selected.size>1?"s":""} queued`:"Select URLs to ingest"}</p>
                  <button className="btn btn-primary" onClick={ingest} disabled={ingesting||selected.size===0} style={{ padding:"8px 18px" }}>
                    {ingesting ? <><div className="spinner" />Ingesting…</> : <>Ingest Selected ({selected.size})</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {ingestStatus && <div className="anim-in" style={{ marginTop:14, padding:"12px 16px", borderRadius:"var(--radius-sm)", fontSize:13.5, background:ingestStatus.ok?"var(--success-bg)":"var(--danger-bg)", border:`1px solid ${ingestStatus.ok?"rgba(34,211,160,0.2)":"rgba(241,99,99,0.2)"}`, color:ingestStatus.ok?"var(--success)":"var(--danger)" }}>{ingestStatus.msg}</div>}
      </div>
    </div>
  );
}

function SettingsTab({ guilds, activeId, onSelect, onCreate, onDelete, onRename, user, onLogout }) {
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [color, setColor] = useState(GUILD_COLORS[0]);
  const [showSessions, setShowSessions] = useState(false);

  const create = () => {
    const tid=newId.trim(), tname=newName.trim();
    if (!tid) { setError("Guild ID is required."); return; }
    if (guilds.find(g=>g.id===tid)) { setError("This ID already exists."); return; }
    onCreate({ id:tid, name:tname||`Guild ${tid.slice(0,6)}`, createdAt:Date.now(), color });
    setNewId(""); setNewName(""); setError("");
  };

  return (
    <div style={{ padding:"32px 36px", overflowY:"auto", flex:1 }}>
      <div style={{ maxWidth:620 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:6 }}>Configuration</div>
        <h1 style={{ fontSize:24, fontWeight:700, fontFamily:"'Syne',sans-serif", color:"var(--text-primary)", marginBottom:4 }}>Guild Settings</h1>
        <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:28, lineHeight:1.6 }}>Manage knowledge base guilds and your Discord account.</p>

        {/* Account */}
        {user && (
          <div className="panel anim-up" style={{ padding:"18px 22px", marginBottom:20 }}>
            <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text-primary)", marginBottom:14 }}>Discord Account</div>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#fff", fontFamily:"'Syne',sans-serif" }}>
                {user.username?.slice(0,1).toUpperCase()||"U"}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>{user.username||"Admin"}</div>
                <div style={{ fontSize:12.5, color:"var(--text-muted)", marginTop:2 }}>{user.email}</div>
              </div>
              <div style={{ marginLeft:"auto" }}>
                <button className="btn btn-danger" onClick={onLogout} style={{ padding:"7px 14px" }}>
                  <I.Logout /> Logout
                </button>
              </div>
            </div>
            <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"10px 14px", fontSize:12.5, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
              Discord ID: {user.discord_id}
            </div>
          </div>
        )}

        {/* Guilds */}
        <div className="panel anim-up d1" style={{ overflow:"hidden", marginBottom:20 }}>
          <div style={{ padding:"14px 22px", borderBottom:"1px solid var(--border)" }}>
            <span style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>Registered Guilds</span>
          </div>
          {guilds.map(g => (
            <div key={g.id} style={{ padding:"14px 22px", borderBottom:"1px solid rgba(255,255,255,0.04)", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:"var(--radius-sm)", background:`${g.color||"#6366f1"}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, fontWeight:700, color:g.color||"#6366f1", fontFamily:"'Syne',sans-serif" }}>
                {g.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                {editId===g.id ? (
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if(e.key==="Enter"){onRename(g.id,editName);setEditId(null);} if(e.key==="Escape") setEditId(null); }}
                    className="field" style={{ height:32, fontSize:13.5, padding:"4px 10px" }} />
                ) : (
                  <>
                    <div style={{ fontSize:13.5, fontWeight:500, color:"var(--text-primary)", display:"flex", alignItems:"center", gap:8 }}>
                      {g.name}
                      {g.id===activeId && <span className="tag tag-success" style={{ fontSize:9 }}>ACTIVE</span>}
                    </div>
                    <span className="mono" style={{ fontSize:10.5, marginTop:3, display:"inline-block" }}>{g.id.slice(0,16)}…</span>
                  </>
                )}
              </div>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                {g.id!==activeId && <button className="btn btn-ghost" style={{ padding:"5px 12px", fontSize:12.5 }} onClick={() => onSelect(g.id)}>Activate</button>}
                <button className="btn btn-ghost" style={{ padding:"6px 10px" }} onClick={() => { setEditId(g.id===editId?null:g.id); setEditName(g.name); }} title="Rename"><I.Edit /></button>
                {guilds.length>1 && <button className="btn btn-danger" style={{ padding:"6px 10px" }} onClick={() => onDelete(g.id)}><I.Trash /></button>}
              </div>
            </div>
          ))}
        </div>

        {/* Create new */}
        <div className="panel anim-up d2" style={{ padding:"20px 22px" }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text-primary)", marginBottom:16 }}>Add New Guild</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <label style={{ fontSize:11.5, color:"var(--text-muted)", fontWeight:600, display:"block", marginBottom:5 }}>GUILD ID *</label>
              <input value={newId} onChange={e => { setNewId(e.target.value); setError(""); }} placeholder="e.g. 1234567890123456789" className="field field-mono" />
            </div>
            <div>
              <label style={{ fontSize:11.5, color:"var(--text-muted)", fontWeight:600, display:"block", marginBottom:5 }}>DISPLAY NAME</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="My Knowledge Base" className="field" />
            </div>
            <div>
              <label style={{ fontSize:11.5, color:"var(--text-muted)", fontWeight:600, display:"block", marginBottom:8 }}>ACCENT COLOR</label>
              <div style={{ display:"flex", gap:8 }}>{GUILD_COLORS.map(c => (<div key={c} onClick={() => setColor(c)} style={{ width:24, height:24, borderRadius:"50%", background:c, cursor:"pointer", border:`2.5px solid ${color===c?"#fff":"transparent"}`, transition:"border var(--transition)", boxSizing:"border-box" }} />))}</div>
            </div>
            {error && <p style={{ fontSize:12.5, color:"var(--danger)" }}>{error}</p>}
            <button className="btn btn-primary" onClick={create} style={{ marginTop:4, padding:"11px", justifyContent:"center" }}>
              <I.Plus /> Create Guild
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────────
const TABS = [
  { id:"overview", label:"Overview",      icon:<I.Home /> },
  { id:"upload",   label:"Knowledge Base",icon:<I.Upload /> },
  { id:"suburls",  label:"Sub-URL Crawler",icon:<I.Globe /> },
  { id:"settings", label:"Guild Settings",icon:<I.Settings /> },
];

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(!getStoredOnboarded());
  const [user, setUser] = useState(getStoredUser());
  const [guilds, setGuilds] = useState(getStoredGuilds());
  const [activeId, setActiveId] = useState(getStoredActiveId());
  const [tab, setTab] = useState("overview");
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle Discord OAuth token in hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#token=")) {
      const token = hash.slice(7);
      saveToken(token);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const activeGuild = guilds.find(g => g.id===activeId) || guilds[0];

  const selectGuild = (id) => { setActiveId(id); saveActiveId(id); };
  const createGuild = (g) => { const u=[...guilds,g]; setGuilds(u); saveGuilds(u); selectGuild(g.id); };
  const deleteGuild = (id) => { const u=guilds.filter(g=>g.id!==id); setGuilds(u); saveGuilds(u); if(activeId===id) selectGuild(u[0].id); };
  const renameGuild = (id, name) => { const u=guilds.map(g=>g.id===id?{...g,name}:g); setGuilds(u); saveGuilds(u); };
  const handleLogout = () => { localStorage.removeItem("wb_token"); localStorage.removeItem("wb_user"); setUser(null); setShowOnboarding(true); localStorage.removeItem("wb_onboarded"); };

  const onboardComplete = (u, g, id) => {
    if (u) { setUser(u); saveUser(u); }
    if (g) { setGuilds(g); saveGuilds(g); }
    if (id) { setActiveId(id); saveActiveId(id); }
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return (
      <>
        <GlobalStyles />
        <OnboardingFlow onComplete={onboardComplete} onSkip={() => { saveOnboarded(); setShowOnboarding(false); }} />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div style={{ height:"100vh", display:"flex", background:"var(--bg-base)", overflow:"hidden" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width:sidebarCollapsed?60:"var(--sidebar-w)", flexShrink:0, display:"flex", flexDirection:"column", background:"var(--bg-surface)", borderRight:"1px solid var(--border)", overflow:"hidden", transition:"width 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
          {/* Logo */}
          <div style={{ padding:"16px 14px 12px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:"var(--radius-sm)", background:"var(--accent-light)", display:"flex", alignItems:"center", justifyContent:"center", color:"#818cf8", flexShrink:0 }}>
                <I.Bot />
              </div>
              {!sidebarCollapsed && (
                <div style={{ overflow:"hidden" }}>
                  <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", fontFamily:"'Syne',sans-serif", letterSpacing:"-0.02em", whiteSpace:"nowrap" }}>WalluBot</div>
                  <div style={{ fontSize:10.5, color:"var(--text-muted)", fontWeight:500, whiteSpace:"nowrap" }}>Admin Panel</div>
                </div>
              )}
              <button onClick={() => setSidebarCollapsed(c=>!c)} className="btn-icon" style={{ marginLeft:"auto", padding:6, flexShrink:0, width:28, height:28 }}>
                {sidebarCollapsed ? <I.ChevRight /> : <I.ChevDown />}
              </button>
            </div>
          </div>

          {/* Guild selector */}
          {!sidebarCollapsed && (
            <div style={{ padding:"12px 10px 8px", flexShrink:0 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text-muted)", padding:"0 4px", marginBottom:6 }}>Active Guild</div>
              <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"8px 10px", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:activeGuild.color||"var(--accent)", flexShrink:0 }} />
                  <span style={{ fontSize:12.5, fontWeight:600, color:"var(--text-primary)", fontFamily:"'DM Mono',monospace", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{activeGuild.name}</span>
                </div>
                <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:3, paddingLeft:16, fontFamily:"'DM Mono',monospace" }}>{activeGuild.id.slice(0,12)}…</div>
              </div>
              {guilds.length>1 && (
                <div style={{ marginTop:5, display:"flex", flexDirection:"column", gap:1 }}>
                  {guilds.filter(g=>g.id!==activeId).map(g => (
                    <button key={g.id} onClick={() => selectGuild(g.id)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px", borderRadius:"var(--radius-xs)", border:"none", background:"transparent", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", width:"100%", transition:"background var(--transition)" }}
                      onMouseEnter={e => e.currentTarget.style.background="var(--bg-elevated)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:g.color||"#4b5563", flexShrink:0 }} />
                      <span style={{ fontSize:11.5, color:"var(--text-muted)", flex:1, textAlign:"left", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!sidebarCollapsed && <div style={{ height:"1px", background:"var(--border)", margin:"4px 10px" }} />}

          {/* Nav */}
          <nav style={{ padding:"4px 8px", flex:1 }}>
            {!sidebarCollapsed && <div style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text-muted)", padding:"0 4px", marginBottom:6 }}>Navigation</div>}
            {TABS.map(t => (
              <button key={t.id} className={`nav-item${tab===t.id?" active":""}`} onClick={() => setTab(t.id)} title={sidebarCollapsed?t.label:undefined} style={{ justifyContent:sidebarCollapsed?"center":undefined, padding:sidebarCollapsed?"8px":undefined }}>
                <div className="nav-icon">{t.icon}</div>
                {!sidebarCollapsed && t.label}
              </button>
            ))}
          </nav>

          {/* Chat toggle + user */}
          <div style={{ padding:"8px 8px 12px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
            <button className="nav-item" onClick={() => setChatOpen(o=>!o)} title={sidebarCollapsed?"Test Chat":undefined}
              style={{ background:chatOpen?"rgba(99,102,241,0.1)":undefined, color:chatOpen?"#818cf8":undefined, width:"100%", justifyContent:sidebarCollapsed?"center":undefined, padding:sidebarCollapsed?"8px":undefined }}>
              <div className="nav-icon" style={{ background:chatOpen?"rgba(99,102,241,0.2)":undefined }}><I.Chat /></div>
              {!sidebarCollapsed && "Test Chat"}
              {!sidebarCollapsed && <span className="status-dot status-online" style={{ marginLeft:"auto" }} />}
            </button>
            {user && !sidebarCollapsed && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px 2px" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff", flexShrink:0 }}>
                  {user.username?.slice(0,1).toUpperCase()||"U"}
                </div>
                <span style={{ fontSize:11.5, color:"var(--text-muted)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.username||"Admin"}</span>
                <span className="mono" style={{ fontSize:10 }}>v2.0</span>
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
          {/* Topbar */}
          <div style={{ height:"var(--topbar-h)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", background:"var(--bg-surface)", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"var(--text-muted)", fontSize:13 }}>{TABS.find(t=>t.id===tab)?.label}</span>
              <span style={{ color:"var(--border-active)" }}>›</span>
              <span className="mono" style={{ fontSize:11 }}>{activeGuild.id.slice(0,10)}…</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button className="btn btn-ghost" style={{ padding:"6px 14px", fontSize:13 }} onClick={() => setTab("settings")}>
                <I.Plus /> New Guild
              </button>
              <button className="btn btn-primary" style={{ padding:"7px 16px", fontSize:13 }} onClick={() => setChatOpen(o=>!o)}>
                <I.Chat /> {chatOpen ? "Close Chat" : "Test Chat"}
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {tab==="overview" && <OverviewTab guilds={guilds} activeGuild={activeGuild} user={user} />}
            {tab==="upload"   && <UploadTab key={activeId} guildId={activeId} />}
            {tab==="suburls"  && <SubUrlsTab key={activeId} guildId={activeId} />}
            {tab==="settings" && <SettingsTab guilds={guilds} activeId={activeId} onSelect={selectGuild} onCreate={createGuild} onDelete={deleteGuild} onRename={renameGuild} user={user} onLogout={handleLogout} />}
          </div>
        </div>

        {/* ── CHAT ── */}
        <ChatPanel isOpen={chatOpen} guildId={activeId} guildName={activeGuild.name} />

        {/* FAB */}
        <button onClick={() => setChatOpen(o=>!o)}
          style={{ position:"fixed", bottom:22, right:22, zIndex:400, width:52, height:52, borderRadius:"50%", background:chatOpen?"var(--bg-elevated)":"var(--accent)", border:`1.5px solid ${chatOpen?"var(--border-active)":"transparent"}`, cursor:"pointer", boxShadow:`0 8px 28px ${chatOpen?"rgba(0,0,0,0.3)":"var(--accent-glow)"}`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", transition:"all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.transform="scale(1.08)"}
          onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
          {chatOpen ? <I.X /> : <I.Chat />}
        </button>
      </div>
    </>
  );
}