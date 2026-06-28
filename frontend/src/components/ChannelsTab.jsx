import { useState, useEffect, useCallback } from "react";
import { API } from "../utils/api.js";
import {
  Spinner, StatusBadge, Tag, Btn, Icon,
  Card, SectionHeader, NoServerSelected,
} from "./Common.jsx";

const LANGUAGES = [
  { value: "english",    label: "English" },
  { value: "hindi",      label: "Hindi" },
  { value: "german",     label: "German" },
  { value: "chinese",    label: "Chinese" },
  { value: "spanish",    label: "Spanish" },
  { value: "french",     label: "French" },
  { value: "arabic",     label: "Arabic" },
  { value: "portuguese", label: "Portuguese" },
  { value: "japanese",   label: "Japanese" },
  { value: "russian",    label: "Russian" },
];


const ToggleSwitch = ({ checked, onChange, disabled }) => {
  return (
    <label style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      cursor: disabled ? "not-allowed" : "pointer",
      userSelect: "none",
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          border: 0,
        }}
      />
      <div style={{
        position: "relative",
        width: 38,
        height: 20,
        background: checked ? "var(--accent)" : "var(--surface-3)",
        border: "1.5px solid var(--border2)",
        borderRadius: 20,
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        opacity: disabled ? 0.6 : 1,
      }}>
        <div style={{
          position: "absolute",
          top: 1.5,
          left: checked ? 19 : 1.5,
          width: 14,
          height: 14,
          background: "white",
          borderRadius: "50%",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.15)",
          transition: "left 0.2s ease",
        }} />
      </div>
    </label>
  );
};

