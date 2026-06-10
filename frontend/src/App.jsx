import { useState, useEffect } from "react";
import { 
  API, 
  getToken, 
  setToken, 
  LS, 
  API_BASE 
} from "./utils/api.js";
import { 
  GlobalStyles, 
  Icon, 
  OnlineDot, 
  Spinner 
} from "./components/Common.jsx";

import LandingPage from "./components/LandingPage.jsx";
import ServerSelect from "./components/ServerSelect.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChannelsTab from "./components/ChannelsTab.jsx";
import UploadTab from "./components/UploadTab.jsx";
import SourcesTab from "./components/SourcesTab.jsx";
import CrawlerTab from "./components/CrawlerTab.jsx";
import ChatWidget from "./components/ChatWidget.jsx";
import PricingPage from "./components/PricingPage.jsx";
import AnalyticsTab from "./components/AnalyticsTab.jsx";
import DocsTab from "./components/DocsTab.jsx";
function Dashboard({ 
  user, 
  guilds, 
  discordGuilds, 
  activeGuildId, 
  onSwitchServer, 
  onActivate,
  onLogout,
  onGuildsChange,
  onShowPricing
}) {
  const [tab, setTab] = useState("channels");
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);

  const handleTogglePause = async () => {
    const activeGuild = guilds.find(g => g.id === activeGuildId) || null;
    if (!activeGuild) return;
    setTogglingPause(true);
    const nextPauseState = !activeGuild.is_paused;
    try {
      await API.updatePauseStatus(activeGuild.id, nextPauseState);
      const updatedGuilds = guilds.map(g => 
        g.id === activeGuild.id ? { ...g, is_paused: nextPauseState } : g
      );
      if (onGuildsChange) onGuildsChange(updatedGuilds);
    } catch (e) {
      alert("Failed to update bot pause status: " + e.message);
    } finally {
      setTogglingPause(false);
    }
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest('[data-dropdown="server-select"]')) {
        setShowServerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const inviteUrl = `${API_BASE}/auth/invite`;
  const activeGuild = guilds.find(g => g.id === activeGuildId) || null;

  const tabLabels = {
    channels: "Channel Management",
    upload: "Knowledge Base",
    sources: "Ingested Sources",
    analytics: "Analytics",
    utils: "URL Crawler",
    docs: "Setup Documentation",
  };

  const getAvatarUrl = (u) => {
    if (u?.avatar && u?.id) return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`;
    return null;
  };

  const getServerIconUrl = (g) => {
    if (g?.id && g?.icon) {
      return g.icon.startsWith("http") ? g.icon : `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`;
    }
    return null;
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar
        tab={tab}
        onTab={setTab}
        activeGuild={activeGuild}
        onSwitchServer={onSwitchServer}
        user={user}
        onLogout={onLogout}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* ── Top Header Bar ── */}
        <header style={{ 
          height: 64,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          background: "var(--surface)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          flexShrink: 0,
          zIndex: 10,
          boxShadow: "0 1px 0 var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--navy)", fontFamily: "'Outfit', sans-serif" }}>
              {tabLabels[tab] || "Dashboard"}
            </h1>
            <span style={{ height: 16, width: 1, background: "var(--border2)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[
                { label: "Docs", href: "#", onClick: (e) => { e.preventDefault(); setTab("docs"); } },
                { label: "Invite", href: "https://discord.gg/H92wkB4X" },
                { label: "Discord", href: activeGuild?.id ? `https://discord.com/channels/${activeGuild.id}` : "https://discord.com" },
              ].map(({ label, href, onClick }) => (
                <a
                  key={label}
                  href={href}
                  onClick={onClick}
                  target={href !== "#" ? "_blank" : undefined}
                  rel={href !== "#" ? "noopener noreferrer" : undefined}
                  style={{ fontSize: 13, fontWeight: 550, color: "var(--muted)", textDecoration: "none", padding: "4px 10px", borderRadius: "var(--r-sm)", transition: "all var(--tr)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--navy)"; e.currentTarget.style.background = "var(--navy-light)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
                >
                  {label}
                </a>
              ))}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); }}
                style={{ 
                  fontSize: 12, fontWeight: 700, color: "#fff", textDecoration: "none", 
                  display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", 
                  borderRadius: "var(--r-full)", background: "linear-gradient(135deg, var(--accent-deep) 0%, var(--accent) 100%)", 
                  boxShadow: "0 2px 10px rgba(239, 35, 60, 0.25)", transition: "all var(--tr)",
                  textTransform: "uppercase", letterSpacing: "0.5px"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(239, 35, 60, 0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(239, 35, 60, 0.25)"; }}
              >
                <Icon name="verified" size={13} style={{ color: "#fff" }} /> Premium
              </a>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Server Switcher Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }} data-dropdown="server-select">
              {activeGuild ? (
                <>
                  <div
                    onClick={() => setShowServerDropdown(!showServerDropdown)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "5px 12px",
                      borderRadius: "var(--r-full)", background: "var(--navy-light)",
                      border: "1px solid var(--border)", cursor: "pointer",
                      transition: "all var(--tr)", userSelect: "none",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(43,45,66,0.12)"; e.currentTarget.style.borderColor = "rgba(43,45,66,0.25)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--navy-light)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    {getServerIconUrl(activeGuild) ? (
                      <img src={getServerIconUrl(activeGuild)} alt={activeGuild.name} style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <Icon name="dns" size={14} style={{ color: "var(--navy)" }} />
                    )}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)" }}>{activeGuild.name}</span>
                    <Icon name="expand_more" size={14} style={{ color: "var(--navy)", marginLeft: 2, transform: showServerDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </div>

                  {showServerDropdown && (
                    <div style={{
                      position: "absolute", top: "100%", right: 0, marginTop: 8,
                      width: 240, background: "var(--surface)",
                      border: "1px solid var(--border2)",
                      borderRadius: "var(--r-md)",
                      boxShadow: "var(--shadow-lg)", zIndex: 100,
                      overflow: "hidden", display: "flex", flexDirection: "column",
                    }}>
                      <div style={{ padding: "10px 14px", fontSize: 10.5, fontWeight: 700, color: "var(--muted2)", borderBottom: "1px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                        Switch Server
                      </div>
                      <div style={{ maxHeight: 240, overflowY: "auto" }}>
                        {guilds.map(g => {
                          const isSelected = g.id === activeGuildId;
                          return (
                            <div
                              key={g.id}
                              onClick={() => { onActivate(g.id, g); setShowServerDropdown(false); }}
                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSelected ? "var(--red-dim)" : "transparent", transition: "background 0.2s" }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = isSelected ? "var(--red-dim)" : "var(--surface-2)"}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? "var(--red-dim)" : "transparent"}
                            >
                              {getServerIconUrl(g) ? (
                                <img src={getServerIconUrl(g)} alt={g.name} style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                              ) : (
                                <Icon name="dns" size={14} style={{ color: isSelected ? "var(--accent-deep)" : "var(--slate)" }} />
                              )}
                              <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500, color: isSelected ? "var(--accent-deep)" : "var(--navy)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {g.name}
                              </span>
                              {isSelected && <Icon name="check" size={12} style={{ color: "var(--accent)" }} />}
                            </div>
                          );
                        })}
                      </div>
                      <div
                        onClick={() => { onSwitchServer(); setShowServerDropdown(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderTop: "1px solid var(--border)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--accent-deep)", transition: "background 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--red-dim)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <Icon name="dns" size={14} style={{ color: "var(--accent)" }} />
                        <span>Manage Servers...</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: "var(--r-full)", background: "var(--surface-2)", border: "1px solid var(--border2)" }}>
                  <Icon name="warning" size={14} style={{ color: "var(--muted)" }} />
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>No server selected</span>
                </div>
              )}

              {/* User Avatar */}
              {user && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
                  {getAvatarUrl(user) ? (
                    <img src={getAvatarUrl(user)} alt={user.username} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--border2)", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                      {(user.username || "U").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
                    {user.username}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Workspace ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", background: "var(--bg)" }}>
          <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto" }}>
            {tab === "channels" && (
              <ChannelsTab
                guildId={activeGuildId}
                guildName={activeGuild?.name}
                onGoToOverview={onSwitchServer}
                isPaused={activeGuild?.is_paused}
                togglingPause={togglingPause}
                onTogglePause={handleTogglePause}
              />
            )}
            {tab === "upload" && (
              <UploadTab guildId={activeGuildId} onGoToOverview={onSwitchServer} />
            )}
            {tab === "sources" && (
              <SourcesTab guildId={activeGuildId} onGoToOverview={onSwitchServer} user={user} />
            )}
            {tab === "analytics" && (
              <AnalyticsTab guildId={activeGuildId} onGoToOverview={onSwitchServer} />
            )}
            {tab === "utils" && (
              <CrawlerTab guildId={activeGuildId} onGoToOverview={onSwitchServer} />
            )}
            {tab === "docs" && (
              <DocsTab guildId={activeGuildId} onGoToOverview={onSwitchServer} />
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat Assistant */}
      <ChatWidget guildId={activeGuild?.id} guildName={activeGuild?.name} />
    </div>
  );
}

// ── Booting / loading screen ──────────────────────────────────────────────────
function BootScreen() {
  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
        animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {/* Logo mark */}
        <div style={{
          position: "relative", width: 64, height: 64,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img
            src="/LOGO.png"
            alt="VaultBot"
            style={{
              width: "100%", height: "100%",
              objectFit: "contain",
            }}
          />
          <span style={{
            position: "absolute", inset: -4, borderRadius: "50%",
            border: "2px solid var(--accent)", opacity: 0.35,
            animation: "pulse-dot 2.5s infinite",
            pointerEvents: "none",
          }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--navy)" }}>
            Vault<span style={{ color: "var(--accent)" }}>Bot</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
            <span>Loading your workspace</span>
            <span className="typing-dot" style={{ animationDelay: "0s" }} />
            <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
            <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("landing");
  const [user, setUser] = useState(LS.get("wb_user", null));
  const [guilds, setGuilds] = useState(LS.get("wb_guilds", []));
  const [discordGuilds, setDiscordGuilds] = useState([]);
  const [booting, setBooting] = useState(true);
  const [activeGuildId, setActiveGuildId] = useState(LS.str("wb_active_guild") || null);

  useEffect(() => {
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const params = new URLSearchParams(window.location.search);
    const token = hashParams.get("token") || hashParams.get("access_token") || params.get("token") || params.get("access_token");

    let redirectedGuildId = hashParams.get("guild_id") || params.get("guild_id");
    if (redirectedGuildId) {
      sessionStorage.setItem("pending_guild_redirect", redirectedGuildId);
    } else {
      redirectedGuildId = sessionStorage.getItem("pending_guild_redirect");
    }

    (async () => {
      const activeToken = token || getToken();
      if (activeToken) {
        if (token) {
          window.history.replaceState(null, "", window.location.pathname);
          setToken(token);
        }
        try {
          const u = await API.getMe();
          setUser(u);
          LS.set("wb_user", u);

          let activated = false;
          try {
            const [guildsRes, statusRes] = await Promise.all([
              API.getGuilds(),
              API.listServersWithStatus(),
            ]);
            const allGuilds = guildsRes.guilds || [];
            const dbServers = statusRes.servers || [];
            setDiscordGuilds(allGuilds);

            const mappedConfigured = dbServers.map(s => {
              const dcGuild = allGuilds.find(g => g.id === s.guild_id);
              return {
                id: s.guild_id, name: s.name, icon: dcGuild?.icon || null,
                config_status: s.config_status, channel_count: s.channel_count,
                has_custom_prompt: s.has_custom_prompt, is_paused: s.is_paused,
              };
            });

            let finalConfigured = mappedConfigured;
            if (redirectedGuildId) {
              const targetGuild = allGuilds.find(g => g.id === redirectedGuildId);
              if (targetGuild) {
                try {
                  await API.addServer(redirectedGuildId, targetGuild.name);
                  const newServer = {
                    id: redirectedGuildId, name: targetGuild.name,
                    icon: targetGuild.icon || null, config_status: "configured",
                    channel_count: 0, has_custom_prompt: false,
                  };
                  finalConfigured = [...mappedConfigured.filter(g => g.id !== redirectedGuildId), newServer];
                  activated = true;
                  sessionStorage.removeItem("pending_guild_redirect");
                } catch (e) {
                  console.error("Auto add server failed:", e);
                }
              }
            }

            setGuilds(finalConfigured);
            LS.set("wb_guilds", finalConfigured);
          } catch (_) {}

          if (activated && redirectedGuildId) {
            sessionStorage.removeItem("pending_guild_redirect");
            handleActivateServer(redirectedGuildId);
          } else {
            setView("servers");
          }
        } catch (_) {
          setView("servers");
        }
        setBooting(false);
        return;
      }

      const storedToken = getToken();
      if (storedToken && !user) {
        try {
          const u = await API.getMe();
          setUser(u);
          LS.set("wb_user", u);
          try { const { guilds: dg } = await API.getGuilds(); setDiscordGuilds(dg || []); } catch (_) {}
          setView("servers");
        } catch (_) {
          setToken(null);
          LS.rm("wb_user");
        }
      } else if (storedToken && user) {
        try { const { guilds: dg } = await API.getGuilds(); setDiscordGuilds(dg || []); } catch (_) {}
        setView("servers");
      }
      setBooting(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view === "dashboard" && !activeGuildId) setView("servers");
  }, [view, activeGuildId]);

  const handleGuildsChange = (updated) => {
    setGuilds(updated);
    LS.set("wb_guilds", updated);
  };

  const handleActivateServer = async (id, serverObj = null) => {
    setActiveGuildId(id);
    LS.strSet("wb_active_guild", id);

    if (serverObj) {
      const exists = guilds.some(g => g.id === id);
      if (!exists) {
        const tempGuild = {
          id: id,
          name: serverObj.name,
          icon: serverObj.icon,
          config_status: "configured",
          channel_count: 0,
          is_paused: false,
        };
        const updated = [...guilds, tempGuild];
        setGuilds(updated);
        LS.set("wb_guilds", updated);
      }
    }

    setView("dashboard");

    try {
      const [guildsRes, statusRes] = await Promise.all([
        API.getGuilds(),
        API.listServersWithStatus(),
      ]);
      const allGuilds = guildsRes.guilds || [];
      const dbServers = statusRes.servers || [];
      setDiscordGuilds(allGuilds);

      const mappedConfigured = dbServers.map(s => {
        const dcGuild = allGuilds.find(g => g.id === s.guild_id);
        return {
          id: s.guild_id, name: s.name, icon: dcGuild?.icon || null,
          config_status: s.config_status, channel_count: s.channel_count,
          has_custom_prompt: s.has_custom_prompt, is_paused: s.is_paused,
        };
      });
      setGuilds(mappedConfigured);
      LS.set("wb_guilds", mappedConfigured);
    } catch (e) {
      console.error("Error refreshing servers:", e);
    }
  };

  const handleLogout = async () => {
    try { await API.logout(); } catch (_) {}
    setToken(null);
    LS.rm("wb_user");
    LS.rm("wb_guilds");
    LS.rm("wb_active_guild");
    setUser(null);
    setGuilds([]);
    setActiveGuildId(null);
    setView("landing");
  };

  const discordLogin = () => { window.location.href = `${API_BASE}/auth/discord`; };
  const discordInvite = () => { window.location.href = `${API_BASE}/auth/invite`; };

  if (booting) {
    return (
      <>
        <GlobalStyles />
        <BootScreen />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      {view === "landing" && (
        <LandingPage
          user={user}
          onLogin={discordLogin}
          onInvite={discordInvite}
          onShowDashboard={() => setView("servers")}
          onShowPricing={() => setView("pricing")}
        />
      )}
      {view === "pricing" && (
        <PricingPage
          user={user}
          onLogin={discordLogin}
          onInvite={discordInvite}
          onShowDashboard={() => setView("servers")}
          onBack={(hash) => {
            setView("landing");
            if (hash) {
              setTimeout(() => {
                const el = document.getElementById(hash.replace("#", ""));
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }
          }}
        />
      )}
      {view === "servers" && (
        <ServerSelect
          user={user}
          guilds={guilds}
          discordGuilds={discordGuilds}
          onActivate={handleActivateServer}
          onAdd={(newServer) => handleGuildsChange([...guilds, newServer])}
          onLogout={handleLogout}
        />
      )}
      {view === "dashboard" && (
        <Dashboard
          user={user}
          guilds={guilds}
          discordGuilds={discordGuilds}
          activeGuildId={activeGuildId}
          onSwitchServer={() => setView("servers")}
          onActivate={handleActivateServer}
          onLogout={handleLogout}
          onGuildsChange={handleGuildsChange}
          onShowPricing={() => setView("pricing")}
        />
      )}
    </>
  );
}