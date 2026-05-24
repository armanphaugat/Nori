import { useState } from "react";
import CrawlerTab from "./CrawlerTab.jsx";
import { Card, SectionHeader, Icon, Tag } from "./Common.jsx";

export default function UtilsTab({ guildId, onGoToOverview }) {
  const [activeSubTab, setActiveSubTab] = useState("crawler");

  const subTabs = [
    { id: "crawler", label: "URL Crawler", icon: "travel_explore", status: "active" },
    { id: "webhooks", label: "Integrations & Webhooks", icon: "hub", status: "soon" },
  ];

  return (
    <div>
      <SectionHeader 
        label="Utility Center" 
        title="Server Utilities" 
        subtitle="Access web scrapers, automation tasks, and external integrations to power up VaultBot." 
      />

      {/* Sub Navigation */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        borderBottom: "1.5px solid var(--outline-variant)",
        paddingBottom: 12,
        flexWrap: "wrap"
      }}>
        {subTabs.map(t => {
          const isActive = activeSubTab === t.id;
          const isSoon = t.status === "soon";
          return (
            <button
              key={t.id}
              onClick={() => !isSoon && setActiveSubTab(t.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: "var(--r-md)",
                border: "none",
                background: isActive ? "var(--primary-fixed)" : "transparent",
                color: isActive ? "var(--primary)" : (isSoon ? "var(--outline)" : "var(--on-surface-variant)"),
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                cursor: isSoon ? "not-allowed" : "pointer",
                transition: "all var(--tr)",
                opacity: isSoon ? 0.65 : 1,
              }}
            >
              <Icon name={t.icon} size={16} />
              <span>{t.label}</span>
              {isSoon && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  background: "var(--surface-container)",
                  color: "var(--outline)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  marginLeft: 4,
                  letterSpacing: "0.05em"
                }}>Soon</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeSubTab === "crawler" && (
        <CrawlerTab guildId={guildId} onGoToOverview={onGoToOverview} />
      )}

      {(activeSubTab === "webhooks" || activeSubTab === "autosync") && (
        <Card style={{
          padding: "48px 32px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          background: "linear-gradient(135deg, var(--surface-lowest) 0%, var(--surface-low) 100%)",
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(70, 72, 212, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: 8,
            boxShadow: "0 8px 32px rgba(70, 72, 212, 0.05)",
          }}>
            <Icon name={activeSubTab === "webhooks" ? "hub" : "sync"} size={32} style={{ color: "var(--primary)" }} />
            <span style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "var(--primary)",
              border: "2px solid var(--surface-container)",
              animation: "pulse-dot 2.5s infinite"
            }} />
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--on-surface)" }}>
            {activeSubTab === "webhooks" ? "Integrations & API Webhooks" : "Automated Knowledge Sync"}
          </h3>
          
          <p style={{
            fontSize: 14,
            color: "var(--on-surface-variant)",
            lineHeight: 1.6,
            maxWidth: 480,
            margin: "0 auto"
          }}>
            {activeSubTab === "webhooks" 
              ? "Connect VaultBot to Slack, GitHub, Notion, or custom developer webhooks. Automatically train your Discord assistant in real time when files or wikis are modified." 
              : "Keep your knowledge base in perfect sync with your cloud drives. Link Google Drive, OneDrive, or Notion databases for scheduled auto-updates every hour."}
          </p>

          <div style={{ display: "inline-flex", gap: 8, marginTop: 8 }}>
            <Tag variant="primary">Automated Ingestion</Tag>
            <Tag variant="neutral">Developer API</Tag>
          </div>
        </Card>
      )}
    </div>
  );
}
