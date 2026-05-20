import { useState, useEffect, useRef, useCallback } from "react";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────

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
  updateFaissK:      (gid, k)     => apiFetch("/server/update-faiss-k",     { method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateBm25K:       (gid, k)     => apiFetch("/server/update-bm25-k",      { method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateTemp:        (gid, k)     => apiFetch("/server/update-temperature",  { method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateChunkSize:   (gid, k)     => apiFetch("/server/update-chunk-size",   { method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateChunkOverlap:(gid, k)     => apiFetch("/server/update-chunk-overlap",{ method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateMaxToken:    (gid, k)     => apiFetch("/server/update-max-token",    { method: "PATCH", body: fd({ guild_id: gid, k }), isForm: true }),
  updateSystemPrompt:(gid, text)  => apiFetch("/server/update-system-prompt",{ method: "PUT",   body: fd({ guild_id: gid, text }), isForm: true }),
  listChannels:      (gid)        => apiFetch(`/channel/list?guild_id=${encodeURIComponent(gid)}`),
  listServersWithStatus:    ()    => apiFetch("/server/list"),
  listAllServersWithStatus: ()    => apiFetch("/server/list-all"),
  addChannel:        (gid, cid)   => apiFetch("/channel/add",     { method: "PUT",    body: fd({ guild_id: gid, channel_id: cid }), isForm: true }),
  deleteChannel:     (gid, cid)   => apiFetch("/channel/delete",  { method: "DELETE", body: fd({ guild_id: gid, channel_id: cid }), isForm: true }),
  addModChannel:     (gid, cid)   => apiFetch("/channel/add-mod", { method: "PUT",    body: fd({ guild_id: gid, channel_id: cid }), isForm: true }),
  upload: (gid, files, urls) => {
    const f = new FormData();
    f.append("guild_id", gid);
    files.forEach(fi => f.append("files", fi));
    if (urls) f.append("urls", urls);
    return apiFetch("/upload/", { method: "PUT", body: f, isForm: true });
  },
  uploadContacts: (gid, file) => {
    const f = new FormData();
    f.append("guild_id", gid);
    f.append("file", file);
    return apiFetch("/upload/contacts", { method: "PUT", body: f, isForm: true });
  },
  addFaq: (gid, text) => apiFetch("/upload/add-faq", { method: "POST", body: fd({ guild_id: gid, text }), isForm: true }),
  getAllUploads: (gid)  => apiFetch(`/upload/all?guild_id=${encodeURIComponent(gid)}`),
  getSubUrls:   (url)  => apiFetch(`/upload/sub-urls?url=${encodeURIComponent(url)}`),
  query:        (question, server) => apiFetch("/query", { method: "POST", body: { question, server } }),
  getAnalytics: (gid)  => apiFetch(`/analytics/summary?guild_id=${encodeURIComponent(gid)}`),
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

// ─── NO SERVER SELECTED EMPTY STATE ──────────────────────────────────────────
function NoServerSelected({ onGoToOverview }) {
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
          Use the server selector in the sidebar to choose which Discord server you're managing.
        </div>
      </div>
      {onGoToOverview && (
        <Btn onClick={onGoToOverview} variant="ghost" style={{ marginTop: 4 }}>
          <Icon name="add" size={16} /> Add a Server
        </Btn>
      )}
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

function Sidebar({ tab, onTab, guilds, activeGuildId, onActivate, user, onLogout }) {
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
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--on-surface)" }}>VaultBot</div>
          <div style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>AI Workspace</div>
        </div>
      </div>

      {/* ── Global Server Selector ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
          color: "var(--on-surface-variant)", marginBottom: 6, padding: "0 2px",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Icon name="dns" size={12} style={{ color: "var(--primary)" }} />
          Active Server
        </div>

        {guilds.length === 0 ? (
          /* No servers yet */
          <div style={{
            padding: "10px 12px", borderRadius: "var(--r-md)",
            background: "var(--surface-container)", border: "1.5px dashed var(--outline-variant)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Icon name="add_circle" size={16} style={{ color: "var(--on-surface-variant)", opacity: 0.5 }} />
            <span style={{ fontSize: 12, color: "var(--on-surface-variant)", fontStyle: "italic" }}>
              No servers yet
            </span>
          </div>
        ) : (
          /* Server dropdown */
          <div className="server-select-wrapper">
            <select
              className="kb-input"
              value={activeGuildId || ""}
              onChange={e => e.target.value && onActivate(e.target.value)}
              style={{
                fontSize: 13, height: 40, fontWeight: 600,
                background: activeGuildId ? "var(--primary-fixed)" : "var(--surface-lowest)",
                color: activeGuildId ? "var(--primary)" : "var(--on-surface-variant)",
                border: activeGuildId ? "1.5px solid rgba(70,72,212,0.3)" : "1.5px solid var(--outline-variant)",
              }}
            >
              {!activeGuildId && <option value="">— select server —</option>}
              {guilds.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Active server status pill */}
        {activeGuildId && guilds.find(g => g.id === activeGuildId) && (
          <div style={{
            marginTop: 6, display: "flex", alignItems: "center", gap: 5,
            padding: "4px 8px", borderRadius: "var(--r-sm)",
          }}>
            <OnlineDot />
            <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>
              All tabs use this server
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(199,196,215,0.2)", marginBottom: 4 }} />

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

// ─── LANDING PAGE (unchanged) ─────────────────────────────────────────────────
const FEATURES = [
  { icon: "smart_toy",       title: "Your Own AI Discord Bot",       desc: "Create a custom AI chatbot for your Discord server trained on your own documents and websites." },
  { icon: "description",     title: "Upload PDFs & Files",           desc: "Simply upload PDFs, notes, Excel sheets, or text files and let the AI learn from them instantly." },
  { icon: "language",        title: "Train From Websites",           desc: "Paste a website link and the bot can learn from entire documentation pages automatically." },
  { icon: "travel_explore",  title: "Website Auto Crawler",          desc: "Automatically finds all pages of a website so you can import everything in one click." },
  { icon: "forum",           title: "Answers From Your Data",        desc: "The bot answers questions using your uploaded content instead of random internet guesses." },
  { icon: "edit_note",       title: "Custom Bot Personality",        desc: "Change how the bot talks, behaves, and responds with your own custom instructions." },
  { icon: "tag",             title: "Choose Bot Channels",           desc: "Select exactly which Discord channels the bot can read and reply in." },
  { icon: "lock",            title: "Secure Discord Login",          desc: "Only authorized Discord server admins can manage and configure the bot." },
  { icon: "insights",        title: "Server Analytics",              desc: "Track usage, uploads, questions asked, and overall bot activity from a dashboard." },
  { icon: "sync",            title: "Instant Knowledge Updates",     desc: "Re-upload documents anytime to keep your AI assistant updated with the latest information." },
  { icon: "image_search",    title: "Image & Screenshot Ingestion",  desc: "Upload screenshots or images and the bot extracts and indexes text from them using OCR automatically." },
  { icon: "travel_explore",  title: "Web Search Fallback",           desc: "When your documents don't have the answer, the bot searches the web and clearly labels it as a web result." },
  { icon: "translate",       title: "Auto Language Detection",       desc: "The bot automatically detects the user's language and replies in the same language every time." },
  { icon: "format_quote",    title: "Source Citations",              desc: "Every answer references the exact document or section it came from." },
  { icon: "psychology",      title: "Hybrid RAG Retrieval",          desc: "Combines FAISS semantic vector search with BM25 keyword retrieval for highly accurate context fetching." },
  { icon: "storage",         title: "FAISS Vector Database",         desc: "Embeddings are indexed and stored using FAISS for ultra-fast similarity search performance." },
  { icon: "dataset",         title: "Smart Chunking Pipeline",       desc: "Documents are intelligently chunked with configurable overlap and chunk sizes for optimal retrieval quality." },
  { icon: "tune",            title: "Live Retrieval Controls",       desc: "Dynamically tune FAISS-K, BM25-K, temperature, max tokens, chunk size, and overlap with live sliders." },
  { icon: "api",             title: "FastAPI Backend",               desc: "Powered by a scalable FastAPI architecture optimized for async ingestion and AI response handling." },
  { icon: "hub",             title: "Multi-Server Architecture",     desc: "Supports isolated knowledge bases and configurations for multiple Discord servers simultaneously." },
  { icon: "memory",          title: "Contextual Conversation Memory",desc: "Maintains contextual awareness across interactions for more coherent multi-turn conversations." },
  { icon: "bolt",            title: "Optimized Retrieval Pipeline",  desc: "Low-latency retrieval and response generation pipeline designed for scalable production workloads." },
];
const STATS = [
  { value: "9+",  label: "Retrieval Modes" },
  { value: "5+",  label: "File Types Supported" },
  { value: "∞",   label: "Servers You Can Add" },
  { value: "90%", label: "Cheaper Than Other Bots" },
];
const HOW_IT_WORKS = [
  { step: "01", icon: "login",       title: "Login with Discord",     desc: "OAuth login verifies you're a server admin. No passwords, no extra signups." },
  { step: "02", icon: "upload_file", title: "Upload Your Knowledge",  desc: "Drag in PDFs, paste website URLs, or import Excel sheets. The crawler handles entire doc sites." },
  { step: "03", icon: "tune",        title: "Tune & Configure",       desc: "Set which channels the bot watches, customize its persona, and dial in retrieval parameters." },
  { step: "04", icon: "smart_toy",   title: "Your Bot Goes Live",     desc: "Members ask questions in Discord and get precise answers pulled from your own documents." },
];
const COMPARISON = [
  { feature: "RAG / Document Q&A",          yours: true,  mee6: false, carl: false, atlas: "partial" },
  { feature: "PDF & File Ingestion",         yours: true,  mee6: false, carl: false, atlas: true },
  { feature: "Web Crawler + URL Ingest",     yours: true,  mee6: false, carl: false, atlas: false },
  { feature: "Hybrid Vector + BM25 Search",  yours: true,  mee6: false, carl: false, atlas: false },
  { feature: "Live Parameter Tuning",        yours: true,  mee6: false, carl: false, atlas: false },
  { feature: "System Prompt Editor",         yours: true,  mee6: false, carl: false, atlas: "partial" },
  { feature: "Per-Channel Control",          yours: true,  mee6: true,  carl: true,  atlas: true },
  { feature: "Analytics Dashboard",          yours: true,  mee6: "partial", carl: false, atlas: "partial" },
  { feature: "Self-Hostable / Open Source",  yours: true,  mee6: false, carl: false, atlas: false },
  { feature: "XLSX Structured Data",         yours: true,  mee6: false, carl: false, atlas: false },
  { feature: "Discord OAuth Admin Auth",     yours: true,  mee6: true,  carl: true,  atlas: true },
];
const TECH_STACK = [
  { icon: "bolt",           label: "FastAPI" },
  { icon: "link",           label: "LangChain" },
  { icon: "search",         label: "FAISS" },
  { icon: "text_fields",    label: "BM25" },
  { icon: "hub",            label: "Discord.py" },
  { icon: "storage",        label: "PostgreSQL" },
  { icon: "developer_mode", label: "Docker" },
];
const FAQS = [
  { q: "Do I need to know coding to set it up?",       a: "No. Login with Discord, upload your files, and the bot is live. The dashboard handles everything visually." },
  { q: "Where is my uploaded data stored?",            a: "All your documents and embeddings are stored on your own server infrastructure. We never access or share your data." },
  { q: "What file types can I upload?",                a: "PDF, TXT, DOCX, XLSX, images (with OCR), and any public website URL or documentation site." },
  { q: "What happens if the bot doesn't know?",        a: "VaultBot first searches your documents. If nothing is found, it falls back to a live web search and clearly labels the result." },
  { q: "Can I use it on multiple Discord servers?",    a: "Yes. Each server gets its own isolated knowledge base and configuration." },
  { q: "Is it free?",                                  a: "We offer a free tier to get started. Paid plans unlock higher query limits and priority support." },
];
const USE_CASES = [
  { icon: "school",         title: "Universities & Colleges",  desc: "Answer student questions about timetables, syllabi, exam schedules, and campus policies — 24/7.", tag: "Education" },
  { icon: "headset_mic",    title: "Product Support Servers",  desc: "Train the bot on your docs and let it handle tier-1 support. Fewer repeated questions.", tag: "Support" },
  { icon: "sports_esports", title: "Gaming Communities",       desc: "Upload game wikis, patch notes, and guides. Let players ask strategy questions and get instant answers.", tag: "Gaming" },
  { icon: "business",       title: "Business Workspaces",      desc: "Internal knowledge base on Discord. HR policies, onboarding docs, SOPs — all queryable by your team.", tag: "Business" },
];

function CmpCell({ val, highlight = false }) {
  const bg = highlight ? "rgba(70,72,212,0.03)" : "transparent";
  const td = (content) => (
    <td style={{ padding: "13px 20px", textAlign: "center", borderBottom: "1px solid rgba(199,196,215,0.15)", background: bg }}>
      {content}
    </td>
  );
  if (val === true)      return td(<span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:"50%",background:"rgba(34,197,94,0.12)",color:"#166534" }}><Icon name="check" size={15}/></span>);
  if (val === false)     return td(<span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:"50%",background:"var(--error-container)",color:"var(--error)" }}><Icon name="close" size={15}/></span>);
  return                      td(<span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:"50%",background:"rgba(234,179,8,0.12)",color:"#854d0e" }}><Icon name="remove" size={15}/></span>);
}

import { useState, useEffect, useRef } from "react";

/* ─────────────── CSS ─────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  :root {
    --blue: #5865f2;
    --blue-light: #bec2ff;
    --blue-dim: rgba(88,101,242,0.12);
    --blue-glow: rgba(88,101,242,0.25);
    --bg: #12131b;
    --s1: #0d0e16;
    --s2: #1a1b23;
    --s3: #1f1f27;
    --s4: #292932;
    --border: rgba(255,255,255,0.08);
    --border2: rgba(190,194,255,0.2);
    --text: #e3e1ed;
    --muted: #c6c5d7;
    --muted2: #8f8fa0;
    --secondary: #4edea3;
    --tertiary: #d0bcff;
    --error: #ffb4ab;
    --tr: 0.2s cubic-bezier(0.4,0,0.2,1);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #2a2b38; border-radius: 99px; }

  /* Glass */
  .glass {
    background: rgba(26,27,35,0.6);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
  }
  .glass-hover:hover {
    background: rgba(31,31,39,0.8) !important;
    border-color: var(--border2) !important;
  }

  /* Noise overlay */
  .noise {
    position: fixed; top:0; left:0; width:100%; height:100%;
    opacity: 0.02; z-index: 9999; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  /* Light bloom */
  .light-bloom {
    position: absolute;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(190,194,255,0.06) 0%, rgba(190,194,255,0) 70%);
    z-index: 0; pointer-events: none;
  }

  /* Animations */
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
  @keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes tdot { 0%,100%{opacity:0.3;transform:translateY(0);} 50%{opacity:1;transform:translateY(-3px);} }
  @keyframes blink { 0%,100%{box-shadow:0 0 0 0 rgba(88,101,242,0.4);} 70%{box-shadow:0 0 0 7px transparent;} }
  @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(88,101,242,0.15);} 50%{box-shadow:0 0 35px rgba(88,101,242,0.3);} }

  .a0{animation:fadeUp 0.5s ease both;}
  .a1{animation:fadeUp 0.5s 0.07s ease both;}
  .a2{animation:fadeUp 0.5s 0.15s ease both;}
  .a3{animation:fadeUp 0.5s 0.23s ease both;}
  .a4{animation:fadeUp 0.5s 0.31s ease both;}
  .a5{animation:fadeUp 0.5s 0.40s ease both;}

  .td{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--muted2);animation:tdot 1.2s ease infinite;}
  .td:nth-child(2){animation-delay:0.2s;}.td:nth-child(3){animation-delay:0.4s;}
  .mq{animation:marquee 30s linear infinite;}

  /* Reveal on scroll */
  .rv{opacity:0;transform:translateY(24px);transition:opacity 0.6s ease,transform 0.6s ease;}
  .rv.on{opacity:1;transform:none;}

  /* Interactive */
  .feat-card:hover { background: rgba(31,31,39,0.9) !important; transform:translateY(-3px); box-shadow:0 20px 40px rgba(0,0,0,0.3); border-color:var(--border2) !important; }
  .feat-card:hover .feat-icon { box-shadow:0 0 16px var(--blue-glow); }
  .step-wrap:hover .step-icon { border-color:var(--border2) !important; box-shadow:0 0 22px var(--blue-glow) !important; }
  .use-card:hover { border-color:var(--border2) !important; transform:translateY(-3px); }
  .nav-link:hover { color:#fff; background:rgba(255,255,255,0.05); }
  .btn-primary:hover { opacity:0.88; transform:translateY(-1px); box-shadow:0 0 32px var(--blue-glow) !important; }
  .btn-ghost:hover { background:rgba(255,255,255,0.07) !important; color:#fff !important; }
  .btn-sm:hover { background:#4550d4 !important; box-shadow:0 0 20px var(--blue-glow) !important; }

  /* Glow */
  .glow-blue { animation: glow-pulse 3s ease infinite; }

  @media(max-width:900px){
    .hide900{display:none!important;}
    .feats-grid{grid-template-columns:repeat(2,1fr)!important;}
    .steps-grid{grid-template-columns:repeat(2,1fr)!important;}
    .use-grid{grid-template-columns:1fr!important;}
  }
  @media(max-width:600px){
    .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
    .hero-inner{padding-top:80px!important;}
  }
`;

/* ─────────────── Helpers ─────────────── */
function Icon({ name, size = 20, fill = 0 }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}`,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {name}
    </span>
  );
}

function DiscordIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("on"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    ref.current.querySelectorAll(".rv").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ─────────────── Data ─────────────── */
const FEATS = [
  { icon:"robot_2",      fill:1, color:"tertiary", title:"Your Own AI Discord Bot",    desc:"Create a custom AI chatbot for your Discord server trained on your own documents and websites." },
  { icon:"picture_as_pdf",fill:1,color:"error",    title:"Upload PDFs & Files",         desc:"Upload PDFs, notes, Excel sheets, or text files and let the AI learn from them instantly." },
  { icon:"language",     fill:1, color:"secondary", title:"Train From Websites",         desc:"Paste a website link and the bot can learn from entire documentation pages automatically." },
  { icon:"travel_explore",fill:1,color:"blue",     title:"Website Auto Crawler",         desc:"Automatically finds all pages of a website so you can import everything in one click." },
  { icon:"question_answer",fill:1,color:"tertiary",title:"Answers From Your Data",       desc:"The bot answers questions using your uploaded content instead of random internet guesses." },
  { icon:"tune",         fill:1, color:"secondary", title:"Custom Bot Personality",       desc:"Change how the bot talks, behaves, and responds with your own custom system prompt instructions." },
  { icon:"forum",        fill:1, color:"blue",      title:"Choose Bot Channels",          desc:"Select exactly which Discord channels the bot can read and reply in." },
  { icon:"bar_chart",   fill:1,  color:"error",     title:"Server Analytics",             desc:"Track usage, uploads, questions asked, and overall bot activity from a dashboard." },
  { icon:"hub",         fill:1,  color:"tertiary",  title:"Hybrid RAG Retrieval",         desc:"Combines FAISS semantic vector search with BM25 keyword retrieval for highly accurate context fetching." },
  { icon:"image_search",fill:1,  color:"secondary", title:"Image & Screenshot OCR",       desc:"Upload screenshots or images and the bot extracts and indexes text from them automatically." },
  { icon:"translate",   fill:1,  color:"blue",      title:"Auto Language Detection",      desc:"The bot automatically detects the user's language and replies in the same language every time." },
  { icon:"link",        fill:1,  color:"error",     title:"Source Citations",             desc:"Every answer references the exact document or section it came from." },
  { icon:"search",      fill:1,  color:"tertiary",  title:"Web Search Fallback",          desc:"When your docs don't have the answer, the bot searches the web and clearly labels the result." },
  { icon:"history",     fill:1,  color:"secondary", title:"Contextual Memory",            desc:"Maintains contextual awareness across interactions for more coherent multi-turn conversations." },
  { icon:"settings_suggest",fill:1,color:"blue",   title:"Live Retrieval Controls",       desc:"Dynamically tune FAISS-K, BM25-K, temperature, max tokens, chunk size and overlap with live sliders." },
  { icon:"dns",         fill:1,  color:"error",     title:"Multi-Server Architecture",    desc:"Supports isolated knowledge bases and configurations for multiple Discord servers simultaneously." },
  { icon:"verified_user",fill:1, color:"secondary", title:"Secure Discord Login",         desc:"Only authorized Discord server admins can manage and configure the bot via OAuth." },
  { icon:"sync",        fill:1,  color:"blue",      title:"Instant Knowledge Updates",    desc:"Re-upload documents anytime to keep your AI assistant updated with the latest information." },
];

const colorMap = {
  blue:      { bg:"rgba(88,101,242,0.12)",  border:"rgba(88,101,242,0.25)",   text:"#bec2ff" },
  secondary: { bg:"rgba(78,222,163,0.1)",   border:"rgba(78,222,163,0.2)",    text:"#4edea3" },
  tertiary:  { bg:"rgba(208,188,255,0.1)",  border:"rgba(208,188,255,0.2)",   text:"#d0bcff" },
  error:     { bg:"rgba(255,180,171,0.08)", border:"rgba(255,180,171,0.18)",  text:"#ffb4ab" },
};

const STEPS = [
  { n:"01", color:"blue",      icon:"shield_lock", fill:1, title:"Login with Discord",    desc:"OAuth login verifies you're a server admin. No passwords, no extra signups." },
  { n:"02", color:"secondary", icon:"upload_file", fill:1, title:"Upload Your Knowledge", desc:"Drag in PDFs, paste website URLs, or import Excel sheets. The crawler handles entire doc sites." },
  { n:"03", color:"tertiary",  icon:"tune",        fill:1, title:"Tune & Configure",      desc:"Set which channels the bot watches, customize its persona, and dial in retrieval parameters." },
  { n:"04", color:"error",     icon:"smart_toy",   fill:1, title:"Bot Goes Live",         desc:"Members ask questions in Discord and get precise answers pulled from your own documents." },
];

const USE_CASES = [
  { tag:"Education", icon:"school",      fill:1, title:"Universities & Colleges",   desc:"Answer student questions about timetables, syllabi, exam schedules, and campus policies - 24/7." },
  { tag:"Support",   icon:"support_agent",fill:1,title:"Product Support Servers",   desc:"Train the bot on your docs and let it handle tier-1 support. Fewer repeated questions." },
  { tag:"Gaming",    icon:"sports_esports",fill:1,title:"Gaming Communities",       desc:"Upload game wikis, patch notes, and guides. Let players ask strategy questions and get instant answers." },
  { tag:"Business",  icon:"business_center",fill:1,title:"Business Workspaces",    desc:"Internal knowledge base on Discord. HR policies, onboarding docs, SOPs, all queryable by your team." },
];

const COMP = [
  ["RAG / Document Q&A",         "yes","no","no","partial"],
  ["PDF & File Ingestion",        "yes","no","no","yes"],
  ["Web Crawler + URL Ingest",    "yes","no","no","no"],
  ["Hybrid Vector + BM25 Search", "yes","no","no","no"],
  ["Live Parameter Tuning",       "yes","no","no","no"],
  ["System Prompt Editor",        "yes","no","no","partial"],
  ["Per-Channel Control",         "yes","yes","yes","yes"],
  ["Analytics Dashboard",         "yes","partial","no","partial"],
  ["Self-Hostable / Open Source", "yes","no","no","no"],
  ["XLSX Structured Data",        "yes","no","no","no"],
  ["Discord OAuth Admin Auth",    "yes","yes","yes","yes"],
];

const FAQS = [
  { q:"Do I need to know coding to set it up?",          a:"No. Login with Discord, upload your files, and the bot is live. The dashboard handles everything visually." },
  { q:"Where is my uploaded data stored?",               a:"All your documents and embeddings are stored on your own server infrastructure. We never access or share your data." },
  { q:"What file types can I upload?",                   a:"PDF, TXT, DOCX, XLSX, images with OCR (.png, .jpg, .jpeg, .tiff, .bmp, .webp), and any public website URL or documentation site." },
  { q:"What happens if the bot doesn't know the answer?",a:"VaultBot first searches your documents. If nothing is found, it falls back to a live web search and clearly labels the result as a web result." },
  { q:"Can I use it on multiple Discord servers?",       a:"Yes. Each server gets its own isolated knowledge base and configuration. The architecture supports unlimited servers simultaneously." },
  { q:"Is it free?",                                     a:"We offer a free tier to get started. Paid plans unlock higher query limits and priority support." },
];

const MQ_ITEMS = [
  "PDF & DOCX Upload","Web URL Ingestion","FAISS Vector Search","BM25 Keyword Search",
  "OCR Image Ingestion","XLSX Structured Data","Website Auto-Crawler","Language Detection","Contextual Memory","Source Citations",
];

const MQ_ICONS = [
  "picture_as_pdf","language","hub","sort","image_search","table_chart",
  "travel_explore","translate","history","link",
];

function Tick({ v }) {
  if (v === "yes")     return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(88,101,242,0.15)",color:"#bec2ff",fontSize:14,fontWeight:700 }}>✓</span>;
  if (v === "no")      return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,0.04)",color:"#454655",fontSize:14 }}>✗</span>;
  return                      <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(234,179,8,0.1)",color:"#f59e0b",fontSize:14 }}>~</span>;
}

/* ─────────────── Component ─────────────── */
export default function LandingPage() {
  const [faq, setFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const pageRef = useReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const SectionLabel = ({ text }) => (
    <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px",borderRadius:99,background:"rgba(190,194,255,0.08)",border:"1px solid rgba(190,194,255,0.18)",marginBottom:16 }}>
      <span style={{ width:3,height:16,borderRadius:2,background:"var(--blue-light)",display:"inline-block" }} />
      <span style={{ fontSize:11.5,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--blue-light)",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{text}</span>
    </div>
  );

  const H2 = ({ children }) => (
    <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"clamp(26px,4vw,44px)",lineHeight:1.15,letterSpacing:"-0.025em",color:"#fff",marginBottom:12 }}>{children}</h2>
  );

  return (
    <div ref={pageRef} style={{ background:"var(--bg)",color:"var(--text)",minHeight:"100vh" }}>
      <style>{css}</style>
      <div className="noise" />

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:200,height:64,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 64px",
        background: scrolled ? "rgba(18,19,27,0.95)" : "rgba(18,19,27,0.7)",
        backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${scrolled ? "rgba(190,194,255,0.15)" : "var(--border)"}`,
        transition:"all 0.3s ease",
      }}>
        <a href="#" style={{ textDecoration:"none",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:28,height:28,borderRadius:7,background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Icon name="shield_lock" size={15} fill={1} />
          </div>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,color:"#fff",letterSpacing:"-0.02em" }}>VaultBot</span>
        </a>
        <div className="hide900" style={{ display:"flex",alignItems:"center",gap:2 }}>
          {[["Features","#features"],["How it Works","#howitworks"],["Compare","#compare"],["FAQ","#faq"]].map(([l,h],i) => (
            <a key={i} href={h} className="nav-link" style={{ padding:"7px 15px",borderRadius:8,fontSize:13,fontWeight:500,letterSpacing:"0.04em",color:"var(--muted)",textDecoration:"none",transition:"all var(--tr)" }}>{l}</a>
          ))}
          <button className="btn-sm" style={{ marginLeft:10,display:"flex",alignItems:"center",gap:8,padding:"8px 18px",borderRadius:9,fontSize:13,fontWeight:600,background:"var(--blue)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 0 14px var(--blue-glow)",transition:"all var(--tr)" }}>
            <DiscordIcon /> Login with Discord
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 64px",position:"relative",overflow:"hidden" }}>
        {/* grid bg */}
        <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(190,194,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(190,194,255,0.03) 1px,transparent 1px)",backgroundSize:"64px 64px",pointerEvents:"none" }} />
        <div className="light-bloom" style={{ top:-100,left:"30%",transform:"none" }} />
        <div className="light-bloom" style={{ bottom:"5%",left:"-5%",width:400,height:400 }} />

        <div className="hero-inner" style={{ width:"100%",maxWidth:1200,display:"flex",alignItems:"center",gap:64,paddingTop:64,position:"relative",zIndex:1 }}>
          {/* LEFT */}
          <div style={{ flex:1,minWidth:0 }}>
            <div className="a0" style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"6px 14px",borderRadius:99,background:"rgba(190,194,255,0.08)",border:"1px solid rgba(190,194,255,0.22)",fontSize:12,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",color:"var(--blue-light)",marginBottom:28 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--blue-light)",animation:"blink 2s ease infinite",display:"inline-block" }} />
              RAG-Powered Discord AI
            </div>

            <h1 className="a1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"clamp(36px,5.5vw,68px)",lineHeight:1.08,letterSpacing:"-0.035em",color:"#fff",marginBottom:20 }}>
              Give Your Discord<br />
              Server an{" "}
              <span style={{ color:"var(--blue-light)" }}>AI Brain</span>
            </h1>

            <p className="a2" style={{ fontSize:18,lineHeight:1.75,color:"var(--muted)",maxWidth:500,marginBottom:36 }}>
              VaultBot transforms your documents, PDFs, and websites into an intelligent Q&amp;A assistant that lives directly inside your Discord server.
            </p>

            <div className="a3" style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:40 }}>
              <button className="btn-primary" style={{ display:"flex",alignItems:"center",gap:9,padding:"14px 26px",borderRadius:10,fontSize:15,fontWeight:700,background:"var(--blue)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 0 22px var(--blue-glow)",transition:"all var(--tr)" }}>
                <DiscordIcon /> Add to Discord
                <Icon name="arrow_forward" size={18} />
              </button>
              <button className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"14px 22px",borderRadius:10,fontSize:15,fontWeight:600,background:"rgba(255,255,255,0.04)",color:"var(--muted)",border:"1px solid var(--border)",cursor:"pointer",transition:"all var(--tr)" }}>
                View Live Demo
              </button>
            </div>

            <div className="a4" style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--muted2)" }}>
              <Icon name="shield_lock" size={13} />
              Secure OAuth · Free tier available · No credit card required
            </div>
          </div>

          {/* RIGHT — Discord mockup bento */}
          <div className="a5 hide900" style={{ width:380,flexShrink:0 }}>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gridTemplateRows:"repeat(6,1fr)",gap:16,height:480 }}>
              {/* Chat window — 6 cols × 4 rows */}
              <div className="glass" style={{ gridColumn:"1/7",gridRow:"1/5",borderRadius:12,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
                {/* header */}
                <div style={{ background:"#1e1f22",padding:"12px 16px",borderBottom:"1px solid rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <Icon name="tag" size={18} />
                    <span style={{ fontWeight:700,fontSize:13,color:"#fff" }}>general-support</span>
                  </div>
                  <div style={{ display:"flex",gap:14,color:"var(--muted2)" }}>
                    <Icon name="search" size={17} />
                    <Icon name="inbox" size={17} />
                  </div>
                </div>
                {/* messages */}
                <div style={{ padding:16,background:"#313338",height:"calc(100% - 45px)",display:"flex",flexDirection:"column",gap:14 }}>
                  {/* user */}
                  <div style={{ display:"flex",gap:10 }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#f59e0b,#ef4444)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700 }}>U</div>
                    <div>
                      <div style={{ fontSize:10,color:"var(--muted2)",marginBottom:3 }}>User · just now</div>
                      <div style={{ color:"var(--text)",fontSize:13.5,lineHeight:1.5 }}>What are the office hours for support?</div>
                    </div>
                  </div>
                  {/* bot */}
                  <div style={{ display:"flex",gap:10,background:"rgba(88,101,242,0.05)",padding:12,borderRadius:8,border:"1px solid rgba(190,194,255,0.12)" }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:"var(--blue)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Icon name="robot_2" size={18} fill={1} />
                    </div>
                    <div>
                      <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:4 }}>
                        <span style={{ fontWeight:700,fontSize:13,color:"var(--blue-light)" }}>VaultBot</span>
                      </div>
                      <div style={{ color:"var(--text)",fontSize:13,lineHeight:1.6 }}>
                        Based on your docs, support is <strong style={{ color:"#fff" }}>Mon–Fri, 9 AM – 5 PM</strong>.
                        <div style={{ marginTop:6,fontSize:11,color:"var(--blue-light)",display:"flex",alignItems:"center",gap:5 }}>
                          <Icon name="link" size={11} /> Source: FAQ document
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* typing */}
                  <div style={{ display:"flex",gap:10 }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700 }}>A</div>
                    <div style={{ background:"var(--s3)",padding:"10px 14px",borderRadius:8,display:"flex",gap:5,alignItems:"center" }}>
                      <span className="td"/><span className="td"/><span className="td"/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat cards — bottom row */}
              <div className="glass" style={{ gridColumn:"1/4",gridRow:"5/7",borderRadius:12,padding:"20px 18px",display:"flex",flexDirection:"column",justifyContent:"center" }}>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:30,letterSpacing:"-0.03em",color:"var(--blue-light)",lineHeight:1 }}>1.2ms</div>
                <div style={{ fontSize:12,color:"var(--muted2)",marginTop:6,fontWeight:600,letterSpacing:"0.03em",textTransform:"uppercase" }}>Avg Query Latency</div>
              </div>
              <div className="glass" style={{ gridColumn:"4/7",gridRow:"5/7",borderRadius:12,padding:"20px 18px",display:"flex",flexDirection:"column",justifyContent:"center" }}>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:30,letterSpacing:"-0.03em",color:"var(--secondary)",lineHeight:1 }}>99.9%</div>
                <div style={{ fontSize:12,color:"var(--muted2)",marginTop:6,fontWeight:600,letterSpacing:"0.03em",textTransform:"uppercase" }}>Uptime SLA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ overflow:"hidden",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",padding:"16px 0",background:"var(--s2)" }}>
        <div className="mq" style={{ display:"flex",gap:44,alignItems:"center",whiteSpace:"nowrap" }}>
          {[...MQ_ITEMS,...MQ_ITEMS].map((m,i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:10,fontSize:13,fontWeight:500,color:"var(--muted)",flexShrink:0 }}>
              <div style={{ width:28,height:28,borderRadius:7,background:"var(--blue-dim)",border:"1px solid rgba(190,194,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--blue-light)" }}>
                <Icon name={MQ_ICONS[i % MQ_ICONS.length]} size={14} fill={1} />
              </div>
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ borderBottom:"1px solid var(--border)",background:"var(--s2)" }}>
        <div className="stats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",maxWidth:1100,margin:"0 auto" }}>
          {[
            { val:"9", suf:"+",  label:"Retrieval Modes",         col:"var(--blue-light)" },
            { val:"5", suf:"+",  label:"File Types Supported",    col:"var(--secondary)" },
            { val:"∞", suf:"",   label:"Servers You Can Add",     col:"var(--tertiary)" },
            { val:"90",suf:"%",  label:"Cheaper Than Other Bots", col:"var(--error)" },
          ].map((s,i) => (
            <div key={i} style={{ padding:"36px 24px",textAlign:"center",borderRight:"1px solid var(--border)" }}>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:44,fontWeight:800,letterSpacing:"-0.04em",lineHeight:1,marginBottom:8 }}>
                <span style={{ color:s.col }}>{s.val}</span>
                <span style={{ color:"#fff" }}>{s.suf}</span>
              </div>
              <div style={{ fontSize:12.5,color:"var(--muted2)",fontWeight:600,letterSpacing:"0.03em",textTransform:"uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="howitworks" style={{ padding:"96px 64px",maxWidth:1200,margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:60 }}>
          <div className="rv"><SectionLabel text="Setup" /></div>
          <div className="rv"><H2>Up and Running in Minutes</H2></div>
          <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.75,maxWidth:520,margin:"0 auto" }}>Four steps from login to a live AI assistant on your Discord server.</p>
        </div>
        <div className="steps-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,position:"relative" }}>
          {/* connector */}
          <div style={{ position:"absolute",top:44,left:"12.5%",right:"12.5%",height:1,background:"linear-gradient(90deg,transparent,rgba(190,194,255,0.15),rgba(190,194,255,0.15),transparent)",pointerEvents:"none" }} />
          {STEPS.map((s,i) => {
            const c = colorMap[s.color];
            return (
              <div key={i} className="rv step-wrap" style={{ padding:"0 20px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",position:"relative",zIndex:1,transitionDelay:`${i*0.08}s` }}>
                <div className="step-icon" style={{ width:88,height:88,borderRadius:20,background:"var(--s2)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,position:"relative",transition:"all 0.3s ease",color:c.text }}>
                  <Icon name={s.icon} size={34} fill={s.fill} />
                  <span style={{ position:"absolute",top:-10,right:-10,width:26,height:26,borderRadius:"50%",background:s.color==="blue"?"var(--blue)":c.bg,border:`1px solid ${c.border}`,color:c.text,fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.n}</span>
                </div>
                {i < 3 && <span style={{ position:"absolute",right:-8,top:30,color:"var(--muted2)",fontSize:20 }}>→</span>}
                <div style={{ fontSize:14,fontWeight:700,color:"#fff",marginBottom:8,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.title}</div>
                <div style={{ fontSize:13.5,color:"var(--muted)",lineHeight:1.65 }}>{s.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding:"96px 64px",background:"var(--s2)" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div className="rv"><SectionLabel text="Capabilities" /></div>
          <div className="rv"><H2>Everything Your Bot Can Do</H2></div>
          <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.75,maxWidth:580,marginBottom:52 }}>A complete AI knowledge assistant built for Discord, with hybrid retrieval, deep customization, and multi-format ingestion.</p>

          {/* Large RAG feature */}
          <div className="rv glass glass-hover feat-card" style={{ borderRadius:16,padding:"32px",marginBottom:20,display:"flex",flexDirection:"column",gap:20,position:"relative",overflow:"hidden",transition:"all 0.25s ease" }}>
            <div className="feat-icon" style={{ width:52,height:52,borderRadius:14,background:"rgba(208,188,255,0.12)",border:"1px solid rgba(208,188,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--tertiary)",transition:"all 0.3s ease" }}>
              <Icon name="hub" size={26} fill={1} />
            </div>
            <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:26,color:"#fff",letterSpacing:"-0.01em" }}>Hybrid RAG Architecture</h3>
            <p style={{ fontSize:16,color:"var(--muted)",lineHeight:1.7,maxWidth:640 }}>Combining the semantic power of FAISS vector search with the keyword precision of BM25. Get the best of both worlds, ultra-low latency with highly accurate context fetching. Supports PDFs, websites, Excel, images, and more.</p>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              {["FAISS","BM25","OpenAI Embedding v3","LangChain","FastAPI"].map((t,i) => (
                <span key={i} style={{ background:"rgba(255,255,255,0.04)",border:"1px solid var(--border)",padding:"5px 12px",borderRadius:6,fontSize:12,fontWeight:600,color:"var(--muted)",letterSpacing:"0.03em" }}>{t}</span>
              ))}
            </div>
            <div style={{ position:"absolute",right:-10,bottom:-10,opacity:0.05,pointerEvents:"none" }}>
              <Icon name="schema" size={200} fill={1} />
            </div>
          </div>

          {/* Features grid */}
          <div className="feats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"var(--border)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden" }}>
            {FEATS.filter(f=>f.title!=="Hybrid RAG Retrieval").map((f,i) => {
              const c = colorMap[f.color];
              return (
                <div key={i} className="rv feat-card" style={{ background:"var(--s2)",padding:24,transition:"all 0.25s ease",transitionDelay:`${(i%3)*0.04}s` }}>
                  <div className="feat-icon" style={{ width:46,height:46,borderRadius:12,background:c.bg,border:`1px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,transition:"all 0.3s ease",color:c.text }}>
                    <Icon name={f.icon} size={22} fill={f.fill} />
                  </div>
                  <div style={{ fontSize:14,fontWeight:700,color:"#fff",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{f.title}</div>
                  <div style={{ fontSize:13.5,color:"var(--muted)",lineHeight:1.6 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section style={{ padding:"96px 64px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div className="rv"><SectionLabel text="Use Cases" /></div>
          <div className="rv"><H2>Built for Every Community</H2></div>
          <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.75,maxWidth:580,marginBottom:52 }}>Whether you're running a university server, product support hub, or gaming community, VaultBot adapts to your needs.</p>
          <div className="use-grid" style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20 }}>
            {USE_CASES.map((u,i) => (
              <div key={i} className="rv use-card glass" style={{ padding:32,borderRadius:16,transition:"all 0.25s ease",transitionDelay:`${i*0.05}s` }}>
                <div style={{ width:50,height:50,borderRadius:14,background:"var(--blue-dim)",border:"1px solid rgba(190,194,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18,color:"var(--blue-light)" }}>
                  <Icon name={u.icon} size={24} fill={u.fill} />
                </div>
                <span style={{ display:"inline-block",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",background:"var(--blue-dim)",color:"var(--blue-light)",border:"1px solid rgba(190,194,255,0.2)",marginBottom:12 }}>{u.tag}</span>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:700,color:"#fff",marginBottom:8 }}>{u.title}</div>
                <div style={{ fontSize:14,color:"var(--muted)",lineHeight:1.65 }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BULLETS ── */}
      <section style={{ padding:"80px 64px",background:"var(--s2)" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(420px,1fr))",gap:56 }}>
          {[
            { label:"How VaultBot Helps", title:"Save time & money with 24/7 automated support", items:[["Reduce support costs","by automating answers to common questions"],["Free up staff time","for more complex issues and strategic tasks"],["Provide instant answers","to your users, no matter the time of day"],["Multilingual support","in the user's preferred language automatically"]] },
            { label:"What Users Report",  title:"Real results from real Discord servers",          items:[["90% reduction","in repetitive support questions in active servers"],["24/7 coverage","without need for additional staff or overhead"],["10× faster responses","for common questions vs manual support"],["Improved satisfaction","through instant, source-cited answers"]] },
          ].map((col,ci) => (
            <div key={ci} className="rv" style={{ transitionDelay:`${ci*0.12}s` }}>
              <SectionLabel text={col.label} />
              <H2>{col.title}</H2>
              <div style={{ display:"flex",flexDirection:"column",gap:14,marginTop:8 }}>
                {col.items.map(([b,r],j) => (
                  <div key={j} style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                    <div style={{ width:22,height:22,borderRadius:"50%",background:"var(--blue-dim)",border:"1px solid rgba(190,194,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,color:"var(--blue-light)" }}>
                      <Icon name="check" size={12} />
                    </div>
                    <span style={{ fontSize:15,color:"var(--muted)",lineHeight:1.55 }}>
                      <strong style={{ color:ci===0?"#fff":"var(--blue-light)",fontWeight:600 }}>{b}</strong> {r}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section id="compare" style={{ padding:"96px 64px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:52 }}>
            <div className="rv"><SectionLabel text="Why VaultBot" /></div>
            <div className="rv"><H2>Built Different</H2></div>
            <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.75,maxWidth:540,margin:"0 auto" }}>VaultBot brings enterprise-grade RAG capabilities that other Discord bots simply don't offer.</p>
          </div>
          <div className="rv glass" style={{ borderRadius:16,overflow:"hidden" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:14 }}>
              <thead>
                <tr style={{ background:"var(--s3)" }}>
                  <th style={{ padding:"16px 24px",fontWeight:700,fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase",color:"var(--muted2)",borderBottom:"1px solid var(--border)",textAlign:"left" }}>Feature</th>
                  {["VaultBot AI","MEE6","Carl-bot","Atlas"].map((h,i) => (
                    <th key={i} style={{ padding:"16px 24px",fontWeight:700,fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase",borderBottom:i===0?"2px solid var(--blue)":"1px solid var(--border)",textAlign:"center",color:i===0?"var(--blue-light)":"var(--muted2)",background:i===0?"rgba(88,101,242,0.06)":"transparent" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMP.map((row,i) => (
                  <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"14px 24px",color:"var(--text)",fontWeight:500,fontSize:14 }}>{row[0]}</td>
                    {row.slice(1).map((v,j) => (
                      <td key={j} style={{ padding:"14px 24px",textAlign:"center",background:j===0?"rgba(88,101,242,0.03)":"transparent" }}><Tick v={v} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding:"96px 64px",background:"var(--s2)" }}>
        <div style={{ maxWidth:760,margin:"0 auto",textAlign:"center" }}>
          <div className="rv"><SectionLabel text="FAQ" /></div>
          <div className="rv"><H2>Common Questions</H2></div>
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:44,textAlign:"left" }}>
            {FAQS.map((f,i) => (
              <div key={i} className="rv" onClick={() => setFaq(faq===i?null:i)} style={{ background:"var(--s3)",border:`1px solid ${faq===i?"var(--border2)":"var(--border)"}`,borderRadius:13,overflow:"hidden",cursor:"pointer",transition:"border-color var(--tr)",transitionDelay:`${i*0.04}s` }}>
                <div style={{ padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,fontSize:15,fontWeight:700,color:faq===i?"var(--blue-light)":"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {f.q}
                  <span style={{ width:28,height:28,borderRadius:8,background:faq===i?"var(--blue-dim)":"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",color:faq===i?"var(--blue-light)":"var(--muted2)",flexShrink:0,transition:"transform var(--tr),background var(--tr)",transform:faq===i?"rotate(180deg)":"none" }}>
                    <Icon name="expand_more" size={18} />
                  </span>
                </div>
                <div style={{ maxHeight:faq===i?200:0,overflow:"hidden",transition:"max-height 0.38s ease" }}>
                  <div style={{ padding:"0 22px 18px",fontSize:14.5,color:"var(--muted)",lineHeight:1.7 }}>{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:"110px 64px",textAlign:"center",position:"relative",overflow:"hidden" }}>
        <div className="light-bloom" style={{ top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:800,height:500 }} />
        <div style={{ position:"relative",zIndex:1 }}>
          <div className="rv glass" style={{ maxWidth:860,margin:"0 auto",borderRadius:28,padding:"80px 60px",display:"inline-block",width:"100%" }}>
            <div className="rv" style={{ marginBottom:0 }}><SectionLabel text="Get Started" /></div>
            <h2 className="rv" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"clamp(30px,5vw,56px)",color:"#fff",letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:16 }}>Ready to automate your support?</h2>
            <p className="rv" style={{ fontSize:18,color:"var(--muted)",marginBottom:44,maxWidth:480,margin:"0 auto 40px" }}>Login with Discord and configure your server's AI bot in minutes. Free to get started.</p>
            <div className="rv" style={{ display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap" }}>
              <button className="btn-primary glow-blue" style={{ display:"flex",alignItems:"center",gap:10,padding:"16px 32px",borderRadius:14,fontSize:16,fontWeight:700,background:"var(--blue)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 0 24px var(--blue-glow)",transition:"all var(--tr)" }}>
                <DiscordIcon size={18} /> Add VaultBot to Discord
              </button>
              <a href="#features" className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"16px 26px",borderRadius:14,fontSize:16,fontWeight:600,background:"rgba(255,255,255,0.04)",color:"var(--muted)",border:"1px solid var(--border)",textDecoration:"none",transition:"all var(--tr)" }}>
                Browse Features →
              </a>
            </div>
            <p className="rv" style={{ marginTop:24,fontSize:13,color:"var(--muted2)" }}>Free tier available for servers up to 500 members.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"var(--s1)",borderTop:"1px solid var(--border)",padding:"56px 64px 40px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:32 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
              <div style={{ width:28,height:28,borderRadius:7,background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <Icon name="shield_lock" size={14} fill={1} />
              </div>
              <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,color:"#fff" }}>VaultBot</span>
            </div>
            <p style={{ fontSize:14,color:"var(--muted)",lineHeight:1.7,maxWidth:340,marginBottom:24 }}>Empowering communities with their own data. Secure, fast, and intelligent retrieval for the Discord era. Built with FastAPI + LangChain.</p>
            <div style={{ display:"flex",gap:10 }}>
              {[
                { icon:"alternate_email", href:"mailto:hello@vaultbot.ai",        title:"Email us" },
                { icon:"hub",             href:"https://discord.gg/vaultbot",     title:"Join our Discord" },
                { icon:"code",            href:"https://github.com/vaultbot-ai",  title:"GitHub" },
              ].map((s,i) => (
                <a key={i} href={s.href} title={s.title} target="_blank" rel="noopener noreferrer" className="glass" style={{ width:38,height:38,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted2)",textDecoration:"none",transition:"color var(--tr)" }}>
                  <Icon name={s.icon} size={17} />
                </a>
              ))}
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:24 }}>
            <div>
              <h4 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:"#fff",marginBottom:16,letterSpacing:"0.04em",textTransform:"uppercase" }}>Product</h4>
              <nav style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {[
                  { label:"Features",       href:"#features" },
                  { label:"Documentation",  href:"/documentation" },
                  { label:"Status",         href:"/status" },
                  { label:"Changelog",      href:"/changelog" },
                ].map((l,i) => (
                  <a key={i} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined} style={{ fontSize:13.5,color:"var(--muted)",textDecoration:"none",transition:"color var(--tr)" }}>{l.label}</a>
                ))}
              </nav>
            </div>
            <div>
              <h4 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:"#fff",marginBottom:16,letterSpacing:"0.04em",textTransform:"uppercase" }}>Legal</h4>
              <nav style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {[
                  { label:"Privacy Policy",    href:"/privacy" },
                  { label:"Terms of Service",  href:"/terms" },
                  { label:"Security",          href:"/security" },
                  { label:"Cookie Policy",     href:"/cookies" },
                ].map((l,i) => (
                  <a key={i} href={l.href} style={{ fontSize:13.5,color:"var(--muted)",textDecoration:"none",transition:"color var(--tr)" }}>{l.label}</a>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <div style={{ maxWidth:1200,margin:"32px auto 0",paddingTop:24,borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap" }}>
          <span style={{ fontSize:12,color:"var(--muted2)" }}>© 2025 VaultBot · Q-ARAG · Not affiliated with Discord Inc.</span>
          <span style={{ fontSize:12,color:"var(--muted2)" }}>Securely indexing the future.</span>
        </div>
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
  const [serversWithStatus, setServersWithStatus] = useState([]);
  const [loadingServers, setLoadingServers] = useState(false);

  const availableToAdd = discordGuilds.filter(g => g.owner && !guilds.find(r => r.id === g.id));

  useEffect(() => {
    const loadServersStatus = async () => {
      setLoadingServers(true);
      try { const data = await API.listServersWithStatus(); setServersWithStatus(data.servers || []); }
      catch (e) { console.error("Failed to load server status:", e); }
      setLoadingServers(false);
    };
    if (guilds.length > 0) loadServersStatus();
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
    { n: guilds.length,                   label: "Registered Servers",  icon: "dns",     color: "var(--primary)", bg: "var(--primary-fixed)" },
    { n: analytics?.total_queries ?? "—", label: "Total Queries",       icon: "forum",   color: "#166634",        bg: "rgba(34,197,94,0.1)" },
    { n: analytics?.total_uploads ?? "—", label: "Documents Ingested",  icon: "storage", color: "var(--tertiary)",bg: "var(--surface-container)" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "configured":   return { bg: "rgba(34,197,94,0.1)", color: "#166534", label: "Configured" };
      case "partial":      return { bg: "rgba(234,179,8,0.1)", color: "#854d0e", label: "Partial" };
      case "unconfigured": return { bg: "var(--error-container)", color: "var(--error)", label: "Unconfigured" };
      default:             return { bg: "var(--surface-container)", color: "var(--on-surface-variant)", label: "Unknown" };
    }
  };

  return (
    <div>
      <SectionHeader label="Dashboard" title="Overview" subtitle="Your bot's current status and quick stats." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} fill size={20} style={{ color: s.color }} />
              </div>
              <OnlineDot />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>{s.n}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card pad="0" style={{ marginBottom: 20, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(199,196,215,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Registered Servers</span>
          <Btn onClick={() => setShowAdd(v => !v)} variant="ghost" style={{ padding: "7px 14px", fontSize: 13, minHeight: 36 }}>
            {showAdd ? <><Icon name="close" size={15}/> Cancel</> : <><Icon name="add" size={15}/> Add Server</>}
          </Btn>
        </div>

        {loadingServers ? (
          <div style={{ padding: "40px 20px", textAlign: "center", display: "flex", gap: 8, alignItems: "center", justifyContent: "center", color: "var(--on-surface-variant)" }}>
            <Spinner size={16}/> Loading server status…
          </div>
        ) : serversWithStatus.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--on-surface-variant)" }}>
            <Icon name="dns" size={40} style={{ opacity: .3, display: "block", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14 }}>No servers yet. Add one to get started.</div>
          </div>
        ) : (
          serversWithStatus.map(server => {
            const statusStyle = getStatusColor(server.config_status);
            return (
              <div key={server.guild_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", borderBottom: "1px solid rgba(199,196,215,0.1)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--primary-fixed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
                  {server.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{server.name}</span>
                    {server.guild_id === activeGuildId && <Tag variant="success">Active</Tag>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "var(--on-surface-variant)", fontFamily: "monospace" }}>{server.guild_id}</span>
                    <Tag variant={server.config_status === "configured" ? "success" : server.config_status === "partial" ? "warn" : "neutral"}
                      style={{ background: statusStyle.bg, color: statusStyle.color, fontSize: 10, padding: "2px 8px" }}>
                      {statusStyle.label}
                    </Tag>
                    <span style={{ fontSize: 10, color: "var(--on-surface-variant)" }}>
                      {server.channel_count} channel{server.channel_count !== 1 ? "s" : ""}
                      {server.has_custom_prompt && " · Prompt set"}
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
                    <Icon name="delete" size={15}/>
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
            {addStatus && <div style={{ marginBottom: 12 }}><StatusBadge {...addStatus}/></div>}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={handleAdd} disabled={adding} style={{ flex: 1, justifyContent: "center" }}>
                {adding ? <><Spinner size={14}/> Registering…</> : <><Icon name="add" size={16}/> Add Server</>}
              </Btn>
              <Btn onClick={() => { setShowAdd(false); setAddStatus(null); }} variant="ghost">Cancel</Btn>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick Start Guide</div>
        {[
          ["Register your Discord server", "Click Add Server above and select the Discord server you want to connect with the AI bot."],
          ["Configure AI settings",        "Open the Server Config tab and customize retrieval settings, temperature, token limits, and response behavior."],
          ["Upload your knowledge base",   "Train the bot using PDFs, website URLs, documentation pages, TXT files, or Excel sheets."],
          ["Crawl entire websites",        "Use the Web Crawler to automatically discover and import all important pages from a website."],
          ["Customize the bot personality","Edit the system prompt to define how your AI assistant should behave and respond."],
          ["Set allowed channels",         "Whitelist specific Discord channels where the bot can listen and reply to users."],
          ["Configure moderation logs",    "Select a dedicated mod/log channel to track uploads, configuration changes, and bot events."],
          ["Test your AI assistant",       "Ask questions inside your Discord server and verify that answers are generated from your uploaded data."],
          ["Monitor analytics",            "Track queries, uploaded documents, activity logs, and server usage directly from the dashboard."],
          ["Keep knowledge updated",       "Re-upload files or re-crawl websites anytime to refresh the bot's knowledge base."],
        ].map(([title, desc], i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < 9 ? "1px solid rgba(199,196,215,0.2)" : "none" }}>
            <div style={{ width:24,height:24,borderRadius:6,background:"var(--primary-fixed)",color:"var(--primary)",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{i+1}</div>
            <div>
              <div style={{ fontSize:13.5,fontWeight:600,marginBottom:2 }}>{title}</div>
              <div style={{ fontSize:12.5,color:"var(--on-surface-variant)",lineHeight:1.5 }}>{desc}</div>
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

const PARAMETER_HINTS = {
  faiss_k:       "Higher values increase retrieval diversity and context coverage, but can slightly increase latency and embedding costs.",
  bm25_k:        "Controls how many keyword-matched chunks are considered. Higher values improve recall but may introduce noise.",
  temperature:   "Higher temperature makes responses more creative and varied, while lower values keep answers more factual and consistent.",
  max_tokens:    "Maximum number of tokens the model can generate in a single response. Higher values allow longer answers.",
  chunk_size:    "Larger chunks preserve more context but increase token usage. Smaller chunks improve precision but may lose surrounding information.",
  chunk_overlap: "Overlap helps preserve continuity between chunks, improving retrieval quality at the cost of additional storage and embeddings.",
};

// Now receives guildId as prop — no internal server selector
function ServerConfigTab({ guildId, onGoToOverview }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [prompt, setPrompt] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // Auto-load whenever the active server changes
  useEffect(() => {
    if (!guildId) { setConfig(null); return; }
    const load = async () => {
      setLoading(true); setStatus(null); setConfig(null);
      try { const d = await API.getConfig(guildId); setConfig(d); setPrompt(d.system_prompt || ""); }
      catch (e) { setStatus({ ok: false, msg: e.message }); }
      setLoading(false);
    };
    load();
  }, [guildId]);

  const saveSlider = async (field, apiMethod, value) => {
    setSaving(s => ({ ...s, [field]: true })); setStatus(null);
    try { await API[apiMethod](guildId, value); setStatus({ ok: true, msg: `${field} saved successfully` }); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setSaving(s => ({ ...s, [field]: false }));
  };

  const savePrompt = async () => {
    setPromptSaving(true); setStatus(null);
    try { await API.updateSystemPrompt(guildId, prompt); setStatus({ ok: true, msg: "System prompt saved" }); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setPromptSaving(false);
  };

  if (!guildId) return (
    <div>
      <SectionHeader label="Configuration" title="Server Config" subtitle="Tune all RAG parameters with live sliders." />
      <NoServerSelected onGoToOverview={onGoToOverview} />
    </div>
  );

  return (
    <div>
      <SectionHeader label="Configuration" title="Server Config" subtitle="Tune all RAG parameters for the active server." />

      {loading && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "20px 0", color: "var(--on-surface-variant)" }}>
          <Spinner/> Loading configuration…
        </div>
      )}

      {!loading && config && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>
          {/* Left: Retrieval Parameters */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <Icon name="tune" size={18} style={{ color: "var(--primary)" }}/> Retrieval Parameters
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {SLIDER_DEFS.map(s => (
                <div key={s.field}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
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

          {/* Right: Server Info + System Prompt */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="dns" size={18} style={{ color: "var(--primary)" }}/> Server Info
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Name",    config.name],
                  ["Guild ID",config.guild_id],
                  ["Added",   config.added_at   ? new Date(config.added_at).toLocaleString()   : "—"],
                  ["Updated", config.updated_at ? new Date(config.updated_at).toLocaleString() : "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "var(--surface-low)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--on-surface-variant)", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Icon name="edit_note" size={18} style={{ color: "var(--primary)" }}/> System Prompt
              </div>
              <textarea className="kb-input kb-mono" value={prompt} onChange={e => setPrompt(e.target.value)} rows={6}
                placeholder="You are a helpful assistant for this Discord server…"
                style={{ resize: "vertical", lineHeight: 1.6, fontFamily: "monospace", fontSize: 13 }} />
              {config.updated_at && (
                <div style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="schedule" size={14}/> Last updated: {new Date(config.updated_at).toLocaleString()}
                </div>
              )}
              <Btn onClick={savePrompt} disabled={promptSaving} style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>
                {promptSaving ? <><Spinner size={14}/> Saving…</> : <><Icon name="save" size={16}/> Save System Prompt</>}
              </Btn>
            </Card>

            {status && <StatusBadge {...status}/>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CHANNELS TAB ─────────────────────────────────────────────────────────────
// Now receives guildId as prop — no internal server selector
function ChannelsTab({ guildId, onGoToOverview }) {
  const [channels, setChannels] = useState([]);
  const [modChannel, setModChannel] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [discordChannels, setDiscordChannels] = useState([]);
  const [newChanId, setNewChanId] = useState("");
  const [newModId, setNewModId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (id) => {
    if (!id) { setLoaded(false); return; }
    setLoading(true); setStatus(null);
    try {
      const [d, dc] = await Promise.allSettled([API.listChannels(id), API.getGuildChannels(id)]);
      if (d.status === "fulfilled")  { setChannels(d.value.channel_ids || []); setModChannel(d.value.mod_channel || null); setLoaded(true); }
      if (dc.status === "fulfilled") setDiscordChannels(dc.value.channels || []);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setLoading(false);
  }, []);

  // Auto-load when active guild changes
  useEffect(() => {
    setLoaded(false); setChannels([]); setDiscordChannels([]); setModChannel(null); setStatus(null);
    if (guildId) load(guildId);
  }, [guildId, load]);

  const chanName = (id) => { const f = discordChannels.find(c => c.id === id); return f ? `#${f.name}` : id; };

  const addChan = async () => {
    if (!guildId || !newChanId.trim()) return;
    try { await API.addChannel(guildId, newChanId.trim()); setStatus({ ok: true, msg: "Channel added" }); setNewChanId(""); load(guildId); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const removeChan = async (cid) => {
    try { await API.deleteChannel(guildId, cid); setStatus({ ok: true, msg: "Channel removed" }); load(guildId); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const setMod = async () => {
    if (!guildId || !newModId.trim()) return;
    try { await API.addModChannel(guildId, newModId.trim()); setStatus({ ok: true, msg: "Mod channel set" }); setNewModId(""); load(guildId); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  if (!guildId) return (
    <div>
      <SectionHeader label="Bot Configuration" title="Channel Management" subtitle="Control which Discord channels the bot responds in." />
      <NoServerSelected onGoToOverview={onGoToOverview} />
    </div>
  );

  return (
    <div>
      <SectionHeader label="Bot Configuration" title="Channel Management" subtitle="Control which Discord channels the bot responds in." />

      {loading && <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", color: "var(--on-surface-variant)" }}><Spinner/> Loading channels…</div>}

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
                <Icon name="tag" size={16} style={{ color: "var(--primary)", flexShrink: 0 }}/>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{chanName(ch)}</span>
                <Btn onClick={() => removeChan(ch)} variant="danger" style={{ padding: "5px 10px", fontSize: 12, minHeight: 32 }}>
                  <Icon name="remove" size={14}/> Remove
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
                  onKeyDown={e => e.key === "Enter" && addChan()} placeholder="Channel ID" style={{ flex: 1, height: 40 }}/>
              )}
              <Btn onClick={addChan} variant="outline" style={{ flexShrink: 0, minHeight: 40 }}>
                <Icon name="add" size={16}/> Add
              </Btn>
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Icon name="shield" size={18} style={{ color: "var(--primary)" }}/> Mod / Log Channel
            </div>
            {modChannel && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 14, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: "var(--r-md)" }}>
                <Icon name="tag" size={16} style={{ color: "#854d0e" }}/>
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
                  onKeyDown={e => e.key === "Enter" && setMod()} placeholder="Mod channel ID" style={{ flex: 1, height: 40 }}/>
              )}
              <Btn onClick={setMod} variant="outline" style={{ flexShrink: 0, minHeight: 40 }}>Set</Btn>
            </div>
          </Card>

          {status && <StatusBadge {...status}/>}
        </>
      )}
    </div>
  );
}

// ─── UPLOAD TAB ───────────────────────────────────────────────────────────────
// Now receives guildId as prop — no internal server selector
function UploadTab({ guildId, onGoToOverview }) {
  const [urls, setUrls] = useState("");
  const [docFiles, setDocFiles] = useState([]);
  const [imgFiles, setImgFiles] = useState([]);
  const [vidFiles, setVidFiles] = useState([]);
  const [audFiles, setAudFiles] = useState([]);
  const [xlsxFile, setXlsxFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [xlsxUploading, setXlsxUploading] = useState(false);
  const [faqText, setFaqText] = useState("");
  const [faqUploading, setFaqUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);

  const docRef  = useRef(null);
  const imgRef  = useRef(null);
  const vidRef  = useRef(null);
  const audRef  = useRef(null);
  const xlsxRef = useRef(null);

  const ALLOWED_EXTENSIONS = {
    doc: [".pdf", ".docx"],
    img: [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"],
    vid: [".mp4"],
    aud: [".mp3", ".wav", ".m4a"],
  };

  const extOf      = (name) => "." + name.split(".").pop().toLowerCase();
  const filterFiles = (list, type) => [...list].filter(f => ALLOWED_EXTENSIONS[type].includes(extOf(f.name)));
  const addFiles   = (setter, type) => (e) => { setter(p => [...p, ...filterFiles(e.target.files, type)]); e.target.value = ""; };
  const dropFiles  = (setter, type) => (e) => { e.preventDefault(); setter(p => [...p, ...filterFiles(e.dataTransfer.files, type)]); };
  const removeFile = (setter, idx) => setter(p => p.filter((_, j) => j !== idx));
  const allFiles   = [...docFiles, ...imgFiles, ...vidFiles, ...audFiles];

  const loadUploads = useCallback(async (id) => {
    if (!id) return;
    setLoadingUploads(true);
    try { const d = await API.getAllUploads(id); setUploads(Array.isArray(d) ? d : d.uploads || []); } catch (_) {}
    setLoadingUploads(false);
  }, []);

  // Auto-load when active guild changes
  useEffect(() => {
    setUploads([]); setStatus(null);
    if (guildId) loadUploads(guildId);
  }, [guildId, loadUploads]);

  const doUpload = async () => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    if (!urls.trim() && !allFiles.length) { setStatus({ ok: false, msg: "Add URLs or files first" }); return; }
    setUploading(true); setStatus(null);
    try {
      const d = await API.upload(guildId, allFiles, urls.trim());
      setStatus({ ok: true, msg: `${d.urls_processed || 0} URL(s), ${d.pdfs_processed || 0} file(s) ingested successfully` });
      setUrls(""); setDocFiles([]); setImgFiles([]); setVidFiles([]); setAudFiles([]);
      loadUploads(guildId);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setUploading(false);
  };

  const doXlsxUpload = async () => {
    if (!guildId)   { setStatus({ ok: false, msg: "No server selected" }); return; }
    if (!xlsxFile)  { setStatus({ ok: false, msg: "No .xlsx file selected" }); return; }
    setXlsxUploading(true); setStatus(null);
    try { const d = await API.uploadContacts(guildId, xlsxFile); setStatus({ ok: true, msg: d.message }); setXlsxFile(null); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setXlsxUploading(false);
  };

  const doFaqUpload = async () => {
    if (!guildId)        { setStatus({ ok: false, msg: "No server selected" }); return; }
    if (!faqText.trim()) { setStatus({ ok: false, msg: "FAQ text cannot be empty" }); return; }
    setFaqUploading(true); setStatus(null);
    try {
      const d = await API.addFaq(guildId, faqText.trim());
      setStatus({ ok: true, msg: d.message || "FAQ added successfully" });
      setFaqText(""); loadUploads(guildId);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setFaqUploading(false);
  };

  const FileSection = ({ label, hint, iconName, accentBg, accentColor, files, setFiles, inputRef, accept, type }) => (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={iconName} size={18} style={{ color: accentColor }}/>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{hint}</div>
        </div>
      </div>
      <div className="drop-zone" onClick={() => inputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={dropFiles(setFiles, type)}>
        <Icon name="upload_file" size={36} style={{ color: accentColor, opacity: 0.6 }}/>
        <p style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>Drop files here or <span style={{ color: "var(--primary)", fontWeight: 600 }}>browse</span></p>
      </div>
      <input ref={inputRef} type="file" accept={accept} multiple style={{ display: "none" }} onChange={addFiles(setFiles, type)}/>
      {files.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: accentBg, borderRadius: "var(--r-sm)", fontSize: 12, color: accentColor }}>
              <Icon name="insert_drive_file" size={13}/>
              {f.name.length > 22 ? f.name.slice(0, 19) + "…" : f.name}
              <span onClick={() => removeFile(setFiles, i)} style={{ cursor: "pointer", opacity: 0.6, fontWeight: 700 }}>✕</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  if (!guildId) return (
    <div>
      <SectionHeader label="Knowledge Base" title="Upload Content" subtitle="Ingest documents, URLs, and structured data into your vector store." />
      <NoServerSelected onGoToOverview={onGoToOverview} />
    </div>
  );

  return (
    <div style={{ width: "100%", minHeight: "100vh", boxSizing: "border-box" }}>
      <SectionHeader label="Knowledge Base" title="Upload Content" subtitle="Ingest PDFs, documents, images, audio, video, structured data, and FAQ text into your vector store." />

      {/* URL upload */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--primary-fixed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="language" size={18} style={{ color: "var(--primary)" }}/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Web URLs</div>
            <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>One per line</div>
          </div>
        </div>
        <textarea className="kb-input kb-mono" value={urls} onChange={e => setUrls(e.target.value)} rows={4}
          placeholder={"https://docs.example.com\nhttps://yoursite.com/about"}
          style={{ resize: "vertical", lineHeight: 1.6, fontFamily: "monospace", fontSize: 13 }}/>
      </Card>

      <FileSection label="Documents" hint=".pdf, .docx"                       iconName="description" accentBg="var(--primary-fixed)"          accentColor="var(--primary)" files={docFiles} setFiles={setDocFiles} inputRef={docRef} accept=".pdf,.docx"            type="doc"/>
      <FileSection label="Images"    hint=".png, .jpg, .jpeg, .tiff, .bmp, .webp" iconName="image"    accentBg="rgba(168,85,247,0.1)"          accentColor="#7c3aed"        files={imgFiles} setFiles={setImgFiles} inputRef={imgRef} accept=".png,.jpg,.jpeg,.tiff,.bmp,.webp" type="img"/>
      <FileSection label="Video"     hint=".mp4"                                iconName="videocam"   accentBg="rgba(245,158,11,0.1)"          accentColor="#b45309"        files={vidFiles} setFiles={setVidFiles} inputRef={vidRef} accept=".mp4"                    type="vid"/>
      <FileSection label="Audio"     hint=".mp3, .wav, .m4a"                    iconName="headphones" accentBg="rgba(20,184,166,0.1)"          accentColor="#0f766e"        files={audFiles} setFiles={setAudFiles} inputRef={audRef} accept=".mp3,.wav,.m4a"          type="aud"/>

      {/* XLSX */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="table_chart" size={18} style={{ color: "#166834" }}/>
          </div>
          <div><div style={{ fontSize: 14, fontWeight: 600 }}>Structured Data (.xlsx)</div><div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>Contacts / Faculty</div></div>
        </div>
        <div className="drop-zone" onClick={() => xlsxRef.current?.click()} onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = [...e.dataTransfer.files].find(f => f.name.endsWith(".xlsx")); if (f) setXlsxFile(f); }}
          style={{ borderColor: xlsxFile ? "#166834" : undefined, background: xlsxFile ? "rgba(34,197,94,0.05)" : undefined }}>
          <Icon name={xlsxFile ? "check_circle" : "table_chart"} size={36} style={{ color: xlsxFile ? "#166834" : "var(--tertiary)", opacity: 0.7 }}/>
          <p style={{ fontSize: 14, color: xlsxFile ? "#166834" : "var(--on-surface-variant)", fontWeight: xlsxFile ? 600 : 400 }}>
            {xlsxFile ? xlsxFile.name : <>Drop <strong>.xlsx</strong> or browse</>}
          </p>
        </div>
        <input ref={xlsxRef} type="file" accept=".xlsx" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) setXlsxFile(e.target.files[0]); }}/>
      </Card>

      {/* FAQ */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="quiz" size={18} style={{ color: "#b91c1c" }}/>
          </div>
          <div><div style={{ fontSize: 14, fontWeight: 600 }}>FAQ / Raw Text</div><div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>Paste a Q&A pair or any plain text to add directly to the vector store</div></div>
        </div>
        <textarea className="kb-input kb-mono" value={faqText} onChange={e => setFaqText(e.target.value)} rows={5}
          placeholder={"Q: What are your office hours?\nA: We are open Monday to Friday, 9 AM – 5 PM."}
          style={{ resize: "vertical", lineHeight: 1.6, fontFamily: "monospace", fontSize: 13 }}/>
        <Btn onClick={doFaqUpload} disabled={faqUploading}
          style={{ marginTop: 10, width: "100%", justifyContent: "center", background: "rgba(239,68,68,0.12)", color: "#b91c1c", border: "1px solid rgba(239,68,68,0.25)" }}>
          {faqUploading ? <><Spinner size={14}/> Adding FAQ…</> : <><Icon name="add_circle" size={16}/> Add to Vector Store</>}
        </Btn>
      </Card>

      {status && <div style={{ marginBottom: 14 }}><StatusBadge {...status}/></div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <Btn onClick={doUpload} disabled={uploading} style={{ flex: 2, justifyContent: "center" }}>
          {uploading ? <><Spinner size={14}/> Ingesting…</> : <><Icon name="cloud_upload" size={16}/> Upload to Vector Store</>}
        </Btn>
        <Btn onClick={doXlsxUpload} disabled={xlsxUploading} variant="success" style={{ flex: 1, justifyContent: "center" }}>
          {xlsxUploading ? <><Spinner size={14}/> Uploading…</> : <><Icon name="table_chart" size={16}/> Upload .xlsx</>}
        </Btn>
      </div>

      {/* Uploads list */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Ingested Sources</span>
          <Btn onClick={() => loadUploads(guildId)} disabled={loadingUploads} variant="ghost" style={{ padding: "6px 12px", fontSize: 13, minHeight: 34 }}>
            {loadingUploads ? <Spinner size={13}/> : <><Icon name="refresh" size={15}/> Refresh</>}
          </Btn>
        </div>
        <Card pad="0" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead><tr><th>Source</th><th>Type</th><th>Date</th></tr></thead>
            <tbody>
              {uploads.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "28px" }}>No uploads yet</td></tr>
              ) : uploads.map((u, i) => (
                <tr key={i}>
                  <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12 }}>{u.url || u.filename || u.source || "—"}</span>
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
// Now receives guildId as prop — no internal server selector
function CrawlerTab({ guildId, onGoToOverview }) {
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
  const toggle   = (u) => setSelected(s => { const n = new Set(s); n.has(u) ? n.delete(u) : n.add(u); return n; });

  const ingest = async () => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    if (!selected.size) return;
    setIngesting(true); setStatus(null);
    try {
      const d = await API.upload(guildId, [], [...selected].join("\n"));
      setStatus({ ok: true, msg: `${d.urls_processed || selected.size} URL(s) ingested` });
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setIngesting(false);
  };

  if (!guildId) return (
    <div>
      <SectionHeader label="Discovery" title="URL Crawler" subtitle="Discover all linked pages of any site, select what to ingest, and bulk-import." />
      <NoServerSelected onGoToOverview={onGoToOverview} />
    </div>
  );

  return (
    <div>
      <SectionHeader label="Discovery" title="URL Crawler" subtitle="Discover all linked pages of any site, select what to ingest, and bulk-import." />

      <Card style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Base URL to Crawl</label>
        <div style={{ display: "flex", gap: 12 }}>
          <input className="kb-input" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doCrawl()}
            placeholder="https://docs.example.com" style={{ flex: 1, fontFamily: "monospace", fontSize: 13 }}/>
          <Btn onClick={doCrawl} disabled={crawling || !baseUrl.trim()} style={{ flexShrink: 0 }}>
            {crawling ? <><Spinner size={14}/> Scanning…</> : <><Icon name="travel_explore" size={16}/> Discover</>}
          </Btn>
        </div>
      </Card>

      {hasResult && (
        <Card pad="0" style={{ marginBottom: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(199,196,215,0.2)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Tag>{allUrls.length} URLs found</Tag>
            {selected.size > 0 && <Tag variant="success">{selected.size} selected</Tag>}
            <input className="kb-input" value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Filter URLs…" style={{ flex: 1, minWidth: 140, height: 34, padding: "5px 12px", fontSize: 13 }}/>
            <Btn onClick={() => setSelected(new Set(filtered))} variant="ghost" style={{ padding: "5px 12px", fontSize: 13, minHeight: 34 }}>All</Btn>
            <Btn onClick={() => setSelected(new Set())} variant="ghost" style={{ padding: "5px 12px", fontSize: 13, minHeight: 34 }}>Clear</Btn>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {filtered.map((u, i) => {
              const sel = selected.has(u);
              return (
                <div key={i} onClick={() => toggle(u)} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:"1px solid rgba(199,196,215,0.08)",cursor:"pointer",background:sel?"rgba(70,72,212,0.04)":"transparent",transition:"background var(--tr)" }}>
                  <div style={{ width:18,height:18,borderRadius:4,flexShrink:0,border:`1.5px solid ${sel?"var(--primary)":"var(--outline-variant)"}`,background:sel?"var(--primary)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,transition:"all var(--tr)" }}>{sel?"✓":""}</div>
                  <span style={{ fontSize:12,color:"var(--on-surface-variant)",fontFamily:"monospace",wordBreak:"break-all",flex:1,lineHeight:1.5 }}>{u}</span>
                  <a href={u} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color:"var(--on-surface-variant)",fontSize:11,flexShrink:0 }}>↗</a>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(199,196,215,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--on-surface-variant)" }}>
              {selected.size > 0 ? `${selected.size} URL${selected.size > 1 ? "s" : ""} queued` : "Select URLs to ingest"}
            </span>
            <Btn onClick={ingest} disabled={ingesting || !selected.size} style={{ minHeight: 36, padding: "8px 16px" }}>
              {ingesting ? <><Spinner size={14}/> Ingesting…</> : `Ingest (${selected.size})`}
            </Btn>
          </div>
        </Card>
      )}

      {status && <StatusBadge {...status}/>}
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
  const inputRef  = useRef(null);

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
      <div style={{ position:"fixed",bottom:88,right:24,width:380,height:520,background:"var(--surface-lowest)",border:"1px solid rgba(199,196,215,0.4)",borderRadius:"var(--r-xl)",boxShadow:"var(--shadow-md)",zIndex:200,display:"flex",flexDirection:"column",overflow:"hidden",transform:open?"scale(1) translateY(0)":"scale(0.92) translateY(16px)",opacity:open?1:0,pointerEvents:open?"all":"none",transition:"transform .3s cubic-bezier(0.16,1,0.3,1), opacity .2s ease",transformOrigin:"bottom right" }}>
        <div style={{ padding:"14px 16px",borderBottom:"1px solid rgba(199,196,215,0.2)",display:"flex",alignItems:"center",gap:10,background:"var(--surface-low)",flexShrink:0 }}>
          <div style={{ width:32,height:32,borderRadius:"var(--r-md)",background:"var(--primary)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Icon name="hub" fill size={16} style={{ color:"#fff" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13.5,fontWeight:600 }}>{guildName || "VaultBot"}</div>
            <div style={{ fontSize:11,color:"var(--on-surface-variant)" }}>RAG Assistant</div>
          </div>
          <OnlineDot/>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12 }}>
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <div style={{ display:"flex",justifyContent:"flex-end" }}>
                  <div style={{ background:"var(--primary)",borderRadius:"12px 4px 12px 12px",padding:"9px 14px",fontSize:13.5,color:"#fff",maxWidth:260,lineHeight:1.5 }}>{msg.text}</div>
                </div>
              ) : (
                <div style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
                  <div style={{ width:26,height:26,borderRadius:6,background:"var(--primary-fixed)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <Icon name="hub" size={14} style={{ color:"var(--primary)" }}/>
                  </div>
                  <div style={{ background:msg.error?"var(--error-container)":"var(--surface-container)",border:`1px solid ${msg.error?"rgba(186,26,26,0.2)":"rgba(199,196,215,0.3)"}`,borderRadius:"4px 12px 12px 12px",padding:"10px 14px",fontSize:13.5,color:msg.error?"var(--error)":"var(--on-surface-variant)",maxWidth:280,lineHeight:1.6 }}>{msg.text}</div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
              <div style={{ width:26,height:26,borderRadius:6,background:"var(--primary-fixed)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <Icon name="hub" size={14} style={{ color:"var(--primary)" }}/>
              </div>
              <div style={{ background:"var(--surface-container)",border:"1px solid rgba(199,196,215,0.3)",borderRadius:"4px 12px 12px 12px",padding:"12px 14px",display:"flex",gap:4 }}>
                {[0,1,2].map(i => <span key={i} className="typing-dot" style={{ animationDelay:`${i*0.2}s` }}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        <div style={{ padding:"10px 12px 14px",borderTop:"1px solid rgba(199,196,215,0.2)",background:"var(--surface-low)",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"flex-end",gap:8,background:"var(--surface-lowest)",border:"1.5px solid var(--outline-variant)",borderRadius:"var(--r-md)",padding:"8px 8px 8px 14px" }}>
            <textarea ref={inputRef} value={input}
              onChange={e => { setInput(e.target.value); const el=e.target; el.style.height="auto"; el.style.height=Math.min(el.scrollHeight,80)+"px"; }}
              onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
              placeholder="Ask a question…" rows={1} disabled={loading}
              style={{ flex:1,background:"transparent",border:"none",outline:"none",color:"var(--on-surface)",fontSize:14,lineHeight:1.5,resize:"none",fontFamily:"'Inter',sans-serif",minHeight:22,maxHeight:80 }}/>
            <button onClick={send} disabled={loading||!input.trim()} style={{ width:32,height:32,borderRadius:"var(--r-sm)",border:"none",cursor:"pointer",background:input.trim()&&!loading?"var(--primary)":"var(--surface-container)",color:input.trim()&&!loading?"#fff":"var(--on-surface-variant)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all var(--tr)" }}>
              {loading ? <Spinner size={14} color="#fff"/> : <Icon name="send" size={16}/>}
            </button>
          </div>
        </div>
      </div>
      <button onClick={() => setOpen(o => !o)} style={{ position:"fixed",bottom:24,right:24,zIndex:210,width:54,height:54,borderRadius:"50%",background:open?"var(--surface-lowest)":"var(--primary)",border:`1.5px solid ${open?"rgba(199,196,215,0.4)":"transparent"}`,cursor:"pointer",boxShadow:open?"var(--shadow-sm)":"0 8px 28px rgba(70,72,212,0.35)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s" }}>
        <Icon name={open?"close":"chat"} size={22} style={{ color:open?"var(--on-surface)":"#fff" }}/>
      </button>
    </>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, guilds, discordGuilds, onGuildsChange, onLogout }) {
  const [tab, setTab] = useState("overview");
  const [activeGuildId, setActiveGuildId] = useState(LS.str("wb_active_guild") || guilds[0]?.id || null);
  const [analytics, setAnalytics] = useState(null);

  // Auto-select first guild if none active
  useEffect(() => {
    if (!activeGuildId && guilds.length > 0) {
      const id = guilds[0].id;
      setActiveGuildId(id);
      LS.strSet("wb_active_guild", id);
    }
  }, [guilds, activeGuildId]);

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

  const activeGuild = guilds.find(g => g.id === activeGuildId) || null;
  const goToOverview = () => setTab("overview");

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar
        tab={tab} onTab={setTab}
        guilds={guilds}
        activeGuildId={activeGuildId}
        onActivate={handleActivate}
        user={user}
        onLogout={onLogout}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{ height:60,borderBottom:"1px solid rgba(199,196,215,0.25)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",background:"rgba(255,248,245,0.8)",backdropFilter:"blur(12px)",flexShrink:0,zIndex:10 }}>
          <h1 style={{ fontSize:18,fontWeight:700,letterSpacing:"-0.01em" }}>
            {NAV_ITEMS.find(n => n.id === tab)?.label || "Overview"}
          </h1>
          <div style={{ display:"flex",alignItems:"center",gap:16 }}>
            {/* Active server pill in header */}
            {activeGuild ? (
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 12px",borderRadius:"var(--r-full)",background:"var(--primary-fixed)",border:"1px solid rgba(70,72,212,0.2)" }}>
                <Icon name="dns" size={14} style={{ color:"var(--primary)" }}/>
                <span style={{ fontSize:12,fontWeight:600,color:"var(--primary)" }}>{activeGuild.name}</span>
                <OnlineDot/>
              </div>
            ) : (
              <div style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:"var(--r-full)",background:"var(--surface-container)",border:"1px solid var(--outline-variant)" }}>
                <Icon name="warning" size={14} style={{ color:"var(--on-surface-variant)" }}/>
                <span style={{ fontSize:12,color:"var(--on-surface-variant)" }}>No server selected</span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
          <div style={{ maxWidth: 760 }}>
            {tab === "overview" && (
              <OverviewTab
                guilds={guilds} discordGuilds={discordGuilds}
                activeGuildId={activeGuildId} user={user} analytics={analytics}
                onActivate={handleActivate} onRemove={handleRemove} onAdd={handleAdd}
              />
            )}
            {tab === "config"   && <ServerConfigTab guildId={activeGuildId} onGoToOverview={goToOverview}/>}
            {tab === "channels" && <ChannelsTab      guildId={activeGuildId} onGoToOverview={goToOverview}/>}
            {tab === "upload"   && <UploadTab        guildId={activeGuildId} onGoToOverview={goToOverview}/>}
            {tab === "crawler"  && <CrawlerTab       guildId={activeGuildId} onGoToOverview={goToOverview}/>}
          </div>
        </div>
      </div>

      <ChatWidget guildId={activeGuild?.id} guildName={activeGuild?.name}/>
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
    const hash   = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hashToken = hash.startsWith("#token=") ? hash.slice(7) : hash.startsWith("#access_token=") ? hash.slice(14) : null;
    const token  = hashToken || params.get("token") || params.get("access_token");

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
        <GlobalStyles/>
        <div style={{ height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)" }}>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:20 }}>
            <div style={{ width:52,height:52,borderRadius:"var(--r-lg)",background:"var(--primary)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Icon name="hub" fill size={28} style={{ color:"#fff" }}/>
            </div>
            <div style={{ fontSize:14,color:"var(--on-surface-variant)" }}>Loading VaultBot…</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles/>
      {view === "landing" ? (
        <LandingPage user={user} onLogin={discordLogin} onShowDashboard={() => setView("dashboard")}/>
      ) : (
        <Dashboard user={user} guilds={guilds} discordGuilds={discordGuilds} onGuildsChange={handleGuildsChange} onLogout={handleLogout}/>
      )}
    </>
  );
}