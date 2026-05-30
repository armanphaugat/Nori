import { useState, useEffect, useCallback, useRef } from "react";
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

export default function UploadTab({ guildId, onGoToOverview }) {
  const [docUrls, setDocUrls] = useState("");
  const [websiteUrls, setWebsiteUrls] = useState("");
  const [docFiles, setDocFiles] = useState([]);
  const [imgFiles, setImgFiles] = useState([]);
  const [vidFiles, setVidFiles] = useState([]);
  const [audFiles, setAudFiles] = useState([]);
  const [docUrlUploading, setDocUrlUploading] = useState(false);
  const [websiteUploading, setWebsiteUploading] = useState(false);
  const [sectionUploading, setSectionUploading] = useState({ doc: false, img: false, vid: false, aud: false });
  const [faqText, setFaqText] = useState("");
  const [faqUploading, setFaqUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);

  // Channel messages states
  const [discordChannels, setDiscordChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [timeRange, setTimeRange] = useState("7");
  const [customDays, setCustomDays] = useState(7);
  const [channelMessagesUploading, setChannelMessagesUploading] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [inspectUpload, setInspectUpload] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dragActive, setDragActive] = useState({ doc: false, img: false, vid: false, aud: false });

  const handleDrag = (type, active) => (e) => {
    e.preventDefault();
    setDragActive(p => ({ ...p, [type]: active }));
  };

  const docRef  = useRef(null);
  const imgRef  = useRef(null);
  const vidRef  = useRef(null);
  const audRef  = useRef(null);

  const ALLOWED_EXTENSIONS = {
    doc: [".pdf", ".docx"],
    img: [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"],
    vid: [".mp4"],
    aud: [".mp3", ".wav", ".m4a"],
  };

  const extOf      = (name) => "." + name.split(".").pop().toLowerCase();
  const filterFiles = (list, type) => {
    const filesArray = Array.from(list || []);
    return filesArray.filter(f => ALLOWED_EXTENSIONS[type].includes(extOf(f.name)));
  };
  const handleFilesAdded = (list, setter, type, label) => {
    const selected = Array.from(list || []);
    if (selected.length === 0) return;

    const allowed = selected.filter(f => {
      const ext = extOf(f.name);
      return ALLOWED_EXTENSIONS[type].includes(ext);
    });

    if (allowed.length < selected.length) {
      const rejectedCount = selected.length - allowed.length;
      setStatus({
        ok: false,
        msg: `Rejected ${rejectedCount} file(s). Only ${ALLOWED_EXTENSIONS[type].join(", ")} files are supported in ${label}.`
      });
    } else {
      setStatus(null);
    }

    if (allowed.length > 0) {
      setter(p => [...p, ...allowed]);
    }
  };
  const addFiles   = (setter, type, label) => (e) => { handleFilesAdded(e.target.files, setter, type, label); e.target.value = ""; };
  const dropFiles  = (setter, type, label) => (e) => { e.preventDefault(); handleFilesAdded(e.dataTransfer.files, setter, type, label); };
  const removeFile = (setter, idx) => setter(p => p.filter((_, j) => j !== idx));

  const loadUploads = useCallback(async (id) => {
    if (!id) return;
    setLoadingUploads(true);
    try { const d = await API.getAllUploads(id); setUploads(Array.isArray(d) ? d : d.uploads || []); } catch (_) {}
    setLoadingUploads(false);
  }, []);

  // Auto-load when active guild changes
  useEffect(() => {
    setUploads([]); setStatus(null);
    setSelectedChannelId("");
    setDiscordChannels([]);
    if (guildId) {
      loadUploads(guildId);
      const fetchChannels = async () => {
        setLoadingChannels(true);
        try {
          const dc = await API.getGuildChannels(guildId);
          const categories = dc.categories || [];
          const flatChannels = [];
          categories.forEach(category => {
            category.channels?.forEach(ch => {
              flatChannels.push({
                ...ch,
                categoryName: category.name,
                categoryId: category.id
              });
            });
          });
          setDiscordChannels(flatChannels);
        } catch (e) {
          console.error("Failed to load guild channels:", e);
        } finally {
          setLoadingChannels(false);
        }
      };
      fetchChannels();
    }
  }, [guildId, loadUploads]);

  const doDocUrlUpload = async () => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    const urlList = docUrls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urlList.length) { setStatus({ ok: false, msg: "Add Document URLs first" }); return; }
    setDocUrlUploading(true); setStatus(null);
    try {
      await Promise.all(urlList.map(u => API.uploadUrl(guildId, u)));
      setStatus({ ok: true, msg: `${urlList.length} Document URL(s) ingested successfully` });
      setDocUrls("");
      loadUploads(guildId);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setDocUrlUploading(false);
  };

  const doWebsiteUpload = async () => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    const urlList = websiteUrls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urlList.length) { setStatus({ ok: false, msg: "Add Website URLs first" }); return; }
    setWebsiteUploading(true); setStatus(null);
    try {
      await Promise.all(urlList.map(u => API.uploadWebsite(guildId, u)));
      setStatus({ ok: true, msg: `${urlList.length} Website URL(s) ingested successfully` });
      setWebsiteUrls("");
      loadUploads(guildId);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setWebsiteUploading(false);
  };

  const doSectionUpload = async (type, files, setFiles, label) => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    if (!files.length) { setStatus({ ok: false, msg: `Add ${label} files first` }); return; }
    setSectionUploading(prev => ({ ...prev, [type]: true })); setStatus(null);
    try {
      await Promise.all(files.map(file => API.uploadFile(guildId, file)));
      setStatus({ ok: true, msg: `${files.length} ${label} file(s) ingested successfully` });
      setFiles([]);
      loadUploads(guildId);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setSectionUploading(prev => ({ ...prev, [type]: false }));
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

  const doChannelMessagesUpload = async () => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    if (!selectedChannelId) { setStatus({ ok: false, msg: "Please select a channel first" }); return; }
    const days = timeRange === "custom" ? parseInt(customDays) : parseInt(timeRange);
    if (isNaN(days) || days <= 0) { setStatus({ ok: false, msg: "Please specify a valid number of days" }); return; }

    setChannelMessagesUploading(true); setStatus(null);
    try {
      const res = await API.uploadChannelMessages(guildId, selectedChannelId, days);
      setStatus({ ok: true, msg: res.message || "Channel messages ingested successfully" });
      setSelectedChannelId("");
      loadUploads(guildId);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setChannelMessagesUploading(false);
  };

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

  const FileSection = ({ label, hint, iconName, accentBg, accentColor, files, setFiles, inputRef, accept, type }) => (
    <Card style={{ margin: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={iconName} size={18} style={{ color: accentColor }}/>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{hint}</div>
        </div>
      </div>
      <div className="drop-zone"
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDrag(type, true)}
        onDragEnter={handleDrag(type, true)}
        onDragLeave={handleDrag(type, false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(p => ({ ...p, [type]: false }));
          dropFiles(setFiles, type, label)(e);
        }}
        style={{
          borderColor: dragActive[type] ? "var(--blue)" : undefined,
          background: dragActive[type] ? "rgba(0,176,244,0.06)" : undefined,
          boxShadow: dragActive[type] ? "0 0 24px rgba(0,176,244,0.18)" : undefined,
          transition: "all 0.25s ease"
        }}>
        <Icon name="upload_file" size={36} style={{ color: accentColor, opacity: 0.6 }}/>
        <p style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>Drop files here or <span style={{ color: "var(--blue)", fontWeight: 600 }}>browse</span></p>
      </div>
      <input ref={inputRef} type="file" accept={accept} multiple style={{ display: "none" }} onChange={addFiles(setFiles, type, label)}/>
      {files.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: accentBg, borderRadius: "var(--r-sm)", fontSize: 12, color: accentColor }}>
                <Icon name="insert_drive_file" size={13}/>
                {f.name.length > 22 ? f.name.slice(0, 19) + "…" : f.name}
                <span onClick={(e) => { e.stopPropagation(); removeFile(setFiles, i); }} style={{ cursor: "pointer", opacity: 0.6, fontWeight: 700 }}>✕</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <Btn onClick={() => doSectionUpload(type, files, setFiles, label)} disabled={sectionUploading[type]}
              style={{ flex: 1, justifyContent: "center", background: accentBg, color: accentColor, border: `1px solid ${accentColor}33` }}>
              {sectionUploading[type] ? <><Spinner size={14}/> Ingesting…</> : <><Icon name="cloud_upload" size={16}/> Upload to Vector Store</>}
            </Btn>
            <Btn onClick={() => setFiles([])} disabled={sectionUploading[type]} variant="ghost" style={{ justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
              Clear
            </Btn>
          </div>
        </>
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
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <SectionHeader label="Knowledge Base" title="Upload Content" subtitle="Ingest PDFs, documents, images, audio, video, website crawler feeds, document URLs, and FAQ text into your vector store." />

      {status && <div style={{ marginBottom: 16 }}><StatusBadge {...status}/></div>}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        {/* Document URLs upload */}
        <Card style={{ margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(0, 176, 244, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="link" size={18} style={{ color: "var(--blue)" }}/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Document URLs</div>
              <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>One specific page/doc URL per line</div>
            </div>
          </div>
          <textarea className="kb-input kb-mono" value={docUrls} onChange={e => setDocUrls(e.target.value)} rows={4}
            placeholder={"https://docs.example.com/getting-started\nhttps://yoursite.com/privacy-policy"}
            style={{ resize: "vertical", lineHeight: 1.6, fontFamily: "monospace", fontSize: 13 }}/>
          {docUrls.trim() && (
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <Btn onClick={doDocUrlUpload} disabled={docUrlUploading}
                style={{ flex: 1, justifyContent: "center", background: "rgba(0, 176, 244, 0.08)", color: "var(--blue)", border: "1px solid rgba(0, 176, 244, 0.2)" }}>
                {docUrlUploading ? <><Spinner size={14}/> Ingesting URL(s)…</> : <><Icon name="cloud_upload" size={16}/> Upload to Vector Store</>}
              </Btn>
              <Btn onClick={() => setDocUrls("")} disabled={docUrlUploading} variant="ghost" style={{ justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                Clear
              </Btn>
            </div>
          )}
        </Card>

        {/* Website Auto-Crawler feeds upload */}
        <Card style={{ margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(16, 185, 129, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="language" size={18} style={{ color: "#10b981" }}/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Website Crawler</div>
              <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>One website root URL per line</div>
            </div>
          </div>
          <textarea className="kb-input kb-mono" value={websiteUrls} onChange={e => setWebsiteUrls(e.target.value)} rows={4}
            placeholder={"https://docs.example.com\nhttps://yoursite.com"}
            style={{ resize: "vertical", lineHeight: 1.6, fontFamily: "monospace", fontSize: 13 }}/>
          {websiteUrls.trim() && (
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <Btn onClick={doWebsiteUpload} disabled={websiteUploading}
                style={{ flex: 1, justifyContent: "center", background: "rgba(16, 185, 129, 0.08)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                {websiteUploading ? <><Spinner size={14}/> Starting Crawler…</> : <><Icon name="settings_input_antenna" size={16}/> Crawl Website</>}
              </Btn>
              <Btn onClick={() => setWebsiteUrls("")} disabled={websiteUploading} variant="ghost" style={{ justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                Clear
              </Btn>
            </div>
          )}
        </Card>

        <FileSection label="Documents" hint=".pdf, .docx"                       iconName="description" accentBg="rgba(0, 176, 244, 0.08)"      accentColor="var(--blue)" files={docFiles} setFiles={setDocFiles} inputRef={docRef} accept=".pdf,.docx"            type="doc"/>
        <FileSection label="Images"    hint=".png, .jpg, .jpeg, .tiff, .bmp, .webp" iconName="image"    accentBg="rgba(168,85,247,0.08)"         accentColor="#a855f7"        files={imgFiles} setFiles={setImgFiles} inputRef={imgRef} accept=".png,.jpg,.jpeg,.tiff,.bmp,.webp" type="img"/>
        <FileSection label="Video"     hint=".mp4"                                iconName="videocam"   accentBg="rgba(245,158,11,0.08)"         accentColor="#f59e0b"        files={vidFiles} setFiles={setVidFiles} inputRef={vidRef} accept=".mp4"                    type="vid"/>
        <FileSection label="Audio"     hint=".mp3, .wav, .m4a"                    iconName="headphones" accentBg="rgba(20,184,166,0.08)"         accentColor="#14b8a6"        files={audFiles} setFiles={setAudFiles} inputRef={audRef} accept=".mp3,.wav,.m4a"          type="aud"/>

        {/* FAQ */}
        <Card style={{ margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(239,68,68,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="quiz" size={18} style={{ color: "#ef4444" }}/>
            </div>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>FAQ / Raw Text</div><div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>Paste a Q&A pair or any plain text to add directly to the vector store</div></div>
          </div>
          <textarea className="kb-input kb-mono" value={faqText} onChange={e => setFaqText(e.target.value)} rows={5}
            placeholder={"Q: What are your office hours?\nA: We are open Monday to Friday, 9 AM – 5 PM."}
            style={{ resize: "vertical", lineHeight: 1.6, fontFamily: "monospace", fontSize: 13 }}/>
          <Btn onClick={doFaqUpload} disabled={faqUploading}
            style={{ marginTop: 10, width: "100%", justifyContent: "center", background: "rgba(239,68,68,0.08)", color: "#ff8b8b", border: "1px solid rgba(239,68,68,0.2)" }}>
            {faqUploading ? <><Spinner size={14}/> Adding FAQ…</> : <><Icon name="add_circle" size={16}/> Add to Vector Store</>}
          </Btn>
        </Card>

        {/* Discord Channel Messages */}
        <Card style={{ margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(88, 101, 242, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="forum" size={18} style={{ color: "var(--discord)" }}/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Discord Channel History</div>
              <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>Ingest recent history from a Discord channel</div>
            </div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 6 }}>Target Channel</label>
            {loadingChannels ? (
              <div style={{ fontSize: 13, color: "var(--on-surface-variant)", display: "flex", alignItems: "center", gap: 6, height: 40 }}>
                <Spinner size={14}/> Loading channels...
              </div>
            ) : (
              <select
                className="kb-input"
                value={selectedChannelId}
                onChange={e => setSelectedChannelId(e.target.value)}
                style={{ height: 40, cursor: "pointer" }}
              >
                <option value="">-- Select Channel --</option>
                {(() => {
                  const grouped = {};
                  discordChannels.forEach(ch => {
                    const cat = ch.categoryName || "Text Channels";
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(ch);
                  });
                  return Object.entries(grouped).map(([category, chans]) => (
                    <optgroup key={category} label={category}>
                      {chans.map(ch => (
                        <option key={ch.id} value={ch.id}>
                          #{ch.name}
                        </option>
                      ))}
                    </optgroup>
                  ));
                })()}
              </select>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 6 }}>Timeframe</label>
            <select
              className="kb-input"
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              style={{ height: 40, cursor: "pointer" }}
            >
              <option value="1">Last 24 Hours (1 Day)</option>
              <option value="3">Last 3 Days</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="custom">Custom Timeframe...</option>
            </select>
          </div>

          {timeRange === "custom" && (
            <div style={{ marginBottom: 12, animation: "fadeIn 0.2s ease" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 6 }}>Custom Days</label>
              <input
                type="number"
                className="kb-input"
                min="1"
                value={customDays}
                onChange={e => setCustomDays(e.target.value)}
                placeholder="Enter number of days..."
                style={{ height: 40 }}
              />
            </div>
          )}

          <Btn
            onClick={doChannelMessagesUpload}
            disabled={channelMessagesUploading || !selectedChannelId}
            style={{
              marginTop: 10,
              width: "100%",
              justifyContent: "center",
              background: "rgba(88, 101, 242, 0.08)",
              color: "#9eb5ff",
              border: "1px solid rgba(88, 101, 242, 0.2)"
            }}
          >
            {channelMessagesUploading ? (
              <><Spinner size={14}/> Ingesting Channel History...</>
            ) : (
              <><Icon name="cloud_upload" size={16}/> Ingest Channel History</>
            )}
          </Btn>
        </Card>
      </div>

      {/* Uploads list */}
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
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
                uploads.filter(u => {
                  const name = u.name || u.url || u.filename || u.source || "";
                  const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesType = filterType === "all" || (u.type || "url").toLowerCase() === filterType.toLowerCase();
                  return matchesSearch && matchesType;
                }).map((u, i) => {
                  const displayStatus = (u.status || "completed").toLowerCase();
                  const isIngested = displayStatus === "completed" || displayStatus === "processed" || displayStatus === "ok";
                  const isFailed = displayStatus === "failed" || displayStatus === "error";

                  return (
                    <tr key={i}>
                      <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Icon
                            name={u.type === "pdf" ? "picture_as_pdf" : (u.type === "url" ? "language" : (u.type === "faq" ? "quiz" : (u.type === "text" ? "forum" : "description")))}
                            size={16}
                            style={{ color: "var(--blue)" }}
                          />
                          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#ffffff" }}>{u.name || u.url || u.filename || u.source || "—"}</span>
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
                })
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
