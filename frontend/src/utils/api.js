// ─── CONFIG ───────────────────────────────────────────────────────────────────
export const API_BASE = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL : "http://localhost:8000";

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
export const LS = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  str: (k) => { try { return localStorage.getItem(k) || null; } catch { return null; } },
  strSet: (k, v) => { try { localStorage.setItem(k, v || ""); } catch {} },
  rm: (k) => { try { localStorage.removeItem(k); } catch {} },
};

export function getToken() { return LS.str("wb_token"); }
export function setToken(t) { t ? LS.strSet("wb_token", t) : LS.rm("wb_token"); }

let _refreshPromise = null;
async function refreshOnce() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" })
    .then(async rr => { if (rr.ok) { const d = await rr.json(); if (d.access_token) { setToken(d.access_token); return d.access_token; } } return null; })
    .catch(() => null).finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

export async function apiFetch(path, opts = {}, _retry = true, _token = null) {
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

export const API = {
  getMe:                    ()                        => apiFetch("/auth/me"),
  logout:                   ()                        => apiFetch("/auth/logout", { method: "POST" }),
  getGuilds:                ()                        => apiFetch("/guilds/"),
  getEligibleGuilds:        ()                        => apiFetch("/guilds/eligible"),
  getGuildChannels:         (gid)                     => apiFetch(`/guilds/${encodeURIComponent(gid)}/channels`),
  addServer:                (gid, name)               => apiFetch("/server/add",                  { method: "POST",   body: fd({ guild_id: gid, name }),                          isForm: true }),
  getConfig:                (gid)                     => apiFetch(`/server/config?guild_id=${encodeURIComponent(gid)}`),
  updateFaissK:             (gid, k)                  => apiFetch("/server/update-faiss-k",        { method: "PATCH",  body: fd({ guild_id: gid, k }),                             isForm: true }),
  updateBm25K:              (gid, k)                  => apiFetch("/server/update-bm25-k",         { method: "PATCH",  body: fd({ guild_id: gid, k }),                             isForm: true }),
  updateTemp:               (gid, k)                  => apiFetch("/server/update-temperature",    { method: "PATCH",  body: fd({ guild_id: gid, k }),                             isForm: true }),
  updateChunkSize:          (gid, k)                  => apiFetch("/server/update-chunk-size",     { method: "PATCH",  body: fd({ guild_id: gid, k }),                             isForm: true }),
  updateChunkOverlap:       (gid, k)                  => apiFetch("/server/update-chunk-overlap",  { method: "PATCH",  body: fd({ guild_id: gid, k }),                             isForm: true }),
  updateMaxToken:           (gid, k)                  => apiFetch("/server/update-max-token",      { method: "PATCH",  body: fd({ guild_id: gid, k }),                             isForm: true }),
  updateSystemPrompt:       (gid, text)               => apiFetch("/server/update-system-prompt",  { method: "PUT",    body: fd({ guild_id: gid, text }),                          isForm: true }),
  jsgetWebSearch:   (gid)          => apiFetch(`/server/get-web-search?guild_id=${encodeURIComponent(gid)}`),
  updateWebSearch:(gid, trigger) => apiFetch("/server/update-websearch", { method: "PATCH", body: fd({ guild_id: gid, trigger }), isForm: true }),
  updatePauseStatus:        (gid, isPaused)           => apiFetch("/server/update-pause",          { method: "PATCH",  body: fd({ guild_id: gid, is_paused: isPaused }),           isForm: true }),
  listServersWithStatus:    ()                        => apiFetch("/server/list"),
  listAllServersWithStatus: ()                        => apiFetch("/server/list-all"),
  listChannels:             (gid)                     => apiFetch(`/channel/list?guild_id=${encodeURIComponent(gid)}`),
  addChannel:               (gid, cid)               => apiFetch("/channel/add",                  { method: "PUT",    body: fd({ guild_id: gid, channel_id: cid }),               isForm: true }),
  deleteChannel:            (gid, cid)               => apiFetch("/channel/delete",               { method: "DELETE", body: fd({ guild_id: gid, channel_id: cid }),               isForm: true }),
  addModChannel:            (gid, cid)               => apiFetch("/channel/add-mod",              { method: "PUT",    body: fd({ guild_id: gid, channel_id: cid }),               isForm: true }),
  addSupportCategory: (gid, cid = null) => apiFetch(
  "/channel/add-support-category",
  { method: "PUT", body: fd({ guild_id: gid, ...(cid ? { channel_id: cid } : {}) }), isForm: true }
),
  addChannelConfig:         (gid, cid, language, tone) => apiFetch("/channel/add-channel-config",    { method: "POST",   body: fd({ guild_id: gid, channel_id: cid, language, tone }), isForm: true }),
  updateChannelConfig:      (gid, cid, language, tone) => apiFetch("/channel/update-channel-config", { method: "PATCH",  body: fd({ guild_id: gid, channel_id: cid, language, tone }), isForm: true }),
  deleteChannelConfig:      (gid, cid)               => apiFetch("/channel/delete-channel-config", { method: "DELETE", body: fd({ guild_id: gid, channel_id: cid }),               isForm: true }),
  listAllChannelConfigs:    (gid)                     => apiFetch(`/channel/list-all-channel-config?guild_id=${encodeURIComponent(gid)}`),
  upload: (gid, files, urls) => {
    const f = new FormData();
    f.append("guild_id", gid);
    files.forEach(fi => f.append("files", fi));
    if (urls) f.append("urls", urls);
    return apiFetch("/upload/", { method: "PUT", body: f, isForm: true });
  },
  uploadFile: (gid, file) => {
    const f = new FormData();
    f.append("guild_id", gid);
    f.append("file", file);
    return apiFetch("/upload/file", { method: "POST", body: f, isForm: true });
  },
  uploadUrl: (gid, url) => {
    const f = new FormData();
    f.append("guild_id", gid);
    f.append("url", url);
    return apiFetch("/upload/url", { method: "POST", body: f, isForm: true });
  },
  uploadWebsite: (gid, url) => {
    const f = new FormData();
    f.append("guild_id", gid);
    f.append("url", url);
    return apiFetch("/upload/website", { method: "POST", body: f, isForm: true });
  },
  uploadContacts: (gid, file) => {
    const f = new FormData();
    f.append("guild_id", gid);
    f.append("file", file);
    return apiFetch("/upload/contacts", { method: "POST", body: f, isForm: true });
  },
  addFaq: (gid, text) => {
    const f = new FormData();
    f.append("guild_id", gid);
    f.append("faq_text", text);
    return apiFetch("/upload/faq", { method: "POST", body: f, isForm: true });
  },
  getAllUploads:          (gid)         => apiFetch(`/upload/all?guild_id=${encodeURIComponent(gid)}`),
  getMyUploads:          ()            => apiFetch("/upload/my-uploads"),
  deleteUpload:          (gid, uid)    => apiFetch(`/upload/delete-content/${encodeURIComponent(uid)}?guild_id=${encodeURIComponent(gid)}`, { method: "DELETE" }),
  getSubUrls:            (url)         => apiFetch(`/upload/sub-urls?url=${encodeURIComponent(url)}`),
  query:                 (question, server) => apiFetch("/query", { method: "POST", body: { question, server } }),
  getAnalytics:          (gid)         => apiFetch(`/analytics/summary?guild_id=${encodeURIComponent(gid)}`),
  getRecentAnalytics:    (gid, limit = 50) => apiFetch(`/analytics/recent-analytics?guild_id=${encodeURIComponent(gid)}&limit=${limit}`),
  getAllAnalytics:        (gid, limit = 30) => apiFetch(`/analytics/all-analytics?guild_id=${encodeURIComponent(gid)}&limit=${limit}`),
  uploadChannelMessages: (gid, channelId, time) => {
    const f = new FormData();
    f.append("guild_id", gid);
    f.append("channel_id", channelId);
    f.append("time", time);
    return apiFetch("/upload/channel-messages", { method: "POST", body: f, isForm: true });
  },
};