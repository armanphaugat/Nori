import { useState, useEffect, useCallback } from "react";
import { API } from "../utils/api.js";
import {
  Spinner, StatusBadge, Tag, Btn, Icon,
  Card, SectionHeader, NoServerSelected,
} from "./Common.jsx";

export default function UtilsTab({ guildId, onGoToOverview, user }) {
  const [uploads, setUploads]           = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterType, setFilterType]     = useState("all");
  const [scope, setScope]               = useState("this-server-mine");
  const [inspectUpload, setInspectUpload] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [status, setStatus]             = useState(null);

  const loadUploads = useCallback(async (id) => {
    if (!id) { setUploads([]); return; }
    setLoadingUploads(true); setStatus(null);
    try {
      const d = await API.getAllUploads(id);
      setUploads(Array.isArray(d) ? d : d.uploads || []);
    } catch (err) {
      setStatus({ ok: false, msg: `Failed to load uploads: ${err.message}` });
    }
    setLoadingUploads(false);
  }, []);

  useEffect(() => { loadUploads(guildId); }, [guildId, loadUploads]);

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.deleteUpload(guildId, deleteTarget.id);
      setStatus({ ok: true, msg: `Deleted "${deleteTarget.name || deleteTarget.filename || "item"}"` });
      setDeleteTarget(null); loadUploads(guildId);
    } catch (e) { setStatus({ ok: false, msg: `Deletion failed: ${e.message}` }); }
    setDeleting(false);
  };

  const typeIcon = (t) => t === "pdf" ? "picture_as_pdf" : t === "url" ? "language" : t === "faq" ? "quiz" : t === "text" ? "forum" : "description";

  if (!guildId) return (
    <div>
      <SectionHeader label="Knowledge Base" title="Ingested Sources" subtitle="Manage and inspect ingested documents, URLs, and databases." />
      <NoServerSelected onGoToOverview={onGoToOverview} />
    </div>
  );

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <SectionHeader label="Knowledge Base" title="Ingested Sources"
        subtitle="View, inspect, or delete processed files and content connected to your server." />

      {status && <div style={{ marginBottom: 16 }}><StatusBadge {...status} /></div>}

      <Card pad="0" style={{ overflow: "visible" }}>
        {/* ── Toolbar ── */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
            Ingested Sources
          </div>
          <Btn onClick={() => loadUploads(guildId)} disabled={loadingUploads} variant="ghost"
            style={{ padding: "6px 14px", fontSize: 13, minHeight: 34 }}>
            {loadingUploads ? <Spinner size={13} /> : <><Icon name="refresh" size={15} /> Refresh</>}
          </Btn>
        </div>

        {/* ── Search + Filters ── */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted2)", pointerEvents: "none" }}>
              <Icon name="search" size={16} />
            </span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sources…"
              style={{
                width: "100%", padding: "8px 14px 8px 36px",
                borderRadius: "var(--r-full)", background: "var(--surface-2)",
                border: "1.5px solid var(--border2)", color: "var(--text)", outline: "none", fontSize: 13.5,
                fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "border-color var(--tr)",
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border2)"}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {[["this-server-all", "group", "All Uploads"], ["this-server-mine", "person", "My Uploads"]].map(([val, icon, label]) => (
              <button key={val} onClick={() => setScope(val)} style={{
                padding: "5px 13px", borderRadius: 99,
                border: `1.5px solid ${scope === val ? "var(--accent)" : "var(--border2)"}`,
                background: scope === val ? "var(--red-dim)" : "var(--surface)",
                color: scope === val ? "var(--accent-deep)" : "var(--muted)",
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 5,
                transition: "all var(--tr)", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                <Icon name={icon} size={13} /> {label}
              </button>
            ))}
            <span style={{ width: 1, height: 16, background: "var(--border2)" }} />
            {["all", "pdf", "url", "faq", "text"].map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{
                padding: "5px 12px", borderRadius: 99,
                border: `1.5px solid ${filterType === t ? "var(--accent)" : "var(--border2)"}`,
                background: filterType === t ? "var(--red-dim)" : "var(--surface)",
                color: filterType === t ? "var(--accent-deep)" : "var(--muted)",
                fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: ".04em",
                transition: "all var(--tr)", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ overflow: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Source Name</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>No uploads yet</td></tr>
              ) : (() => {
                const filtered = uploads.filter(u => {
                  if (scope === "this-server-mine" && u.uploaded_by !== user?.discord_id) return false;
                  const name = u.name || u.url || u.filename || u.source || "";
                  return name.toLowerCase().includes(searchQuery.toLowerCase())
                    && (filterType === "all" || (u.type || "url").toLowerCase() === filterType);
                });
                if (filtered.length === 0) return (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: "28px", color: "var(--muted)" }}>No matching sources found</td></tr>
                );
                return filtered.map((u, i) => {
                  const ds       = (u.status || "completed").toLowerCase();
                  const ingested = ds === "completed" || ds === "processed" || ds === "ok";
                  const failed   = ds === "failed" || ds === "error";
                  return (
                    <tr key={i}>
                      <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Icon name={typeIcon(u.type)} size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                          <span style={{ fontFamily: "monospace", fontSize: 12.5, color: "var(--navy)" }}>
                            {u.name || u.url || u.filename || u.source || "—"}
                          </span>
                        </div>
                      </td>
                      <td><Tag variant="neutral">{u.type || "url"}</Tag></td>
                      <td>
                        {ingested ? (
                          <Tag variant="success"><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} /> Ingested</span></Tag>
                        ) : failed ? (
                          <Tag variant="error"><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} /> Failed</span></Tag>
                        ) : (
                          <Tag variant="warn"><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#eab308" }} /> Processing</span></Tag>
                        )}
                      </td>
                      <td style={{ textAlign: "right", paddingRight: 16 }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button onClick={() => setInspectUpload(u)} title="Inspect" style={{
                            background: "var(--surface-2)", border: "1.5px solid var(--border2)",
                            borderRadius: "var(--r-sm)", width: 28, height: 28, color: "var(--navy-mid)",
                            cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                            transition: "all var(--tr)",
                          }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent-deep)"; e.currentTarget.style.background = "var(--red-dim)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--navy-mid)"; e.currentTarget.style.background = "var(--surface-2)"; }}
                          >
                            <Icon name="info" size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(u)} title="Delete" style={{
                            background: "rgba(239,35,60,0.05)", border: "1.5px solid var(--red-border)",
                            borderRadius: "var(--r-sm)", width: 28, height: 28, color: "var(--accent-deep)",
                            cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                            transition: "all var(--tr)",
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--red-dim)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,35,60,0.05)"; e.currentTarget.style.borderColor = "var(--red-border)"; }}
                          >
                            <Icon name="delete" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Inspect Modal ── */}
      {inspectUpload && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(43,45,66,0.35)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: 24,
        }}>
          <div style={{
            width: "100%", maxWidth: 520, borderRadius: "var(--r-xl)",
            border: "1px solid var(--border2)", background: "var(--surface)",
            boxShadow: "0 24px 60px rgba(43,45,66,0.2)", overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 24px", borderBottom: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 600, color: "var(--navy)", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="info" size={17} style={{ color: "var(--accent)" }} /> Source Inspector
              </h3>
              <button onClick={() => setInspectUpload(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                {[["Source Name", inspectUpload.name || inspectUpload.filename || "—"],
                  ["Ingestion Type", inspectUpload.type || "url"],
                  ["Status", inspectUpload.status === "ok" || inspectUpload.status === "completed" ? "Ingested" : inspectUpload.status || "Ingested"],
                  ["Record ID", inspectUpload.id],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: "var(--muted2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "var(--navy)", wordBreak: "break-all", fontFamily: label === "Record ID" ? "monospace" : undefined }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "var(--surface-2)", padding: 14, borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Sync Info</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, fontWeight: 300 }}>
                  Websites and URLs take about <strong style={{ fontWeight: 600, color: "var(--navy)" }}>3–5 minutes</strong> to fully sync. PDFs, images, audio, and video are processed <strong style={{ fontWeight: 600, color: "var(--navy)" }}>instantly</strong>.
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <Btn onClick={() => setInspectUpload(null)} variant="primary">Close Inspector</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(43,45,66,0.35)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: 24,
        }}>
          <div style={{
            width: "100%", maxWidth: 460, borderRadius: "var(--r-xl)",
            border: "1px solid var(--red-border)", background: "var(--surface)",
            boxShadow: "0 24px 60px rgba(43,45,66,0.2)", overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 24px", borderBottom: "1px solid var(--red-border)",
              background: "var(--red-dim)",
            }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 600, color: "var(--accent-deep)", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="warning" size={17} /> Confirm Deletion
              </h3>
              <button onClick={() => setDeleteTarget(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, fontWeight: 300, marginBottom: 16 }}>
                You are about to delete <strong style={{ color: "var(--navy)", fontWeight: 600 }}>"{deleteTarget.name || deleteTarget.filename || "this source"}"</strong> from your knowledge store.
              </p>
              <div style={{ background: "var(--red-dim)", padding: 14, borderRadius: "var(--r-md)", border: "1px solid var(--red-border)", marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "var(--accent-deep)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Permanent consequences</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, fontWeight: 300 }}>
                  Nori will immediately forget all information from this source. This action cannot be undone.
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Btn onClick={() => setDeleteTarget(null)} disabled={deleting} variant="ghost">Cancel</Btn>
                <Btn onClick={doDelete} disabled={deleting} variant="accent">
                  {deleting ? <><Spinner size={13} color="#fff" /> Deleting…</> : "Yes, Delete Permanently"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}