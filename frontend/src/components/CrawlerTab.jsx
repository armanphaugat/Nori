import { useState } from "react";
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

export default function CrawlerTab({ guildId, onGoToOverview }) {
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
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
                <div key={i} onClick={() => toggle(u)} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",background:sel?"rgba(0,176,244,0.06)":"transparent",transition:"background var(--tr)" }}>
                  <div style={{ width:18,height:18,borderRadius:4,flexShrink:0,border:`1.5px solid ${sel?"var(--blue)":"var(--outline-variant)"}`,background:sel?"var(--blue)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontSize:11,fontWeight:700,transition:"all var(--tr)" }}>{sel?"✓":""}</div>
                  <span style={{ fontSize:12,color:"var(--on-surface)",fontFamily:"monospace",wordBreak:"break-all",flex:1,lineHeight:1.5 }}>{u}</span>
                  <a href={u} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color:"var(--blue)",fontSize:11,flexShrink:0,textDecoration:"none" }}>↗</a>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--outline-variant)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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
