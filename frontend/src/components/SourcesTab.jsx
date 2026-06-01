import { useState, useEffect, useCallback } from "react";
import { API } from "../utils/api.js";
import {
  Spinner,
  StatusBadge,
  Tag,
  Btn,
  Icon,
  Card,
  SectionHeader,
  NoServerSelected
} from "./Common.jsx";

export default function SourcesTab({ guildId, onGoToOverview, user }) {
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [scope, setScope] = useState("this-server-mine"); // "this-server-mine" | "this-server-all"
  const [inspectUpload, setInspectUpload] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState(null);

  const loadUploads = useCallback(async (id) => {
    if (!id) {
      setUploads([]);
      return;
    }
    setLoadingUploads(true);
    setStatus(null);
    try {
      const d = await API.getAllUploads(id);
      setUploads(Array.isArray(d) ? d : d.uploads || []);
    } catch (err) {
      console.error("Error loading uploads:", err);
      setStatus({ ok: false, msg: `Failed to load uploads: ${err.message}` });
    }
    setLoadingUploads(false);
  }, []);

  // Reload when active guild changes
  useEffect(() => {
    loadUploads(guildId);
  }, [guildId, loadUploads]);

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.deleteUpload(guildId, deleteTarget.id);
      setStatus({ ok: true, msg: `Successfully deleted "${deleteTarget.name || deleteTarget.filename || "item"}"` });
      setDeleteTarget(null);
      loadUploads(guildId);
    } catch (e) {
      setStatus({ ok: false, msg: `Deletion failed: ${e.message}` });
    }
    setDeleting(false);
  };

  if (!guildId) return (
    <div>
      <SectionHeader label="Knowledge Base" title="Ingested Sources" subtitle="Manage and inspect ingested documents, URLs, and databases." />
      <NoServerSelected onGoToOverview={onGoToOverview} />
    </div>
  );

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <SectionHeader label="Knowledge Base" title="Ingested Sources" subtitle="View, inspect, or delete processed files and database content connected to your server." />

      {status && <div style={{ marginBottom: 16 }}><StatusBadge {...status}/></div>}

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Ingested Sources</span>
          <Btn onClick={() => loadUploads(guildId)} disabled={loadingUploads} variant="ghost" style={{ padding: "6px 12px", fontSize: 13, minHeight: 34 }}>
            {loadingUploads ? <Spinner size={13}/> : <><Icon name="refresh" size={15}/> Refresh</>}
          </Btn>
        </div>

        {/* SEARCH AND FILTERS */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--on-surface-variant)", pointerEvents: "none" }}>
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ingested sources..."
              style={{
                width: "100%", padding: "10px 14px 10px 36px", borderRadius: "var(--r-md)",
                background: "rgba(0, 0, 0, 0.25)", border: "1.5px solid var(--outline-variant)",
                color: "var(--on-surface)", outline: "none", fontSize: 13.5
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => setScope("this-server-mine")}
              style={{
                padding: "6px 14px", borderRadius: 99,
                border: `1px solid ${scope === "this-server-mine" ? "var(--blue)" : "var(--outline-variant)"}`,
                background: scope === "this-server-mine" ? "rgba(0,176,244,0.1)" : "rgba(255,255,255,0.02)",
                color: scope === "this-server-mine" ? "var(--blue)" : "var(--on-surface-variant)",
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all var(--tr)"
              }}
            >
              <Icon name="person" size={14} style={{ color: scope === "this-server-mine" ? "var(--blue)" : "var(--on-surface-variant)" }} />
              <span>My Uploads</span>
            </button>

            <button
              onClick={() => setScope("this-server-all")}
              style={{
                padding: "6px 14px", borderRadius: 99,
                border: `1px solid ${scope === "this-server-all" ? "var(--blue)" : "var(--outline-variant)"}`,
                background: scope === "this-server-all" ? "rgba(0,176,244,0.1)" : "rgba(255,255,255,0.02)",
                color: scope === "this-server-all" ? "var(--blue)" : "var(--on-surface-variant)",
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all var(--tr)"
              }}
            >
              <Icon name="group" size={14} style={{ color: scope === "this-server-all" ? "var(--blue)" : "var(--on-surface-variant)" }} />
              <span>All Uploads</span>
            </button>

            <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
            
            {["all", "pdf", "url", "faq", "text"].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: "6px 14px", borderRadius: 99, border: `1px solid ${filterType===t?"var(--blue)":"var(--outline-variant)"}`,
                  background: filterType===t?"rgba(0,176,244,0.1)":"rgba(255,255,255,0.02)",
                  color: filterType===t?"var(--blue)":"var(--on-surface-variant)",
                  fontSize: 12.5, fontWeight: 600, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.03em",
                  transition: "all var(--tr)"
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Card pad="0" style={{ overflow: "hidden" }}>
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
                <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "28px" }}>No uploads yet</td></tr>
              ) : (
                (() => {
                  const filtered = uploads.filter(u => {
                    if (scope === "this-server-mine") {
                      const isUploadedByMe = u.uploaded_by === user?.discord_id;
                      if (!isUploadedByMe) return false;
                    }
                    const name = u.name || u.url || u.filename || u.source || "";
                    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesType = filterType === "all" || (u.type || "url").toLowerCase() === filterType.toLowerCase();
                    return matchesSearch && matchesType;
                  });

                  if (filtered.length === 0) {
                    return <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "28px" }}>No matching sources found</td></tr>;
                  }

                  return filtered.map((u, i) => {
                    const displayStatus = (u.status || "completed").toLowerCase();
                    const isIngested = displayStatus === "completed" || displayStatus === "processed" || displayStatus === "ok";
                    const isFailed = displayStatus === "failed" || displayStatus === "error";

                    return (
                      <tr key={i}>
                        <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Icon
                              name={u.type === "pdf" ? "picture_as_pdf" : (u.type === "url" ? "language" : (u.type === "faq" ? "quiz" : (u.type === "text" ? "forum" : "description")))}
                              size={16}
                              style={{ color: "var(--blue)", flexShrink: 0 }}
                            />
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontFamily: "monospace", fontSize: 12, color: "#ffffff" }}>{u.name || u.url || u.filename || u.source || "—"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Tag variant="neutral">{u.type || "url"}</Tag>
                        </td>
                        <td>
                          {isIngested ? (
                            <Tag variant="success">
                              <span style={{ display:"inline-flex",alignItems:"center",gap:5 }}>
                                <span style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e" }}/> Ingested
                              </span>
                            </Tag>
                          ) : isFailed ? (
                            <Tag variant="error">
                              <span style={{ display:"inline-flex",alignItems:"center",gap:5 }}>
                                <span style={{ width:6,height:6,borderRadius:"50%",background:"#ef4444" }}/> Failed
                              </span>
                            </Tag>
                          ) : (
                            <Tag variant="warn">
                              <span style={{ display:"inline-flex",alignItems:"center",gap:5 }}>
                                <span style={{ width:6,height:6,borderRadius:"50%",background:"#eab308" }}/> Processing
                              </span>
                            </Tag>
                          )}
                        </td>
                        <td style={{ textAlign: "right", paddingRight: 16 }}>
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              onClick={() => setInspectUpload(u)}
                              title="Inspect Metadata"
                              style={{
                                background: "rgba(255,255,255,0.03)", border: "1px solid var(--outline-variant)",
                                borderRadius: 6, width: 28, height: 28, color: "var(--blue)",
                                cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                                transition: "all var(--tr)"
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,176,244,0.1)"; e.currentTarget.style.borderColor = "var(--blue)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "var(--outline-variant)"; }}
                            >
                              <Icon name="info" size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              title="Delete Source"
                              style={{
                                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                                borderRadius: 6, width: 28, height: 28, color: "#ff8b8b",
                                cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                                transition: "all var(--tr)"
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ffffff"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#ff8b8b"; }}
                            >
                              <Icon name="delete" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* METADATA INSPECTOR MODAL */}
      {inspectUpload && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(4, 5, 8, 0.75)", backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: 24
        }}>
          <div style={{
            width: "100%", maxWidth: 540, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(18, 20, 36, 0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)", overflow: "hidden"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--blue)", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="info" size={16} style={{ color: "var(--blue)" }} /> Source Metadata Inspector
              </h3>
              <button onClick={() => setInspectUpload(null)} style={{ background: "transparent", border: "none", color: "var(--on-surface-variant)", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--on-surface-variant)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Source Name</div>
                  <div style={{ fontSize: 13, color: "#ffffff", wordBreak: "break-all", fontFamily: "monospace" }}>{inspectUpload.name || inspectUpload.filename || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--on-surface-variant)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Ingestion Type</div>
                  <Tag variant="neutral">{inspectUpload.type || "url"}</Tag>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--on-surface-variant)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Status</div>
                  <div style={{ fontSize: 13, color: "#ffffff" }}>
                    {(inspectUpload.status === "ok" || inspectUpload.status === "completed" || inspectUpload.status === "processed") ? "Ingested" : (inspectUpload.status || "Ingested")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--on-surface-variant)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Database Record ID</div>
                  <div style={{ fontSize: 11, color: "var(--on-surface-variant)", fontFamily: "monospace" }}>{inspectUpload.id}</div>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.01)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 11, color: "var(--on-surface-variant)", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Sync Status Info</div>
                <div style={{ fontSize: 12.5, color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
                  Websites and URL feeds will take about <strong>3 to 5 minutes</strong> to fully sync and become searchable. All other file uploads (PDFs, images, audio, video) and FAQs are processed <strong>instantly</strong>.
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <Btn onClick={() => setInspectUpload(null)}>Close Inspector</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMABLE DELETION MODAL */}
      {deleteTarget && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(4, 5, 8, 0.75)", backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: 24
        }}>
          <div style={{
            width: "100%", maxWidth: 480, borderRadius: 16, border: "1px solid rgba(239, 68, 68, 0.2)",
            background: "rgba(22, 10, 15, 0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)", overflow: "hidden"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(239, 68, 68, 0.15)", background: "rgba(239, 68, 68, 0.04)" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#ff8b8b", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="warning" size={16} /> Confirm Source Deletion
              </h3>
              <button onClick={() => setDeleteTarget(null)} style={{ background: "transparent", border: "none", color: "var(--on-surface-variant)", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 14, color: "var(--on-surface)", lineHeight: 1.6, marginTop: 0 }}>
                You are about to delete <strong>"{deleteTarget.name || deleteTarget.filename || "this source"}"</strong> from your vector knowledge store.
              </p>
              <div style={{ background: "rgba(239,68,68,0.05)", padding: 14, borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)", marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#ff8b8b", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Critical Consequences:</div>
                <div style={{ fontSize: 12.5, color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
                  VaultBot will instantly forget all information parsed from this document. Any user querying VaultBot inside Discord will no longer retrieve responses derived from this content. This action is permanent and cannot be undone.
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <Btn
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  variant="ghost"
                  style={{
                    padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 40
                  }}
                >
                  Cancel
                </Btn>
                <button
                  onClick={doDelete}
                  disabled={deleting}
                  style={{
                    padding: "10px 18px", borderRadius: 8, border: "none",
                    background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 0 16px rgba(239,68,68,0.25)", display: "flex", alignItems: "center", gap: 6,
                    transition: "all var(--tr)"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#ff5b5b"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#ef4444"; }}
                >
                  {deleting ? <><Spinner size={13} color="#fff" /> Deleting…</> : "Yes, Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
