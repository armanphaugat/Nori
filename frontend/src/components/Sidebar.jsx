import { Icon, OnlineDot } from "./Common.jsx";

export default function Sidebar({ tab, onTab, activeGuild, onSwitchServer, user, onLogout }) {
  const NAV_GROUPS = [
    {
      title: "Settings",
      items: [
        { id: "channels", label: "Channels", icon: "forum" },
        { id: "upload", label: "Knowledge Base", icon: "storage" },
        { id: "sources", label: "Ingested Sources", icon: "folder_open" },
      ]
    },
    {
      title: "Utility",
      items: [
        { id: "utils", label: "URL Crawler", icon: "travel_explore" },
      ]
    }
  ];

  // Get Discord Server Icon or initials placeholder
  const getServerIconUrl = (guild) => {
    if (guild?.id && guild?.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
    }
    return null;
  };

  const serverIconUrl = getServerIconUrl(activeGuild);

  return (
    <aside style={{
      width: 250,
      flexShrink: 0,
      background: "#1e1f22",
      borderRight: "1px solid rgba(255,255,255,0.05)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      padding: "16px 12px",
      gap: 4,
      boxSizing: "border-box"
    }}>
      {/* ── Switch Server Back Navigation ── */}
      <button
        onClick={onSwitchServer}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: "6px",
          border: "none",
          background: "rgba(255, 255, 255, 0.03)",
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          transition: "all var(--tr)",
          marginBottom: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"; }}
      >
        <Icon name="arrow_back" size={16} style={{ color: "var(--blue)" }} />
        <span>Switch Server</span>
      </button>

      {/* ── Active Server Info Block ── */}
      {activeGuild && (
        <div style={{
          padding: "12px",
          borderRadius: "8px",
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.04)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          {serverIconUrl ? (
            <img
              src={serverIconUrl}
              alt={activeGuild.name}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.1)" }}
            />
          ) : (
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--blue))",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700
            }}>
              {(activeGuild.name || "SV").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#ffffff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }} title={activeGuild.name}>
              {activeGuild.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <OnlineDot />
              <span style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.4)" }}>Connected</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Groups */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
        {NAV_GROUPS.map(group => (
          <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.3)",
              marginBottom: 4,
              paddingLeft: 8
            }}>
              {group.title}
            </div>
            {group.items.map(n => {
              const isActive = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => onTab(n.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: "6px",
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
                    cursor: "pointer",
                    border: "none",
                    background: isActive ? "rgba(255, 255, 255, 0.05)" : "transparent",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all var(--tr)",
                    whiteSpace: "nowrap",
                    width: "100%",
                    textAlign: "left",
                    position: "relative"
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                    }
                  }}
                >
                  {/* Glowing left edge selection line */}
                  {isActive && (
                    <div style={{
                      position: "absolute",
                      left: 0,
                      top: "20%",
                      height: "60%",
                      width: 3.5,
                      background: "var(--blue)",
                      borderRadius: "0 4px 4px 0",
                      boxShadow: "0 0 8px var(--blue)"
                    }} />
                  )}
                  <Icon
                    name={n.icon}
                    size={18}
                    style={{ color: isActive ? "var(--blue)" : "rgba(255,255,255,0.4)" }}
                  />
                  <span>{n.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Profile Details */}
      <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", marginBottom: 8 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--blue))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}>
              {(user.username || "U").slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#ffffff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {user.username || "Admin"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Server Manager</div>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            borderRadius: "6px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--error)",
            cursor: "pointer",
            border: "none",
            background: "transparent",
            fontFamily: "'Inter', sans-serif",
            transition: "all var(--tr)",
            width: "100%",
            textAlign: "left"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,180,171,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <Icon name="logout" size={18} style={{ color: "var(--error)" }} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
