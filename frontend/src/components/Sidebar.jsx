import { useState, useEffect } from "react";
import { Icon } from "./Common.jsx";

export default function Sidebar({ tab, onTab, activeGuild, guilds, onActivate, onSwitchServer, user, onLogout, onShowHome }) {
  const [showServerDropdown, setShowServerDropdown] = useState(false);

  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest('[data-dropdown="sidebar-server-select"]')) {
        setShowServerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);
  const NAV_GROUPS = [
    {
      title: "Configuration",
      items: [
        { id: "channels",  label: "General Settings", icon: "settings" },
        { id: "upload",    label: "Knowledge Base",   icon: "storage" },
        { id: "sources",   label: "Ingested Sources", icon: "folder_open" },
        { id: "analytics", label: "Analytics",        icon: "analytics" },
      ],
    },
    {
      title: "Account",
      items: [
        { id: "profile",   label: "My Profile",       icon: "person" },
        { id: "billing",   label: "Billing & Plans",  icon: "credit_card" },
      ],
    },
  ];

  const getServerIconUrl = (guild) => {
    if (guild?.id && guild?.icon) {
      return guild.icon.startsWith("http") ? guild.icon : `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
    }
    return null;
  };

  const serverIconUrl = getServerIconUrl(activeGuild);

  // ─── Resize & Collapse States ───
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("nori_sidebar_collapsed") === "true";
  });
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem("nori_sidebar_width");
    return saved ? parseInt(saved, 10) : 260;
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      window.getSelection()?.removeAllRanges();
      const newWidth = Math.max(200, Math.min(450, e.clientX));
      setWidth(newWidth);
      localStorage.setItem("nori_sidebar_width", newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // ─── Screen Size Responsive Auto-Collapse ───
  useEffect(() => {
    let wasSmall = window.innerWidth < 850;
    
    const handleResize = () => {
      const isSmall = window.innerWidth < 850;
      if (isSmall && !wasSmall) {
        setIsCollapsed(true);
      } else if (!isSmall && wasSmall) {
        const savedCollapsed = localStorage.getItem("nori_sidebar_collapsed") === "true";
        setIsCollapsed(savedCollapsed);
      }
      wasSmall = isSmall;
    };

    // Initial check on mount
    const initialSmall = window.innerWidth < 850;
    if (initialSmall) {
      setIsCollapsed(true);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("nori_sidebar_collapsed", String(next));
  };

  return (
    <aside style={{
      width: isCollapsed ? 72 : width,
      flexShrink: 0,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      padding: isCollapsed ? "24px 8px" : "24px 16px",
      gap: 6,
      boxSizing: "border-box",
      boxShadow: "1px 0 10px rgba(15, 23, 42, 0.02)",
      position: "relative",
      transition: isDragging ? "none" : "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>

      {/* ── Drag edge handle ── */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={toggleCollapse}
        style={{
          position: "absolute",
          top: 0,
          right: -3,
          width: 6,
          height: "100%",
          cursor: isCollapsed ? "default" : "col-resize",
          zIndex: 100,
          background: isDragging ? "var(--accent)" : "transparent",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => { if (!isCollapsed) e.currentTarget.style.background = "var(--border2)"; }}
        onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.background = "transparent"; }}
      />

      {/* ── Logo ── */}
      <div 
        onClick={onShowHome}
        title="Go to Home"
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: isCollapsed ? "4px 0 22px" : "4px 4px 22px",
          justifyContent: isCollapsed ? "center" : "flex-start",
          borderBottom: "1px solid var(--border)",
          marginBottom: 10,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <div style={{
          width: 42,
          height: 42,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <img
            src="/LOGO.png"
            alt="Nori"
            style={{
              width: "100%", height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
        {!isCollapsed && (
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800, fontSize: 21,
            color: "var(--navy)", letterSpacing: "-0.025em",
            whiteSpace: "nowrap",
          }}>Nori</span>
        )}
      </div>

      {/* ── Server Switcher ── */}
      <div style={{ position: "relative", marginBottom: 14 }} data-dropdown="sidebar-server-select">
        {activeGuild ? (
          <div
            onClick={() => setShowServerDropdown(!showServerDropdown)}
            title={isCollapsed ? "Switch Server" : undefined}
            style={{
              display: "flex", alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: isCollapsed ? 0 : 8,
              padding: isCollapsed ? "9px 0" : "9px 12px",
              borderRadius: "var(--r-md)", background: "var(--surface)",
              border: "1px solid var(--border)", cursor: "pointer",
              transition: "all var(--tr)", userSelect: "none",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-3)"; e.currentTarget.style.borderColor = "var(--border2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            {serverIconUrl ? (
              <img src={serverIconUrl} alt={activeGuild.name} style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <Icon name="dns" size={14} style={{ color: "var(--navy)" }} />
            )}
            {!isCollapsed && (
              <>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginLeft: 4 }}>
                  {activeGuild.name}
                </span>
                <Icon name="unfold_more" size={14} style={{ color: "var(--muted)" }} />
              </>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border2)", cursor: "pointer" }} onClick={onSwitchServer}>
            <Icon name="warning" size={14} style={{ color: "var(--muted)" }} />
            {!isCollapsed && <span style={{ fontSize: 13, color: "var(--muted)" }}>No server</span>}
          </div>
        )}

        {showServerDropdown && (
          <div style={{
            position: "absolute", top: "100%", left: 0, marginTop: 4,
            width: isCollapsed ? 240 : "100%", background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-lg)", zIndex: 100,
            overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "10px 14px", fontSize: 10.5, fontWeight: 700, color: "var(--muted2)", borderBottom: "1px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              Switch Server
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {(guilds || []).map(g => {
                const isSelected = g.id === activeGuild?.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => { onActivate(g.id, g); setShowServerDropdown(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSelected ? "var(--accent-dim)" : "transparent", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = isSelected ? "var(--accent-dim)" : "var(--surface-2)"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? "var(--accent-dim)" : "transparent"}
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
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--accent-dim)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <Icon name="dns" size={14} style={{ color: "var(--accent)" }} />
              <span>Manage Servers...</span>
            </div>
          </div>
        )}
      </div>



      {/* ── Navigation groups ── */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22, overflow: "auto" }}>
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {!isCollapsed ? (
              <div style={{
                fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em",
                textTransform: "uppercase", color: "var(--slate)",
                marginBottom: 6, paddingLeft: 10,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {group.title}
              </div>
            ) : (
              gIdx > 0 && <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
            )}
            {group.items.map(n => {
              const isActive = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => onTab(n.id)}
                  title={isCollapsed ? n.label : undefined}
                  className={`nav-item${isActive ? " active" : ""}`}
                  style={{
                    position: "relative",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    padding: isCollapsed ? "10px 0" : "10px 14px",
                    gap: isCollapsed ? 0 : 10,
                  }}
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
                    style={{ color: isActive ? "var(--accent-deep)" : "var(--slate)", flexShrink: 0 }}
                  />
                  {!isCollapsed && (
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: isActive ? 600 : 500 }}>{n.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        paddingTop: 16,
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}>


        {/* ── Collapse / Expand Toggle Button ── */}
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          style={{
            display: "flex", alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: isCollapsed ? 0 : 8,
            padding: isCollapsed ? "9px 0" : "9px 12px", borderRadius: "var(--r-md)",
            fontSize: 13, fontWeight: 600, color: "var(--muted)",
            cursor: "pointer", border: "none",
            background: "transparent",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: "all var(--tr)", width: "100%", textAlign: "left",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-3)"; e.currentTarget.style.color = "var(--navy)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
        >
          <Icon name={isCollapsed ? "chevron_right" : "chevron_left"} size={16} style={{ flexShrink: 0 }} />
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}