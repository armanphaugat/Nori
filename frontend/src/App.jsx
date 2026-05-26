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

// Import modular pages and components
import LandingPage from "./components/LandingPage.jsx";
import ServerSelect from "./components/ServerSelect.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChannelsTab from "./components/ChannelsTab.jsx";
import UploadTab from "./components/UploadTab.jsx";
import UtilsTab from "./components/UtilsTab.jsx";
import ChatWidget from "./components/ChatWidget.jsx";

function Dashboard({ 
  user, 
  guilds, 
  discordGuilds, 
  activeGuildId, 
  onSwitchServer, 
  onLogout 
}) {
  const [tab, setTab] = useState("channels"); // Default to Channels tab as first of 3 tabs

  const inviteUrl = `${API_BASE}/auth/invite`;

  const activeGuild = guilds.find(g => g.id === activeGuildId) || null;

  const tabLabels = {
    channels: "Channel Management",
    upload: "Knowledge Base",
    utils: "Server Utilities"
  };

  const getAvatarUrl = (u) => {
    if (u?.avatar && u?.id) {
      return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`;
    }
    return null;
  };

  const getServerIconUrl = (g) => {
    if (g?.id && g?.icon) {
      return `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`;
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
        {/* Top Header Bar */}
        <header style={{ 
          height: 64, 
          borderBottom: "1px solid rgba(255,255,255,0.06)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "0 32px", 
          background: "rgba(18, 20, 32, 0.7)", 
          backdropFilter: "blur(16px)", 
          WebkitBackdropFilter: "blur(16px)",
          flexShrink: 0, 
          zIndex: 10 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
              {tabLabels[tab] || "Dashboard"}
            </h1>
            <span style={{ height: 16, width: 1, background: "rgba(255,255,255,0.08)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color var(--tr)" }} onMouseEnter={e => e.target.style.color = "#ffffff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}>Docs</a>
              <a href={inviteUrl} style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color var(--tr)" }} onMouseEnter={e => e.target.style.color = "#ffffff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}>Invite</a>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color var(--tr)" }} onMouseEnter={e => e.target.style.color = "#ffffff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}>Discord</a>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color var(--tr)" }} onMouseEnter={e => e.target.style.color = "#ffffff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}>Status</a>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: "var(--blue)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }} onMouseEnter={e => e.target.style.textShadow = "0 0 8px rgba(0,176,244,0.4)"} onMouseLeave={e => e.target.style.textShadow = "none"}>
                <Icon name="verified" size={14} style={{ color: "var(--blue)" }} /> Premium
              </a>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {activeGuild ? (
              <div 
                onClick={onSwitchServer}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "5px 12px", 
                  borderRadius: "var(--r-full)", 
                  background: "rgba(34,197,94,0.06)", 
                  border: "1px solid rgba(34,197,94,0.15)",
                  cursor: "pointer",
                  transition: "all var(--tr)"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,197,94,0.12)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,197,94,0.06)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.15)"; }}
              >
                {getServerIconUrl(activeGuild) ? (
                  <img 
                    src={getServerIconUrl(activeGuild)} 
                    alt={activeGuild.name} 
                    style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} 
                  />
                ) : (
                  <Icon name="dns" size={14} style={{ color: "#22c55e" }} />
                )}
                <span style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>{activeGuild.name}</span>
                <OnlineDot />
              </div>
            ) : (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 6, 
                padding: "5px 12px", 
                borderRadius: "var(--r-full)", 
                background: "rgba(255, 255, 255, 0.03)", 
                border: "1px solid var(--outline-variant)" 
              }}>
                <Icon name="warning" size={14} style={{ color: "var(--on-surface-variant)" }} />
                <span style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>No server selected</span>
              </div>
            )}

            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 16 }}>
                {getAvatarUrl(user) ? (
                  <img
                    src={getAvatarUrl(user)}
                    alt={user.username}
                    style={{ width: 26, height: 26, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--blue) 0%, var(--primary) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 750,
                    color: "#ffffff",
                    boxShadow: "0 0 8px rgba(0, 176, 244, 0.2)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.2)"
                  }} title="User Avatar Fallback">
                    {(user.username || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                  {user.username}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Main Workspace Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
          <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto" }}>
            {tab === "channels" && (
              <ChannelsTab guildId={activeGuildId} onGoToOverview={onSwitchServer} />
            )}
            {tab === "upload" && (
              <UploadTab guildId={activeGuildId} onGoToOverview={onSwitchServer} />
            )}
            {tab === "utils" && (
              <UtilsTab guildId={activeGuildId} onGoToOverview={onSwitchServer} />
            )}
          </div>
        </div>
      </div>

      {/* Floating Chatbot Assistant Widget */}
      <ChatWidget guildId={activeGuild?.id} guildName={activeGuild?.name} />
    </div>
  );
}

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
              API.listServersWithStatus()
            ]);
            const allGuilds = guildsRes.guilds || [];
            const dbServers = statusRes.servers || [];

            setDiscordGuilds(allGuilds);

            const mappedConfigured = dbServers.map(s => {
              const dcGuild = allGuilds.find(g => g.id === s.guild_id);
              return {
                id: s.guild_id,
                name: s.name,
                icon: dcGuild?.icon || null,
                config_status: s.config_status,
                channel_count: s.channel_count,
                has_custom_prompt: s.has_custom_prompt,
              };
            });

            let finalConfigured = mappedConfigured;
            if (redirectedGuildId) {
              const targetGuild = allGuilds.find(g => g.id === redirectedGuildId);
              if (targetGuild) {
                try {
                  await API.addServer(redirectedGuildId, targetGuild.name);
                  const newServer = {
                    id: redirectedGuildId,
                    name: targetGuild.name,
                    icon: targetGuild.icon || null,
                    config_status: "configured",
                    channel_count: 0,
                    has_custom_prompt: false,
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
          try { 
            const { guilds: dg } = await API.getGuilds(); 
            setDiscordGuilds(dg || []); 
          } catch (_) {}
          
          setView("servers");
        } catch (_) { 
          setToken(null); 
          LS.rm("wb_user"); 
        }
      } else if (storedToken && user) {
        try { 
          const { guilds: dg } = await API.getGuilds(); 
          setDiscordGuilds(dg || []); 
        } catch (_) {}
        setView("servers");
      }
      setBooting(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard routing: redirect to server select if in dashboard without selected guild
  useEffect(() => {
    if (view === "dashboard" && !activeGuildId) {
      setView("servers");
    }
  }, [view, activeGuildId]);

  const handleGuildsChange = (updated) => { 
    setGuilds(updated); 
    LS.set("wb_guilds", updated); 
  };

  const handleActivateServer = (id) => {
    setActiveGuildId(id);
    LS.strSet("wb_active_guild", id);
    setView("dashboard");
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

  const discordLogin = () => { 
    window.location.href = `${API_BASE}/auth/discord`; 
  };

  if (booting) {
    return (
      <>
        <GlobalStyles />
        <div style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 50%, rgba(88, 101, 242, 0.08) 0%, rgba(7, 8, 13, 1) 100%)",
          color: "#e3e1ed",
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            animation: "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both"
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(88, 101, 242, 0.3)",
              position: "relative"
            }}>
              <Icon name="hub" fill size={32} style={{ color: "#fff" }} />
              <span style={{
                position: "absolute",
                inset: -4,
                borderRadius: "20px",
                border: "2px solid var(--blue)",
                opacity: 0.5,
                animation: "pulse-dot 2.5s infinite"
              }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "#fff" }}>
                Vault<span style={{ color: "var(--blue)" }}>Bot</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--on-surface-variant)" }}>
                <span>Loading your workspace</span>
                <span className="typing-dot" style={{ animationDelay: "0s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        </div>
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
          onShowDashboard={() => setView("servers")} 
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
          onLogout={handleLogout}
        />
      )}
    </>
  );
}