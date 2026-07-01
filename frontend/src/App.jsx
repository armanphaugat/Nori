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
import ChatWidget from "./components/ChatWidget.jsx";
import PricingPage from "./components/PricingPage.jsx";
import AnalyticsTab from "./components/AnalyticsTab.jsx";
import DocsTab from "./components/DocsTab.jsx";
import LegalPage from "./components/LegalPage.jsx";
import BillingTab from "./components/BillingTab.jsx";
import ProfileTab from "./components/ProfileTab.jsx";

const BADGE_STYLES = {
  free: {
    bg: "linear-gradient(135deg, #8D99AE 0%, #5a6480 100%)",
    shadow: "rgba(141, 153, 174, 0.25)",
    label: "Free Plan",
    icon: "info"
  },
  starter: {
    bg: "linear-gradient(135deg, #3885dc 0%, #1a5fab 100%)",
    shadow: "rgba(26, 95, 171, 0.25)",
    label: "Starter Plan",
    icon: "verified"
  },

  pro: {
    bg: "linear-gradient(135deg, #3d3f58 0%, var(--navy) 100%)",
    shadow: "rgba(43, 45, 66, 0.25)",
    label: "Pro Plan",
    icon: "verified"
  },
  enterprise: {
    bg: "linear-gradient(135deg, #3d3f58 0%, var(--navy) 100%)",
    shadow: "rgba(43, 45, 66, 0.25)",
    label: "Enterprise Plan",
    icon: "verified"
  },
  paid: {
    bg: "linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%)",
    shadow: "rgba(30,58,138, 0.25)",
    label: "Premium Plan",
    icon: "verified"
  }
};

