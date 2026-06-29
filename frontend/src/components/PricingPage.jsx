import { useState, useEffect } from "react";
import { API_BASE } from "../utils/api.js";

function Icon({ name, size = 20, fill = 0, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        lineHeight: 1,
        display: "inline-flex",
        ...style,
      }}
    >
      {name}
    </span>
  );
}

function DiscordIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <g transform="translate(0, 28.5)">
        <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" />
      </g>
    </svg>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  :root {
    --navy:        #2B2D42;
    --navy-mid:    #3d3f58;
    --slate:       #8D99AE;
    --slate-dim:   rgba(141,153,174,0.18);
    --slate-glow:  rgba(141,153,174,0.32);
    --light:       #EDF2F4;
    --light-dim:   rgba(237,242,244,0.7);
    --accent:         #1D4ED8;
    --accent-deep:    #1E3A8A;
    --accent-dim:     rgba(30,58,138,0.12);
    --accent-glow:    rgba(30,58,138,0.22);

    --bg:          var(--light);
    --surface1:    #ffffff;
    --surface2:    #f4f7f9;
    --surface3:    #e8edf1;
    --surface4:    #dde3ea;
    --border:      rgba(43,45,66,0.1);
    --border2:     rgba(43,45,66,0.22);
    --text:        var(--navy);
    --muted:       #5a5d78;
    --muted2:      rgba(141,153,174,0.8);
    --tr:          0.2s cubic-bezier(0.4,0,0.2,1);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Plus Jakarta Sans', sans-serif;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--slate); border-radius: 99px; }

  h1, h2, h3, h4 { font-family: 'Outfit', sans-serif; }

  .water-bg {
    position: fixed; top:0; left:0; width:100%; height:100%;
    opacity: 0.04; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(43,45,66,0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(43,45,66,0.08) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .bloom {
    position: absolute; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(30,58,138,0.07) 0%, transparent 70%);
  }
  .bloom-slate {
    position: absolute; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(141,153,174,0.1) 0%, transparent 70%);
  }

  @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:none; } }
  @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  @keyframes glow-pulse { 0%,100%{box-shadow:0 0 22px rgba(30,58,138,0.18);} 50%{box-shadow:0 0 40px rgba(30,58,138,0.35);} }
  @keyframes ripple { 0%{transform:scale(1);opacity:0.5;} 100%{transform:scale(2.2);opacity:0;} }
  @keyframes float { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-6px);} }

  .a0{animation:fadeUp 0.55s ease both;}
  .a1{animation:fadeUp 0.55s 0.08s ease both;}
  .a2{animation:fadeUp 0.55s 0.17s ease both;}
  .a3{animation:fadeUp 0.55s 0.26s ease both;}
  .a4{animation:fadeUp 0.55s 0.35s ease both;}

  .shimmer-text {
    color: #EF233C !important;
    font-weight: 800;
  }

  .glow-accent { animation: glow-pulse 3s ease infinite; }
  .float { animation: float 4s ease-in-out infinite; }

  .ripple-dot::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(30,58,138,0.35);
    animation: ripple 2s ease-out infinite;
  }
  .ripple-dot { position: relative; }

  .nav-link:hover { color: var(--navy); background: rgba(43,45,66,0.06); }
  .btn-sm:hover { background: var(--navy) !important; color: white !important; box-shadow: 0 0 22px var(--slate-glow) !important; }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 0 36px var(--accent-glow) !important; }
  .btn-ghost:hover { background: rgba(43,45,66,0.06) !important; color: var(--navy) !important; }

  .tier-card {
    border-radius: 16px;
    border: 1px solid var(--border2);
    background: white;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .tier-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 48px rgba(43,45,66,0.13);
  }
  .tier-card.featured {
    border: 2px solid var(--accent);
    box-shadow: 0 8px 32px rgba(30,58,138,0.15);
  }
  .tier-card.featured:hover {
    box-shadow: 0 24px 56px rgba(30,58,138,0.22);
  }

  .toggle-pill {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid var(--border2);
    border-radius: 99px;
    padding: 4px;
    gap: 0;
  }
  .toggle-pill button {
    padding: 7px 20px;
    border-radius: 99px;
    border: none;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    transition: all var(--tr);
  }
  .toggle-pill button.active {
    background: var(--navy);
    color: white;
  }
  .toggle-pill button:not(.active) {
    background: transparent;
    color: var(--muted);
  }

  .feature-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13.5px;
    color: var(--muted);
    line-height: 1.55;
    font-weight: 300;
  }
  .feature-row.disabled {
    opacity: 0.35;
  }

  .usage-meter {
    background: var(--surface3);
    border-radius: 99px;
    height: 4px;
    overflow: hidden;
    margin-top: 6px;
  }
  .usage-fill {
    height: 100%;
    border-radius: 99px;
    background: var(--accent);
    transition: width 0.5s ease;
  }

  .compare-row:hover td {
    background: rgba(43,45,66,0.02);
  }

  .faq-item {
    background: white;
    border: 1px solid var(--border2);
    border-radius: 13px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color var(--tr), box-shadow var(--tr);
  }
  .faq-item.open {
    border-color: rgba(30,58,138,0.3);
    box-shadow: 0 4px 16px rgba(30,58,138,0.08);
  }

  .show600 { display: none; }

  @media(max-width:1150px) {
    nav {
      padding: 0 24px !important;
    }
    .pricing-hero {
      padding: 96px 24px 48px !important;
    }
  }
  @media(max-width:900px) {
    .tiers-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .hide900 { display: none !important; }
    nav {
      padding: 0 16px !important;
    }
  }
  @media(max-width:600px) {
    .tiers-grid { grid-template-columns: 1fr !important; }
    .pricing-hero { padding: 96px 24px 48px !important; }
    section { padding-left: 24px !important; padding-right: 24px !important; }
    .hide600 { display: none !important; }
    .show600 { display: inline !important; }
  }
