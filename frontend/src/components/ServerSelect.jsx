import { useState, useEffect } from "react";
import { API } from "../utils/api.js";
import { Spinner, StatusBadge, Btn, Icon, Tag } from "./Common.jsx";

export default function ServerSelect({ user, guilds, discordGuilds, onActivate, onAdd, onLogout }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [configuredServers, setConfiguredServers] = useState(guilds || []);
  const [addableServers, setAddableServers] = useState(discordGuilds || []);
  const [addingId, setAddingId] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  // Fetch configured and addable servers from backend
  const loadStatuses = async () => {
  try {
    setLoading(true);
    const res = await API.getEligibleGuilds();
    const guilds = res.guilds || [];

    const configured = guilds
      .filter(g => g.registered)
      .map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
      }));

    const addable = guilds.filter(g => !g.registered);

    setConfiguredServers(configured);
    setAddableServers(addable);
  } catch (e) {
    console.error("Failed to load servers:", e);
    setErrorStatus({ ok: false, msg: e.message || "Failed to load servers" });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadStatuses();
  }, []);

  // Handle instant add bot & activate
  const handleSetupBot = async (g) => {
    setAddingId(g.id);
    setErrorStatus(null);
    try {
      await API.addServer(g.id, g.name);
      // Inform App.jsx of new registered server
      onAdd({ id: g.id, name: g.name, icon: g.icon });
      // Instantly open the dashboard
      onActivate(g.id);
    } catch (e) {
      setErrorStatus({ ok: false, msg: e.message || "Failed to add bot to server" });
    } finally {
      setAddingId(null);
    }
  };

  // Filter lists by search query
  const filteredConfigured = configuredServers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAddable = addableServers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadgeProps = (status) => {
    switch (status) {
      case "configured":
        return { variant: "success", text: "Active" };
      case "partial":
        return { variant: "warn", text: "Partial" };
      case "unconfigured":
        return { variant: "neutral", text: "Unconfigured" };
      default:
        return { variant: "neutral", text: status };
    }
  };

  // Get Discord Avatar or standard placeholder
  const getAvatarUrl = (user) => {
    if (user?.avatar && user?.id) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    return null;
  };

  // Get Discord Server Icon or standard placeholder
  const getServerIconUrl = (guildId, iconHash) => {
    if (guildId && iconHash) {
      if (iconHash.startsWith("http")) return iconHash;
      return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png`;
    }
    return null;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 50% 50%, rgba(88, 101, 242, 0.08) 0%, rgba(7, 8, 13, 1) 100%)",
      color: "#e3e1ed",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      overflowX: "hidden"
    }}>
      {/* Dynamic CSS injections for premium transitions and hover animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .picker-card {
          width: 100%;
          max-width: 820px;
          background: rgba(28, 29, 38, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
          margin: auto;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .picker-header {
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .picker-header-title {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.02em;
          text-transform: capitalize;
        }
        .picker-body {
          padding: 48px 32px 56px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 36px;
        }
        .picker-greeting {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          text-align: center;
          letter-spacing: -0.01em;
        }
        .server-avatar-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justifyContent: center;
          position: relative;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(0, 0, 0, 0.3);
          user-select: none;
        }
        .server-avatar-circle.configured {
          border: 3.5px solid #22c55e;
          box-shadow: 0 0 14px rgba(34, 197, 94, 0.3);
        }
        .server-avatar-circle.addable {
          border: 3.5px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }
        .server-avatar-circle:hover {
          transform: scale(1.1);
        }
        .server-avatar-circle.configured:hover {
          box-shadow: 0 0 24px rgba(34, 197, 94, 0.6), 0 4px 12px rgba(0,0,0,0.5);
          border-color: #26d96a;
        }
        .server-avatar-circle.addable:hover {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0,0,0,0.5);
          border-color: rgba(255, 255, 255, 0.5);
        }
        .server-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 120px;
          text-align: center;
        }
        .server-label {
          font-size: 13.5px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          transition: color 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        .server-item:hover .server-label {
          color: #ffffff;
        }
        .picker-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 32px;
          width: 100%;
          max-width: 680px;
          margin-top: 8px;
        }
        .top-nav {
          width: 100%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(10, 11, 18, 0.6);
          backdrop-filter: blur(12px);
          padding: 16px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-sizing: border-box;
          z-index: 10;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .nav-link {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: #ffffff;
        }
        .search-pill {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 99px;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 320px;
          transition: all 0.25s;
        }
        .search-pill:focus-within {
          border-color: var(--blue);
          box-shadow: 0 0 12px rgba(0, 176, 244, 0.2);
          background: rgba(0, 0, 0, 0.35);
        }
      `}} />

      {/* Top Navbar */}
      <nav className="top-nav">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: "8px",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(88, 101, 242, 0.3)"
          }}>
            <Icon name="hub" size={18} fill style={{ color: "#fff" }} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" }}>
            Vault<span style={{ color: "var(--blue)" }}>Bot</span>
          </span>
        </div>



        {/* User profile / Log out */}
        {user && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "99px",
            padding: "5px 6px 5px 12px",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {getAvatarUrl(user) ? (
                <img
                  src={getAvatarUrl(user)}
                  alt={user.username}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)", objectFit: "cover" }}
                />
              ) : (
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--blue) 0%, var(--primary) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 750,
                  color: "#ffffff",
                  boxShadow: "0 0 10px rgba(0, 176, 244, 0.2)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)"
                }} title="User Avatar Fallback">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginRight: 4 }}>
                {user.username}
              </span>
            </div>
            <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />
            <button
              onClick={onLogout}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                padding: "6px 14px 6px 10px",
                borderRadius: "99px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all var(--tr)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#ffb4ab"; e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name="logout" size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </nav>

      {/* Main Server Picker Content Layout */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "40px 24px 80px", width: "100%" }}>
        
        <div className="picker-card">
          {/* Card Top Strip */}
          <div className="picker-header">
            <Icon name="dns" size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
            <span className="picker-header-title">Server picker</span>
          </div>

          <div className="picker-body">
            {/* Greeting Header */}
            <h1 className="picker-greeting">
              Hello, <span style={{ color: "var(--blue)" }}>{user?.username || "blaze"}</span>! Please select a server to get started
            </h1>

            {/* Error notifications */}
            {errorStatus && (
              <div style={{ width: "100%", maxWidth: 680 }}>
                <StatusBadge {...errorStatus} />
              </div>
            )}

            {/* Search Filter Bar */}
            <div className="search-pill">
              <Icon name="search" size={18} style={{ color: "rgba(255,255,255,0.3)" }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter servers..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 14,
                  width: "100%"
                }}
              />
              {search && (
                <span
                  onClick={() => setSearch("")}
                  style={{ cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700 }}
                >✕</span>
              )}
            </div>

            {/* Configured & Unconfigured Server Row List */}
            {loading ? (
              <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <Spinner size={24} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Syncing Discord servers...</span>
              </div>
            ) : filteredConfigured.length === 0 && filteredAddable.length === 0 ? (
              <div style={{
                padding: "36px",
                textAlign: "center",
                background: "rgba(0,0,0,0.15)",
                border: "1px dashed rgba(255,255,255,0.06)",
                borderRadius: 10,
                color: "rgba(255,255,255,0.4)",
                fontSize: 13.5,
                width: "100%",
                maxWidth: 480
              }}>
                <Icon name="sentiment_dissatisfied" size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>No servers match your filter. Make sure you own or manage a server.</div>
              </div>
            ) : (
              <div className="picker-grid">
                
                {/* 1. Configured Servers First */}
                {filteredConfigured.map(server => {
                  const hasIcon = server.icon !== null;
                  const iconUrl = getServerIconUrl(server.id, server.icon);

                  return (
                    <div key={server.id} className="server-item" onClick={() => onActivate(server.id)}>
                      <div className="server-avatar-circle configured" title={`Manage ${server.name}`}>
                        {hasIcon && iconUrl ? (
                          <img
                            src={iconUrl}
                            alt={server.name}
                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: "#ffffff"
                          }}>
                            {server.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="server-label">{server.name}</div>
                    </div>
                  );
                })}

                {/* 2. Addable Servers Second */}
                {filteredAddable.map(guild => {
                  const hasIcon = guild.icon !== null;
                  const iconUrl = getServerIconUrl(guild.id, guild.icon);
                  const isAdding = addingId === guild.id;

                  return (
                    <div key={guild.id} className="server-item" onClick={() => !isAdding && handleSetupBot(guild)}>
                      <div className="server-avatar-circle addable" title={isAdding ? "Setting up bot..." : `Setup VaultBot in ${guild.name}`}>
                        {isAdding ? (
                          <Spinner size={24} color="#fff" />
                        ) : hasIcon && iconUrl ? (
                          <img
                            src={iconUrl}
                            alt={guild.name}
                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", opacity: 0.8 }}
                          />
                        ) : (
                          <div style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: "rgba(255,255,255,0.7)"
                          }}>
                            {guild.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="server-label" style={{ color: "rgba(255,255,255,0.6)" }}>{guild.name}</div>
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
