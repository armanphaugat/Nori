import { useState, useEffect, useCallback } from "react";
import { API } from "../utils/api.js";
import {
  Spinner, StatusBadge, Tag, Btn, Icon, Card,
  SectionHeader, NoServerSelected,
} from "./Common.jsx";

export default function SourcesTab({ guildId, onGoToOverview, user, onTab }) {
  const [uploads, setUploads]           = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterType, setFilterType]     = useState("all");
  const [scope, setScope]               = useState("this-server-all");
  const [inspectUpload, setInspectUpload] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [status, setStatus]             = useState(null);

  const loadUploads = useCallback(async (id) => {
    if (!id) { setUploads([]); return; }
    setLoadingUploads(true);
    setStatus(null);
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
      setStatus({ ok: true, msg: `Successfully deleted "${deleteTarget.name || deleteTarget.filename || "item"}"` });
      setDeleteTarget(null);
      loadUploads(guildId);
    } catch (e) {
      setStatus({ ok: false, msg: `Deletion failed: ${e.message}` });
    }
    setDeleting(false);
  };

  // ── type → icon map ──
  const typeIcon = t => ({
    pdf: "picture_as_pdf", url: "language",
    faq: "quiz", text: "forum",
  }[t] ?? "description");

  // ── pill toggle style helper ──
  const pillStyle = (active) => ({
    padding: "6px 14px", borderRadius: "var(--r-full)",
    border: `1px solid ${active ? "var(--accent)" : "var(--border2)"}`,
    background: active ? "var(--red-dim)" : "var(--surface)",
    color: active ? "var(--accent-deep)" : "var(--muted)",
    fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6,
    transition: "all var(--tr)", fontFamily: "'Plus Jakarta Sans', sans-serif",
    letterSpacing: "0.02em",
  });

  if (!guildId) return (
    <div>
      <SectionHeader
        label="Knowledge Base"
        title="Ingested Sources"
        subtitle="Manage and inspect ingested documents, URLs, and databases."
      />
      <NoServerSelected onGoToOverview={onGoToOverview} />
    </div>
  );

  // ── filtered rows ──
  const filtered = uploads.filter(u => {
    if (scope === "this-server-mine" && u.uploaded_by !== user?.discord_id) return false;
    const name = (u.name || u.url || u.filename || u.source || "").toLowerCase();
    if (!name.includes(searchQuery.toLowerCase())) return false;
    if (filterType !== "all" && (u.type || "url").toLowerCase() !== filterType) return false;
    return true;
  });

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <SectionHeader
        label="Knowledge Base"
        title="Ingested Sources"
        subtitle="View, inspect, or delete processed files and database content connected to your server."
      />

      {status && (
        <div style={{ marginBottom: 16 }}>
          <StatusBadge {...status} />
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, gap: 12, flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "var(--muted2)", pointerEvents: "none",
          }}>
            <Icon name="search" size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search sources…"
            className="kb-input"
            style={{ paddingLeft: 36 }}
          />
        </div>

        {/* Filters row */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {/* Scope toggles */}
          <button onClick={() => setScope("this-server-all")} style={pillStyle(scope === "this-server-all")}>
            <Icon name="group" size={13} style={{ color: scope === "this-server-all" ? "var(--accent-deep)" : "var(--muted2)" }} />
            All Uploads
          </button>
          <button onClick={() => setScope("this-server-mine")} style={pillStyle(scope === "this-server-mine")}>
            <Icon name="person" size={13} style={{ color: scope === "this-server-mine" ? "var(--accent-deep)" : "var(--muted2)" }} />
            My Uploads
          </button>

          <span style={{ width: 1, height: 18, background: "var(--border2)", margin: "0 2px" }} />

          {/* Type filters */}
          {["all", "pdf", "url", "faq", "text"].map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={pillStyle(filterType === t)}>
              {t === "all" ? "All" : t.toUpperCase()}
            </button>
          ))}

          {/* Add Sources */}
          <Btn
            onClick={() => onTab("upload")}
            variant="primary"
            style={{ padding: "6px 14px", fontSize: 13, minHeight: 34 }}
          >
            <Icon name="add" size={15} /> Add Source
          </Btn>
        </div>
      </div>

      {/* ── Table ── */}
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
            {uploads.length === 0 && !loadingUploads ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--muted2)", padding: "40px 20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <Icon name="inbox" size={28} style={{ color: "var(--muted2)", opacity: 0.5 }} />
                    <span style={{ fontSize: 14 }}>No uploads yet</span>
                  </div>
                </td>
              </tr>
            ) : loadingUploads ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "40px 20px" }}>
                  <Spinner size={20} />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--muted2)", padding: "32px 20px", fontSize: 14 }}>
                  No matching sources found
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => {
                const s = (u.status || "completed").toLowerCase();
                const isOk     = ["completed", "processed", "ok"].includes(s);
                const isFailed = ["failed", "error"].includes(s);
                const displayName = u.name || u.url || u.filename || u.source || "—";

                return (
                  <tr key={i}>
                    {/* Name */}
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "var(--r-sm)", flexShrink: 0,
                          background: "var(--red-dim)", border: "1px solid var(--red-border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon name={typeIcon(u.type)} size={15} fill style={{ color: "var(--accent-deep)" }} />
                        </div>
                        <span style={{
                          fontSize: 13, color: "var(--text)", fontFamily: "'DM Mono', monospace",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200,
                        }}>
                          {displayName}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td>
                      <Tag variant="slate">{u.type || "url"}</Tag>
                    </td>

                    {/* Status */}
                    <td>
                      {isOk ? (
                        <Tag variant="success">
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                          Ingested
                        </Tag>
                      ) : isFailed ? (
                        <Tag variant="error">
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
                          Failed
                        </Tag>
                      ) : (
                        <Tag variant="warn">
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#eab308", display: "inline-block" }} />
                          Processing
                        </Tag>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right", paddingRight: 16 }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          onClick={() => setInspectUpload(u)}
                          title="Inspect Metadata"
                          style={{
                            background: "var(--surface-2)", border: "1px solid var(--border2)",
                            borderRadius: "var(--r-sm)", width: 30, height: 30,
                            color: "var(--muted)", cursor: "pointer",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            transition: "all var(--tr)",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "var(--red-dim)";
                            e.currentTarget.style.borderColor = "var(--red-border)";
                            e.currentTarget.style.color = "var(--accent-deep)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "var(--surface-2)";
                            e.currentTarget.style.borderColor = "var(--border2)";
                            e.currentTarget.style.color = "var(--muted)";
                          }}
                        >
                          <Icon name="info" size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          title="Delete Source"
                          style={{
                            background: "rgba(239,35,60,0.05)", border: "1px solid var(--red-border)",
                            borderRadius: "var(--r-sm)", width: 30, height: 30,
                            color: "var(--accent-deep)", cursor: "pointer",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            transition: "all var(--tr)",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "rgba(239,35,60,0.12)";
                            e.currentTarget.style.borderColor = "var(--accent)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "rgba(239,35,60,0.05)";
                            e.currentTarget.style.borderColor = "var(--red-border)";
                          }}
                        >
                          <Icon name="delete" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* ── Metadata inspector modal ── */}
      {inspectUpload && (
        <Modal onClose={() => setInspectUpload(null)}>
          <ModalHeader
            icon="info"
            title="Source Metadata"
            onClose={() => setInspectUpload(null)}
          />
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
              <MetaField label="Source Name" mono>
                {inspectUpload.name || inspectUpload.filename || "—"}
              </MetaField>
              <MetaField label="Ingestion Type">
                <Tag variant="slate">{inspectUpload.type || "url"}</Tag>
              </MetaField>
              <MetaField label="Status">
                {["ok", "completed", "processed"].includes(inspectUpload.status)
                  ? <Tag variant="success"><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />Ingested</Tag>
                  : <span style={{ fontSize: 13, color: "var(--muted)" }}>{inspectUpload.status || "Ingested"}</span>
                }
              </MetaField>
              <MetaField label="Database Record ID" mono>
                {inspectUpload.id}
              </MetaField>
            </div>

            <div style={{
              background: "var(--surface-2)", padding: 14, borderRadius: "var(--r-md)",
              border: "1px solid var(--border)", marginBottom: 24,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Sync Status
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, fontWeight: 300 }}>
                Websites and URL feeds take <strong style={{ color: "var(--navy)", fontWeight: 600 }}>3–5 minutes</strong> to fully sync.
                PDFs, images, and FAQs are processed <strong style={{ color: "var(--navy)", fontWeight: 600 }}>instantly</strong>.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={() => setInspectUpload(null)} variant="ghost">Close</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <Modal onClose={() => !deleting && setDeleteTarget(null)} danger>
          <ModalHeader
            icon="warning"
            title="Confirm Deletion"
            onClose={() => !deleting && setDeleteTarget(null)}
            danger
          />
          <div style={{ padding: 24 }}>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 16 }}>
              You are about to permanently delete{" "}
              <strong style={{ color: "var(--navy)", fontWeight: 600 }}>
                "{deleteTarget.name || deleteTarget.filename || "this source"}"
              </strong>{" "}
              from your knowledge store.
            </p>

            <div style={{
              background: "rgba(239,35,60,0.04)", padding: 14,
              borderRadius: "var(--r-md)", border: "1px solid var(--red-border)", marginBottom: 24,
            }}>
              <div style={{
                fontSize: 11, color: "var(--accent-deep)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
              }}>
                Permanent Consequence
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, fontWeight: 300 }}>
                VaultBot will instantly forget all information parsed from this document. Members will no longer receive answers sourced from this content. This action cannot be undone.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn onClick={() => setDeleteTarget(null)} disabled={deleting} variant="ghost">
                Cancel
              </Btn>
              <Btn onClick={doDelete} disabled={deleting} variant="accent">
                {deleting
                  ? <><Spinner size={13} color="#fff" /> Deleting…</>
                  : <><Icon name="delete" size={15} /> Delete Permanently</>
                }
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Local helpers ────────────────────────────────────────────────────────────

function Modal({ children, onClose, danger = false }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(43,45,66,0.45)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 999, padding: 24,
        animation: "fadeIn .15s ease",
      }}
    >
      <div style={{
        width: "100%", maxWidth: danger ? 480 : 540,
        borderRadius: "var(--r-xl)",
        background: "var(--surface)",
        border: `1px solid ${danger ? "var(--red-border)" : "var(--border2)"}`,
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
        animation: "fadeUp .2s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon, title, onClose, danger = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 20px",
      borderBottom: `1px solid ${danger ? "var(--red-border)" : "var(--border)"}`,
      background: danger ? "rgba(239,35,60,0.03)" : "var(--surface-2)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "var(--r-sm)",
          background: danger ? "var(--red-dim)" : "var(--surface-3)",
          border: `1px solid ${danger ? "var(--red-border)" : "var(--border2)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={15} fill style={{ color: danger ? "var(--accent-deep)" : "var(--muted)" }} />
        </div>
        <h3 style={{
          margin: 0, fontSize: 15, fontWeight: 600,
          color: danger ? "var(--accent-deep)" : "var(--navy)",
          fontFamily: "'Outfit', sans-serif",
        }}>{title}</h3>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "var(--surface-3)", border: "1px solid var(--border2)",
          borderRadius: "var(--r-sm)", width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--muted)", transition: "all var(--tr)",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-4)"; e.currentTarget.style.color = "var(--navy)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--surface-3)"; e.currentTarget.style.color = "var(--muted)"; }}
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}

function MetaField({ label, children, mono = false }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: "var(--muted2)",
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5,
      }}>{label}</div>
      <div style={{
        fontSize: mono ? 12 : 13.5,
        color: "var(--text)",
        fontFamily: mono ? "'DM Mono', monospace" : "'Plus Jakarta Sans', sans-serif",
        wordBreak: "break-all", lineHeight: 1.5,
      }}>
        {children}
      </div>
    </div>
  );
}