`;

const TIERS = [
  {
    id: "free",
    name: "Free",
    tagline: "Try it out, no commitment",
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: "slate",
    icon: "explore",
    badge: null,
    base: {
      messages: 50,
      urls: 5,
      files: 3,
    },
    overage: null,
    features: [
      { text: "50 bot messages / month", on: true },
      { text: "Up to 5 ingested URLs", on: true },
      { text: "Up to 3 uploaded files", on: true },
      { text: "Support via Discord server", on: true },
    ],
    cta: "Get Started Free",
    ctaStyle: "ghost",
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For small communities getting serious",
    monthlyPrice: 25,
    yearlyPrice: 19,
    color: "blue",
    icon: "bolt",
    badge: null,
    base: {
      messages: 200,
      urls: 10,
      files: 10,
    },
    overage: null,
    features: [
      { text: "200 bot messages / month", on: true },
      { text: "Up to 10 ingested URLs", on: true },
      { text: "Up to 10 uploaded files", on: true },
      { text: "Support via Discord server", on: true },
    ],
    cta: "Start Free Trial",
    ctaStyle: "ghost",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For power users and large servers",
    monthlyPrice: 99,
    yearlyPrice: 79,
    color: "navy",
    icon: "workspace_premium",
    badge: "Most Popular",
    featured: true,
    base: {
      messages: 800,
      urls: 50,
      files: 50,
    },
    overage: null,
    features: [
      { text: "800 bot messages / month", on: true },
      { text: "Up to 50 ingested URLs", on: true },
      { text: "Up to 50 uploaded files", on: true },
      { text: "Priority email + Discord support", on: true },
    ],
    cta: "Get Pro",
    ctaStyle: "dark",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom scale, built around your needs",
    monthlyPrice: null,
    yearlyPrice: null,
    color: "navy",
    icon: "domain",
    badge: "Custom Pricing",
    featured: false,
    enterprise: true,
    base: {
      messages: "Unlimited",
      urls: "Unlimited",
      files: "Unlimited",
    },
    overage: null,
    features: [
      { text: "Unlimited bot messages", on: true },
      { text: "Unlimited ingested URLs", on: true },
      { text: "Unlimited uploaded files", on: true },
      { text: "SLA + dedicated success manager", on: true },
    ],
    cta: "Talk to Sales",
    ctaStyle: "dark",
  },
];

const COMPARE_FEATURES = [
  { label: "Messages / month",       free: "50",          starter: "200",       pro: "800",             enterprise: "Unlimited" },
  { label: "URL uploads",            free: "5",           starter: "10",        pro: "50",              enterprise: "Unlimited" },
  { label: "File uploads",           free: "3",           starter: "10",        pro: "50",              enterprise: "Unlimited" },
  { label: "PDF & DOCX support",     free: true,          starter: true,        pro: true,              enterprise: true },
  { label: "Image / OCR support",    free: false,         starter: true,        pro: true,              enterprise: true },
  { label: "URL ingestion",          free: false,         starter: "5 URLs",    pro: "Unlimited",       enterprise: "Unlimited" },
  { label: "Auto-sync URLs",         free: false,         starter: false,       pro: true,              enterprise: true },
  { label: "Analytics dashboard",    free: false,         starter: false,       pro: "Advanced",        enterprise: "Custom" },
  { label: "Custom bot persona",     free: false,         starter: false,       pro: "Multiple",        enterprise: "White-label" },
  { label: "Web search fallback",    free: false,         starter: false,       pro: true,              enterprise: true },
  { label: "Priority support",       free: false,         starter: false,       pro: "24h email",       enterprise: "Dedicated SLA" },
  { label: "SSO / audit logs",       free: false,         starter: false,       pro: false,             enterprise: true },
];

const FAQS = [
  { q: "What counts as a 'message'?", a: "Every time a server member sends a question and Nori responds, that's one message. Commands, setup interactions, and analytics views don't count. You can monitor usage in real time on the dashboard." },
  { q: "What happens if I exceed my monthly message limit?", a: "On Starter and Pro plans you can continue using the bot, we simply bill the overage at the per-message rate shown on your plan. We'll send you an email alert at 80% and 100% of your base allocation so there are no surprises." },
  { q: "Can I switch plans mid-month?", a: "Yes. Upgrades take effect instantly; you'll be charged a prorated amount for the remainder of the billing period. Downgrades take effect at the start of your next billing cycle." },
  { q: "What is the free trial for paid plans?", a: "Every paid plan comes with a 14-day free trial with full access to all plan features. No credit card is required to start the trial, you only enter payment details if you decide to continue." },
  { q: "Do documents count against my limit permanently?", a: "Deleted documents are removed from your storage and no longer count. You can replace or rotate your content library as often as you like within your plan's document slot limit." },
  { q: "What does 'white-label' mean in the Enterprise plan?", a: "Your bot gets a fully custom name, avatar, and brand identity with zero mention of Nori anywhere in the interface. Members interact with your bot, not ours." },
  { q: "Is there a discount for annual billing?", a: "Yes, switching to annual billing saves you roughly 25% compared to monthly pricing across all paid plans. You can toggle between billing periods on this page to see the exact rates." },
];

const colorMap = {
  red:   { bg: "rgba(30,58,138,0.08)",   border: "rgba(30,58,138,0.25)",   text: "#1E3A8A",   icon: "#1E3A8A"  },
  slate: { bg: "rgba(141,153,174,0.14)", border: "rgba(141,153,174,0.32)", text: "#5a6480",   icon: "#5a6480"  },
  blue:  { bg: "rgba(56,133,220,0.09)",  border: "rgba(56,133,220,0.28)",  text: "#1a5fab",   icon: "#1a5fab"  },
  navy:  { bg: "rgba(43,45,66,0.07)",    border: "rgba(43,45,66,0.22)",    text: "#2B2D42",   icon: "#2B2D42"  },
};

function SectionLabel({ text }) {
  return null;
}

function CheckIcon({ on }) {
  if (on === true) return (
    <span style={{ width:18,height:18,borderRadius:"50%",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.22)",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#16a34a",marginTop:1 }}>
      <Icon name="check" size={11} />
    </span>
  );
  if (on === false) return (
    <span style={{ width:18,height:18,borderRadius:"50%",background:"rgba(43,45,66,0.05)",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#c0c4d0",marginTop:1 }}>
      <Icon name="remove" size={11} />
    </span>
  );
  return null;
}

function CellVal({ v }) {
  if (v === true) return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:"50%",background:"rgba(34,197,94,0.08)",color:"#16a34a",fontSize:13,fontWeight:700 }}>✓</span>;
  if (v === false) return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:"50%",background:"rgba(239,35,60,0.08)",color:"#EF233C",fontSize:13,fontWeight:700 }}>✗</span>;
  return <span style={{ fontSize:13,color:"var(--navy)",fontWeight:500 }}>{v}</span>;
}

export default function PricingPage({ 
  user, 
  activeGuildId, 
  onLogin, 
  onShowDashboard, 
  onBack,
  onInvite,
  onShowPrivacy,
  onShowTerms
}) {
  const [annual, setAnnual] = useState(false);
  const [faq, setFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const getPrice = (tier) => {
    if (tier.enterprise) return null;
    if (tier.monthlyPrice === 0) return 0;
    return annual ? tier.yearlyPrice : tier.monthlyPrice;
  };

  const getSavings = (tier) => {
    if (!tier.monthlyPrice || tier.enterprise) return null;
    const saved = (tier.monthlyPrice - tier.yearlyPrice) * 12;
    return saved > 0 ? saved : null;
  };

  return (
    <div style={{ background:"var(--bg)",color:"var(--text)",minHeight:"100vh" }}>
      <style>{CSS}</style>
      <div className="water-bg" />

      {/* NAV */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:200,height:64,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 64px",
        background: scrolled ? "rgba(237,242,244,0.97)" : "rgba(237,242,244,0.82)",
        backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${scrolled ? "rgba(43,45,66,0.15)" : "var(--border)"}`,
        transition:"all 0.3s ease",
      }}>
        <div onClick={onBack} style={{ textDecoration:"none",display:"flex",alignItems:"center",gap:12,cursor:"pointer" }}>
  <img
    src="/LOGO.png"
    alt="Nori"
    style={{ width:44,height:44,objectFit:"contain" }}
  />
  <span style={{ fontFamily:"'Outfit', sans-serif",fontWeight:600,fontSize:22,color:"var(--navy)",letterSpacing:"0.01em" }}>Nori</span>