export default function ChannelsTab({
  guildId, guildName: initialGuildName = "",
  onGoToOverview, isPaused, togglingPause, onTogglePause,
}) {
  const [channels, setChannels]               = useState([]);
  const [modChannel, setModChannel]           = useState(null);
  const [loaded, setLoaded]                   = useState(false);
  const [discordChannels, setDiscordChannels] = useState([]);
  const [status, setStatus]                   = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [searchChanInput, setSearchChanInput] = useState("");
  const [searchModInput, setSearchModInput]   = useState("");
  const [showChanDropdown, setShowChanDropdown] = useState(false);
  const [showModDropdown, setShowModDropdown]   = useState(false);
  const [selectedChansToAdd, setSelectedChansToAdd] = useState([]);
  const [selectedModChanToAdd, setSelectedModChanToAdd] = useState(null);
  const [guildName, setGuildName]             = useState(initialGuildName || "Discord Server");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [supportSetupMode, setSupportSetupMode] = useState("new");
  const [selectedSupportChan, setSelectedSupportChan] = useState("");

  // ── Web Search State ──
  const [webSearchEnabled, setWebSearchEnabled]   = useState(false);
  const [togglingWebSearch, setTogglingWebSearch] = useState(false);

  // ── Channel Config State ──
  const [channelConfigs, setChannelConfigs]       = useState([]);
  const [configStatus, setConfigStatus]           = useState(null);
  const [configLoading, setConfigLoading]         = useState(false);
  const [showAddConfig, setShowAddConfig]         = useState(false);
  const [newConfigChanId, setNewConfigChanId]     = useState("");
  const [newConfigLang, setNewConfigLang]         = useState("english");
  const [newConfigTone, setNewConfigTone]         = useState("professional");
  const [addingConfig, setAddingConfig]           = useState(false);
  const [editingConfigId, setEditingConfigId]     = useState(null);
  const [editLang, setEditLang]                   = useState("");
  const [editTone, setEditTone]                   = useState("");
  const [deletingConfigId, setDeletingConfigId]   = useState(null);

  const handleCreateSupportCategory = async () => {
    if (!guildId) return;
    if (supportSetupMode === "existing" && !selectedSupportChan) {
      setStatus({ ok: false, msg: "Please select an existing channel first!" }); return;
    }
    setCreatingCategory(true); setStatus(null);
    try {
      const res = await API.addSupportCategory(guildId, supportSetupMode === "existing" ? selectedSupportChan : null);
      if (res.status === "success") {
        setStatus({ ok: true, msg: supportSetupMode === "existing"
          ? "Support system configured successfully!"
          : "Support category and ticket channel created!" });
        setSelectedSupportChan(""); await load(guildId);
      } else { setStatus({ ok: false, msg: res.message || "Failed to configure support system" }); }
    } catch (e) { setStatus({ ok: false, msg: e.message || "Failed to configure support system" }); }
    setCreatingCategory(false);
  };

  const load = useCallback(async (id) => {
    if (!id) { setLoaded(false); return; }
    setLoading(true); setStatus(null);
    try {
      const [d, dc, ws] = await Promise.allSettled([
        API.listChannels(id),
        API.getGuildChannels(id),
        API.getWebSearch(id),
      ]);
      if (d.status === "fulfilled") {
        setChannels(d.value.channel_ids || []);
        setModChannel(d.value.mod_channel || null);
        setGuildName(d.value.guild_name || initialGuildName || "Discord Server");
        setLoaded(true);
      }
      if (dc.status === "fulfilled") {
        const flat = [];
        (dc.value.categories || []).forEach(cat =>
          cat.channels?.forEach(ch => flat.push({ ...ch, categoryName: cat.name, categoryId: cat.id }))
        );
        setDiscordChannels(flat);
      }
      if (ws.status === "fulfilled") {
        setWebSearchEnabled(ws.value.on ?? false);
      }
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setLoading(false);
  }, [initialGuildName]);

  const loadChannelConfigs = useCallback(async (id) => {
    if (!id) return;
    setConfigLoading(true); setConfigStatus(null);
    try {
      const res = await API.listAllChannelConfigs(id);
      if (res.status === "success") setChannelConfigs(res.data || []);
    } catch (e) { setConfigStatus({ ok: false, msg: e.message }); }
    setConfigLoading(false);
  }, []);

  useEffect(() => {
    setLoaded(false); setChannels([]); setDiscordChannels([]); setModChannel(null); setStatus(null);
    setSupportSetupMode("new"); setSelectedSupportChan("");
    setGuildName(initialGuildName || "Discord Server");
    setChannelConfigs([]); setConfigStatus(null); setShowAddConfig(false);
    setWebSearchEnabled(false);
    if (guildId) { load(guildId); loadChannelConfigs(guildId); }
  }, [guildId]);

  useEffect(() => {
    if (initialGuildName) {
      setGuildName(initialGuildName);
    }
  }, [initialGuildName]);

  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest('[data-dropdown="channels"]')) setShowChanDropdown(false);
      if (!e.target.closest('[data-dropdown="modchannel"]')) setShowModDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handlePauseClick = () => {
    if (!isPaused) {
      const confirmDeactivate = window.confirm(
        "Warning: Deactivating the bot will stop it from responding to any questions in your Discord server. Are you sure you want to proceed?"
      );
      if (!confirmDeactivate) return;
    }
    onTogglePause();
  };

  const handleToggleWebSearch = async () => {
    if (!guildId) return;
    setTogglingWebSearch(true);
    try {
      await API.updateWebSearch(guildId, !webSearchEnabled);
      setWebSearchEnabled(v => !v);
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    }
    setTogglingWebSearch(false);
  };

  const chanName = (id) => { const f = discordChannels.find(c => c.id === id); return f ? `#${f.name}` : id; };
  const filterChannels    = (q) => discordChannels.filter(c => !channels.includes(c.id) && (c.name.toLowerCase().includes(q.toLowerCase()) || (c.categoryName?.toLowerCase().includes(q.toLowerCase()))));
  const filterModChannels = (q) => discordChannels.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || (c.categoryName?.toLowerCase().includes(q.toLowerCase())));

  const handleSelectChannel    = (id) => setSelectedChansToAdd(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const handleSelectModChannel = (id) => setSelectedModChanToAdd(selectedModChanToAdd === id ? null : id);

  const addChan = async () => {
    if (!guildId || selectedChansToAdd.length === 0) return;
    try {
      for (const cid of selectedChansToAdd) await API.addChannel(guildId, cid);
      setChannels([...channels, ...selectedChansToAdd]);
      setStatus({ ok: true, msg: `${selectedChansToAdd.length} channel${selectedChansToAdd.length > 1 ? "s" : ""} added` });
      setSelectedChansToAdd([]); setSearchChanInput(""); setShowChanDropdown(false);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const removeChan = async (cid) => {
    try {
      await API.deleteChannel(guildId, cid);
      setChannels(channels.filter(c => c !== cid));
      setStatus({ ok: true, msg: "Channel removed" });
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const setMod = async () => {
    if (!guildId || !selectedModChanToAdd) return;
    try {
      await API.addModChannel(guildId, selectedModChanToAdd);
      setModChannel(selectedModChanToAdd);
      setStatus({ ok: true, msg: "Mod channel set" });
      setSelectedModChanToAdd(null); setSearchModInput(""); setShowModDropdown(false);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const removeMod = async () => {
    if (!guildId) return;
    try {
      await API.addModChannel(guildId, "");
      setModChannel(null);
      setStatus({ ok: true, msg: "Mod channel removed" });
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  // ── Channel Config Handlers ──
  const handleAddConfig = async () => {
    if (!guildId || !newConfigChanId) {
      setConfigStatus({ ok: false, msg: "Please select a channel first" }); return;
    }
    setAddingConfig(true); setConfigStatus(null);
    try {
      const res = await API.addChannelConfig(guildId, newConfigChanId, newConfigLang, newConfigTone);
      if (res.status === "success") {
        setConfigStatus({ ok: true, msg: "Channel config added successfully" });
        setShowAddConfig(false); setNewConfigChanId(""); setNewConfigLang("english"); setNewConfigTone("professional");
        await loadChannelConfigs(guildId);
      } else { setConfigStatus({ ok: false, msg: res.message || "Failed to add config" }); }
    } catch (e) { setConfigStatus({ ok: false, msg: e.message }); }
    setAddingConfig(false);
  };

  const handleEditConfig = (cfg) => {
    setEditingConfigId(cfg.channel_id);
    setEditLang(cfg.language);
    setEditTone(cfg.tone);
  };

  const handleUpdateConfig = async (channelId) => {
    setConfigStatus(null);
    try {
      const res = await API.updateChannelConfig(guildId, channelId, editLang, editTone);
      if (res.status === "success") {
        setConfigStatus({ ok: true, msg: "Config updated successfully" });
        setEditingConfigId(null);
        await loadChannelConfigs(guildId);
      } else { setConfigStatus({ ok: false, msg: res.message || "Failed to update config" }); }
    } catch (e) { setConfigStatus({ ok: false, msg: e.message }); }
  };

  const handleDeleteConfig = async (channelId) => {
    setDeletingConfigId(channelId); setConfigStatus(null);
    try {
      const res = await API.deleteChannelConfig(guildId, channelId);
      if (res.status === "success") {
        setConfigStatus({ ok: true, msg: "Config deleted successfully" });
        await loadChannelConfigs(guildId);
      } else { setConfigStatus({ ok: false, msg: res.message || "Failed to delete config" }); }
    } catch (e) { setConfigStatus({ ok: false, msg: e.message }); }
    setDeletingConfigId(null);
  };

  const SelectStyle = {
    height: 36, padding: "0 10px", fontSize: 13,
    background: "var(--surface)", border: "1.5px solid var(--border2)",
    borderRadius: "var(--r-md)", color: "var(--navy)",
    cursor: "pointer", outline: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  const DropdownMenu = ({ list, selected, onSelect, multi }) => {
    const grouped = {};
    list.forEach(c => { const cat = c.categoryName || "Uncategorized"; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(c); });
    return (
      <div style={{
        position: "absolute", top: "100%", left: 0, right: 0,
        background: "var(--surface)", border: "1.5px solid var(--border2)",
        borderTop: "none", borderRadius: "0 0 var(--r-md) var(--r-md)",
        maxHeight: 240, zIndex: 20,
        boxShadow: "0 8px 24px rgba(43,45,66,0.12)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {list.length === 0 ? (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>No channels found</div>
          ) : Object.entries(grouped).map(([cat, chans]) => (
            <div key={cat}>
              <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: ".05em" }}>{cat}</div>
              {chans.map(c => {
                const isSel = multi ? selected.includes(c.id) : selected === c.id;
                return (
                  <div key={c.id} onClick={() => onSelect(c.id)}
                    style={{
                      padding: "8px 16px 8px 28px", fontSize: 13.5, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      background: isSel ? "var(--red-dim)" : "transparent",
                      transition: "background var(--tr)",
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSel ? "var(--red-dim)" : "transparent"; }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `1.5px solid ${isSel ? "var(--accent)" : "var(--border2)"}`,
                      background: isSel ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSel && <Icon name="check" size={11} style={{ color: "#fff" }} />}
                    </div>
                    <span style={{ color: "var(--text)", fontSize: 13 }}>#{c.name}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!guildId) return (
    <div>
      <SectionHeader label="Bot Configuration" title="General Settings" subtitle="Control which Discord channels the bot responds in." />
      <NoServerSelected onGoToOverview={onGoToOverview} />
    </div>
  );

  return (
    <div>
      {/* ── Header row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 28 }}>
        <SectionHeader label="Bot Configuration" title="General Settings" subtitle="Control which Discord channels the bot responds in." />

        {guildId && loaded && (
          <div style={{ display: "flex", gap: 12, flexShrink: 0, marginTop: 4 }}>

            {/* ── Pause / Deactivate Button ── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <button
                onClick={handlePauseClick}
                disabled={togglingPause}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "9px 20px", borderRadius: "var(--r-full)",
                  background: isPaused ? "rgba(16, 185, 129, 0.08)" : "rgba(220, 38, 38, 0.08)",
                  border: isPaused ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(220, 38, 38, 0.3)",
                  cursor: togglingPause ? "not-allowed" : "pointer",
                  transition: "all var(--tr)",
                  fontSize: 13.5, fontWeight: 600,
                  color: isPaused ? "rgb(16, 185, 129)" : "rgb(220, 38, 38)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  opacity: togglingPause ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!togglingPause) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = isPaused ? "0 4px 12px rgba(16, 185, 129, 0.15)" : "0 4px 12px rgba(220, 38, 38, 0.15)"; } }}
                onMouseLeave={e => { if (!togglingPause) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; } }}
              >
                {togglingPause ? (
                  <><Spinner size={14} /><span>Updating…</span></>
                ) : isPaused ? (
                  <><Icon name="play_circle" size={17} style={{ color: "rgb(16, 185, 129)" }} /><span>Activate Bot</span></>
                ) : (
                  <><Icon name="block" size={17} style={{ color: "rgb(220, 38, 38)" }} /><span>Deactivate Bot</span></>
                )}
              </button>
              <span style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                {isPaused ? "Bot is currently inactive" : "Bot is currently active"}
              </span>
            </div>

            {/* ── Web Search Toggle ── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  padding: "9px 20px", borderRadius: "var(--r-full)",
                  background: webSearchEnabled ? "rgba(59,130,246,0.08)" : "var(--surface)",
                  border: `1.5px solid ${webSearchEnabled ? "rgba(59,130,246,0.35)" : "var(--border2)"}`,
                  boxSizing: "border-box",
                  height: 40,
                  transition: "all var(--tr)",
                  fontSize: 13.5, fontWeight: 600,
                  color: webSearchEnabled ? "rgb(37,99,235)" : "var(--muted)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${webSearchEnabled ? "rgba(59,130,246,0.12)" : "rgba(43,45,66,0.08)"}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <Icon
                  name={webSearchEnabled ? "travel_explore" : "search_off"}
                  size={17}
                  style={{ color: webSearchEnabled ? "rgb(37,99,235)" : "var(--muted)" }}
                />
                <span>Web Search</span>
                <ToggleSwitch
                  checked={webSearchEnabled}
                  onChange={handleToggleWebSearch}
                  disabled={togglingWebSearch}
                />
              </div>
              <span style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                {togglingWebSearch ? "Updating…" : webSearchEnabled ? "Web Search is enabled" : "Web Search is disabled"}
              </span>
            </div>



          </div>
        )}
      </div>

      {/* ── Server info banner ── */}
      {guildId && loaded && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 20px",
          background: "var(--surface)", border: "1px solid var(--border2)",
          borderRadius: "var(--r-lg)", marginBottom: 20,
          boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "var(--navy)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name="tag" size={20} style={{ color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 2 }}>{guildName}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Server ID: {guildId}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Tag variant={isPaused ? "warn" : "success"}>
              {isPaused ? "Paused" : "Active"}
            </Tag>
            <Tag variant={webSearchEnabled ? "success" : "neutral"}>
              {webSearchEnabled ? "Web Search On" : "Web Search Off"}
            </Tag>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "16px 0", color: "var(--muted)" }}>
          <Spinner /> Loading channels…
        </div>
      )}

      {!loading && loaded && (
        <>
          {/* ── Two column cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, position: "relative", zIndex: 10 }}>

            {/* Active Bot Channels */}
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--navy)" }}>
                <Icon name="tag" size={17} style={{ color: "var(--accent)" }} /> Active Bot Channels
              </div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5, fontWeight: 300 }}>
                Select the channels where Nori is allowed to respond to user questions. In these channels, users do not need a bot prefix command to ask.
              </p>

              {channels.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, textAlign: "center", padding: "10px 0" }}>
                  No channels configured yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, maxHeight: 140, overflowY: "auto" }}>
                  {channels.map(ch => (
                    <div key={ch} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      background: "var(--surface-2)", border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)",
                    }}>
                      <Icon name="tag" size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {chanName(ch)}
                      </span>
                      <Btn onClick={() => removeChan(ch)} variant="danger" style={{ padding: "2px 6px", fontSize: 11, minHeight: 22, flexShrink: 0 }}>
                        <Icon name="delete" size={12} />
                      </Btn>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, position: "relative" }} data-dropdown="channels">
                <div style={{ flex: 1, position: "relative" }}>
                  <input className="kb-input" type="text" readOnly
                    placeholder={selectedChansToAdd.length > 0 ? `${selectedChansToAdd.length} selected` : "Search channels…"}
                    onFocus={() => setShowChanDropdown(true)}
                    style={{ height: 40, cursor: "pointer" }}
                  />
                  {showChanDropdown && (
                    <DropdownMenu
                      list={filterChannels(searchChanInput)}
                      selected={selectedChansToAdd}
                      onSelect={handleSelectChannel}
                      multi
                    />
                  )}
                </div>
                <Btn onClick={addChan} variant="outline" style={{ flexShrink: 0, minHeight: 40 }} disabled={selectedChansToAdd.length === 0}>
                  <Icon name="add" size={16} />
                </Btn>
              </div>
            </Card>

            {/* Mod / Log Channel */}
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--navy)" }}>
                <Icon name="shield" size={17} style={{ color: "var(--accent)" }} /> Mod / Log Channel
              </div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5, fontWeight: 300 }}>
                Select a staff-only channel where Nori will post logs of unsatisfied responses (thumbs down feedback) and query error alerts.
              </p>

              {modChannel && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 14,
                  background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: "var(--r-md)",
                }}>
                  <Icon name="tag" size={15} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: 13, color: "var(--accent-deep)", fontWeight: 600, flex: 1 }}>{chanName(modChannel)}</span>
                  <Tag variant="warn">Active</Tag>
                  <Btn onClick={removeMod} variant="danger" style={{ padding: "2px 6px", fontSize: 11, minHeight: 22, flexShrink: 0 }}>
                    <Icon name="delete" size={12} />
                  </Btn>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, position: "relative" }} data-dropdown="modchannel">
                <div style={{ flex: 1, position: "relative" }}>
                  <input className="kb-input" type="text" readOnly
                    placeholder="Search mod channels…"
                    onFocus={() => setShowModDropdown(true)}
                    style={{ height: 40, cursor: "pointer" }}
                  />
                  {showModDropdown && (
                    <DropdownMenu
                      list={filterModChannels(searchModInput)}
                      selected={selectedModChanToAdd}
                      onSelect={handleSelectModChannel}
                      multi={false}
                    />
                  )}
                </div>
                <Btn onClick={setMod} variant="outline" style={{ flexShrink: 0, minHeight: 40 }} disabled={!selectedModChanToAdd}>Set</Btn>
              </div>
            </Card>
          </div>

          {/* ── Ticket support card ── */}
          <Card style={{
            background: "var(--red-dim)",
            border: "1px solid var(--red-border)",
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: "var(--navy)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(43,45,66,0.2)", flexShrink: 0,
                }}>
                  <Icon name="confirmation_number" size={24} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--navy)", marginBottom: 2 }}>
                    Automated Ticket & Support System
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, fontWeight: 300 }}>
                    Configure a read-only channel with a ticket widget. Users open private threads, they can't chat directly in the channel.
                  </div>
                </div>
              </div>

              <div style={{
                padding: "18px 20px", background: "rgba(255,255,255,0.55)",
                border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Setup Method</div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {[["new", "Create a dedicated new channel"], ["existing", "Use an existing channel"]].map(([val, label]) => (
                      <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5, color: "var(--navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <input type="radio" name="supportSetupMode" value={val} checked={supportSetupMode === val}
                          onChange={() => setSupportSetupMode(val)}
                          style={{ accentColor: "var(--accent)" }} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {supportSetupMode === "existing" && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Select Target Channel</div>
                    <select className="kb-input" value={selectedSupportChan}
                      onChange={e => setSelectedSupportChan(e.target.value)}
                      style={{ maxWidth: 340, height: 40, padding: "0 12px", cursor: "pointer" }}>
                      <option value="">-- Select Channel --</option>
                      {discordChannels.map(c => (
                        <option key={c.id} value={c.id}>#{c.name} {c.categoryName ? `(${c.categoryName})` : ""}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                  <Btn onClick={handleCreateSupportCategory}
                    disabled={creatingCategory || (supportSetupMode === "existing" && !selectedSupportChan)}
                    variant="primary">
                    {creatingCategory ? (
                      <><Spinner size={15} color="#fff" /><span>Configuring…</span></>
                    ) : (
                      <><Icon name={supportSetupMode === "new" ? "add_box" : "settings"} size={17} />
                        <span>{supportSetupMode === "new" ? "Create Support Category & Channel" : "Setup Support in Selected Channel"}</span></>
                    )}
                  </Btn>
                  <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="info" size={14} style={{ color: "var(--accent)" }} />
                    <span>Channel will be set to read-only automatically.</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {status && <StatusBadge {...status} />}

          {/* ── Channel Language & Tone Config ── */}
          <Card style={{ marginTop: 16 }}>
            {/* Card Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="translate" size={17} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>Channel Language & Tone</span>
                {channelConfigs.length > 0 && (
                  <Tag variant="info">{channelConfigs.length}</Tag>
                )}
              </div>
              <Btn
                variant="outline"
                style={{ fontSize: 12, padding: "5px 12px", minHeight: 32, display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => { setShowAddConfig(v => !v); setConfigStatus(null); }}
              >
                <Icon name={showAddConfig ? "remove" : "add"} size={14} />
                {showAddConfig ? "Cancel" : "Add Config"}
              </Btn>
            </div>

            {/* Add Config Form */}
            {showAddConfig && (
              <div style={{
                padding: "16px", marginBottom: 16,
                background: "var(--surface-2)", border: "1px solid var(--border2)",
                borderRadius: "var(--r-md)",
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 2 }}>New Channel Config</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                  {/* Channel select */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>Channel</div>
                    <select
                      style={{ ...SelectStyle, width: "100%" }}
                      value={newConfigChanId}
                      onChange={e => setNewConfigChanId(e.target.value)}
                    >
                      <option value="">-- Select Channel --</option>
                      {discordChannels.map(c => (
                        <option key={c.id} value={c.id}>#{c.name}{c.categoryName ? ` (${c.categoryName})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  {/* Language select */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>Language</div>
                    <select
                      style={{ ...SelectStyle, width: "100%" }}
                      value={newConfigLang}
                      onChange={e => setNewConfigLang(e.target.value)}
                    >
                      {LANGUAGES.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  {/* Tone input */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>Tone</div>
                    <input
                      type="text"
                      style={{
                        height: 36, padding: "0 10px", fontSize: 13,
                        background: "var(--surface)", border: "1.5px solid var(--border2)",
                        borderRadius: "var(--r-md)", color: "var(--navy)",
                        outline: "none", width: "100%",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                      placeholder="e.g. professional, friendly, casual"
                      maxLength={100}
                      value={newConfigTone}
                      onChange={e => setNewConfigTone(e.target.value)}
                    />
                  </div>
                  {/* Add button */}
                  <Btn
                    variant="primary"
                    style={{ minHeight: 36, padding: "0 16px", fontSize: 13 }}
                    onClick={handleAddConfig}
                    disabled={addingConfig || !newConfigChanId}
                  >
                    {addingConfig ? <Spinner size={13} color="#fff" /> : <><Icon name="add" size={14} /><span>Add</span></>}
                  </Btn>
                </div>
              </div>
            )}

            {/* Config List */}
            {configLoading ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 0", color: "var(--muted)", fontSize: 13 }}>
                <Spinner size={14} /> Loading configs…
              </div>
            ) : channelConfigs.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "18px 0" }}>
                No channel configs yet. Add one above.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {/* Table header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 140px 140px 80px",
                  padding: "6px 12px", gap: 10,
                  fontSize: 11, fontWeight: 700, color: "var(--muted2)",
                  textTransform: "uppercase", letterSpacing: ".05em",
                }}>
                  <span>Channel</span>
                  <span>Language</span>
                  <span>Tone</span>
                  <span>Actions</span>
                </div>

                {channelConfigs.map(cfg => (
                  <div key={cfg.channel_id} style={{
                    display: "grid", gridTemplateColumns: "1fr 140px 140px 80px",
                    alignItems: "center", gap: 10,
                    padding: "10px 12px",
                    background: editingConfigId === cfg.channel_id ? "var(--red-dim)" : "var(--surface-2)",
                    border: `1px solid ${editingConfigId === cfg.channel_id ? "var(--red-border)" : "var(--border)"}`,
                    borderRadius: "var(--r-md)",
                    transition: "all var(--tr)",
                  }}>
                    {/* Channel name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                      <Icon name="tag" size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {chanName(cfg.channel_id)}
                      </span>
                    </div>

                    {/* Language */}
                    {editingConfigId === cfg.channel_id ? (
                      <select style={{ ...SelectStyle, width: "100%" }} value={editLang} onChange={e => setEditLang(e.target.value)}>
                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    ) : (
                      <Tag variant="info" style={{ fontSize: 12 }}>
                        {LANGUAGES.find(l => l.value === cfg.language)?.label || cfg.language}
                      </Tag>
                    )}

                    {/* Tone */}
                    {editingConfigId === cfg.channel_id ? (
                      <input
                        type="text"
                        style={{
                          height: 36, padding: "0 10px", fontSize: 13,
                          background: "var(--surface)", border: "1.5px solid var(--border2)",
                          borderRadius: "var(--r-md)", color: "var(--navy)",
                          outline: "none", width: "100%",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                        maxLength={100}
                        value={editTone}
                        onChange={e => setEditTone(e.target.value)}
                      />
                    ) : (
                      <Tag variant="success" style={{ fontSize: 12 }}>
                        {cfg.tone}
                      </Tag>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6 }}>
                      {editingConfigId === cfg.channel_id ? (
                        <>
                          <Btn variant="primary" style={{ padding: "3px 8px", fontSize: 11, minHeight: 26 }} onClick={() => handleUpdateConfig(cfg.channel_id)}>
                            <Icon name="check" size={12} />
                          </Btn>
                          <Btn variant="outline" style={{ padding: "3px 8px", fontSize: 11, minHeight: 26 }} onClick={() => setEditingConfigId(null)}>
                            <Icon name="close" size={12} />
                          </Btn>
                        </>
                      ) : (
                        <>
                          <Btn variant="outline" style={{ padding: "3px 8px", fontSize: 11, minHeight: 26 }} onClick={() => handleEditConfig(cfg)}>
                            <Icon name="edit" size={12} />
                          </Btn>
                          <Btn variant="danger" style={{ padding: "3px 8px", fontSize: 11, minHeight: 26 }} onClick={() => handleDeleteConfig(cfg.channel_id)} disabled={deletingConfigId === cfg.channel_id}>
                            {deletingConfigId === cfg.channel_id ? <Spinner size={11} /> : <Icon name="delete" size={12} />}
                          </Btn>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {configStatus && <div style={{ marginTop: 12 }}><StatusBadge {...configStatus} /></div>}
          </Card>
        </>
      )}
    </div>
  );
}