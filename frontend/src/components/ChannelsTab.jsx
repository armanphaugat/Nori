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

export default function ChannelsTab({ 
  guildId, 
  guildName: initialGuildName = "", 
  onGoToOverview,
  isPaused,
  togglingPause,
  onTogglePause
}) {
  const [channels, setChannels] = useState([]);
  const [modChannel, setModChannel] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [discordChannels, setDiscordChannels] = useState([]); // Flat list of all channels
  const [newChanId, setNewChanId] = useState("");
  const [newModId, setNewModId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchChanInput, setSearchChanInput] = useState(""); // Search for active channels
  const [searchModInput, setSearchModInput] = useState(""); // Search for mod channel
  const [showChanDropdown, setShowChanDropdown] = useState(false);
  const [showModDropdown, setShowModDropdown] = useState(false);
  const [selectedChansToAdd, setSelectedChansToAdd] = useState([]);
  const [selectedModChanToAdd, setSelectedModChanToAdd] = useState(null);
  const [guildName, setGuildName] = useState(initialGuildName || "Discord Server");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [supportSetupMode, setSupportSetupMode] = useState("new"); // 'new' | 'existing'
  const [selectedSupportChan, setSelectedSupportChan] = useState("");

  const handleCreateSupportCategory = async () => {
    if (!guildId) return;
    if (supportSetupMode === "existing" && !selectedSupportChan) {
      setStatus({ ok: false, msg: "Please select an existing channel first!" });
      return;
    }
    setCreatingCategory(true);
    setStatus(null);
    try {
      const res = await API.addSupportCategory(guildId, supportSetupMode === "existing" ? selectedSupportChan : null);
      if (res.status === "success") {
        setStatus({ 
          ok: true, 
          msg: supportSetupMode === "existing"
            ? "Support system configured in the channel successfully! Permissions updated."
            : "Support category and 🎫 ticket channel created successfully! Permissions updated."
        });
        setSelectedSupportChan("");
        await load(guildId);
      } else {
        setStatus({ ok: false, msg: res.message || "Failed to configure support system" });
      }
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Failed to configure support system" });
    } finally {
      setCreatingCategory(false);
    }
  };

  const load = useCallback(async (id) => {
    if (!id) { setLoaded(false); return; }
    setLoading(true); setStatus(null);
    try {
      const [d, dc] = await Promise.allSettled([API.listChannels(id), API.getGuildChannels(id)]);
      if (d.status === "fulfilled")  { 
        setChannels(d.value.channel_ids || []); 
        setModChannel(d.value.mod_channel || null); 
        setGuildName(d.value.guild_name || initialGuildName || "Discord Server");
        setLoaded(true); 
      }
      if (dc.status === "fulfilled") {
        // Flatten the categorized structure into a single list
        const categories = dc.value.categories || [];
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
      }
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setLoading(false);
  }, [initialGuildName]);
 
  // Auto-load when active guild changes
  useEffect(() => {
    setLoaded(false); setChannels([]); setDiscordChannels([]); setModChannel(null); setStatus(null);
    setSupportSetupMode("new"); setSelectedSupportChan("");
    setGuildName(initialGuildName || "Discord Server");
    if (guildId) load(guildId);
  }, [guildId, load, initialGuildName]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-dropdown="channels"]')) setShowChanDropdown(false);
      if (!e.target.closest('[data-dropdown="modchannel"]')) setShowModDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const chanName = (id) => { 
    const f = discordChannels.find(c => c.id === id); 
    return f ? `#${f.name}` : id; 
  };

  const filterChannels = (searchQuery) => {
    return discordChannels.filter(c => 
      !channels.includes(c.id) && (
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.categoryName && c.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
  };

  const filterModChannels = (searchQuery) => {
    return discordChannels.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.categoryName && c.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const handleSelectChannel = (channelId) => {
    setSelectedChansToAdd(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSelectModChannel = (channelId) => {
    setSelectedModChanToAdd(selectedModChanToAdd === channelId ? null : channelId);
  };

  const addChan = async () => {
    if (!guildId || selectedChansToAdd.length === 0) return;
    try { 
      // Add all selected channels
      for (const chanId of selectedChansToAdd) {
        await API.addChannel(guildId, chanId);
      }
      setChannels([...channels, ...selectedChansToAdd]);
      setStatus({ ok: true, msg: `${selectedChansToAdd.length} channel${selectedChansToAdd.length > 1 ? 's' : ''} added` }); 
      setSelectedChansToAdd([]);
      setSearchChanInput("");
      setShowChanDropdown(false);
    }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const removeChan = async (cid) => {
    try { 
      await API.deleteChannel(guildId, cid);
      setChannels(channels.filter(c => c !== cid));
      setStatus({ ok: true, msg: "Channel removed" }); 
    }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const setMod = async () => {
    if (!guildId || !selectedModChanToAdd) return;
    try { 
      await API.addModChannel(guildId, selectedModChanToAdd);
      setModChannel(selectedModChanToAdd);
      setStatus({ ok: true, msg: "Mod channel set" }); 
      setSelectedModChanToAdd(null);
      setSearchModInput("");
      setShowModDropdown(false);
    }
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <SectionHeader label="Bot Configuration" title="Channel Management" subtitle="Control which Discord channels the bot responds in." />
        </div>
        {guildId && loaded && (
          <button
            onClick={onTogglePause}
            disabled={togglingPause}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              borderRadius: "var(--r-full)",
              background: isPaused ? "rgba(239, 68, 68, 0.14)" : "rgba(78, 222, 163, 0.14)",
              border: `1.5px solid ${isPaused ? "rgba(239, 68, 68, 0.45)" : "rgba(78, 222, 163, 0.45)"}`,
              cursor: "pointer",
              transition: "all var(--tr)",
              fontSize: 13.5,
              fontWeight: 700,
              color: isPaused ? "#ff7878" : "#5cf2b4",
              boxShadow: isPaused ? "none" : "0 3px 14px rgba(78, 222, 163, 0.2)",
              userSelect: "none",
              marginTop: 4,
              flexShrink: 0
            }}
            onMouseEnter={e => {
              if (!togglingPause) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.background = isPaused ? "rgba(239, 68, 68, 0.22)" : "rgba(78, 222, 163, 0.22)";
                e.currentTarget.style.borderColor = isPaused ? "rgba(239, 68, 68, 0.65)" : "rgba(78, 222, 163, 0.65)";
                e.currentTarget.style.boxShadow = isPaused ? "0 6px 16px rgba(239, 68, 68, 0.2)" : "0 6px 20px rgba(78, 222, 163, 0.35)";
              }
            }}
            onMouseLeave={e => {
              if (!togglingPause) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = isPaused ? "rgba(239, 68, 68, 0.14)" : "rgba(78, 222, 163, 0.14)";
                e.currentTarget.style.borderColor = isPaused ? "rgba(239, 68, 68, 0.45)" : "rgba(78, 222, 163, 0.45)";
                e.currentTarget.style.boxShadow = isPaused ? "none" : "0 3px 14px rgba(78, 222, 163, 0.2)";
              }
            }}
          >
            {togglingPause ? (
              <>
                <Spinner size={14} color={isPaused ? "#ff7878" : "#5cf2b4"} />
                <span>Updating...</span>
              </>
            ) : isPaused ? (
              <>
                <Icon name="pause_circle" size={18} style={{ color: "#ef4444" }} />
                <span>Bot Paused</span>
              </>
            ) : (
              <>
                <Icon name="play_circle" size={18} style={{ color: "#22c55e" }} />
                <span>Bot Active</span>
              </>
            )}
          </button>
        )}
      </div>

      {guildId && loaded && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: "var(--r-md)",
          marginBottom: 20
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <Icon name="tag" size={20} style={{ color: "#fff" }}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
              {guildName}
            </div>
            <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>
              Server ID: {guildId}
            </div>
          </div>
        </div>
      )}

      {loading && <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", color: "var(--on-surface-variant)" }}><Spinner/> Loading channels…</div>}

      {!loading && loaded && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, position: "relative", zIndex: 10 }}>
            {/* LEFT SIDE - ACTIVE BOT CHANNELS */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Icon name="tag" size={18} style={{ color: "var(--blue)" }}/> Active Bot Channels
              </div>
              
              {channels.length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--on-surface-variant)", marginBottom: 14, textAlign: "center", padding: "12px 0" }}>
                  No channels configured
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, maxHeight: 120, overflowY: "auto" }}>
                  {channels.map(ch => (
                    <div key={ch} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "var(--r-sm)" }}>
                      <Icon name="tag" size={14} style={{ color: "var(--blue)", flexShrink: 0 }}/>
                      <span style={{ fontSize: 13, color: "#fff", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chanName(ch)}</span>
                      <Btn onClick={() => removeChan(ch)} variant="danger" style={{ padding: "3px 6px", fontSize: 10, minHeight: 24, flexShrink: 0 }}>
                        <Icon name="delete" size={12}/>
                      </Btn>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, position: "relative" }} data-dropdown="channels">
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    className="kb-input"
                    type="text"
                    placeholder={selectedChansToAdd.length > 0 ? `${selectedChansToAdd.length} selected` : "Search channels..."}
                    onFocus={() => setShowChanDropdown(true)}
                    readOnly
                    style={{ flex: 1, height: 40, width: "100%", cursor: "pointer" }}
                  />
                  {showChanDropdown && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "var(--surface)",
                      border: "1px solid var(--outline-variant)",
                      borderTop: "none",
                      borderRadius: "0 0 var(--r-md) var(--r-md)",
                      maxHeight: 240,
                      zIndex: 20,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      display: "flex",
                      flexDirection: "column"
                    }}>
                      <div style={{
                        position: "sticky",
                        top: 0,
                        background: "var(--surface)",
                        borderBottom: "1px solid var(--outline-variant)",
                        padding: "8px 12px",
                        zIndex: 21
                      }}>
                        <input
                          type="text"
                          value={searchChanInput}
                          onChange={e => setSearchChanInput(e.target.value)}
                          placeholder="Search channels..."
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            fontSize: 13,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid var(--outline-variant)",
                            borderRadius: "var(--r-sm)",
                            color: "#fff",
                            outline: "none"
                          }}
                          onKeyDown={e => e.stopPropagation()}
                        />
                      </div>
                      <div style={{ overflowY: "auto", flex: 1 }}>
                        {filterChannels(searchChanInput).length === 0 ? (
                          <div style={{ padding: "12px 16px", fontSize: 13.5, color: "var(--on-surface-variant)", textAlign: "center" }}>
                            No channels found
                          </div>
                        ) : (
                          (() => {
                            // Group channels by category
                            const grouped = {};
                            filterChannels(searchChanInput).forEach(c => {
                              const cat = c.categoryName || "Uncategorized";
                              if (!grouped[cat]) grouped[cat] = [];
                              grouped[cat].push(c);
                            });

                            return Object.entries(grouped).map(([category, chans]) => (
                              <div key={category}>
                                <div style={{
                                  padding: "8px 16px 4px 16px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "var(--on-surface-variant)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px"
                                }}>
                                  {category}
                                </div>
                                {chans.map(c => {
                                  const isSelected = selectedChansToAdd.includes(c.id);
                                  return (
                                    <div
                                      key={c.id}
                                      onClick={() => handleSelectChannel(c.id)}
                                      style={{
                                        padding: "8px 16px 8px 32px",
                                        fontSize: 13.5,
                                        cursor: "pointer",
                                        transition: "background-color 0.2s",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        background: isSelected ? "rgba(59,130,246,0.1)" : "transparent"
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"}
                                      onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? "rgba(59,130,246,0.1)" : "transparent"}
                                    >
                                      <div style={{
                                        width: 18,
                                        height: 18,
                                        border: `2px solid ${isSelected ? "var(--blue)" : "var(--outline-variant)"}`,
                                        borderRadius: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: isSelected ? "var(--blue)" : "transparent",
                                        flexShrink: 0
                                      }}>
                                        {isSelected && (
                                          <Icon name="check" size={12} style={{ color: "#fff" }}/>
                                        )}
                                      </div>
                                      <span style={{ flex: 1 }}>#{c.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ));
                          })()
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Btn onClick={addChan} variant="outline" style={{ flexShrink: 0, minHeight: 40 }} disabled={selectedChansToAdd.length === 0}>
                  <Icon name="add" size={16}/>
                </Btn>
              </div>
            </Card>

            {/* RIGHT SIDE - MOD CHANNEL */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Icon name="shield" size={18} style={{ color: "var(--blue)" }}/> Mod / Log Channel
              </div>
              
              {modChannel && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 14, background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: "var(--r-md)" }}>
                  <Icon name="tag" size={16} style={{ color: "#eab308" }}/>
                  <span style={{ fontSize: 13.5, color: "#fef08a", fontWeight: 500, flex: 1 }}>{chanName(modChannel)}</span>
                  <Tag variant="warn">Active</Tag>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, position: "relative" }} data-dropdown="modchannel">
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    className="kb-input"
                    type="text"
                    placeholder="Search mod channels..."
                    onFocus={() => setShowModDropdown(true)}
                    readOnly
                    style={{ flex: 1, height: 40, width: "100%", cursor: "pointer" }}
                  />
                  {showModDropdown && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "var(--surface)",
                      border: "1px solid var(--outline-variant)",
                      borderTop: "none",
                      borderRadius: "0 0 var(--r-md) var(--r-md)",
                      maxHeight: 240,
                      zIndex: 20,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      display: "flex",
                      flexDirection: "column"
                    }}>
                      <div style={{
                        position: "sticky",
                        top: 0,
                        background: "var(--surface)",
                        borderBottom: "1px solid var(--outline-variant)",
                        padding: "8px 12px",
                        zIndex: 21
                      }}>
                        <input
                          type="text"
                          value={searchModInput}
                          onChange={e => setSearchModInput(e.target.value)}
                          placeholder="Search mod channels..."
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            fontSize: 13,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid var(--outline-variant)",
                            borderRadius: "var(--r-sm)",
                            color: "#fff",
                            outline: "none"
                          }}
                          onKeyDown={e => e.stopPropagation()}
                        />
                      </div>
                      <div style={{ overflowY: "auto", flex: 1 }}>
                        {filterModChannels(searchModInput).length === 0 ? (
                          <div style={{ padding: "12px 16px", fontSize: 13.5, color: "var(--on-surface-variant)", textAlign: "center" }}>
                            No channels found
                          </div>
                        ) : (
                          (() => {
                            // Group channels by category
                            const grouped = {};
                            filterModChannels(searchModInput).forEach(c => {
                              const cat = c.categoryName || "Uncategorized";
                              if (!grouped[cat]) grouped[cat] = [];
                              grouped[cat].push(c);
                            });

                            return Object.entries(grouped).map(([category, chans]) => (
                              <div key={category}>
                                <div style={{
                                  padding: "8px 16px 4px 16px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "var(--on-surface-variant)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px"
                                }}>
                                  {category}
                                </div>
                                {chans.map(c => {
                                  const isSelected = selectedModChanToAdd === c.id;
                                  return (
                                    <div
                                      key={c.id}
                                      onClick={() => handleSelectModChannel(c.id)}
                                      style={{
                                        padding: "8px 16px 8px 32px",
                                        fontSize: 13.5,
                                        cursor: "pointer",
                                        transition: "background-color 0.2s",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        background: isSelected ? "rgba(234,179,8,0.1)" : "transparent"
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"}
                                      onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? "rgba(234,179,8,0.1)" : "transparent"}
                                    >
                                      <div style={{
                                        width: 18,
                                        height: 18,
                                        border: `2px solid ${isSelected ? "#eab308" : "var(--outline-variant)"}`,
                                        borderRadius: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: isSelected ? "#eab308" : "transparent",
                                        flexShrink: 0
                                      }}>
                                        {isSelected && (
                                          <Icon name="check" size={12} style={{ color: "#1a1a1a" }}/>
                                        )}
                                      </div>
                                      <span style={{ flex: 1 }}>#{c.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ));
                          })()
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Btn onClick={setMod} variant="outline" style={{ flexShrink: 0, minHeight: 40 }} disabled={!selectedModChanToAdd}>Set</Btn>
              </div>
            </Card>
          </div>          {/* Automated Ticket & Support System Setup */}
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <Card style={{
              background: "linear-gradient(135deg, rgba(88, 101, 242, 0.08) 0%, rgba(78, 222, 163, 0.08) 100%)",
              border: "1px solid rgba(88, 101, 242, 0.2)",
              boxSizing: "border-box"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Header Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", flex: 1, minWidth: 280 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, var(--discord) 0%, var(--secondary) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 14px rgba(88, 101, 242, 0.3)",
                      flexShrink: 0
                    }}>
                      <Icon name="confirmation_number" size={24} style={{ color: "#fff" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
                        Automated Ticket & Support System
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--on-surface-variant)", lineHeight: 1.4 }}>
                        Configure a read-only channel with a 🎫 support ticket generator widget. Users can open private ticket threads, but cannot chat directly in the channel.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection & Options area */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  padding: "16px 20px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "var(--r-md)"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surface-variant)" }}>Setup Method:</div>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5, color: "#fff" }}>
                        <input
                          type="radio"
                          name="supportSetupMode"
                          value="new"
                          checked={supportSetupMode === "new"}
                          onChange={() => setSupportSetupMode("new")}
                          style={{ accentColor: "var(--secondary)" }}
                        />
                        Create a dedicated new channel
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5, color: "#fff" }}>
                        <input
                          type="radio"
                          name="supportSetupMode"
                          value="existing"
                          checked={supportSetupMode === "existing"}
                          onChange={() => setSupportSetupMode("existing")}
                          style={{ accentColor: "var(--secondary)" }}
                        />
                        Use an existing channel
                      </label>
                    </div>
                  </div>

                  {supportSetupMode === "existing" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surface-variant)" }}>Select Target Channel:</div>
                      <select
                        className="kb-input"
                        value={selectedSupportChan}
                        onChange={e => setSelectedSupportChan(e.target.value)}
                        style={{
                          width: "100%",
                          maxWidth: 340,
                          height: 40,
                          padding: "0 12px",
                          fontSize: 13.5,
                          background: "var(--surface)",
                          border: "1px solid var(--outline-variant)",
                          borderRadius: "var(--r-sm)",
                          color: "#fff",
                          outline: "none",
                          cursor: "pointer"
                        }}
                      >
                        <option value="">-- Select Channel --</option>
                        {discordChannels.map(c => (
                          <option key={c.id} value={c.id}>
                            #{c.name} {c.categoryName ? `(${c.categoryName})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                    <Btn
                      onClick={handleCreateSupportCategory}
                      disabled={creatingCategory || (supportSetupMode === "existing" && !selectedSupportChan)}
                      variant="success"
                      style={{ minHeight: 40, padding: "0 20px" }}
                    >
                      {creatingCategory ? (
                        <>
                          <Spinner size={16} color="#fff" />
                          <span>Configuring Support...</span>
                        </>
                      ) : (
                        <>
                          <Icon name={supportSetupMode === "new" ? "add_box" : "settings"} size={18} />
                          <span>{supportSetupMode === "new" ? "Create Support Category & Channel" : "Setup Support in Selected Channel"}</span>
                        </>
                      )}
                    </Btn>

                    <div style={{ fontSize: 12, color: "var(--on-surface-variant)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="info" size={14} style={{ color: "var(--blue)" }} />
                      <span>Note: This channel will be made read-only for normal users automatically.</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          {status && <StatusBadge {...status}/>}
        </>
      )}
    </div>
  );
}