</div>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          {/* Menu links - hidden below 900px */}
          <div className="hide900" style={{ display:"flex",alignItems:"center",gap:2 }}>
            <button
              onClick={onBack}
              className="nav-link"
              style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 15px",borderRadius:8,fontSize:13,fontWeight:500,color:"var(--muted)",background:"none",border:"none",cursor:"pointer",transition:"all var(--tr)" }}
            >
              <Icon name="arrow_back" size={15} /> Back
            </button>
            {[["Plans","#pricing"]].map(([l,h],i) => (
              <a key={i} href={h} className="nav-link" style={{ padding:"7px 15px",borderRadius:8,fontSize:13,fontWeight:500,letterSpacing:"0.02em",color:"var(--muted)",textDecoration:"none",transition:"all var(--tr)" }}>{l}</a>
            ))}
          </div>

          {/* Primary CTA - always visible */}
          {user ? (
            <button onClick={onShowDashboard} className="btn-sm" style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,background:"var(--surface1)",color:"var(--navy)",border:"1px solid var(--border2)",cursor:"pointer",transition:"all var(--tr)" }}>
              <Icon name="grid_view" size={15} /> Dashboard
            </button>
          ) : (
            <button onClick={onLogin} className="btn-sm" style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,background:"var(--surface1)",color:"var(--navy)",border:"1px solid var(--border2)",cursor:"pointer",transition:"all var(--tr)" }}>
              <DiscordIcon />
              <span className="hide600">Login with Discord</span>
              <span className="show600">Login</span>
            </button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="pricing-hero" style={{ padding:"120px 64px 64px",position:"relative",overflow:"hidden",textAlign:"center" }}>
        <div className="bloom" style={{ top:-100,left:"20%",width:900,height:700 }} />
        <div className="bloom-slate" style={{ bottom:"5%",right:"-5%",width:500,height:500 }} />
        <div style={{ position:"relative",zIndex:1,maxWidth:760,margin:"0 auto" }}>

          <h1 className="a1" style={{ fontFamily:"'Outfit', sans-serif",fontWeight:700,fontSize:"clamp(38px,5.5vw,72px)",lineHeight:1.05,letterSpacing:"-0.01em",color:"var(--navy)",marginBottom:20 }}>
            Pay for What You Use,<br /><span className="shimmer-text">Nothing More</span>
          </h1>

          <p className="a2" style={{ fontSize:18,lineHeight:1.8,color:"var(--muted)",maxWidth:560,margin:"0 auto 40px",fontWeight:300 }}>
            Every plan includes the full feature set for that tier. Simple, transparent pricing with no hidden fees or overage charges.
          </p>

          {/* Billing toggle */}
          <div className="a3" style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:16 }}>
            <div className="toggle-pill">
              <button className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Monthly</button>
              <button className={annual ? "active" : ""} onClick={() => setAnnual(true)}>Annual</button>
            </div>
            {annual && (
              <span style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(30,58,138,0.08)",border:"1px solid rgba(30,58,138,0.22)",padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700,color:"var(--accent-deep)" }}>
                <Icon name="local_offer" size={13} fill={1} /> Save up to 25%
              </span>
            )}
          </div>
          <p className="a4" style={{ fontSize:12,color:"var(--muted2)" }}>7-day free trial on all paid plans. No credit card required.</p>
        </div>
      </section>

      {/* TIER CARDS */}
      <section id="pricing" style={{ padding:"0 64px 96px",position:"relative",zIndex:1 }}>
        <div style={{ maxWidth:1300,margin:"0 auto" }}>
          <div className="tiers-grid" style={{ display:"grid",gridTemplateColumns:`repeat(${TIERS.length},1fr)`,gap:16,alignItems:"stretch" }}>
            {TIERS.map((tier, i) => {
              const price = getPrice(tier);
              const savings = getSavings(tier);
              const c = colorMap[tier.color] || colorMap.navy;
              const isFeatured = tier.featured;
              const isEnterprise = tier.enterprise;

              return (
                <div
                  key={tier.id}
                  className={`tier-card${isFeatured ? " featured" : ""}`}
                  style={{
                    animationDelay: `${i * 0.07}s`,
                    animation: "fadeUp 0.55s ease both",
                  }}
                >
                  {/* Featured ribbon */}
                  {isFeatured && (
                    <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:"var(--accent)",borderRadius:"16px 16px 0 0" }} />
                  )}

                  {/* Badge */}
                  {tier.badge && (
                    <div style={{ position:"absolute",top:isFeatured?14:12,right:14 }}>
                      <span style={{
                        display:"inline-block",
                        padding:"3px 10px",
                        borderRadius:99,
                        fontSize:10,
                        fontWeight:800,
                        letterSpacing:"0.06em",
                        textTransform:"uppercase",
                        background: isFeatured ? "var(--accent)" : isEnterprise ? "var(--navy)" : c.bg,
                        color: (isFeatured || isEnterprise) ? "white" : c.text,
                        border: (isFeatured || isEnterprise) ? "none" : `1px solid ${c.border}`,
                      }}>
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  <div style={{ padding:"28px 24px 0" }}>
                    {/* Icon + Name */}
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12,marginTop: isFeatured ? 8 : 0 }}>
                      <div style={{ width:40,height:40,borderRadius:11,background:isFeatured ? "rgba(30,58,138,0.1)" : c.bg,border:`1px solid ${isFeatured ? "rgba(30,58,138,0.3)" : c.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:isFeatured ? "var(--accent-deep)" : c.text }}>
                        <Icon name={tier.icon} size={20} fill={1} />
                      </div>
                      <div>
                        <div style={{ fontFamily:"'Outfit', sans-serif",fontWeight:600,fontSize:20,color:"var(--navy)",lineHeight:1.1 }}>{tier.name}</div>
                      </div>
                    </div>

                    <p style={{ fontSize:12.5,color:"var(--muted)",lineHeight:1.5,marginBottom:20,fontWeight:300 }}>{tier.tagline}</p>

                    {/* Price */}
                    <div style={{ marginBottom:20 }}>
                      {isEnterprise ? (
                        <div>
                          <div style={{ fontFamily:"'Outfit', sans-serif",fontWeight:700,fontSize:34,color:"var(--navy)",lineHeight:1 }}>Custom</div>
                          <div style={{ fontSize:12,color:"var(--muted2)",marginTop:4 }}>Volume-based quote</div>
                        </div>
                      ) : price === 0 ? (
                        <div>
                          <div style={{ fontFamily:"'Outfit', sans-serif",fontWeight:700,fontSize:34,color:"var(--navy)",lineHeight:1 }}>Free</div>
                          <div style={{ fontSize:12,color:"var(--muted2)",marginTop:4 }}>Forever, no card needed</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display:"flex",alignItems:"flex-end",gap:3,lineHeight:1 }}>
                            <span style={{ fontSize:15,color:"var(--muted)",fontWeight:500,alignSelf:"flex-start",marginTop:7 }}>$</span>
                            <span style={{ fontFamily:"'Outfit', sans-serif",fontWeight:700,fontSize:38,color:"var(--navy)" }}>{price}</span>
                            <span style={{ fontSize:13,color:"var(--muted2)",marginBottom:5 }}>/mo</span>
                          </div>
                          <div style={{ fontSize:11.5,color:"var(--muted2)",marginTop:5 }}>
                            {annual ? `Billed $${price * 12}/yr` : "Billed monthly"}
                            {annual && savings && (
                              <span style={{ marginLeft:6,color:"var(--accent-deep)",fontWeight:700 }}>· Save ${savings}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Base limits */}
                    <div style={{ background:"var(--surface2)",borderRadius:10,padding:"12px 14px",marginBottom:20,border:"1px solid var(--border)" }}>
                      <div style={{ fontSize:10,fontWeight:700,color:"var(--muted2)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8 }}>Base Includes</div>
                      {[
                        ["chat_bubble", `${tier.base.messages} messages`],
                        ["link", `${tier.base.urls} URLs`],
                        ["description", `${tier.base.files} files`],
                      ].map(([icon, val], j) => (
                        <div key={j} style={{ display:"flex",alignItems:"center",gap:7,fontSize:12,color:"var(--muted)",marginBottom: j < 2 ? 5 : 0 }}>
                          <Icon name={icon} size={13} fill={1} style={{ color: isFeatured ? "var(--accent-deep)" : c.text, flexShrink:0 }} />
                          {val}
                        </div>
                      ))}
                    </div>

                    {/* Overage */}
                    {tier.overage ? (
                      <div style={{ marginBottom:20,padding:"10px 14px",borderRadius:10,background:"rgba(30,58,138,0.04)",border:"1px solid rgba(30,58,138,0.15)" }}>
                        <div style={{ fontSize:10,fontWeight:700,color:"var(--accent-deep)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6 }}>If You Exceed</div>
                        {Object.values(tier.overage).map((o, j) => (
                          <div key={j} style={{ fontSize:11.5,color:"var(--muted)",marginBottom: j < Object.values(tier.overage).length - 1 ? 3 : 0 }}>+ {o}</div>
                        ))}
                      </div>
                    ) : !isEnterprise ? (
                      <div style={{ marginBottom:20,padding:"10px 14px",borderRadius:10,background:"rgba(43,45,66,0.04)",border:"1px solid var(--border)" }}>
                        <div style={{ fontSize:11.5,color:"var(--muted2)" }}>No overage billing, upgrade to continue if you hit limits.</div>
                      </div>
                    ) : (
                      <div style={{ marginBottom:20,padding:"10px 14px",borderRadius:10,background:"rgba(43,45,66,0.04)",border:"1px solid var(--border)" }}>
                        <div style={{ fontSize:11.5,color:"var(--muted2)" }}>Custom contract, SLA-backed with flexible terms.</div>
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      onClick={
                        isEnterprise
                          ? () => window.open("https://discord.gg/WrpaytBfN", "_blank")
                          : () => {
                              if (!user) {
                                localStorage.setItem("pending_checkout_plan", tier.id);
                                if (activeGuildId) {
                                  localStorage.setItem("pending_checkout_guild_id", activeGuildId);
                                }
                                onLogin();
                                return;
                              }
                              const qs = new URLSearchParams();
                              if (activeGuildId) qs.append("guild_id", activeGuildId);
                              qs.append("plan", tier.id);
                              window.location.href = `${API_BASE}/patreon/checkout?${qs.toString()}`;
                            }
                      }
                      style={{
                        width:"100%",
                        display:"flex",alignItems:"center",justifyContent:"center",gap:9,
                        padding:"12px 16px",
                        borderRadius:10,
                        fontSize:13.5,
                        fontWeight:600,
                        cursor:"pointer",
                        transition:"all var(--tr)",
                        marginBottom:20,
                        fontFamily:"'Plus Jakarta Sans', sans-serif",
                        ...(tier.ctaStyle === "primary"
                          ? { background:"var(--accent)",color:"white",border:"none",boxShadow:"0 4px 18px rgba(30,58,138,0.3)" }
                          : tier.ctaStyle === "dark"
                          ? { background:"var(--navy)",color:"white",border:"none",boxShadow:"0 4px 14px rgba(43,45,66,0.2)" }
                          : { background:"white",color:"var(--navy)",border:"1px solid var(--border2)" }
                        )
                      }}
                    >
                      {tier.id === "free" && <DiscordIcon size={14} />}
                      {isEnterprise && <Icon name="mail" size={15} fill={1} />}
                      {tier.cta}
                      {!isEnterprise && <Icon name="arrow_forward" size={15} />}
                    </button>
                  </div>

                  {/* Feature list */}
                  <div style={{ borderTop:"1px solid var(--border)",padding:"20px 24px 28px",display:"flex",flexDirection:"column",gap:9,flex:1 }}>
                    <div style={{ fontSize:10,fontWeight:700,color:"var(--muted2)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>What's Included</div>
                    {tier.features.map((f, j) => (
                      <div key={j} className={`feature-row${!f.on ? " disabled" : ""}`}>
                        <CheckIcon on={f.on} />
                        <span>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reassurance strip */}
          <div style={{ marginTop:40,display:"flex",alignItems:"center",justifyContent:"center",gap:32,flexWrap:"wrap" }}>
            {[
              ["shield_lock","Secure Discord login"],
              ["credit_card_off","No card for free trial"],
              ["swap_horiz","Switch plans anytime"],
              ["cancel","Cancel anytime"],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:7,fontSize:13,color:"var(--muted2)" }}>
                <Icon name={icon} size={15} fill={1} style={{ color:"var(--slate)" }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section id="compare" style={{ padding:"88px 64px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:48 }}>
            <SectionLabel text="Full Comparison" />
            <h2 style={{ fontFamily:"'Outfit', sans-serif",fontWeight:600,fontSize:"clamp(26px,3.5vw,44px)",lineHeight:1.1,color:"var(--navy)",marginBottom:12 }}>Every Plan, Side by Side</h2>
            <p style={{ fontSize:16,color:"var(--muted)",lineHeight:1.8,fontWeight:300 }}>See exactly what's in each plan before you commit.</p>
          </div>

          <div style={{ borderRadius:16,overflow:"auto",border:"1px solid var(--border2)",boxShadow:"0 4px 24px rgba(43,45,66,0.08)" }}>
            <table style={{ width:"100%",minWidth:720,borderCollapse:"collapse",fontSize:13.5 }}>
              <thead>
                <tr style={{ background:"var(--navy)" }}>
                  <th style={{ padding:"16px 20px",textAlign:"left",fontWeight:600,fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.45)",borderBottom:"1px solid rgba(255,255,255,0.1)",width:"28%" }}>Feature</th>
                  {["Free","Starter","Pro","Enterprise"].map((h, i) => (
                    <th key={i} style={{ padding:"16px 10px",fontWeight:700,fontSize:11,letterSpacing:"0.05em",textTransform:"uppercase",textAlign:"center",color: h === "Pro" ? "var(--accent)" : "rgba(255,255,255,0.6)",borderBottom: h === "Pro" ? "2px solid var(--accent)" : "1px solid rgba(255,255,255,0.1)",background: h === "Pro" ? "rgba(30,58,138,0.1)" : "transparent" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_FEATURES.map((row, i) => (
                  <tr key={i} className="compare-row" style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"13px 20px",color:"var(--navy)",fontWeight:500,background: i%2===0 ? "white" : "var(--surface2)" }}>{row.label}</td>
                    {["free","starter","pro","enterprise"].map((plan, j) => (
                      <td key={j} style={{ padding:"13px 10px",textAlign:"center",background: plan==="pro" ? "rgba(30,58,138,0.02)" : i%2===0 ? "white" : "var(--surface2)" }}>
                        <CellVal v={row[plan]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding:"88px 64px",background:"var(--surface2)",borderTop:"1px solid var(--border)" }}>
        <div style={{ maxWidth:780,margin:"0 auto",textAlign:"center" }}>
          <SectionLabel text="Questions" />
          <h2 style={{ fontFamily:"'Outfit', sans-serif",fontWeight:600,fontSize:"clamp(26px,3.5vw,44px)",lineHeight:1.1,color:"var(--navy)",marginBottom:44 }}>Pricing Questions, Answered</h2>
          <div style={{ display:"flex",flexDirection:"column",gap:10,textAlign:"left" }}>
            {FAQS.map((f, i) => (
              <div
                key={i}
                className={`faq-item${faq === i ? " open" : ""}`}
                onClick={() => setFaq(faq === i ? null : i)}
              >
                <div style={{ padding:"17px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,fontSize:14.5,fontWeight:600,color: faq===i ? "var(--accent-deep)" : "var(--navy)",fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                  {f.q}
                  <span style={{ width:28,height:28,borderRadius:8,background: faq===i ? "rgba(30,58,138,0.08)" : "rgba(43,45,66,0.05)",display:"flex",alignItems:"center",justifyContent:"center",color: faq===i ? "var(--accent)" : "var(--muted2)",flexShrink:0,transition:"transform var(--tr),background var(--tr)",transform: faq===i ? "rotate(180deg)" : "none" }}>
                    <Icon name="expand_more" size={18} />
                  </span>
                </div>
                <div style={{ maxHeight: faq===i ? 200 : 0,overflow:"hidden",transition:"max-height 0.38s ease" }}>
                  <div style={{ padding:"0 22px 18px",fontSize:14,color:"var(--muted)",lineHeight:1.75,fontWeight:300 }}>{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"100px 64px",textAlign:"center",position:"relative",overflow:"hidden",background:"var(--navy)" }}>
        <div style={{ position:"absolute",top:-80,left:"25%",width:900,height:700,background:"radial-gradient(circle, rgba(30,58,138,0.12) 0%, transparent 70%)",pointerEvents:"none",zIndex:0 }} />
        <div style={{ position:"relative",zIndex:1,maxWidth:760,margin:"0 auto" }}>
          <SectionLabel text="Get Started Free" />
          <h2 style={{ fontFamily:"'Outfit', sans-serif",fontWeight:700,fontSize:"clamp(28px,4.5vw,56px)",color:"white",letterSpacing:"-0.01em",lineHeight:1.08,marginBottom:14 }}>Start free. Scale only when you're ready.</h2>
          <p style={{ fontSize:17,color:"rgba(255,255,255,0.55)",marginBottom:40,maxWidth:460,margin:"0 auto 36px",fontWeight:300,lineHeight:1.75 }}>No credit card. No commitment. Just upload your first document and watch Nori go to work.</p>
          <div style={{ display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap" }}>
            <button onClick={onInvite} className="btn-primary glow-accent" style={{ display:"flex",alignItems:"center",gap:10,padding:"15px 30px",borderRadius:12,fontSize:15,fontWeight:600,background:"#EF233C",color:"white",border:"none",cursor:"pointer",boxShadow:"0 0 28px rgba(239, 35, 60, 0.25)",transition:"all var(--tr)" }}>
              <DiscordIcon size={16} /> Add Nori Free
              <Icon name="arrow_forward" size={16} />
            </button>
            <a href="https://discord.gg/WrpaytBfN" target="_blank" rel="noopener noreferrer" style={{ display:"flex",alignItems:"center",gap:8,padding:"15px 24px",borderRadius:12,fontSize:15,fontWeight:500,background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.15)",textDecoration:"none",transition:"all var(--tr)" }}>
              <Icon name="mail" size={16} fill={1} /> Talk to Sales
            </a>
          </div>
          <p style={{ marginTop:22,fontSize:12,color:"rgba(255,255,255,0.28)" }}>Free tier available forever. Paid plans from $9/mo billed annually.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:"var(--surface3)",borderTop:"1px solid var(--border2)",padding:"48px 64px 36px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{
              width: 30, height: 30,
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
            </div>
            <span style={{ fontFamily:"'Outfit', sans-serif",fontWeight:600,fontSize:20,color:"var(--navy)" }}>Nori</span>
          </div>
          <div style={{ display:"flex",gap:24,flexWrap:"wrap" }}>
            {[
              { label: "Features", href: "#features", onClick: (e) => { e.preventDefault(); onBack?.("#features"); } },
              { label: "How it Works", href: "#howitworks", onClick: (e) => { e.preventDefault(); onBack?.("#howitworks"); } },
              { label: "Pricing", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
              { label: "Support", href: "https://discord.gg/WrpaytBfN" },
              { label: "Privacy Policy", onClick: onShowPrivacy },
              { label: "Terms & Conditions", onClick: onShowTerms },
            ].map((item, i) => (
              item.href ? (
                <a
                  key={i}
                  href={item.href}
                  onClick={item.onClick}
                  style={{ fontSize:13,color:"var(--muted)",textDecoration:"none",transition:"all var(--tr)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  key={i}
                  onClick={item.onClick}
                  style={{ fontSize:13,color:"var(--muted)",textDecoration:"none",cursor:"pointer",transition:"all var(--tr)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
                >
                  {item.label}
                </span>
              )
            ))}
          </div>
        </div>
        <div style={{ maxWidth:1200,margin:"24px auto 0",paddingTop:20,borderTop:"1px solid var(--border2)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap" }}>
          <span style={{ fontSize:12,color:"var(--muted2)" }}>© 2026 Nori · Not affiliated with Discord Inc.</span>
          <a href="mailto:support@noribot.dev" style={{ fontSize:12,color:"var(--accent-deep)",textDecoration:"none",fontWeight:600,transition:"color var(--tr)" }} onMouseEnter={e => e.currentTarget.style.color = "var(--navy)"} onMouseLeave={e => e.currentTarget.style.color = "var(--accent-deep)"}>support@noribot.dev</a>
          <span style={{ fontSize:12,color:"var(--muted2)" }}>Your docs. Your bot. Your community.</span>
        </div>
      </footer>
    </div>
  );
}