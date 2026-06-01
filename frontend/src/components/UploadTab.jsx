import { useState, useEffect, useCallback, useRef } from "react";
import { API } from "../utils/api.js";
import {
  Spinner, StatusBadge, Btn, Icon, Card,
  SectionHeader, NoServerSelected,
} from "./Common.jsx";

export default function UploadTab({ guildId, onGoToOverview }) {
  const [docUrls, setDocUrls]   = useState("");
  const [websiteUrls, setWebsiteUrls] = useState("");
  const [docFiles, setDocFiles] = useState([]);
  const [imgFiles, setImgFiles] = useState([]);
  const [vidFiles, setVidFiles] = useState([]);
  const [audFiles, setAudFiles] = useState([]);
  const [docUrlUploading, setDocUrlUploading] = useState(false);
  const [websiteUploading, setWebsiteUploading] = useState(false);
  const [sectionUploading, setSectionUploading] = useState({ doc: false, img: false, vid: false, aud: false });
  const [faqText, setFaqText]       = useState("");
  const [faqUploading, setFaqUploading] = useState(false);
  const [status, setStatus]         = useState(null);
  const [discordChannels, setDiscordChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [timeRange, setTimeRange]   = useState("7");
  const [customDays, setCustomDays] = useState(7);
  const [channelMessagesUploading, setChannelMessagesUploading] = useState(false);
  const [dragActive, setDragActive] = useState({ doc: false, img: false, vid: false, aud: false });

  const docRef = useRef(null); const imgRef = useRef(null);
  const vidRef = useRef(null); const audRef = useRef(null);

  const ALLOWED = {
    doc: [".pdf", ".docx"],
    img: [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"],
    vid: [".mp4"],
    aud: [".mp3", ".wav", ".m4a"],
  };

  const extOf = (name) => "." + name.split(".").pop().toLowerCase();

  const handleFilesAdded = (list, setter, type, label) => {
    const all     = Array.from(list || []);
    const allowed = all.filter(f => ALLOWED[type].includes(extOf(f.name)));
    if (allowed.length < all.length) {
      setStatus({ ok: false, msg: `Rejected ${all.length - allowed.length} file(s). Only ${ALLOWED[type].join(", ")} allowed in ${label}.` });
    } else { setStatus(null); }
    if (allowed.length > 0) setter(p => [...p, ...allowed]);
  };

  const addFiles  = (setter, type, label) => (e) => { handleFilesAdded(e.target.files, setter, type, label); e.target.value = ""; };
  const dropFiles = (setter, type, label) => (e) => { e.preventDefault(); handleFilesAdded(e.dataTransfer.files, setter, type, label); };
  const removeFile = (setter, idx) => setter(p => p.filter((_, j) => j !== idx));
  const handleDrag = (type, active) => (e) => { e.preventDefault(); setDragActive(p => ({ ...p, [type]: active })); };

  useEffect(() => {
    setStatus(null); setSelectedChannelId(""); setDiscordChannels([]);
    if (!guildId) return;
    const fetchChannels = async () => {
      setLoadingChannels(true);
      try {
        const dc = await API.getGuildChannels(guildId);
        const flat = [];
        (dc.categories || []).forEach(cat => cat.channels?.forEach(ch => flat.push({ ...ch, categoryName: cat.name })));
        setDiscordChannels(flat);
      } catch (_) {}
      setLoadingChannels(false);
    };
    fetchChannels();
  }, [guildId]);

  const doDocUrlUpload = async () => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    const urls = docUrls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urls.length) { setStatus({ ok: false, msg: "Add Document URLs first" }); return; }
    setDocUrlUploading(true); setStatus(null);
    try { await Promise.all(urls.map(u => API.uploadUrl(guildId, u))); setStatus({ ok: true, msg: `${urls.length} Document URL(s) ingested` }); setDocUrls(""); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setDocUrlUploading(false);
  };

  const doWebsiteUpload = async () => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    const urls = websiteUrls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urls.length) { setStatus({ ok: false, msg: "Add Website URLs first" }); return; }
    setWebsiteUploading(true); setStatus(null);
    try { await Promise.all(urls.map(u => API.uploadWebsite(guildId, u))); setStatus({ ok: true, msg: `${urls.length} Website URL(s) ingested` }); setWebsiteUrls(""); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setWebsiteUploading(false);
  };

  const doSectionUpload = async (type, files, setFiles, label) => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    if (!files.length) { setStatus({ ok: false, msg: `Add ${label} files first` }); return; }
    setSectionUploading(p => ({ ...p, [type]: true })); setStatus(null);
    try { await Promise.all(files.map(f => API.uploadFile(guildId, f))); setStatus({ ok: true, msg: `${files.length} ${label} file(s) ingested` }); setFiles([]); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setSectionUploading(p => ({ ...p, [type]: false }));
  };

  const doFaqUpload = async () => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    if (!faqText.trim()) { setStatus({ ok: false, msg: "FAQ text cannot be empty" }); return; }
    setFaqUploading(true); setStatus(null);
    try { const d = await API.addFaq(guildId, faqText.trim()); setStatus({ ok: true, msg: d.message || "FAQ added" }); setFaqText(""); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setFaqUploading(false);
  };

  const doChannelMessagesUpload = async () => {
    if (!guildId) { setStatus({ ok: false, msg: "No server selected" }); return; }
    if (!selectedChannelId) { setStatus({ ok: false, msg: "Please select a channel first" }); return; }
    const days = timeRange === "custom" ? parseInt(customDays) : parseInt(timeRange);
    if (isNaN(days) || days <= 0) { setStatus({ ok: false, msg: "Please specify valid number of days" }); return; }
    setChannelMessagesUploading(true); setStatus(null);
    try { const r = await API.uploadChannelMessages(guildId, selectedChannelId, days); setStatus({ ok: true, msg: r.message || "Channel messages ingested" }); setSelectedChannelId(""); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
    setChannelMessagesUploading(false);
  };

  // ── Reusable file section card ──
  const FileSection = ({ label, hint, iconName, accentColor, files, setFiles, inputRef, accept, type }) => (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "var(--r-md)",
          background: "var(--red-dim)", border: "1px solid var(--red-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={iconName} size={19} style={{ color: accentColor }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 300 }}>{hint}</div>
        </div>
      </div>

      <div className="drop-zone"
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDrag(type, true)}
        onDragEnter={handleDrag(type, true)}
        onDragLeave={handleDrag(type, false)}
        onDrop={(e) => { handleDrag(type, false)(e); dropFiles(setFiles, type, label)(e); }}
        style={{
          borderColor: dragActive[type] ? "var(--accent)" : undefined,
          background: dragActive[type] ? "var(--red-dim)" : undefined,
          transition: "all .22s ease",
        }}
      >
        <Icon name="upload_file" size={34} style={{ color: accentColor, opacity: .55 }} />
        <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 300 }}>
          Drop files here or <span style={{ color: "var(--accent)", fontWeight: 600 }}>browse</span>
        </p>
      </div>

      <input ref={inputRef} type="file" accept={accept} multiple style={{ display: "none" }} onChange={addFiles(setFiles, type, label)} />

      {files.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {files.map((f, i) => (
              <div key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 10px",
                background: "var(--surface-2)", border: "1px solid var(--border2)",
                borderRadius: "var(--r-full)", fontSize: 12, color: "var(--navy)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <Icon name="insert_drive_file" size={13} style={{ color: "var(--accent)" }} />
                {f.name.length > 22 ? f.name.slice(0, 19) + "…" : f.name}
                <span onClick={() => removeFile(setFiles, i)} style={{ cursor: "pointer", color: "var(--muted2)", fontWeight: 700, marginLeft: 2 }}>✕</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn onClick={() => doSectionUpload(type, files, setFiles, label)}
              disabled={sectionUploading[type]} variant="primary" style={{ flex: 1, justifyContent: "center" }}>
              {sectionUploading[type] ? <><Spinner size={14} color="#fff" /> Ingesting…</> : <><Icon name="cloud_upload" size={16} /> Upload to Vector Store</>}
            </Btn>
            <Btn onClick={() => setFiles([])} disabled={sectionUploading[type]} variant="ghost">Clear</Btn>
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
      <SectionHeader label="Knowledge Base" title="Upload Content"
        subtitle="Ingest PDFs, images, audio, video, website feeds, document URLs, and FAQ text into your vector store." />

      {status && <div style={{ marginBottom: 16 }}><StatusBadge {...status} /></div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16, marginBottom: 24 }}>

        {/* Document URLs */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: "var(--red-dim)", border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="link" size={19} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Document URLs</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 300 }}>One specific page/doc URL per line</div>
            </div>
          </div>
          <textarea className="kb-input kb-mono" value={docUrls} onChange={e => setDocUrls(e.target.value)} rows={4}
            placeholder={"https://docs.example.com/getting-started\nhttps://yoursite.com/privacy-policy"}
            style={{ resize: "vertical", lineHeight: 1.6 }} />
          {docUrls.trim() && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Btn onClick={doDocUrlUpload} disabled={docUrlUploading} variant="primary" style={{ flex: 1, justifyContent: "center" }}>
                {docUrlUploading ? <><Spinner size={14} color="#fff" /> Ingesting…</> : <><Icon name="cloud_upload" size={16} /> Upload to Vector Store</>}
              </Btn>
              <Btn onClick={() => setDocUrls("")} disabled={docUrlUploading} variant="ghost">Clear</Btn>
            </div>
          )}
        </Card>

        {/* Website Crawler */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: "var(--red-dim)", border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="language" size={19} style={{ color: "var(--accent-deep)" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Website Crawler</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 300 }}>One website root URL per line</div>
            </div>
          </div>
          <textarea className="kb-input kb-mono" value={websiteUrls} onChange={e => setWebsiteUrls(e.target.value)} rows={4}
            placeholder={"https://docs.example.com\nhttps://yoursite.com"}
            style={{ resize: "vertical", lineHeight: 1.6 }} />
          {websiteUrls.trim() && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Btn onClick={doWebsiteUpload} disabled={websiteUploading} variant="primary" style={{ flex: 1, justifyContent: "center" }}>
                {websiteUploading ? <><Spinner size={14} color="#fff" /> Starting Crawler…</> : <><Icon name="settings_input_antenna" size={16} /> Crawl Website</>}
              </Btn>
              <Btn onClick={() => setWebsiteUrls("")} disabled={websiteUploading} variant="ghost">Clear</Btn>
            </div>
          )}
        </Card>

        <FileSection label="Documents" hint=".pdf, .docx"                            iconName="description" accentColor="var(--accent)"       files={docFiles} setFiles={setDocFiles} inputRef={docRef} accept=".pdf,.docx"                    type="doc" />
        <FileSection label="Images"    hint=".png, .jpg, .jpeg, .tiff, .bmp, .webp"  iconName="image"       accentColor="var(--accent-deep)"   files={imgFiles} setFiles={setImgFiles} inputRef={imgRef} accept=".png,.jpg,.jpeg,.tiff,.bmp,.webp" type="img" />
        <FileSection label="Video"     hint=".mp4"                                   iconName="videocam"    accentColor="var(--slate)"         files={vidFiles} setFiles={setVidFiles} inputRef={vidRef} accept=".mp4"                            type="vid" />
        <FileSection label="Audio"     hint=".mp3, .wav, .m4a"                       iconName="headphones"  accentColor="var(--navy-mid)"      files={audFiles} setFiles={setAudFiles} inputRef={audRef} accept=".mp3,.wav,.m4a"                  type="aud" />

        {/* FAQ */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: "var(--red-dim)", border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="quiz" size={19} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>FAQ / Raw Text</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 300 }}>Paste a Q&A pair or plain text</div>
            </div>
          </div>
          <textarea className="kb-input kb-mono" value={faqText} onChange={e => setFaqText(e.target.value)} rows={5}
            placeholder={"Q: What are your office hours?\nA: We are open Monday to Friday, 9 AM – 5 PM."}
            style={{ resize: "vertical", lineHeight: 1.6 }} />
          <Btn onClick={doFaqUpload} disabled={faqUploading} variant="primary"
            style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>
            {faqUploading ? <><Spinner size={14} color="#fff" /> Adding FAQ…</> : <><Icon name="add_circle" size={16} /> Add to Vector Store</>}
          </Btn>
        </Card>

        {/* Discord Channel History */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: "var(--red-dim)", border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="forum" size={19} style={{ color: "var(--accent-deep)" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Discord Channel History</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 300 }}>Ingest recent messages from a channel</div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Target Channel</label>
            {loadingChannels ? (
              <div style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, height: 40 }}>
                <Spinner size={14} /> Loading channels…
              </div>
            ) : (
              <select className="kb-input" value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)} style={{ height: 40, cursor: "pointer" }}>
                <option value="">-- Select Channel --</option>
                {(() => {
                  const grouped = {};
                  discordChannels.forEach(ch => { const cat = ch.categoryName || "Text Channels"; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(ch); });
                  return Object.entries(grouped).map(([cat, chans]) => (
                    <optgroup key={cat} label={cat}>
                      {chans.map(ch => <option key={ch.id} value={ch.id}>#{ch.name}</option>)}
                    </optgroup>
                  ));
                })()}
              </select>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Timeframe</label>
            <select className="kb-input" value={timeRange} onChange={e => setTimeRange(e.target.value)} style={{ height: 40, cursor: "pointer" }}>
              <option value="1">Last 24 Hours</option>
              <option value="3">Last 3 Days</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="custom">Custom…</option>
            </select>
          </div>

          {timeRange === "custom" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Custom Days</label>
              <input type="number" className="kb-input" min="1" value={customDays}
                onChange={e => setCustomDays(e.target.value)} style={{ height: 40 }} />
            </div>
          )}

          <Btn onClick={doChannelMessagesUpload} disabled={channelMessagesUploading || !selectedChannelId}
            variant="primary" style={{ marginTop: 8, width: "100%", justifyContent: "center" }}>
            {channelMessagesUploading ? <><Spinner size={14} color="#fff" /> Ingesting…</> : <><Icon name="cloud_upload" size={16} /> Ingest Channel History</>}
          </Btn>
        </Card>
      </div>
    </div>
  );
}