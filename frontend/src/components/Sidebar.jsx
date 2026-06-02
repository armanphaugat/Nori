import { Icon, OnlineDot } from "./Common.jsx";

export default function Sidebar({ tab, onTab, activeGuild, onSwitchServer, user, onLogout }) {
  const NAV_GROUPS = [
    {
      title: "Configuration",
      items: [
        { id: "channels",  label: "Channels",        icon: "forum" },
        { id: "upload",    label: "Knowledge Base",   icon: "storage" },
        { id: "sources",   label: "Ingested Sources", icon: "folder_open" },
      ],
    },
    {
      title: "Utility",
      items: [
        { id: "utils", label: "URL Crawler", icon: "travel_explore" },
      ],
    },
  ];

  const getServerIconUrl = (guild) => {
    if (guild?.id && guild?.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
    }
    return null;
  };

  const serverIconUrl = getServerIconUrl(activeGuild);

  return (
    <aside style={{
      width: 256,
      flexShrink: 0,
      background: "#ffffff",
      borderRight: "1px solid rgba(43,45,66,0.1)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      padding: "20px 14px",
      gap: 4,
      boxSizing: "border-box",
      boxShadow: "2px 0 12px rgba(43,45,66,0.06)",
    }}>

      {/* ── Logo ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "4px 6px 20px", borderBottom: "1px solid rgba(43,45,66,0.08)",
        marginBottom: 8,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "var(--navy)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(43,45,66,0.25)",
        }}>
          <Icon name="shield_lock" size={17} fill style={{ color: "#fff" }} />
        </div>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 600, fontSize: 20,
          color: "var(--navy)", letterSpacing: "0.01em",
        }}>VaultBot</span>
      </div>

      {/* ── Switch server button ── */}
      <button
        onClick={onSwitchServer}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: "var(--r-md)",
          border: "1.5px solid var(--border2)",
          background: "transparent",
          color: "var(--muted)",
          fontSize: 12.5, fontWeight: 600,
          cursor: "pointer", width: "100%", textAlign: "left",
          transition: "all var(--tr)", marginBottom: 12,
          fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "var(--navy)";
          e.currentTarget.style.background = "var(--surface-2)";
          e.currentTarget.style.borderColor = "var(--border2)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "var(--muted)";
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "var(--border2)";
        }}
      >
        <Icon name="arrow_back" size={15} style={{ color: "var(--accent)" }} />
        <span>Switch Server</span>
      </button>

      {/* ── Active server pill ── */}
      {activeGuild && (
        <div style={{
          padding: "12px 14px",
          borderRadius: "var(--r-lg)",
          background: "var(--red-dim)",
          border: "1px solid var(--red-border)",
          marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          {serverIconUrl ? (
            <img
              src={serverIconUrl}
              alt={activeGuild.name}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid var(--red-border)", flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--navy)",
              color: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {(activeGuild.name || "SV").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "var(--navy)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }} title={activeGuild.name}>
              {activeGuild.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <OnlineDot />
              <span style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>Connected</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation groups ── */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, overflow: "auto" }}>
        {NAV_GROUPS.map(group => (
          <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: ".1em",
              textTransform: "uppercase", color: "var(--muted2)",
              marginBottom: 4, paddingLeft: 10,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {group.title}
            </div>
            {group.items.map(n => {
              const isActive = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => onTab(n.id)}
                  className={`nav-item${isActive ? " active" : ""}`}
                  style={{ position: "relative" }}
                >
                  {isActive && (
                    <span style={{
                      position: "absolute", left: 0, top: "18%",
                      height: "64%", width: 3,
                      background: "var(--accent)",
                      borderRadius: "0 3px 3px 0",
                    }} />
                  )}
                  <Icon
                    name={n.icon}
                    size={17}
                    style={{ color: isActive ? "var(--accent-deep)" : "var(--slate)" }}
                  />
                  <span>{n.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        paddingTop: 14,
        borderTop: "1px solid rgba(43,45,66,0.08)",
      }}>
        {user && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", marginBottom: 6,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--navy)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {(user.username || "U").slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "var(--navy)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user.username || "Admin"}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted2)" }}>Server Manager</div>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 12px", borderRadius: "var(--r-md)",
            fontSize: 13, fontWeight: 600, color: "var(--accent-deep)",
            cursor: "pointer", border: "none",
            background: "transparent",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all var(--tr)", width: "100%", textAlign: "left",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--red-dim)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <Icon name="logout" size={16} style={{ color: "var(--accent-deep)" }} />
          Sign out
        </button>
      </div>
    </aside>
  );
}