function Dashboard({ 
  user, 
  guilds, 
  discordGuilds, 
  activeGuildId, 
  onSwitchServer, 
  onActivate,
  onLogout,
  onGuildsChange,
  onShowPricing,
  onShowHome
}) {
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    const validTabs = ["channels", "upload", "sources", "analytics", "billing", "docs", "profile"];
    if (urlTab && validTabs.includes(urlTab)) {
      return urlTab;
    }
    const hash = window.location.hash.replace("#", "");
    if (hash && validTabs.includes(hash)) {
      return hash;
    }
    return null;
  };

  const [tab, setTab] = useState(() => {
    const urlTab = getTabFromUrl();
    if (urlTab) return urlTab;
    return LS.str("wb_active_tab") || "channels";
  });

  const changeTab = (t) => {
    setTab(t);
    LS.strSet("wb_active_tab", t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    url.searchParams.set("page", "dashboard");
    url.searchParams.delete("guild_id"); // never expose guild_id in URL
    window.history.pushState({}, "", url.pathname + url.search + url.hash);
  };

  useEffect(() => {
    const handlePopState = () => {
      const urlTab = getTabFromUrl();
      if (urlTab) {
        setTab(urlTab);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const [activePlan, setActivePlan] = useState("free");

  useEffect(() => {
    if (!activeGuildId) return;
    API.getServerPlan(activeGuildId)
      .then(res => {
        if (res && res.plan) {
          setActivePlan(res.plan);
        } else {
          setActivePlan("free");
        }
      })
      .catch(() => {
        setActivePlan("free");
      });
  }, [activeGuildId]);

  const badge = BADGE_STYLES[activePlan] || BADGE_STYLES.free;
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
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
      if (!e.target.closest('[data-dropdown="profile-select"]')) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const inviteUrl = `${API_BASE}/auth/invite`;
  const activeGuild = guilds.find(g => g.id === activeGuildId) || null;

  const tabLabels = {
    channels: "General Settings",
    upload: "Knowledge Base",
    sources: "Ingested Sources",
    analytics: "Analytics",
    billing: "Billing & Plans",
    docs: "Setup Documentation",
    profile: "My Profile",
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
        onTab={changeTab}
        activeGuild={activeGuild}
        guilds={guilds}
        onActivate={onActivate}
        onSwitchServer={onSwitchServer}
        user={user}
        onLogout={onLogout}
        onShowHome={onShowHome}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* ── Top Header Bar ── */}
        <header style={{ 
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          background: "var(--surface)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          flexShrink: 0,
          zIndex: 150,
          boxShadow: "0 1px 0 var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--navy)", fontFamily: "'Outfit', sans-serif" }}>
              {tabLabels[tab] || "Dashboard"}
            </h1>
            <span style={{ height: 16, width: 1, background: "var(--border2)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[
                { label: "Home", href: "#", onClick: (e) => { e.preventDefault(); onShowHome(); } },
                { label: "Docs", href: "#", onClick: (e) => { e.preventDefault(); changeTab("docs"); } },
                { label: "Invite", href: "https://discord.gg/WrpaytBfN" },
                { label: "Discord", href: activeGuild?.id ? `https://discord.com/channels/${activeGuild.id}` : "https://discord.com" },
              ].map(({ label, href, onClick }) => (
                <a
                  key={label}
                  href={href}
                  onClick={onClick}
                  target={href !== "#" ? "_blank" : undefined}
                  rel={href !== "#" ? "noopener noreferrer" : undefined}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 550, color: "var(--muted)", textDecoration: "none", padding: "4px 10px", borderRadius: "var(--r-sm)", transition: "all var(--tr)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--navy)"; e.currentTarget.style.background = "var(--navy-light)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
                >
                  {label}
                </a>
              ))}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); changeTab("billing"); }}
                style={{ 
                  fontSize: 11, fontWeight: 700, color: "#fff", textDecoration: "none", 
                  display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", 
                  borderRadius: "var(--r-full)", background: badge.bg, 
                  boxShadow: `0 2px 10px ${badge.shadow}`, transition: "all var(--tr)",
                  textTransform: "uppercase", letterSpacing: "0.5px"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 14px ${badge.shadow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 2px 10px ${badge.shadow}`; }}
              >
                <Icon name={badge.icon} size={13} style={{ color: "#fff" }} /> {badge.label}
              </a>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* User Avatar & Dropdown */}
              {user && (
                <div style={{ position: "relative" }} data-dropdown="profile-select">
                  <div
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, borderLeft: "1px solid var(--border)", paddingLeft: 16,
                      cursor: "pointer", userSelect: "none", paddingTop: 4, paddingBottom: 4
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = 0.85; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = 1; }}
                  >
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
                    <Icon name="expand_more" size={14} style={{ color: "var(--navy)", marginLeft: 2, transform: showProfileDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </div>

                  {showProfileDropdown && (
                    <div style={{
                      position: "absolute", top: "100%", right: 0, marginTop: 8,
                      width: 200, background: "var(--surface)",
                      border: "1px solid var(--border2)",
                      borderRadius: "var(--r-md)",
                      boxShadow: "var(--shadow-lg)", zIndex: 200,
                      overflow: "hidden", display: "flex", flexDirection: "column",
                    }}>
                      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                        Logged in as <strong style={{ color: "var(--navy)" }}>{user.username}</strong>
                      </div>
                      
                      <div
                        onClick={() => { changeTab("profile"); setShowProfileDropdown(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "var(--navy)", transition: "background 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--surface-2)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <Icon name="person" size={16} style={{ color: "var(--slate)" }} />
                        <span>My Profile</span>
                      </div>

                      <div
                        onClick={() => { onLogout(); setShowProfileDropdown(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderTop: "1px solid var(--border)", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "var(--accent-deep)", transition: "background 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--accent-dim)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <Icon name="logout" size={16} style={{ color: "var(--accent)" }} />
                        <span>Sign Out</span>
                      </div>
                    </div>
                  )}
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
              <SourcesTab guildId={activeGuildId} onGoToOverview={onSwitchServer} user={user} onTab={changeTab} />
            )}
            {tab === "analytics" && (
              <AnalyticsTab guildId={activeGuildId} onGoToOverview={onSwitchServer} />
            )}
            {tab === "billing" && (
              <BillingTab guildId={activeGuildId} onGoToOverview={onSwitchServer} user={user} />
            )}
            {tab === "docs" && (
              <DocsTab guildId={activeGuildId} onGoToOverview={onSwitchServer} />
            )}
            {tab === "profile" && (
              <ProfileTab
                user={user}
                guilds={guilds}
                onLogout={onLogout}
                onGoToOverview={onSwitchServer}
                onActivate={onActivate}
                onGuildsChange={onGuildsChange}
                onTab={changeTab}
              />
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
            alt="Nori"
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
            No<span style={{ color: "var(--accent)" }}>ri</span>
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
  const getViewFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");
    const validViews = ["landing", "pricing", "servers", "dashboard", "privacy", "terms"];
    if (page && validViews.includes(page)) {
      return page;
    }
    const path = window.location.pathname.replace(/^\/|\/$/g, "");
    if (validViews.includes(path)) {
      return path;
    }
    return null;
  };

  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    const validTabs = ["channels", "upload", "sources", "analytics", "billing", "docs", "profile"];
    if (urlTab && validTabs.includes(urlTab)) {
      return urlTab;
    }
    const hash = window.location.hash.replace("#", "");
    if (hash && validTabs.includes(hash)) {
      return hash;
    }
    return null;
  };

  const [view, setView] = useState(() => {
    const urlView = getViewFromUrl();
    if (urlView) return urlView;
    return "landing";
  });

  const navigateTo = (newView) => {
    setView(newView);
    const url = new URL(window.location.href);
    url.searchParams.set("page", newView);
    url.searchParams.delete("tab");
    url.searchParams.delete("guild_id"); // never add guild_id to URL
    const validViews = ["landing", "pricing", "servers", "dashboard", "privacy", "terms"];
    const path = url.pathname.replace(/^\/|\/$/g, "");
    if (validViews.includes(path)) {
      url.pathname = "/";
    }
    window.history.pushState({}, "", url.pathname + url.search + url.hash);
  };

  const [user, setUser] = useState(LS.get("wb_user", null));
  const [guilds, setGuilds] = useState(LS.get("wb_guilds", []));
  const [discordGuilds, setDiscordGuilds] = useState([]);
  const [booting, setBooting] = useState(true);
  const [activeGuildId, setActiveGuildId] = useState(() => {
    // Read active guild only from localStorage — never expose guild_id in URL
    return LS.str("wb_active_guild") || null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const urlView = getViewFromUrl();
      if (urlView) {
        setView(urlView);
      }
      // guild_id is never in the URL; always read from localStorage
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const params = new URLSearchParams(window.location.search);
    const token = hashParams.get("token") || hashParams.get("access_token") || params.get("token") || params.get("access_token");

    let redirectedGuildId = hashParams.get("guild_id");
    if (redirectedGuildId) {
      localStorage.setItem("pending_guild_redirect", redirectedGuildId);
    } else {
      redirectedGuildId = localStorage.getItem("pending_guild_redirect");
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
                  localStorage.removeItem("pending_guild_redirect");
                } catch (e) {
                  console.error("Auto add server failed:", e);
                }
              }
            }

            setGuilds(finalConfigured);
            LS.set("wb_guilds", finalConfigured);
          } catch (_) {}

          const pendingPlan = localStorage.getItem("pending_checkout_plan");
          if (pendingPlan) {
            const pendingGuild = localStorage.getItem("pending_checkout_guild_id") || activeGuildId || redirectedGuildId;
            localStorage.removeItem("pending_checkout_plan");
            localStorage.removeItem("pending_checkout_guild_id");
            
            const qs = new URLSearchParams();
            if (pendingGuild) qs.append("guild_id", pendingGuild);
            qs.append("plan", pendingPlan);
            window.location.href = `${API_BASE}/patreon/checkout?${qs.toString()}`;
            return;
          }

          if (activated && redirectedGuildId) {
            localStorage.removeItem("pending_guild_redirect");
            handleActivateServer(redirectedGuildId);
          } else {
            const urlView = getViewFromUrl();
            if (urlView) {
              setView(urlView);
            } else {
              setView("landing");
            }
          }
        } catch (_) {
          const urlView = getViewFromUrl();
          if (urlView) {
            setView(urlView);
          } else {
            setView("landing");
          }
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
          const pendingPlan = localStorage.getItem("pending_checkout_plan");
          if (pendingPlan) {
            const pendingGuild = localStorage.getItem("pending_checkout_guild_id") || activeGuildId;
            localStorage.removeItem("pending_checkout_plan");
            localStorage.removeItem("pending_checkout_guild_id");
            
            const qs = new URLSearchParams();
            if (pendingGuild) qs.append("guild_id", pendingGuild);
            qs.append("plan", pendingPlan);
            window.location.href = `${API_BASE}/patreon/checkout?${qs.toString()}`;
            return;
          }

          const urlView = getViewFromUrl();
          if (urlView) {
            setView(urlView);
          } else {
            setView("landing");
          }
        } catch (_) {
          setToken(null);
          LS.rm("wb_user");
        }
      } else if (storedToken && user) {
        try { const { guilds: dg } = await API.getGuilds(); setDiscordGuilds(dg || []); } catch (_) {}
        const pendingPlan = localStorage.getItem("pending_checkout_plan");
        if (pendingPlan) {
          const pendingGuild = localStorage.getItem("pending_checkout_guild_id") || activeGuildId;
          localStorage.removeItem("pending_checkout_plan");
          localStorage.removeItem("pending_checkout_guild_id");
          
          const qs = new URLSearchParams();
          if (pendingGuild) qs.append("guild_id", pendingGuild);
          qs.append("plan", pendingPlan);
          window.location.href = `${API_BASE}/patreon/checkout?${qs.toString()}`;
          return;
        }

        const urlView = getViewFromUrl();
        if (urlView) {
          setView(urlView);
        } else {
          setView("landing");
        }
      }
      setBooting(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view === "dashboard" && !activeGuildId) {
      setView("servers");
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("page", view);
    // Never put guild_id in the URL — kept only in localStorage
    url.searchParams.delete("guild_id");
    if (view !== "dashboard") {
      url.searchParams.delete("tab");
    }
    const validViews = ["landing", "pricing", "servers", "dashboard", "privacy", "terms"];
    const path = url.pathname.replace(/^\/|\/$/g, "");
    if (validViews.includes(path)) {
      url.pathname = "/";
    }
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
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
    LS.rm("wb_active_tab");
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
          onShowDashboard={() => navigateTo("servers")}
          onShowPricing={() => navigateTo("pricing")}
          onShowPrivacy={() => navigateTo("privacy")}
          onShowTerms={() => navigateTo("terms")}
        />
      )}
      {view === "pricing" && (
        <PricingPage
          user={user}
          activeGuildId={activeGuildId}
          onLogin={discordLogin}
          onInvite={discordInvite}
          onShowDashboard={() => navigateTo("servers")}
          onShowPrivacy={() => navigateTo("privacy")}
          onShowTerms={() => navigateTo("terms")}
          onBack={(hash) => {
            navigateTo("landing");
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
          onSwitchServer={() => {
            setActiveGuildId(null);
            LS.rm("wb_active_guild");
            LS.rm("wb_active_tab");
            navigateTo("servers");
          }}
          onActivate={handleActivateServer}
          onLogout={handleLogout}
          onGuildsChange={handleGuildsChange}
          onShowPricing={() => navigateTo("pricing")}
          onShowHome={() => navigateTo("landing")}
        />
      )}
      {(view === "privacy" || view === "terms") && (
        <LegalPage
          type={view}
          onBack={() => navigateTo("landing")}
        />
      )}
    </>
  );
}