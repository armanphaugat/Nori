import { useState, useEffect } from "react";
import { API, API_BASE } from "../utils/api.js";
import {
  Spinner, StatusBadge, Tag, Btn, Icon,
  Card, SectionHeader, DiscordIcon
} from "./Common.jsx";

export default function ProfileTab({
  user,
  guilds,
  onLogout,
  onGoToOverview,
  onActivate,
  onGuildsChange,
  onTab
}) {
  const [loading, setLoading] = useState(true);
  const [allServers, setAllServers] = useState([]);
  const [configuredServers, setConfiguredServers] = useState([]);
  const [addableServers, setAddableServers] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadServers = async (retries = 3, delay = 1500) => {
    try {
      setLoading(true);
      setErrorStatus(null);
      const res = await API.getEligibleGuilds();

      const configured = res.bot_present || [];
      const addable = res.bot_not_present || [];
      
      setConfiguredServers(configured);
      setAddableServers(addable);
      setAllServers([...configured, ...addable]);
    } catch (e) {
      if (e.message.includes("429") && retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return loadServers(retries - 1, delay * 2);
      }
      setErrorStatus({ ok: false, msg: e.message || "Failed to load servers list" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  const handleCopyId = () => {
    if (user?.discord_id) {
      navigator.clipboard.writeText(user.discord_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSetupBot = async (g) => {
    setAddingId(g.id);
    setErrorStatus(null);
    try {
      await API.addServer(g.id, g.name);
      // Notify parent about new server
      const newServer = { id: g.id, name: g.name, icon: g.icon, config_status: "configured", channel_count: 0 };
      if (onGuildsChange && guilds) {
        onGuildsChange([...guilds, newServer]);
      }
      // Activate the server settings tab
      onActivate(g.id, g);
      if (onTab) onTab("channels");
    } catch (e) {
      setErrorStatus({ ok: false, msg: e.message || "Failed to add bot to server" });
    } finally {
      setAddingId(null);
    }
  };

  const getAvatarUrl = (u) => {
    if (u?.avatar && u?.discord_id) {
      return `https://cdn.discordapp.com/avatars/${u.discord_id}/${u.avatar}.png`;
    }
    if (u?.avatar && u?.id) {
      return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`;
    }
    return null;
  };

  const getServerIconUrl = (id, icon) => {
    if (id && icon) {
      return icon.startsWith("http") ? icon : `https://cdn.discordapp.com/icons/${id}/${icon}.png`;
    }
    return null;
  };

  const handleInviteNewServer = () => {
    window.location.href = `${API_BASE}/auth/invite`;
  };

  const PROFILE_CSS = `
    @keyframes pulse-copied {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.08); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    .profile-card {
      background: white;
      border: 1px solid var(--border2);
      border-radius: var(--r-lg);
      padding: 32px;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      gap: 32px;
      position: relative;
      overflow: hidden;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .profile-avatar-container {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 3px solid var(--accent);
      box-shadow: 0 4px 14px var(--accent-glow);
      flex-shrink: 0;
      overflow: hidden;
      transition: transform var(--tr);
    }
    .profile-avatar-container:hover {
      transform: scale(1.04);
    }
    .profile-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 240px;
    }
    .profile-details-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px 16px;
      margin-top: 12px;
      font-size: 14px;
    }
    .profile-details-label {
      color: var(--slate);
      font-weight: 600;
    }
    .profile-details-value {
      color: var(--navy);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .profile-server-card {
      background: white;
      border: 1.5px solid var(--border);
      border-radius: var(--r-md);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: all var(--tr);
      position: relative;
      cursor: pointer;
    }
    .profile-server-card.configured:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .profile-server-card.addable {
      border-style: dashed;
      cursor: default;
    }
    .profile-server-card.addable:hover {
      border-color: var(--accent);
      background: var(--surface-2);
    }
    .profile-server-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--navy-light);
      border: 1px solid var(--border);
      overflow: hidden;
      color: var(--navy);
      font-weight: 700;
      font-size: 16px;
      font-family: 'Outfit', sans-serif;
    }
    .profile-server-icon.configured {
      border: 2px solid var(--accent);
      background: var(--navy);
      color: white;
    }
  `;

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <style dangerouslySetInnerHTML={{ __html: PROFILE_CSS }} />
      
      <SectionHeader
        label="Account Settings"
        title="My Profile"
        subtitle="Manage your Discord integration, view servers, and active bot instances."
      />

      {errorStatus && <div style={{ marginBottom: 20 }}><StatusBadge {...errorStatus} /></div>}

      {/* User Profile Card */}
      {user && (
        <div className="profile-card">
          <div className="profile-avatar-container">
            {getAvatarUrl(user) ? (
              <img
                src={getAvatarUrl(user)}
                alt={user.username}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%", background: "var(--navy)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, fontWeight: 800, color: "#fff", fontFamily: "'Outfit', sans-serif"
              }}>
                {(user.username || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-info">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: "var(--navy)", margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                {user.username}
              </h3>
              <Tag variant="primary">Server Manager</Tag>
            </div>
            
            <div className="profile-details-grid">
              <span className="profile-details-label">Discord ID:</span>
              <span className="profile-details-value">
                <code>{user.discord_id || user.id}</code>
                <button
                  onClick={handleCopyId}
                  title="Copy ID"
                  style={{
                    background: "none", border: "none", cursor: "pointer", color: copied ? "#22c55e" : "var(--slate)",
                    display: "flex", alignItems: "center", transition: "color 0.2s"
                  }}
                >
                  <Icon name={copied ? "check" : "content_copy"} size={14} />
                  {copied && <span style={{ fontSize: 11, marginLeft: 4, fontWeight: 600 }}>Copied!</span>}
                </button>
              </span>
              
              {user.email && (
                <>
                  <span className="profile-details-label">Email:</span>
                  <span className="profile-details-value">{user.email}</span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <Btn onClick={onGoToOverview} variant="ghost" style={{ fontSize: 13 }}>
              <Icon name="dns" size={15} /> Switch Servers
            </Btn>
            <Btn onClick={onLogout} variant="danger" style={{ fontSize: 13 }}>
              <Icon name="logout" size={15} /> Sign Out
            </Btn>
          </div>
        </div>
      )}

      {/* Servers section */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", margin: 0, fontFamily: "'Outfit', sans-serif" }}>
            Discord Servers & Bot Status
          </h3>
          <Btn onClick={handleInviteNewServer} variant="ghost" style={{ padding: "6px 12px", minHeight: 32, fontSize: 12.5 }}>
            <DiscordIcon size={14} /> <span style={{ marginLeft: 4 }}>Add to New Server</span>
          </Btn>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 16 }}>
            <Spinner size={32} />
            <span style={{ fontSize: 13, color: "var(--muted2)" }}>Retrieving eligible servers...</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            
            {/* Active configured servers */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                Active Servers ({configuredServers.length})
              </div>
              {configuredServers.length === 0 ? (
                <div style={{
                  padding: 24, background: "var(--surface-2)", border: "1px dashed var(--border2)",
                  borderRadius: "var(--r-md)", color: "var(--muted)", fontSize: 13.5, textAlign: "center"
                }}>
                  No active Nori servers found. Use the section below to add the bot to your Discord servers.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {configuredServers.map(s => {
                    const iconUrl = getServerIconUrl(s.id, s.icon);
                    return (
                      <div
                        key={s.id}
                        className="profile-server-card configured"
                        onClick={() => {
                          onActivate(s.id, s);
                          if (onTab) onTab("channels");
                        }}
                        title="Click to manage server settings"
                      >
                        <div className="profile-server-icon configured">
                          {iconUrl ? (
                            <img src={iconUrl} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            s.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {s.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                            <span style={{ fontSize: 11.5, color: "#16a34a", fontWeight: 650 }}>Bot Configured</span>
                          </div>
                        </div>
                        <Icon name="chevron_right" size={16} style={{ color: "var(--slate)" }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Other servers (addable) */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                Available to Setup ({addableServers.length})
              </div>
              {addableServers.length === 0 ? (
                <div style={{
                  padding: 24, background: "var(--surface-2)", border: "1px dashed var(--border2)",
                  borderRadius: "var(--r-md)", color: "var(--muted)", fontSize: 13.5, textAlign: "center"
                }}>
                  No other eligible Discord servers found. Make sure you are an Administrator on the server.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {addableServers.map(s => {
                    const iconUrl = getServerIconUrl(s.id, s.icon);
                    const isAdding = addingId === s.id;
                    return (
                      <div
                        key={s.id}
                        className="profile-server-card addable"
                        style={{ 
                          cursor: "pointer", 
                          opacity: 0.75,
                          filter: "grayscale(70%)",
                          transition: "all var(--tr)"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.filter = "grayscale(0%)"; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = 0.75; e.currentTarget.style.filter = "grayscale(70%)"; }}
                        onClick={() => {
                          window.location.href = `${API_BASE}/auth/invite?guild_id=${s.id}`;
                        }}
                      >
                        <div className="profile-server-icon">
                          {iconUrl ? (
                            <img src={iconUrl} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            s.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 550, color: "var(--navy)", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--slate)", marginTop: 4 }}>
                            Requires bot setup
                          </div>
                        </div>
                        <Btn
                          variant="ghost"
                          style={{
                            padding: "4px 10px", minHeight: 28, fontSize: 11.5,
                            borderColor: "var(--accent-border)", color: "var(--accent-deep)"
                          }}
                        >
                          Invite
                        </Btn>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
