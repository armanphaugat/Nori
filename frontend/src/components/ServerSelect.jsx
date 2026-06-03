import { useState, useEffect } from "react";
import { API, API_BASE } from "../utils/api.js";
import { Spinner, StatusBadge, Btn, Icon, DiscordIcon } from "./Common.jsx";

export default function ServerSelect({ user, guilds, discordGuilds, onActivate, onAdd, onLogout }) {
  const [search, setSearch]                   = useState("");
  const [loading, setLoading]                 = useState(false);
  const [configuredServers, setConfiguredServers] = useState(guilds || []);
  const [addableServers, setAddableServers]   = useState(discordGuilds || []);
  const [addingId, setAddingId]               = useState(null);
  const [errorStatus, setErrorStatus]         = useState(null);

  const handleInviteNewServer = () => { window.location.href = `${API_BASE}/auth/invite`; };

  const loadStatuses = async (retries = 3, delay = 1500) => {
  try {
    setLoading(true);
    const res = await API.getEligibleGuilds();
    const g   = res.guilds || [];
    setConfiguredServers(g.filter(x => x.registered).map(x => ({ id: x.id, name: x.name, icon: x.icon })));
    setAddableServers(g.filter(x => !x.registered));
  } catch (e) {
    if (e.message.includes("429") && retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return loadStatuses(retries - 1, delay * 2);
    }
    setErrorStatus({ ok: false, msg: e.message || "Failed to load servers" });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { loadStatuses(); }, []);

  const handleSetupBot = async (g) => {
    setAddingId(g.id); setErrorStatus(null);
    try {
      await API.addServer(g.id, g.name);
      onAdd({ id: g.id, name: g.name, icon: g.icon });
      onActivate(g.id);
    } catch (e) {
      setErrorStatus({ ok: false, msg: e.message || "Failed to add bot to server" });
    } finally {
      setAddingId(null);
    }
  };

  const getAvatarUrl  = (u)    => u?.avatar && u?.id ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : null;
  const getServerIcon = (id, h) => id && h ? (h.startsWith("http") ? h : `https://cdn.discordapp.com/icons/${id}/${h}.png`) : null;

  const filteredConfigured = configuredServers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const filteredAddable    = addableServers.filter(s    => s.name.toLowerCase().includes(search.toLowerCase()));

  const GRID_CSS = `
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
    .vb-server-card {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      width: 116px; text-align: center; cursor: pointer; animation: fadeUp .4s ease both;
    }
    .vb-server-avatar {
      width: 88px; height: 88px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: all .25s cubic-bezier(0.4,0,0.2,1);
      position: relative; overflow: hidden;
    }
    .vb-server-avatar.configured {
      border: 3px solid var(--accent);
      box-shadow: 0 0 0 4px var(--red-dim), 0 4px 16px rgba(43,45,66,0.1);
    }
    .vb-server-avatar.addable {
      border: 2px dashed var(--border2);
      box-shadow: 0 2px 10px rgba(43,45,66,0.07);
      background: var(--surface-2);
    }
    .vb-server-card:hover .vb-server-avatar.configured {
      transform: translateY(-3px) scale(1.04);
      box-shadow: 0 0 0 4px var(--red-dim), 0 12px 28px rgba(239,35,60,0.22);
    }
    .vb-server-card:hover .vb-server-avatar.addable {
      transform: translateY(-3px) scale(1.04);
      border-color: var(--border2);
      box-shadow: 0 8px 20px rgba(43,45,66,0.1);
    }
    .vb-server-label {
      font-size: 13px; font-weight: 500; color: var(--muted);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      width: 100%; transition: color .2s;
      font-family: 'DM Sans', sans-serif;
    }
    .vb-server-card:hover .vb-server-label { color: var(--navy); }
    .vb-server-label.configured { color: var(--navy); font-weight: 600; }

    .vb-search-pill {
      background: var(--surface);
      border: 1.5px solid var(--border2);
      border-radius: 99px; padding: 9px 18px;
      display: flex; align-items: center; gap: 10px;
      width: 100%; max-width: 340px;
      transition: all .2s;
    }
    .vb-search-pill:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--red-dim);
    }

    .water-bg {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      opacity: 0.035; z-index: 0; pointer-events: none;
      background-image:
        linear-gradient(rgba(43,45,66,0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(43,45,66,0.07) 1px, transparent 1px);
      background-size: 44px 44px;
    }
    .bloom-red {
      position: fixed; top: -80px; left: 25%;
      width: 700px; height: 600px; pointer-events: none; z-index: 0;
      background: radial-gradient(circle, rgba(239,35,60,0.06) 0%, transparent 70%);
    }
  `;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      color: "var(--text)",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center",
      position: "relative",
      overflowX: "hidden",
    }}>
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />
      <div className="water-bg" />
      <div className="bloom-red" />

      {/* ── Top Nav ── */}
      <nav style={{
        width: "100%", borderBottom: "1px solid var(--border)",
        background: "rgba(237,242,244,0.92)",
        backdropFilter: "blur(20px)",
        padding: "16px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxSizing: "border-box", zIndex: 10, position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--navy)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(43,45,66,0.25)",
          }}>
            <Icon name="shield_lock" size={16} fill style={{ color: "#fff" }} />
          </div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600, fontSize: 21, color: "var(--navy)",
          }}>VaultBot</span>
        </div>

        {user && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--surface)", border: "1px solid var(--border2)",
            borderRadius: 99, padding: "5px 6px 5px 14px",
          }}>
            {getAvatarUrl(user) ? (
              <img src={getAvatarUrl(user)} alt={user.username}
                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--border2)" }} />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "var(--navy)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#fff",
              }}>
                {user.username.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginRight: 4 }}>
              {user.username}
            </span>
            <span style={{ width: 1, height: 16, background: "var(--border2)" }} />
            <button onClick={onLogout} style={{
              background: "transparent", border: "none",
              color: "var(--muted)", padding: "6px 12px 6px 8px",
              borderRadius: 99, fontSize: 12, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "all var(--tr)", fontFamily: "'DM Sans', sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-deep)"; e.currentTarget.style.background = "var(--red-dim)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name="logout" size={14} /> Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* ── Main card ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "48px 24px 80px",
        width: "100%", position: "relative", zIndex: 1,
      }}>
        <div style={{
          width: "100%", maxWidth: 820,
          background: "var(--surface)",
          border: "1px solid var(--border2)",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(43,45,66,0.12)",
          overflow: "hidden",
          animation: "fadeUp .5s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {/* Card header strip */}
          <div style={{
            background: "var(--navy)", padding: "14px 28px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Icon name="dns" size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
              Server picker
            </span>
          </div>

          <div style={{
            padding: "48px 40px 56px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
          }}>
            {/* Greeting */}
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700, fontSize: "clamp(22px,3.5vw,34px)",
              color: "var(--navy)", textAlign: "center", letterSpacing: "-0.01em",
            }}>
              Hello, <span style={{ color: "var(--accent)" }}>{user?.username || "there"}</span>!
              <br />
              <span style={{ fontSize: "0.72em", fontWeight: 400, color: "var(--muted)" }}>
                Select a server to get started
              </span>
            </h1>

            {errorStatus && (
              <div style={{ width: "100%", maxWidth: 640 }}>
                <StatusBadge {...errorStatus} />
              </div>
            )}

            {/* Search */}
            <div className="vb-search-pill">
              <Icon name="search" size={17} style={{ color: "var(--muted2)" }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Filter servers…"
                style={{
                  background: "transparent", border: "none", outline: "none",
                  color: "var(--text)", fontSize: 14, width: "100%",
                  fontFamily: "'DM Sans', sans-serif",
                }} />
              {search && (
                <span onClick={() => setSearch("")}
                  style={{ cursor: "pointer", color: "var(--muted2)", fontSize: 13, fontWeight: 700 }}>✕</span>
              )}
            </div>

            {/* Invite banner */}
            <div style={{
              width: "100%", maxWidth: 680,
              background: "var(--red-dim)", border: "1px solid var(--red-border)",
              borderRadius: "var(--r-lg)", padding: "18px 22px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 260 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "var(--navy)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, boxShadow: "0 4px 12px rgba(43,45,66,0.2)",
                }}>
                  <DiscordIcon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 2 }}>
                    Add VaultBot to a new server
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4, fontWeight: 300 }}>
                    Invite the bot where you have admin access.
                  </div>
                </div>
              </div>
              <Btn variant="primary" onClick={handleInviteNewServer} style={{ flexShrink: 0 }}>
                <Icon name="add" size={16} /> Invite to Discord
              </Btn>
            </div>

            {/* Server grid */}
            {loading ? (
              <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <Spinner size={24} />
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Syncing Discord servers…</span>
              </div>
            ) : filteredConfigured.length === 0 && filteredAddable.length === 0 ? (
              <div style={{
                padding: "40px", textAlign: "center",
                background: "var(--surface-2)", border: "1px dashed var(--border2)",
                borderRadius: "var(--r-lg)", color: "var(--muted)", fontSize: 14, maxWidth: 420,
              }}>
                <Icon name="sentiment_dissatisfied" size={32} style={{ opacity: .35, marginBottom: 8 }} />
                <div>No servers match your filter.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 28, width: "100%", maxWidth: 680 }}>
                {filteredConfigured.map((server, idx) => {
                  const iconUrl = getServerIcon(server.id, server.icon);
                  return (
                    <div key={server.id} className="vb-server-card"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                      onClick={() => onActivate(server.id)}>
                      <div className="vb-server-avatar configured">
                        {iconUrl ? (
                          <img src={iconUrl} alt={server.name}
                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display',serif" }}>
                            {server.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="vb-server-label configured">{server.name}</div>
                    </div>
                  );
                })}
                {filteredAddable.map((guild, idx) => {
                  const iconUrl     = getServerIcon(guild.id, guild.icon);
                  const isAdding    = addingId === guild.id;
                  return (
                    <div key={guild.id} className="vb-server-card"
                      style={{ animationDelay: `${(filteredConfigured.length + idx) * 0.05}s` }}
                      onClick={() => !isAdding && handleSetupBot(guild)}>
                      <div className="vb-server-avatar addable">
                        {isAdding ? <Spinner size={22} /> : iconUrl ? (
                          <img src={iconUrl} alt={guild.name}
                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", opacity: .75 }} />
                        ) : (
                          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--muted)", fontFamily: "'Playfair Display',serif" }}>
                            {guild.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="vb-server-label">{guild.name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}