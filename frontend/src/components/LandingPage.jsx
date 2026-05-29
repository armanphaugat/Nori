import { useState, useEffect, useRef } from "react";

// ─── ICON HELPER ────────────────────────────────────────────────────────────
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.079.11 18.1.128 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

// ─── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  :root {
    --black:   #0B090A;
    --s1:      #0f0c0d;
    --s2:      #161A1D;
    --s3:      #1e1314;
    --s4:      #271718;
    --crimson-deep: #660708;
    --crimson:      #A4161A;
    --red:          #BA181B;
    --red-bright:   #E5383B;
    --warm-gray:    #B1A7A6;
    --silver:       #D3D3D3;
    --off-white:    #F5F3F4;
    --white:        #FFFFFF;

    --accent:       var(--red);
    --accent-dim:   rgba(186,24,27,0.14);
    --accent-glow:  rgba(229,56,59,0.28);
    --accent-light: #f07274;
    --border:       rgba(255,255,255,0.07);
    --border2:      rgba(229,56,59,0.3);
    --text:         var(--off-white);
    --muted:        var(--warm-gray);
    --muted2:       #7a6f6f;
    --tr:           0.2s cubic-bezier(0.4,0,0.2,1);
  }

  body {
    background: var(--black);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #2a1515; border-radius: 99px; }

  .glass {
    background: rgba(22,10,11,0.65);
    backdrop-filter: blur(14px);
    border: 1px solid var(--border);
  }
  .glass-hover:hover {
    background: rgba(30,12,13,0.85) !important;
    border-color: var(--border2) !important;
  }

  /* Noise */
  .noise {
    position: fixed; top:0; left:0; width:100%; height:100%;
    opacity: 0.025; z-index: 9999; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  /* Bloom */
  .bloom {
    position: absolute; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(186,24,27,0.12) 0%, transparent 70%);
  }

  /* Animations */
  @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:none; } }
  @keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes tdot { 0%,100%{opacity:0.3;transform:translateY(0);} 50%{opacity:1;transform:translateY(-3px);} }
  @keyframes blink { 0%,100%{box-shadow:0 0 0 0 rgba(229,56,59,0.5);} 70%{box-shadow:0 0 0 8px transparent;} }
  @keyframes glow-pulse { 0%,100%{box-shadow:0 0 22px rgba(186,24,27,0.2);} 50%{box-shadow:0 0 40px rgba(229,56,59,0.38);} }
  @keyframes bounce-slow { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
  @keyframes antenna-wiggle { 0%,100%{transform:rotate(0deg);} 50%{transform:rotate(15deg);} }
  @keyframes pulse-eye { 0%,100%{transform:scaleY(1);} 48%{transform:scaleY(1);} 50%{transform:scaleY(0.1);} 52%{transform:scaleY(1);} }
  @keyframes scroll-mouse { 0%{opacity:0;transform:translateY(-4px);} 50%{opacity:1;} 100%{opacity:0;transform:translateY(8px);} }
  @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }

  .mascot-bounce { animation: bounce-slow 4s ease-in-out infinite; }
  .mascot-antenna { animation: antenna-wiggle 2.5s ease-in-out infinite; transform-origin: bottom center; display: inline-block; }
  .mascot-eye { animation: pulse-eye 5s ease-in-out infinite; transform-origin: center; }

  .a0{animation:fadeUp 0.55s ease both;}
  .a1{animation:fadeUp 0.55s 0.08s ease both;}
  .a2{animation:fadeUp 0.55s 0.17s ease both;}
  .a3{animation:fadeUp 0.55s 0.26s ease both;}
  .a4{animation:fadeUp 0.55s 0.35s ease both;}
  .a5{animation:fadeUp 0.55s 0.44s ease both;}

  .td{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--muted2);animation:tdot 1.2s ease infinite;}
  .td:nth-child(2){animation-delay:0.2s;}.td:nth-child(3){animation-delay:0.4s;}
  .mq{animation:marquee 32s linear infinite;}

  .rv{opacity:0;transform:translateY(24px);transition:opacity 0.6s ease,transform 0.6s ease;}
  .rv.on{opacity:1;transform:none;}

  /* Hover states */
  .feat-card{transition:all 0.25s ease;}
  .feat-card:hover{background:rgba(30,14,15,0.95)!important;transform:translateY(-3px);box-shadow:0 20px 40px rgba(0,0,0,0.4);border-color:var(--border2)!important;}
  .feat-card:hover .feat-icon{box-shadow:0 0 18px var(--accent-glow);}
  .step-wrap:hover .step-icon{border-color:var(--border2)!important;box-shadow:0 0 22px var(--accent-glow)!important;}
  .use-card:hover{border-color:var(--border2)!important;transform:translateY(-3px);}
  .nav-link:hover{color:#fff;background:rgba(255,255,255,0.05);}
  .btn-primary:hover{opacity:0.88;transform:translateY(-1px);box-shadow:0 0 36px var(--accent-glow)!important;}
  .btn-ghost:hover{background:rgba(255,255,255,0.06)!important;color:#fff!important;}
  .btn-sm:hover{background:var(--crimson)!important;box-shadow:0 0 22px var(--accent-glow)!important;}

  .glow-red{animation:glow-pulse 3s ease infinite;}

  /* Scroll indicator */
  .scroll-btn{
    position:absolute;bottom:30px;left:50%;transform:translateX(-50%);
    display:flex;flex-direction:column;align-items:center;gap:8px;
    font-size:11px;text-transform:uppercase;letter-spacing:0.1em;
    color:var(--muted2);text-decoration:none;z-index:10;
  }
  .scroll-wheel{
    width:22px;height:36px;border:2px solid var(--muted2);border-radius:99px;
    display:flex;justify-content:center;padding-top:6px;
  }
  .scroll-wheel-dot{
    width:4px;height:8px;background:var(--accent-light);border-radius:99px;
    animation:scroll-mouse 1.6s cubic-bezier(0.4,0,0.2,1) infinite;
  }

  /* Red shimmer text */
  .shimmer-text {
    background: linear-gradient(90deg, var(--red) 0%, var(--red-bright) 30%, #ff8a8c 50%, var(--red-bright) 70%, var(--red) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }

  /* Diagonal accent line on hero */
  .hero-line {
    position: absolute;
    top: 0; right: 0;
    width: 1px; height: 100%;
    background: linear-gradient(to bottom, transparent, rgba(186,24,27,0.25), transparent);
    pointer-events: none;
  }

  @media(max-width:900px){
    .hide900{display:none!important;}
    .feats-grid{grid-template-columns:repeat(2,1fr)!important;}
    .steps-grid{grid-template-columns:repeat(2,1fr)!important;}
    .use-grid{grid-template-columns:1fr!important;}
  }
  @media(max-width:600px){
    .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
    .hero-inner{padding-top:80px!important;}
  }
`;

// ─── DATA ────────────────────────────────────────────────────────────────────
const FEATS = [
  { icon:"robot_2",       fill:1, color:"red",    title:"Your Own AI Discord Bot",     desc:"Create a custom AI chatbot for your Discord server trained on your own documents and websites." },
  { icon:"picture_as_pdf",fill:1, color:"crimson", title:"Upload PDFs & Files",         desc:"Upload PDFs, notes, Excel sheets, or text files and let the AI learn from them instantly." },
  { icon:"language",      fill:1, color:"red",    title:"Website Ingestion & Crawler",  desc:"Import any website URL or auto-crawl entire documentation folders in one click." },
  { icon:"question_answer",fill:1,color:"crimson",title:"Answers From Your Data",       desc:"The bot answers questions using your uploaded content instead of random internet guesses." },
  { icon:"tune",          fill:1, color:"red",    title:"Custom Bot Personality",       desc:"Change how the bot talks, behaves, and responds with your own custom system prompt instructions." },
  { icon:"forum",         fill:1, color:"crimson", title:"Choose Bot Channels",          desc:"Select exactly which Discord channels the bot can read and reply in." },
  { icon:"bar_chart",     fill:1, color:"red",    title:"Server Analytics",             desc:"Track usage, uploads, questions asked, and overall bot activity from a dashboard." },
  { icon:"sync",          fill:1, color:"crimson", title:"Auto URL Updation",           desc:"Automatically monitor and sync URLs to refresh the knowledge base with the latest updates." },
  { icon:"image_search",  fill:1, color:"red",    title:"Image & Screenshot OCR",       desc:"Upload screenshots or images and the bot extracts and indexes text from them automatically." },
  { icon:"translate",     fill:1, color:"crimson", title:"Auto Language Detection",      desc:"The bot automatically detects the user's language and replies in the same language every time." },
  { icon:"link",          fill:1, color:"red",    title:"Source Citations",             desc:"Every answer references the exact document or section it came from." },
  { icon:"search",        fill:1, color:"crimson", title:"Web Search Fallback",          desc:"When your docs don't have the answer, the bot searches the web and labels the result." },
];

const colorMap = {
  red:     { bg:"rgba(186,24,27,0.12)",  border:"rgba(229,56,59,0.28)",   text:"#f07274" },
  crimson: { bg:"rgba(102,7,8,0.2)",     border:"rgba(164,22,26,0.3)",    text:"#c97375" },
};

const STEPS = [
  { n:"01", color:"red",    icon:"shield_lock",  fill:1, title:"Login with Discord",    desc:"OAuth login verifies you're a server admin. No passwords, no extra signups." },
  { n:"02", color:"crimson",icon:"upload_file",  fill:1, title:"Upload Your Knowledge", desc:"Drag in PDFs, paste website URLs, or import Excel sheets. The crawler handles entire doc sites." },
  { n:"03", color:"red",    icon:"tune",         fill:1, title:"Tune & Configure",      desc:"Set which channels the bot watches, customize its persona, and dial in retrieval parameters." },
  { n:"04", color:"crimson",icon:"smart_toy",    fill:1, title:"Bot Goes Live",         desc:"Members ask questions in Discord and get precise answers pulled from your own documents." },
];

const USE_CASES = [
  { tag:"Education", icon:"school",        fill:1, title:"Universities & Colleges",  desc:"Answer student questions about timetables, syllabi, exam schedules, and campus policies — 24/7." },
  { tag:"Support",   icon:"support_agent", fill:1, title:"Product Support Servers",  desc:"Train the bot on your docs and let it handle tier-1 support. Fewer repeated questions." },
  { tag:"Gaming",    icon:"sports_esports",fill:1, title:"Gaming Communities",       desc:"Upload game wikis, patch notes, and guides. Let players ask strategy questions and get instant answers." },
  { tag:"Business",  icon:"business_center",fill:1,title:"Business Workspaces",     desc:"Internal knowledge base on Discord. HR policies, onboarding docs, SOPs — all queryable." },
];

const COMP = [
  ["RAG / Document Q&A",         "yes","no",      "No dynamic ingestion of PDFs or custom files; only static pre-programmed answers."],
  ["PDF & File Ingestion",        "yes","no",      "Lack semantic vector pipelines to parse custom notes, text files, and server docs."],
  ["Web Crawler & URL Ingestion", "yes","no",      "Cannot scan URL structures to crawl website hierarchies or sync online docs."],
  ["Auto URL Updation",           "yes","no",      "Cannot automatically monitor and refresh links to keep knowledge bases updated."],
  ["Custom Bot Personality",      "yes","partial", "Limited to basic prefix commands; cannot write fully flexible AI personalities."],
  ["Analytics Dashboard",         "yes","partial", "No visual tracking of query accuracy, source distribution, or chunk density."],
];

const FAQS = [
  { q:"Do I need to know coding to set it up?",          a:"No. Login with Discord, upload your files, and the bot is live. The dashboard handles everything visually." },
  { q:"Where is my uploaded data stored?",               a:"All your documents and embeddings are stored on your own server infrastructure. We never access or share your data." },
  { q:"What file types can I upload?",                   a:"PDF, TXT, DOCX, XLSX, images with OCR (.png, .jpg, .jpeg, .tiff, .bmp, .webp), and any public website URL or documentation site." },
  { q:"What happens if the bot doesn't know the answer?",a:"VaultBot first searches your documents. If nothing is found, it falls back to a live web search and clearly labels the result." },
  { q:"Can I use it on multiple Discord servers?",       a:"Yes. Each server gets its own isolated knowledge base and configuration. The architecture supports unlimited servers simultaneously." },
  { q:"Is it free?",                                     a:"We offer a free tier to get started. Paid plans unlock higher query limits and priority support." },
];

const MQ_ITEMS = [
  "PDF & DOCX Upload","Web URL Ingestion","FAISS Vector Search","BM25 Keyword Search",
  "OCR Image Ingestion","XLSX Structured Data","Website Auto-Crawler","Language Detection","Contextual Memory","Source Citations",
];
const MQ_ICONS = [
  "picture_as_pdf","language","hub","sort","image_search","table_chart",
  "travel_explore","translate","history","link",
];

const PLAYGROUND_PRESETS = [
  {
    question: "What is the final exam retake schedule?",
    answer: "According to the official **Academic Regulations.pdf**, final retakes are scheduled from **June 15th to June 22nd, 2026**. All applications must be submitted by June 8th.",
    citations: [{ name: "Academic Regulations.pdf", type: "pdf", text: "Section 4.2: Retake examinations for the Summer term will commence on June 15, 2026 and run through June 22, 2026. Deadlines for student registration are strictly enforced as June 8, 2026." }]
  },
  {
    question: "What is the refund policy for digital assets?",
    answer: "Per the **refund-policy URL**, digital assets can be refunded within **14 days** of purchase, provided the assets haven't been downloaded or imported into a project.",
    citations: [{ name: "refund-policy.html (URL)", type: "url", text: "Article 2 — Digital goods are eligible for a 14-day refund window. This eligibility is immediately voided upon download, license activation, or project integration." }]
  },
  {
    question: "Where do I find the Shadow Core in Chapter 3?",
    answer: "In the **game_guide.docx**, the Shadow Core is located behind the **waterfall cavern in Chapter 3**. Equip the Fire Shield before entering to withstand the heat.",
    citations: [{ name: "game_guide.docx", type: "docx", text: "Chapter 3: The Shadow Core lies hidden within the humid caverns behind the Great Waterfall. Fire protection (Shield or Potion) is required for traversal." }]
  },
];

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("on"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    ref.current.querySelectorAll(".rv").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px",borderRadius:99,background:"rgba(186,24,27,0.1)",border:"1px solid rgba(229,56,59,0.25)",marginBottom:16 }}>
      <span style={{ width:3,height:16,borderRadius:2,background:"var(--accent-light)",display:"inline-block" }} />
      <span style={{ fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--accent-light)",fontFamily:"'DM Sans',sans-serif" }}>{text}</span>
    </div>
  );
}

function H2({ children }) {
  return (
    <h2 style={{ fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:"clamp(26px,4vw,48px)",lineHeight:1.12,letterSpacing:"-0.01em",color:"#fff",marginBottom:12 }}>{children}</h2>
  );
}

function Tick({ v }) {
  if (v === "yes") return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(186,24,27,0.18)",color:"var(--accent-light)",fontSize:14,fontWeight:700 }}>✓</span>;
  if (v === "no")  return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,0.04)",color:"#454655",fontSize:14 }}>✗</span>;
  return                  <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(186,100,8,0.12)",color:"#d4892a",fontSize:14 }}>~</span>;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function LandingPage({ user, onLogin, onShowDashboard }) {
  const [faq, setFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const pageRef = useReveal();

  const [playgroundMessages, setPlaygroundMessages] = useState([
    { sender:"bot", text:"Hello! I am **Vaulty** 🤖, your server's custom RAG knowledge brain. Choose one of the preset questions below to see how I search through uploaded documents and respond with accurate, source-cited information!", citations:[] }
  ]);
  const [playgroundTyping, setPlaygroundTyping] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [selectedCitation, setSelectedCitation] = useState(null);

  const handlePlaygroundRun = (idx) => {
    if (playgroundTyping) return;
    const preset = PLAYGROUND_PRESETS[idx];
    setActivePreset(idx);
    setSelectedCitation(null);
    const updated = [...playgroundMessages, { sender:"user", text:preset.question, citations:[] }];
    setPlaygroundMessages(updated);
    setPlaygroundTyping(true);
    setTimeout(() => {
      setPlaygroundMessages([...updated, { sender:"bot", text:preset.answer, citations:preset.citations }]);
      setPlaygroundTyping(false);
    }, 1100);
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div ref={pageRef} style={{ background:"var(--black)",color:"var(--text)",minHeight:"100vh" }}>
      <style>{CSS}</style>
      <div className="noise" />

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:200,height:64,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 64px",
        background: scrolled ? "rgba(11,9,10,0.96)" : "rgba(11,9,10,0.75)",
        backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${scrolled ? "rgba(186,24,27,0.25)" : "var(--border)"}`,
        transition:"all 0.3s ease",
      }}>
        <a href="#" style={{ textDecoration:"none",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px var(--accent-glow)" }}>
            <Icon name="shield_lock" size={16} fill={1} style={{ color:"#fff" }} />
          </div>
          <span style={{ fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:20,color:"#fff",letterSpacing:"-0.01em" }}>VaultBot</span>
        </a>
        <div className="hide900" style={{ display:"flex",alignItems:"center",gap:2 }}>
          {[["Features","#features"],["How it Works","#howitworks"],["Compare","#compare"],["FAQ","#faq"]].map(([l,h],i) => (
            <a key={i} href={h} className="nav-link" style={{ padding:"7px 15px",borderRadius:8,fontSize:13,fontWeight:500,letterSpacing:"0.02em",color:"var(--muted)",textDecoration:"none",transition:"all var(--tr)" }}>{l}</a>
          ))}
          {user ? (
            <button onClick={onShowDashboard} className="btn-sm" style={{ marginLeft:12,display:"flex",alignItems:"center",gap:8,padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,background:"var(--red)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 0 16px var(--accent-glow)",transition:"all var(--tr)" }}>
              <Icon name="grid_view" size={15} /> Dashboard
            </button>
          ) : (
            <button onClick={onLogin} className="btn-sm" style={{ marginLeft:12,display:"flex",alignItems:"center",gap:8,padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,background:"var(--red)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 0 16px var(--accent-glow)",transition:"all var(--tr)" }}>
              <DiscordIcon /> Login with Discord
            </button>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 64px",position:"relative",overflow:"hidden" }}>
        <div className="bloom" style={{ top:-80,left:"25%",width:700,height:700 }} />
        <div className="bloom" style={{ bottom:"10%",right:"-5%",width:400,height:400,background:"radial-gradient(circle,rgba(102,7,8,0.15) 0%,transparent 70%)" }} />
        <div className="hero-line" />

        <div className="hero-inner" style={{ width:"100%",maxWidth:1200,display:"flex",alignItems:"center",gap:72,paddingTop:64,position:"relative",zIndex:1 }}>
          {/* LEFT */}
          <div style={{ flex:1,minWidth:0 }}>
            <div className="a0" style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"6px 16px",borderRadius:99,background:"rgba(186,24,27,0.1)",border:"1px solid rgba(229,56,59,0.28)",fontSize:12,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"var(--accent-light)",marginBottom:28 }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:"var(--red-bright)",animation:"blink 2s ease infinite",display:"inline-block" }} />
              RAG-Powered Discord AI
            </div>

            <h1 className="a1" style={{ fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:"clamp(38px,5.5vw,72px)",lineHeight:1.05,letterSpacing:"-0.015em",color:"#fff",marginBottom:22 }}>
              Give Your Discord<br />
              Server an{" "}
              <span className="shimmer-text">AI Brain</span>
            </h1>

            <p className="a2" style={{ fontSize:18,lineHeight:1.8,color:"var(--muted)",maxWidth:500,marginBottom:38,fontWeight:300 }}>
              VaultBot transforms your documents, PDFs, and websites into an intelligent Q&amp;A assistant that lives directly inside your Discord server.
            </p>

            <div className="a3" style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:40 }}>
              <button onClick={user ? onShowDashboard : onLogin} className="btn-primary" style={{ display:"flex",alignItems:"center",gap:10,padding:"14px 28px",borderRadius:10,fontSize:15,fontWeight:600,background:"var(--red)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 0 24px var(--accent-glow)",transition:"all var(--tr)" }}>
                <DiscordIcon size={18} /> {user ? "Go to Dashboard" : "Invite to Discord"}
                <Icon name="arrow_forward" size={18} />
              </button>
              <button onClick={() => document.getElementById("playground")?.scrollIntoView({ behavior:"smooth" })} className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"14px 22px",borderRadius:10,fontSize:15,fontWeight:500,background:"rgba(255,255,255,0.04)",color:"var(--muted)",border:"1px solid var(--border)",cursor:"pointer",transition:"all var(--tr)" }}>
                View Live Demo
              </button>
            </div>

            <div className="a4" style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--muted2)" }}>
              <Icon name="shield_lock" size={13} />
              Secure OAuth · Free tier available · No credit card required
            </div>
          </div>

          {/* RIGHT — Discord mockup bento */}
          <div className="a5 hide900" style={{ width:380,flexShrink:0,position:"relative" }}>
            <div className="mascot-bounce" style={{ position:"absolute",top:-90,right:-30,zIndex:100,pointerEvents:"none",display:"flex",flexDirection:"column",alignItems:"center" }}>
              <div style={{ background:"linear-gradient(135deg,var(--crimson-deep),var(--crimson))",padding:"7px 13px",borderRadius:"12px 12px 0 12px",color:"#fff",fontSize:10,fontWeight:700,boxShadow:"0 8px 20px rgba(102,7,8,0.4)",marginBottom:8,whiteSpace:"nowrap",border:"1px solid rgba(229,56,59,0.3)" }}>
                Hey! Try my live demo below! 🤖🔥
              </div>
              <svg width="85" height="85" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter:"drop-shadow(0 8px 20px rgba(186,24,27,0.45))" }}>
                <rect x="18" y="24" width="64" height="52" rx="20" fill="#1e0a0b" stroke="#BA181B" strokeWidth="3" />
                <rect x="23" y="29" width="54" height="42" rx="14" fill="#0f0505" />
                <g className="mascot-antenna">
                  <line x1="50" y1="24" x2="50" y2="12" stroke="#BA181B" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="50" cy="9" r="5" fill="#E5383B" />
                </g>
                <g className="mascot-eye">
                  <circle cx="38" cy="48" r="6" fill="#f07274" />
                  <circle cx="38" cy="48" r="2.5" fill="#fff" />
                  <path d="M 57 48 Q 62 44 67 48" stroke="#f07274" strokeWidth="3" strokeLinecap="round" fill="none" />
                </g>
                <ellipse cx="32" cy="58" rx="3.5" ry="1.5" fill="#E5383B" opacity="0.45" />
                <ellipse cx="68" cy="58" rx="3.5" ry="1.5" fill="#E5383B" opacity="0.45" />
                <path d="M 46 56 Q 50 59 54 56" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <rect x="12" y="42" width="6" height="16" rx="3" fill="#BA181B" />
                <rect x="82" y="42" width="6" height="16" rx="3" fill="#BA181B" />
              </svg>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gridTemplateRows:"repeat(6,1fr)",gap:14,height:480 }}>
              <div className="glass" style={{ gridColumn:"1/7",gridRow:"1/5",borderRadius:14,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.6)",border:"1px solid rgba(186,24,27,0.2)" }}>
                <div style={{ background:"#1a0b0c",padding:"12px 16px",borderBottom:"1px solid rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <Icon name="tag" size={18} style={{ color:"var(--muted2)" }} />
                    <span style={{ fontWeight:700,fontSize:13,color:"#fff" }}>general-support</span>
                  </div>
                  <div style={{ display:"flex",gap:14,color:"var(--muted2)" }}>
                    <Icon name="search" size={17} />
                    <Icon name="inbox" size={17} />
                  </div>
                </div>
                <div style={{ padding:16,background:"#200e0f",height:"calc(100% - 45px)",display:"flex",flexDirection:"column",gap:14 }}>
                  <div style={{ display:"flex",gap:10 }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#660708,#A4161A)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700 }}>U</div>
                    <div>
                      <div style={{ fontSize:10,color:"var(--muted2)",marginBottom:3 }}>User · just now</div>
                      <div style={{ color:"var(--text)",fontSize:13.5,lineHeight:1.5 }}>What are the office hours for support?</div>
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:10,background:"rgba(186,24,27,0.06)",padding:12,borderRadius:8,border:"1px solid rgba(186,24,27,0.18)" }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:"var(--red)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Icon name="robot_2" size={18} fill={1} style={{ color:"#fff" }} />
                    </div>
                    <div>
                      <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:4 }}>
                        <span style={{ fontWeight:700,fontSize:13,color:"var(--accent-light)" }}>VaultBot</span>
                      </div>
                      <div style={{ color:"var(--text)",fontSize:13,lineHeight:1.6 }}>
                        Based on your docs, support is <strong style={{ color:"#fff" }}>Mon–Fri, 9 AM – 5 PM</strong>.
                        <div style={{ marginTop:6,fontSize:11,color:"var(--accent-light)",display:"flex",alignItems:"center",gap:5 }}>
                          <Icon name="link" size={11} /> Source: FAQ document
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:10 }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#660708,#BA181B)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700 }}>A</div>
                    <div style={{ background:"rgba(0,0,0,0.2)",padding:"10px 14px",borderRadius:8,display:"flex",gap:5,alignItems:"center" }}>
                      <span className="td"/><span className="td"/><span className="td"/>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass" style={{ gridColumn:"1/4",gridRow:"5/7",borderRadius:12,padding:"20px 18px",display:"flex",flexDirection:"column",justifyContent:"center",border:"1px solid rgba(186,24,27,0.18)" }}>
                <div style={{ fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:32,color:"var(--accent-light)",lineHeight:1 }}>1.2ms</div>
                <div style={{ fontSize:11,color:"var(--muted2)",marginTop:6,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase" }}>Avg Query Latency</div>
              </div>
              <div className="glass" style={{ gridColumn:"4/7",gridRow:"5/7",borderRadius:12,padding:"20px 18px",display:"flex",flexDirection:"column",justifyContent:"center",border:"1px solid rgba(186,24,27,0.18)" }}>
                <div style={{ fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:32,color:"#c0bab9",lineHeight:1 }}>99.9%</div>
                <div style={{ fontSize:11,color:"var(--muted2)",marginTop:6,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase" }}>Uptime SLA</div>
              </div>
            </div>
          </div>
        </div>

        <a href="#playground" className="scroll-btn">
          <span style={{ marginBottom:6 }}>Scroll Down</span>
          <div className="scroll-wheel">
            <div className="scroll-wheel-dot" />
          </div>
        </a>
      </section>

      {/* ── PLAYGROUND ── */}
      <section id="playground" style={{ padding:"96px 64px",background:"var(--s1)",borderTop:"1px solid var(--border)",position:"relative" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:48 }}>
            <div className="rv"><SectionLabel text="Interactive Demo" /></div>
            <div className="rv"><H2>Test Vaulty's RAG Brain Live</H2></div>
            <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:600,margin:"0 auto",fontWeight:300 }}>
              See how Vaulty instantly ingests diverse sources, performs vector searches, and cites exact references. Click a preset below to try!
            </p>
          </div>

          <div style={{ display:"flex",gap:32,flexWrap:"wrap",alignItems:"flex-start" }}>
            {/* Presets */}
            <div style={{ flex:"1 1 340px",display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"var(--muted2)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4 }}>Select a Preset Question</div>
              {PLAYGROUND_PRESETS.map((p,idx) => (
                <button key={idx} onClick={() => handlePlaygroundRun(idx)} className="glass" style={{ display:"flex",flexDirection:"column",gap:8,padding:"16px 20px",borderRadius:12,border:`1.5px solid ${activePreset===idx?"var(--red)":"var(--border)"}`,background:activePreset===idx?"rgba(186,24,27,0.07)":"rgba(255,255,255,0.02)",color:"#fff",cursor:"pointer",textAlign:"left",outline:"none",transition:"all var(--tr)" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:11,fontWeight:700,color:"var(--accent-light)",textTransform:"uppercase",letterSpacing:"0.04em" }}>
                    <Icon name={p.citations[0].type==="pdf"?"picture_as_pdf":p.citations[0].type==="url"?"language":"description"} size={14} />
                    Source: {p.citations[0].name}
                  </div>
                  <div style={{ fontSize:14,fontWeight:500,lineHeight:1.45 }}>"{p.question}"</div>
                </button>
              ))}

              {selectedCitation && (
                <div className="glass" style={{ marginTop:16,padding:16,borderRadius:12,border:"1px solid rgba(186,24,27,0.3)",background:"rgba(186,24,27,0.04)" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:"var(--accent-light)",marginBottom:8 }}>
                    <Icon name="verified" size={14} /> Vector Semantic Match Details
                  </div>
                  <div style={{ fontSize:11,color:"var(--muted2)",marginBottom:6 }}>Source chunk retrieved by FAISS:</div>
                  <div style={{ fontSize:12.5,color:"var(--text)",fontStyle:"italic",lineHeight:1.6,background:"rgba(0,0,0,0.2)",padding:"8px 12px",borderRadius:6 }}>
                    "{selectedCitation.text}"
                  </div>
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="glass" style={{ flex:"2 2 500px",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 50px rgba(0,0,0,0.5)",border:"1px solid rgba(186,24,27,0.2)",background:"#1a0b0c" }}>
              <div style={{ background:"#160909",padding:"14px 20px",borderBottom:"1px solid rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <Icon name="tag" size={20} style={{ color:"var(--muted2)" }} />
                  <span style={{ fontWeight:700,fontSize:14,color:"#fff",fontFamily:"'DM Sans',sans-serif" }}>#vaulty-playground</span>
                </div>
                <div style={{ fontSize:11,fontWeight:700,color:"var(--accent-light)",background:"rgba(186,24,27,0.14)",padding:"4px 10px",borderRadius:6,border:"1px solid rgba(186,24,27,0.28)" }}>
                  PLAYGROUND RETRIEVAL SIMULATOR
                </div>
              </div>

              <div style={{ padding:24,background:"#200e0f",minHeight:340,display:"flex",flexDirection:"column",gap:20 }}>
                {playgroundMessages.map((msg,i) => (
                  <div key={i} style={{ display:"flex",gap:14,animation:"fadeUp 0.3s ease both" }}>
                    {msg.sender==="user" ? (
                      <>
                        <div style={{ width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#660708,#A4161A)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:700 }}>U</div>
                        <div>
                          <div style={{ fontSize:11,color:"var(--muted2)",marginBottom:4 }}>User · simulated</div>
                          <div style={{ color:"#fff",fontSize:14,lineHeight:1.5 }}>{msg.text}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width:38,height:38,borderRadius:"50%",background:"var(--red)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px var(--accent-glow)" }}>
                          <Icon name="robot_2" size={20} fill={1} style={{ color:"#fff" }} />
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                            <span style={{ fontWeight:700,fontSize:14,color:"#fff" }}>Vaulty</span>
                            <span style={{ fontSize:9,fontWeight:800,textTransform:"uppercase",background:"var(--red)",color:"#fff",padding:"2px 6px",borderRadius:4,letterSpacing:"0.05em" }}>BOT</span>
                            <span style={{ fontSize:11,color:"var(--muted2)" }}>· now</span>
                          </div>
                          <div style={{ color:"var(--text)",fontSize:13.5,lineHeight:1.65 }}>{msg.text}</div>
                          {msg.citations.length > 0 && (
                            <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginTop:12 }}>
                              {msg.citations.map((c,j) => (
                                <button key={j} onClick={() => setSelectedCitation(c)} style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(186,24,27,0.1)",border:"1px solid rgba(186,24,27,0.3)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,color:"var(--accent-light)",cursor:"pointer",outline:"none",transition:"all var(--tr)" }}>
                                  <Icon name="link" size={12} />
                                  Source: {c.name}
                                  <span style={{ fontSize:10,opacity:0.6 }}>(Click to view)</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {playgroundTyping && (
                  <div style={{ display:"flex",gap:14,alignItems:"center" }}>
                    <div style={{ width:38,height:38,borderRadius:"50%",background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Icon name="robot_2" size={20} fill={1} style={{ color:"#fff" }} />
                    </div>
                    <div style={{ background:"rgba(0,0,0,0.2)",padding:"12px 18px",borderRadius:12,display:"flex",gap:6,alignItems:"center" }}>
                      <span className="td"/><span className="td"/><span className="td"/>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ overflow:"hidden",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",padding:"16px 0",background:"var(--s2)" }}>
        <div className="mq" style={{ display:"flex",gap:44,alignItems:"center",whiteSpace:"nowrap" }}>
          {[...MQ_ITEMS,...MQ_ITEMS].map((m,i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:10,fontSize:13,fontWeight:500,color:"var(--muted)",flexShrink:0 }}>
              <div style={{ width:28,height:28,borderRadius:7,background:"var(--accent-dim)",border:"1px solid rgba(186,24,27,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent-light)" }}>
                <Icon name={MQ_ICONS[i%MQ_ICONS.length]} size={14} fill={1} />
              </div>
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ borderBottom:"1px solid var(--border)",background:"var(--s2)" }}>
        <div className="stats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",maxWidth:1100,margin:"0 auto" }}>
          {[
            { val:"9",  suf:"+", label:"Retrieval Modes",         col:"var(--accent-light)" },
            { val:"5",  suf:"+", label:"File Types Supported",    col:"var(--silver)" },
            { val:"∞",  suf:"",  label:"Servers You Can Add",     col:"var(--off-white)" },
            { val:"90", suf:"%", label:"Cheaper Than Other Bots", col:"var(--red-bright)" },
          ].map((s,i) => (
            <div key={i} style={{ padding:"36px 24px",textAlign:"center",borderRight:"1px solid var(--border)" }}>
              <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:48,fontWeight:400,lineHeight:1,marginBottom:8 }}>
                <span style={{ color:s.col }}>{s.val}</span>
                <span style={{ color:"#fff" }}>{s.suf}</span>
              </div>
              <div style={{ fontSize:12,color:"var(--muted2)",fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="howitworks" style={{ padding:"96px 64px",maxWidth:1200,margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:60 }}>
          <div className="rv"><SectionLabel text="Setup" /></div>
          <div className="rv"><H2>Up and Running in Minutes</H2></div>
          <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:520,margin:"0 auto",fontWeight:300 }}>Four steps from login to a live AI assistant on your Discord server.</p>
        </div>
        <div className="steps-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,position:"relative" }}>
          <div style={{ position:"absolute",top:44,left:"12.5%",right:"12.5%",height:1,background:"linear-gradient(90deg,transparent,rgba(186,24,27,0.2),rgba(186,24,27,0.2),transparent)",pointerEvents:"none" }} />
          {STEPS.map((s,i) => {
            const c = colorMap[s.color];
            return (
              <div key={i} className="rv step-wrap" style={{ padding:"0 20px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",position:"relative",zIndex:1,transitionDelay:`${i*0.08}s` }}>
                <div className="step-icon" style={{ width:88,height:88,borderRadius:20,background:"var(--s2)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,position:"relative",transition:"all 0.3s ease",color:c.text }}>
                  <Icon name={s.icon} size={34} fill={s.fill} />
                  <span style={{ position:"absolute",top:-10,right:-10,width:26,height:26,borderRadius:"50%",background:s.color==="red"?"var(--red)":c.bg,border:`1px solid ${c.border}`,color:s.color==="red"?"#fff":c.text,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif" }}>{s.n}</span>
                </div>
                {i < 3 && <span style={{ position:"absolute",right:-8,top:30,color:"var(--muted2)",fontSize:20 }}>→</span>}
                <div style={{ fontSize:14,fontWeight:600,color:"#fff",marginBottom:8,fontFamily:"'DM Sans',sans-serif" }}>{s.title}</div>
                <div style={{ fontSize:13.5,color:"var(--muted)",lineHeight:1.65,fontWeight:300 }}>{s.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding:"96px 64px",background:"var(--s2)" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div className="rv"><SectionLabel text="Capabilities" /></div>
          <div className="rv"><H2>Everything Your Bot Can Do</H2></div>
          <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:580,marginBottom:52,fontWeight:300 }}>A complete AI knowledge assistant built for Discord, with hybrid retrieval, deep customization, and multi-format ingestion.</p>

          {/* Feature hero card */}
          <div className="rv glass glass-hover feat-card" style={{ borderRadius:16,padding:"32px",marginBottom:20,display:"flex",flexDirection:"column",gap:20,position:"relative",overflow:"hidden",border:"1px solid rgba(186,24,27,0.18)" }}>
            <div className="feat-icon" style={{ width:52,height:52,borderRadius:14,background:"rgba(186,24,27,0.14)",border:"1px solid rgba(186,24,27,0.3)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent-light)",transition:"all 0.3s ease" }}>
              <Icon name="dashboard_customize" size={26} fill={1} />
            </div>
            <h3 style={{ fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:28,color:"#fff",letterSpacing:"-0.01em" }}>Live Admin Control & Auto-Sync Engine</h3>
            <p style={{ fontSize:16,color:"var(--muted)",lineHeight:1.75,maxWidth:720,fontWeight:300 }}>Manage your server's entire knowledge base through a sleek admin dashboard. Instantly drag & drop files, crawl website URLs in real-time, monitor whitelisted channels, and auto-discover web architectures — all without writing a single line of code.</p>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              {["Drag & Drop Ingestion","Auto-Sync Scheduler","Visual Analytics Panel","Zero-Code Setup","Per-Channel Controls"].map((t,i) => (
                <span key={i} style={{ background:"rgba(255,255,255,0.04)",border:"1px solid var(--border)",padding:"5px 12px",borderRadius:6,fontSize:12,fontWeight:500,color:"var(--muted)",letterSpacing:"0.02em" }}>{t}</span>
              ))}
            </div>
            <div style={{ position:"absolute",right:-10,bottom:-10,opacity:0.04,pointerEvents:"none" }}>
              <Icon name="settings_suggest" size={200} fill={1} />
            </div>
          </div>

          {/* Feature grid */}
          <div className="feats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,overflow:"hidden" }}>
            {FEATS.map((f,i) => {
              const c = colorMap[f.color];
              return (
                <div key={i} className="rv feat-card" style={{ background:"var(--s2)",padding:24,transitionDelay:`${(i%3)*0.04}s` }}>
                  <div className="feat-icon" style={{ width:46,height:46,borderRadius:12,background:c.bg,border:`1px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,transition:"all 0.3s ease",color:c.text }}>
                    <Icon name={f.icon} size={22} fill={f.fill} />
                  </div>
                  <div style={{ fontSize:14,fontWeight:600,color:"#fff",marginBottom:6 }}>{f.title}</div>
                  <div style={{ fontSize:13.5,color:"var(--muted)",lineHeight:1.6,fontWeight:300 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section style={{ padding:"96px 64px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div className="rv"><SectionLabel text="Use Cases" /></div>
          <div className="rv"><H2>Built for Every Community</H2></div>
          <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:580,marginBottom:52,fontWeight:300 }}>Whether you're running a university server, product support hub, or gaming community, VaultBot adapts to your needs.</p>
          <div className="use-grid" style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20 }}>
            {USE_CASES.map((u,i) => (
              <div key={i} className="rv use-card glass" style={{ padding:32,borderRadius:16,transition:"all 0.25s ease",transitionDelay:`${i*0.05}s` }}>
                <div style={{ width:50,height:50,borderRadius:14,background:"var(--accent-dim)",border:"1px solid rgba(186,24,27,0.25)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18,color:"var(--accent-light)" }}>
                  <Icon name={u.icon} size={24} fill={u.fill} />
                </div>
                <span style={{ display:"inline-block",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",background:"var(--accent-dim)",color:"var(--accent-light)",border:"1px solid rgba(186,24,27,0.25)",marginBottom:12 }}>{u.tag}</span>
                <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:20,fontWeight:400,color:"#fff",marginBottom:10 }}>{u.title}</div>
                <div style={{ fontSize:14,color:"var(--muted)",lineHeight:1.65,fontWeight:300 }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BULLETS ── */}
      <section style={{ padding:"80px 64px",background:"var(--s2)" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(420px,1fr))",gap:56 }}>
          {[
            { label:"How VaultBot Helps", title:"Save time & money with 24/7 automated support", items:[["Reduce support costs","by automating answers to common questions"],["Free up staff time","for more complex issues and strategic tasks"],["Provide instant answers","to your users, no matter the time of day"],["Multilingual support","in the user's preferred language automatically"]] },
            { label:"What Users Report",  title:"Real results from real Discord servers",          items:[["90% reduction","in repetitive support questions in active servers"],["24/7 coverage","without need for additional staff or overhead"],["10× faster responses","for common questions vs manual support"],["Improved satisfaction","through instant, source-cited answers"]] },
          ].map((col,ci) => (
            <div key={ci} className="rv" style={{ transitionDelay:`${ci*0.12}s` }}>
              <SectionLabel text={col.label} />
              <H2>{col.title}</H2>
              <div style={{ display:"flex",flexDirection:"column",gap:14,marginTop:8 }}>
                {col.items.map(([b,r],j) => (
                  <div key={j} style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                    <div style={{ width:22,height:22,borderRadius:"50%",background:"var(--accent-dim)",border:"1px solid rgba(186,24,27,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,color:"var(--accent-light)" }}>
                      <Icon name="check" size={12} />
                    </div>
                    <span style={{ fontSize:15,color:"var(--muted)",lineHeight:1.6,fontWeight:300 }}>
                      <strong style={{ color:ci===0?"#fff":"var(--accent-light)",fontWeight:600 }}>{b}</strong> {r}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section id="compare" style={{ padding:"96px 64px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:52 }}>
            <div className="rv"><SectionLabel text="Why VaultBot" /></div>
            <div className="rv"><H2>Built Different</H2></div>
            <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:540,margin:"0 auto",fontWeight:300 }}>VaultBot brings enterprise-grade RAG capabilities that other Discord bots simply don't offer.</p>
          </div>
          <div className="rv glass" style={{ borderRadius:16,overflow:"hidden",border:"1px solid rgba(186,24,27,0.15)" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:14 }}>
              <thead>
                <tr style={{ background:"var(--s3)" }}>
                  <th style={{ padding:"16px 24px",fontWeight:600,fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase",color:"var(--muted2)",borderBottom:"1px solid var(--border)",textAlign:"left" }}>Feature</th>
                  {["VaultBot AI","Other Bots","What's Missing?"].map((h,i) => (
                    <th key={i} style={{ padding:"16px 24px",fontWeight:700,fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase",borderBottom:i===0?"2px solid var(--red)":"1px solid var(--border)",textAlign:i===2?"left":"center",color:i===0?"var(--accent-light)":"var(--muted2)",background:i===0?"rgba(186,24,27,0.07)":"transparent" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMP.map((row,i) => (
                  <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"14px 24px",color:"var(--text)",fontWeight:500,fontSize:14 }}>{row[0]}</td>
                    <td style={{ padding:"14px 24px",textAlign:"center",background:"rgba(186,24,27,0.03)" }}><Tick v={row[1]} /></td>
                    <td style={{ padding:"14px 24px",textAlign:"center" }}><Tick v={row[2]} /></td>
                    <td style={{ padding:"14px 24px",color:"var(--muted)",fontSize:13,lineHeight:1.5,fontWeight:300 }}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding:"96px 64px",background:"var(--s2)" }}>
        <div style={{ maxWidth:760,margin:"0 auto",textAlign:"center" }}>
          <div className="rv"><SectionLabel text="FAQ" /></div>
          <div className="rv"><H2>Common Questions</H2></div>
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:44,textAlign:"left" }}>
            {FAQS.map((f,i) => (
              <div key={i} className="rv" onClick={() => setFaq(faq===i?null:i)} style={{ background:"var(--s3)",border:`1px solid ${faq===i?"rgba(186,24,27,0.35)":"var(--border)"}`,borderRadius:13,overflow:"hidden",cursor:"pointer",transition:"border-color var(--tr)",transitionDelay:`${i*0.04}s` }}>
                <div style={{ padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,fontSize:15,fontWeight:600,color:faq===i?"var(--accent-light)":"#fff",fontFamily:"'DM Sans',sans-serif" }}>
                  {f.q}
                  <span style={{ width:28,height:28,borderRadius:8,background:faq===i?"var(--accent-dim)":"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",color:faq===i?"var(--accent-light)":"var(--muted2)",flexShrink:0,transition:"transform var(--tr),background var(--tr)",transform:faq===i?"rotate(180deg)":"none" }}>
                    <Icon name="expand_more" size={18} />
                  </span>
                </div>
                <div style={{ maxHeight:faq===i?200:0,overflow:"hidden",transition:"max-height 0.38s ease" }}>
                  <div style={{ padding:"0 22px 18px",fontSize:14.5,color:"var(--muted)",lineHeight:1.75,fontWeight:300 }}>{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:"110px 64px",textAlign:"center",position:"relative",overflow:"hidden" }}>
        <div className="bloom" style={{ top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:900,height:600 }} />
        <div style={{ position:"relative",zIndex:1 }}>
          <div className="rv glass" style={{ maxWidth:860,margin:"0 auto",borderRadius:28,padding:"80px 60px",display:"inline-block",width:"100%",border:"1px solid rgba(186,24,27,0.2)" }}>
            <div className="rv"><SectionLabel text="Get Started" /></div>
            <h2 className="rv" style={{ fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:"clamp(30px,5vw,58px)",color:"#fff",letterSpacing:"-0.015em",lineHeight:1.1,marginBottom:16 }}>Ready to automate your support?</h2>
            <p className="rv" style={{ fontSize:18,color:"var(--muted)",marginBottom:44,maxWidth:480,margin:"0 auto 40px",fontWeight:300 }}>Login with Discord and configure your server's AI bot in minutes. Free to get started.</p>
            <div className="rv" style={{ display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap" }}>
              <button onClick={onLogin} className="btn-primary glow-red" style={{ display:"flex",alignItems:"center",gap:10,padding:"16px 32px",borderRadius:14,fontSize:16,fontWeight:600,background:"var(--red)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 0 28px var(--accent-glow)",transition:"all var(--tr)" }}>
                <DiscordIcon size={18} /> Add VaultBot to Discord
              </button>
              <a href="#features" className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"16px 26px",borderRadius:14,fontSize:16,fontWeight:500,background:"rgba(255,255,255,0.04)",color:"var(--muted)",border:"1px solid var(--border)",textDecoration:"none",transition:"all var(--tr)" }}>
                Browse Features →
              </a>
            </div>
            <p className="rv" style={{ marginTop:24,fontSize:13,color:"var(--muted2)" }}>Free tier available with free trial query credits included for every server.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"var(--s1)",borderTop:"1px solid var(--border)",padding:"56px 64px 40px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:32 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
              <div style={{ width:30,height:30,borderRadius:8,background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 14px var(--accent-glow)" }}>
                <Icon name="shield_lock" size={15} fill={1} style={{ color:"#fff" }} />
              </div>
              <span style={{ fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:20,color:"#fff" }}>VaultBot</span>
            </div>
            <p style={{ fontSize:14,color:"var(--muted)",lineHeight:1.75,maxWidth:340,marginBottom:24,fontWeight:300 }}>VaultBot is an advanced RAG knowledge base assistant designed for Discord servers. Securely crawl, parse, index, and query your documentation, manuals, sheets, and images in real-time.</p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:24 }}>
            <div>
              <h4 style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,color:"#fff",marginBottom:16,letterSpacing:"0.06em",textTransform:"uppercase" }}>Supported Ingestion</h4>
              <ul style={{ display:"flex",flexDirection:"column",gap:10,listStyle:"none",padding:0 }}>
                {["PDF Documents","Websites & URLs","Excel Sheets (XLSX)","OCR Images (PNG/JPG)"].map((l,i) => (
                  <li key={i} style={{ fontSize:13.5,color:"var(--muted)",display:"flex",alignItems:"center",gap:8,fontWeight:300 }}>
                    <span style={{ width:4,height:4,borderRadius:"50%",background:"var(--accent-light)" }} />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,color:"#fff",marginBottom:16,letterSpacing:"0.06em",textTransform:"uppercase" }}>Built With</h4>
              <ul style={{ display:"flex",flexDirection:"column",gap:10,listStyle:"none",padding:0 }}>
                {["FastAPI Framework","React Dashboard","PostgreSQL Storage","Graphlit Integration"].map((l,i) => (
                  <li key={i} style={{ fontSize:13.5,color:"var(--muted)",display:"flex",alignItems:"center",gap:8,fontWeight:300 }}>
                    <span style={{ width:4,height:4,borderRadius:"50%",background:"var(--silver)" }} />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div style={{ maxWidth:1200,margin:"32px auto 0",paddingTop:24,borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap" }}>
          <span style={{ fontSize:12,color:"var(--muted2)" }}>© 2026 VaultBot · Q-ARAG · Not affiliated with Discord Inc.</span>
          <span style={{ fontSize:12,color:"var(--muted2)" }}>Securely indexing the future.</span>
        </div>
      </footer>
    </div>
  );
}