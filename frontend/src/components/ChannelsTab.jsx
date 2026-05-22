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

export default function ChannelsTab({ guildId, onGoToOverview }) {
  const [channels, setChannels] = useState([]);
  const [modChannel, setModChannel] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [discordChannels, setDiscordChannels] = useState([]);
  const [newChanId, setNewChanId] = useState("");
  const [newModId, setNewModId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (id) => {
    if (!id) { setLoaded(false); return; }
    setLoading(true); setStatus(null);
    try {
      const [d, dc] = await Promise.allSettled([API.listChannels(id), API.getGuildChannels(id)]);
      if (d.status === "fulfilled")  { setChannels(d.value.channel_ids || []); setModChannel(d.value.mod_channel || null); setLoaded(true); }
      if (dc.status === "fulfilled") setDiscordChannels(dc.value.channels || []);
    } catch (e) { setStatus({ ok: false, msg: e.message }); }
    setLoading(false);
  }, []);

  // Auto-load when active guild changes
  useEffect(() => {
    setLoaded(false); setChannels([]); setDiscordChannels([]); setModChannel(null); setStatus(null);
    if (guildId) load(guildId);
  }, [guildId, load]);

  const chanName = (id) => { const f = discordChannels.find(c => c.id === id); return f ? `#${f.name}` : id; };

  const addChan = async () => {
    if (!guildId || !newChanId.trim()) return;
    try { await API.addChannel(guildId, newChanId.trim()); setStatus({ ok: true, msg: "Channel added" }); setNewChanId(""); load(guildId); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const removeChan = async (cid) => {
    try { await API.deleteChannel(guildId, cid); setStatus({ ok: true, msg: "Channel removed" }); load(guildId); }
    catch (e) { setStatus({ ok: false, msg: e.message }); }
  };

  const setMod = async () => {
    if (!guildId || !newModId.trim()) return;
    try { await API.addModChannel(guildId, newModId.trim()); setStatus({ ok: true, msg: "Mod channel set" }); setNewModId(""); load(guildId); }
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
      <SectionHeader label="Bot Configuration" title="Channel Management" subtitle="Control which Discord channels the bot responds in." />

      {loading && <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", color: "var(--on-surface-variant)" }}><Spinner/> Loading channels…</div>}

      {!loading && loaded && (
        <>
          <Card pad="0" style={{ marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "center", justify: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Active Bot Channels</span>
              <Tag>{channels.length}</Tag>
            </div>
            {channels.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--on-surface-variant)", fontSize: 13.5 }}>No channels configured yet.</div>
            ) : channels.map(ch => (
              <div key={ch} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Icon name="tag" size={16} style={{ color: "var(--blue)", flexShrink: 0 }}/>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: "#fff" }}>{chanName(ch)}</span>
                <Btn onClick={() => removeChan(ch)} variant="danger" style={{ padding: "5px 10px", fontSize: 12, minHeight: 32 }}>
                  <Icon name="delete" size={14}/> Remove
                </Btn>
              </div>
            ))}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--outline-variant)", display: "flex", gap: 10 }}>
              {discordChannels.length > 0 ? (
                <select className="kb-input" value={newChanId} onChange={e => setNewChanId(e.target.value)} style={{ flex: 1, height: 40 }}>
                  <option value="">— select a channel —</option>
                  {discordChannels.filter(c => !channels.includes(c.id)).map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              ) : (
                <input className="kb-input" value={newChanId} onChange={e => setNewChanId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addChan()} placeholder="Channel ID" style={{ flex: 1, height: 40 }}/>
              )}
              <Btn onClick={addChan} variant="outline" style={{ flexShrink: 0, minHeight: 40 }}>
                <Icon name="add" size={16}/> Add
              </Btn>
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
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
            <div style={{ display: "flex", gap: 10 }}>
              {discordChannels.length > 0 ? (
                <select className="kb-input" value={newModId} onChange={e => setNewModId(e.target.value)} style={{ flex: 1, height: 40 }}>
                  <option value="">— select mod channel —</option>
                  {discordChannels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              ) : (
                <input className="kb-input" value={newModId} onChange={e => setNewModId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setMod()} placeholder="Mod channel ID" style={{ flex: 1, height: 40 }}/>
              )}
              <Btn onClick={setMod} variant="outline" style={{ flexShrink: 0, minHeight: 40 }}>Set</Btn>
            </div>
          </Card>

          {status && <StatusBadge {...status}/>}
        </>
      )}
    </div>
  );
}
