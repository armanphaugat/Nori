import { useState, useEffect, useCallback } from "react";
import { API, API_BASE } from "../utils/api.js";
import {
  Spinner, StatusBadge, Tag, Btn, Icon,
  Card, SectionHeader, NoServerSelected,
} from "./Common.jsx";

const TIER_DETAILS = {
  free: {
    name: "Free Tier",
    tagline: "Standard access for small servers.",
    price: "$0/mo",
    color: "var(--slate)",
    bg: "rgba(141,153,174,0.14)",
    max: 50,
    features: ["50 bot messages / month", "Up to 5 ingested URLs", "Up to 3 uploaded files", "Support via Discord server"]
  },
  starter: {
    name: "Starter Tier",
    tagline: "For small communities getting serious.",
    price: "$25/mo",
    color: "#1a5fab",
    bg: "rgba(56,133,220,0.09)",
    max: 200,
    features: ["200 bot messages / month", "Up to 10 ingested URLs", "Up to 10 uploaded files", "Support via Discord server"]
  },
  pro: {
    name: "Pro Tier",
    tagline: "For power users and large servers.",
    price: "$99/mo",
    color: "var(--navy)",
    bg: "rgba(43,45,66,0.07)",
    max: 800,
    features: ["800 bot messages / month", "Up to 50 ingested URLs", "Up to 50 uploaded files", "Priority email + Discord support"]
  },
  enterprise: {
    name: "Enterprise Tier",
    tagline: "Custom scale, built around your needs.",
    price: "Custom Pricing",
    color: "var(--navy)",
    bg: "rgba(43,45,66,0.07)",
    max: 1000000,
    features: ["Unlimited bot messages", "Unlimited ingested URLs", "Unlimited uploaded files", "SLA + dedicated success manager"]
  },
  paid: {
    name: "Paid Premium Tier",
    tagline: "Unrestricted high-limit access for active communities.",
    price: "Patreon Pledge",
    color: "var(--accent)",
    bg: "rgba(239,35,60,0.08)",
    max: 1000000,
    features: ["1,000,000 bot messages / month", "Unlimited ingested URLs", "Unlimited uploaded files", "Priority bot response time"]
  }
};

