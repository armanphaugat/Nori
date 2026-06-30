import { useState, useEffect, useCallback } from "react";
import { API } from "../utils/api.js";
import {
  Spinner, StatusBadge, Tag, Btn, Icon, Card,
  SectionHeader, NoServerSelected,
} from "./Common.jsx";

// ─── HELPER FUNCTIONS & SUB-COMPONENTS ──────────────────────────────────────────

const isUrl = (item) => {
  const name = item.name || "";
  return item.type === "url" || name.startsWith("http://") || name.startsWith("https://");
};

const getDomain = (urlStr) => {
  try {
    const url = new URL(urlStr);
    return url.hostname;
  } catch (_) {
    return "";
  }
};

const typeIcon = t => ({
  pdf: "picture_as_pdf", url: "language",
  faq: "quiz", text: "forum", github: "code",
  image: "image", video: "movie", docx: "description", xlsx: "table_chart",
}[t] ?? "description");

const FaviconContainer = ({ item }) => {
  const isUrlType = isUrl(item);
  const domain = isUrlType ? getDomain(item.name) : "";
  const [imgFailed, setImgFailed] = useState(false);

  if (isUrlType && domain && !imgFailed) {
    return (
      <img
        src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`}
        alt="logo"
        style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "contain", flexShrink: 0 }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div style={{
      width: 18, height: 18, borderRadius: "50%",
      background: "var(--accent-dim)", display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0
    }}>
      <Icon name={typeIcon(item.type)} size={11} style={{ color: "var(--accent)" }} />
    </div>
  );
};

const LoadingState = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 20px" }}>
    <Spinner size={32} />
  </div>
);

const EmptyState = ({ onTab }) => (
  <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "60px 20px", textAlign: "center" }}>
    <Icon name="inbox" size={40} style={{ color: "var(--text-m)", opacity: 0.5 }} />
    <div>
      <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>No sources ingested yet</h4>
      <p style={{ fontSize: 13, color: "var(--text-s)", fontWeight: 300 }}>Upload files or add web search crawls to start training your bot.</p>
    </div>
    <Btn onClick={() => onTab("upload")} variant="primary" style={{ marginTop: 8 }}>
      <Icon name="add" size={16} /> Add First Source
    </Btn>
  </Card>
);

const NoMatchesState = () => (
  <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "50px 20px", textAlign: "center" }}>
    <Icon name="search_off" size={36} style={{ color: "var(--text-m)", opacity: 0.6 }} />
    <div>
      <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>No matching sources found</h4>
      <p style={{ fontSize: 13, color: "var(--text-s)", fontWeight: 300 }}>Try adjusting your search keywords or active filters.</p>
    </div>
  </Card>
);

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
  const [showFilters, setShowFilters]   = useState(false);

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

  // pill toggle style helper
  const pillStyle = (active) => ({
    padding: "6px 14px", borderRadius: "var(--r-full)",
    border: `1.5px solid ${active ? "var(--accent)" : "var(--border2)"}`,
    background: active ? "var(--accent-dim)" : "var(--surface)",
    color: active ? "var(--accent-deep)" : "var(--muted)",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6,
    transition: "all var(--tr)", fontFamily: "'Plus Jakarta Sans', sans-serif",
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

  // filtered rows
  const filtered = uploads.filter(u => {
    if (scope === "this-server-mine" && u.uploaded_by !== user?.discord_id) return false;
    const name = (u.name || u.url || u.filename || u.source || "").toLowerCase();
    if (!name.includes(searchQuery.toLowerCase())) return false;
    
    const currentType = (u.type || "url").toLowerCase();
    if (filterType !== "all") {
      if (filterType === "files") {
        const fileTypes = ["pdf", "docx", "xlsx", "image", "video", "contacts"];
        if (!fileTypes.includes(currentType)) return false;
      } else {
        if (currentType !== filterType) return false;
      }
    }
    return true;
  });

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <style>{`
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .data-table th {
          background: transparent !important;
          border-bottom: 1.5px solid var(--border2) !important;
          font-weight: 500 !important;
          font-size: 12.5px !important;
          color: var(--muted) !important;
          text-transform: none !important;
          letter-spacing: normal !important;
          padding: 12px 20px !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }
        .data-table td {
          padding: 14px 20px !important;
          border-bottom: 1px solid var(--border2) !important;
          color: var(--navy) !important;
          vertical-align: middle !important;
        }
        .data-table tr:hover td {
          background: var(--surface-2) !important;
        }
        .kb-source-link {
          color: var(--navy) !important;
          text-decoration: none !important;
          font-weight: 600 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          transition: color var(--tr) !important;
        }
        .kb-source-link:hover {
          color: var(--accent) !important;
          text-decoration: underline !important;
        }
        .kb-source-link .material-symbols-outlined {
          opacity: 0.5;
          transition: opacity var(--tr), color var(--tr);
        }
        .kb-source-link:hover .material-symbols-outlined {
          opacity: 1 !important;
          color: var(--accent) !important;
        }
      `}</style>

      <SectionHeader
        label="Knowledge Base"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>Ingested Sources</span>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              color: "var(--text-s)",
              padding: "2px 8px",
              borderRadius: "10px",
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center"
            }}>
              {uploads.length}
            </span>
          </div>
        }
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
        {/* Left side filters */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flex: "1 1 auto" }}>
          {/* Search */}
          <div style={{ position: "relative", width: 240 }}>
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
              placeholder="Filter by name..."
              className="kb-input"
              style={{ paddingLeft: 36, height: 34, paddingTop: 0, paddingBottom: 0, fontSize: 13 }}
            />
          </div>

          {/* Filter button */}
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={{
              padding: "6px 14px", 
              borderRadius: "var(--r-md)",
              border: `1.5px solid ${showFilters || filterType !== "all" || scope !== "this-server-all" ? "var(--accent)" : "var(--border2)"}`,
              background: showFilters || filterType !== "all" || scope !== "this-server-all" ? "var(--accent-dim)" : "var(--surface)",
              color: showFilters || filterType !== "all" || scope !== "this-server-all" ? "var(--accent-deep)" : "var(--navy)",
              fontSize: 13, 
              fontWeight: 600, 
              cursor: "pointer",
              display: "inline-flex", 
              alignItems: "center", 
              gap: 6,
              transition: "all var(--tr)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              height: 34,
            }}
          >
            <Icon name="filter_list" size={15} />
            Filter
          </button>
        </div>

        {/* Right side: Add Sources */}
        <Btn
          onClick={() => onTab("upload")}
          variant="primary"
          style={{ padding: "6px 14px", fontSize: 13, minHeight: 34 }}
        >
          <Icon name="add" size={15} /> Add Source
        </Btn>
      </div>

      {/* Expanded filters row */}
      {showFilters && (
        <div style={{
          display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center",
          background: "var(--surface-2)", padding: "10px 16px", borderRadius: "var(--r-md)",
          border: "1.5px solid var(--border2)", marginBottom: 14,
          animation: "fadeIn .15s ease",
        }}>
          {/* Scope toggles */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginRight: 4 }}>Scope:</span>
            <button onClick={() => setScope("this-server-all")} style={pillStyle(scope === "this-server-all")}>
              <Icon name="group" size={13} style={{ color: scope === "this-server-all" ? "var(--accent-deep)" : "var(--muted2)" }} />
              All Uploads
            </button>
            <button onClick={() => setScope("this-server-mine")} style={pillStyle(scope === "this-server-mine")}>
              <Icon name="person" size={13} style={{ color: scope === "this-server-mine" ? "var(--accent-deep)" : "var(--muted2)" }} />
              My Uploads
            </button>
          </div>

          <span style={{ width: 1, height: 18, background: "var(--border2)" }} />

          {/* Type filters */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginRight: 4 }}>Type:</span>
            {["all", "files", "url", "faq", "text", "github"].map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={pillStyle(filterType === t)}>
                {t === "all" ? "All" : t === "github" ? "GitHub" : t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main View Area ── */}
      {loadingUploads ? (
        <LoadingState />
      ) : uploads.length === 0 ? (
        <EmptyState onTab={onTab} />
      ) : filtered.length === 0 ? (
        <NoMatchesState />
      ) : (
        <Card pad="0" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const isUrlType = isUrl(u);
                const displayName = u.name || u.url || u.filename || u.source || "—";
                const s = (u.status || "completed").toLowerCase();
                const isOk     = ["completed", "processed", "ok"].includes(s);
                const isFailed = ["failed", "error"].includes(s);

                return (
                  <tr key={i}>
                    {/* Logo/Favicon + Name / URL in same cell */}
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <FaviconContainer item={u} />
                        {isUrlType ? (
                          <a 
                            href={u.name.startsWith("http") ? u.name : `https://${u.name}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="kb-source-link"
                          >
                            {u.name} <Icon name="open_in_new" size={12} />
                          </a>
                        ) : (
                          <span style={{ fontWeight: 600, color: "var(--navy)" }}>{displayName}</span>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ fontSize: 13, color: "var(--muted)", textTransform: "capitalize", fontWeight: 400 }}>
                      {u.type || "url"}
                    </td>

                    {/* Status */}
                    <td>
                      {isOk ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>
                          <span style={{ width: 7, height: 7, borderRadius: 1.5, background: "#22c55e", display: "inline-block", flexShrink: 0 }} />
                          Ingested
                        </div>
                      ) : isFailed ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>
                          <span style={{ width: 7, height: 7, borderRadius: 1.5, background: "var(--accent)", display: "inline-block", flexShrink: 0 }} />
                          Failed
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>
                          <span style={{ width: 7, height: 7, borderRadius: 1.5, background: "#eab308", display: "inline-block", flexShrink: 0 }} />
                          Processing
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right", paddingRight: 20 }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          onClick={() => setInspectUpload(u)}
                          title="Inspect Metadata"
                          style={{
                            background: "var(--bg-s)", border: "1px solid var(--border)",
                            borderRadius: "var(--r-sm)", width: 30, height: 30,
                            color: "var(--text-s)", cursor: "pointer",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            transition: "all var(--tr)",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "var(--accent-l)";
                            e.currentTarget.style.color = "var(--accent)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "var(--bg-s)";
                            e.currentTarget.style.color = "var(--text-s)";
                          }}
                        >
                          <Icon name="info" size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          title="Delete Source"
                          style={{
                            background: "var(--danger-dim)", border: "1px solid var(--danger-border)",
                            borderRadius: "var(--r-sm)", width: 30, height: 30,
                            color: "var(--danger)", cursor: "pointer",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            transition: "all var(--tr)",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "var(--danger-glow)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "var(--danger-dim)";
                          }}
                        >
                          <Icon name="delete" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

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
              background: "rgba(30,58,138,0.04)", padding: 14,
              borderRadius: "var(--r-md)", border: "1px solid var(--accent-border)", marginBottom: 24,
            }}>
              <div style={{
                fontSize: 11, color: "var(--accent-deep)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
              }}>
                Permanent Consequence
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, fontWeight: 300 }}>
                Nori will instantly forget all information parsed from this document. Members will no longer receive answers sourced from this content. This action cannot be undone.
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
        border: `1px solid ${danger ? "var(--accent-border)" : "var(--border2)"}`,
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
      borderBottom: `1px solid ${danger ? "var(--accent-border)" : "var(--border)"}`,
      background: danger ? "rgba(30,58,138,0.03)" : "var(--surface-2)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "var(--r-sm)",
          background: danger ? "var(--accent-dim)" : "var(--surface-3)",
          border: `1px solid ${danger ? "var(--accent-border)" : "var(--border2)"}`,
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