export default function BillingTab({ guildId, onGoToOverview, user }) {
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const fetchBillingData = useCallback(async (gid) => {
    if (!gid) return;
    setLoading(true);
    setStatus(null);
    try {
      const [planRes, usageRes] = await Promise.all([
        API.getServerPlan(gid),
        API.getQuestionsUsage(gid)
      ]);
      setPlan(planRes);
      setUsage(usageRes);
    } catch (e) {
      setStatus({ ok: false, msg: `Failed to fetch billing details: ${e.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData(guildId);
  }, [guildId, fetchBillingData]);

  const activePlanId = plan?.plan || "free";
  const activePlan = TIER_DETAILS[activePlanId] || TIER_DETAILS.free;
  const questionsAsked = usage?.questions_asked || 0;
  const maxQuestions = plan?.max_limit_questions || activePlan.max;
  const usagePercent = Math.min(100, Math.round((questionsAsked / maxQuestions) * 100));

  const handleUpgrade = () => {
    if (activePlanId !== "free") {
      window.location.href = "https://www.patreon.com/portal/membership";
    } else {
      window.location.href = `${API_BASE}/patreon/checkout?guild_id=${guildId}`;
    }
  };

  if (!guildId) return (
    <div>
      <SectionHeader label="Billing & Subscriptions" title="Billing & Plans" subtitle="Manage your server subscription plan and limits." />
      <NoServerSelected onGoToOverview={onGoToOverview} />
    </div>
  );

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 16 }}>
      <Spinner size={32} />
      <span style={{ fontSize: 13, color: "var(--muted2)" }}>Loading subscription status...</span>
    </div>
  );

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <SectionHeader
        label="Billing & Subscriptions"
        title="Billing & Plans"
        subtitle="Manage limits, check message usage, and link Patreon subscriptions."
      />

      {status && <div style={{ marginBottom: 16 }}><StatusBadge {...status} /></div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "stretch", marginBottom: 32, flexWrap: "wrap" }}>
        {/* Current Plan Card */}
        <Card style={{
          position: "relative",
          overflow: "hidden",
          border: `1.5px solid ${activePlan.color}35`,
          background: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 24
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px",
                  background: activePlan.bg, color: activePlan.color,
                  padding: "4px 10px", borderRadius: 99, display: "inline-block", marginBottom: 8
                }}>
                  Active Plan
                </span>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--navy)", fontFamily: "'Outfit', sans-serif" }}>
                  {activePlan.name}
                </h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 18, fontWeight: 850, color: "var(--navy)", fontFamily: "'Outfit', sans-serif" }}>
                  {activePlan.price}
                </span>
              </div>
            </div>
            
            <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 20, fontWeight: 300 }}>
              {activePlan.tagline}
            </p>

            <div style={{ fontSize: 12.5, color: "var(--muted)", background: "var(--surface2)", padding: 14, borderRadius: 10, border: "1px dashed var(--border2)" }}>
              {activePlanId !== "free" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                  <span>Subscription is active! Handled automatically via Patreon.</span>
                </div>
              ) : (
                <span>Your server is running on the Free tier. Upgrade to unlock higher query limits and additional features.</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <Btn onClick={handleUpgrade} variant={activePlanId !== "free" ? "ghost" : "primary"} style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer"
            }}>
              <Icon name={activePlanId !== "free" ? "settings" : "shopping_cart"} size={15} />
              {activePlanId !== "free" ? "Manage Pledge on Patreon" : "Upgrade on Patreon"}
            </Btn>
          </div>
        </Card>

        {/* Message Limit Meter */}
        <Card style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "white" }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--navy)", marginBottom: 4 }}>
              Questions Asked
            </h4>
            <p style={{ fontSize: 12.5, color: "var(--muted2)", marginBottom: 20 }}>
              Questions asked by members during the billing period.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* Circular SVG Progress */}
              <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
                <svg width="90" height="90" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--surface3)"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={usagePercent >= 90 ? "var(--accent)" : "var(--accent-deep)"}
                    strokeWidth="3.5"
                    strokeDasharray={`${usagePercent}, 100`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 0.5s ease" }}
                  />
                </svg>
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800, color: "var(--navy)", fontFamily: "'Outfit', sans-serif"
                }}>
                  {usagePercent}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: 24, fontWeight: 850, color: "var(--navy)", fontFamily: "'Outfit', sans-serif" }}>
                  {questionsAsked.toLocaleString()} <span style={{ fontSize: 14, color: "var(--muted2)", fontWeight: 400 }}>/ {activePlanId === "enterprise" ? "Unlimited" : maxQuestions.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>
                  {activePlanId === "enterprise" ? (
                    <span>Premium plan includes unlimited query quota</span>
                  ) : maxQuestions - questionsAsked > 0 ? (
                    <span><strong>{(maxQuestions - questionsAsked).toLocaleString()}</strong> questions left in cycle</span>
                  ) : (
                    <span style={{ color: "var(--accent-deep)", fontWeight: 750 }}>Limit Exceeded!</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(43,45,66,0.04)", border: "1px solid var(--border)", padding: "10px 14px", borderRadius: 10, fontSize: 12, color: "var(--muted)" }}>
            <span style={{ fontWeight: 600, color: "var(--navy)" }}>Note:</span> Linking your Patreon account automatically links the subscription. Make sure to connect your Discord account in Patreon settings to enable instant plan activation.
          </div>
        </Card>
      </div>

      {/* Feature comparison table */}
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 16, fontFamily: "'Outfit', sans-serif" }}>
        Plan Details
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, alignItems: "stretch", marginBottom: 24 }}>
        {["free", "starter", "pro", "enterprise"].map((id) => {
          const tier = TIER_DETAILS[id];
          const isCurrent = activePlanId === id;
          
          return (
            <Card key={id} style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: isCurrent ? `2px solid ${tier.color}` : "1.5px solid var(--border2)",
              background: "white",
              padding: 24,
            }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 750, color: "var(--navy)", fontFamily: "'Outfit', sans-serif" }}>
                    {tier.name}
                  </h4>
                  {isCurrent && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: "uppercase", background: tier.bg, color: tier.color,
                      padding: "2px 8px", borderRadius: 6
                    }}>
                      Active
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginBottom: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)" }}>{tier.price}</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginBottom: 16, minHeight: 36 }}>
                  {tier.tagline}
                </p>

                <div style={{ height: 1, background: "var(--border)", marginBottom: 16 }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {tier.features.map((feat, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11.5, color: "var(--muted)" }}>
                      <span style={{ display: "inline-flex", width: 14, height: 14, borderRadius: "50%", background: "#22c55e20", color: "#16a34a", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0, marginTop: 2 }}>✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "auto", paddingTop: 16 }}>
                <Btn
                  onClick={
                    id === "enterprise"
                      ? () => window.open("https://discord.gg/WrpaytBfN", "_blank")
                      : id === "free"
                      ? undefined
                      : () => {
                          window.location.href = `${API_BASE}/patreon/checkout?guild_id=${guildId}&plan=${id}`;
                        }
                  }
                  variant={isCurrent ? "ghost" : "primary"}
                  disabled={isCurrent || id === "free"}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontSize: 12.5,
                    padding: "8px 12px"
                  }}
                >
                  {isCurrent ? (
                    "Current Plan"
                  ) : id === "free" ? (
                    "Free Plan"
                  ) : id === "enterprise" ? (
                    "Talk to Sales"
                  ) : (
                    "Select Plan"
                  )}
                </Btn>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
