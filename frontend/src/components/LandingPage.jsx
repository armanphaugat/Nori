import { useState, useEffect, useRef } from "react";

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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

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
    --red:         #EF233C;
    --red-deep:    #D90429;
    --red-dim:     rgba(239,35,60,0.12);
    --red-glow:    rgba(239,35,60,0.22);

    --bg:          var(--light);
    --surface1:    #ffffff;
    --surface2:    #f4f7f9;
    --surface3:    #e8edf1;
    --surface4:    #dde3ea;

    --accent:      var(--red);
    --accent-deep: var(--red-deep);
    --accent-glow: var(--red-glow);
    --accent-dim:  var(--red-dim);
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
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--slate); border-radius: 99px; }

  .glass {
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(16px);
    border: 1px solid var(--border);
  }
  .glass-hover:hover {
    background: rgba(255,255,255,0.92) !important;
    border-color: var(--border2) !important;
  }

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
    background: radial-gradient(circle, rgba(239,35,60,0.07) 0%, transparent 70%);
  }
  .bloom-slate {
    position: absolute; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(141,153,174,0.1) 0%, transparent 70%);
  }

  @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:none; } }
  @keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes tdot { 0%,100%{opacity:0.3;transform:translateY(0);} 50%{opacity:1;transform:translateY(-3px);} }
  @keyframes blink { 0%,100%{box-shadow:0 0 0 0 rgba(239,35,60,0.4);} 70%{box-shadow:0 0 0 8px transparent;} }
  @keyframes glow-pulse { 0%,100%{box-shadow:0 0 22px rgba(239,35,60,0.18);} 50%{box-shadow:0 0 40px rgba(239,35,60,0.35);} }
  @keyframes bounce-slow { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
  @keyframes antenna-wiggle { 0%,100%{transform:rotate(0deg);} 50%{transform:rotate(15deg);} }
  @keyframes pulse-eye { 0%,100%{transform:scaleY(1);} 48%{transform:scaleY(1);} 50%{transform:scaleY(0.1);} 52%{transform:scaleY(1);} }
  @keyframes scroll-mouse { 0%{opacity:0;transform:translateY(-4px);} 50%{opacity:1;} 100%{opacity:0;transform:translateY(8px);} }
  @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  @keyframes ripple { 0%{transform:scale(1);opacity:0.5;} 100%{transform:scale(2.2);opacity:0;} }

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

  .feat-card{transition:all 0.25s ease;}
  .feat-card:hover{background:rgba(255,255,255,0.98)!important;transform:translateY(-3px);box-shadow:0 20px 40px rgba(43,45,66,0.12);border-color:var(--border2)!important;}
  .feat-card:hover .feat-icon{box-shadow:0 0 18px var(--red-glow);}
  .step-wrap:hover .step-icon{border-color:var(--border2)!important;box-shadow:0 0 22px var(--red-glow)!important;}
  .use-card:hover{border-color:var(--border2)!important;transform:translateY(-3px);box-shadow:0 16px 32px rgba(43,45,66,0.1);}
  .nav-link:hover{color:var(--navy);background:rgba(43,45,66,0.06);}
  .btn-primary:hover{opacity:0.9;transform:translateY(-1px);box-shadow:0 0 36px var(--red-glow)!important;}
  .btn-ghost:hover{background:rgba(43,45,66,0.06)!important;color:var(--navy)!important;}
  .btn-sm:hover{background:var(--navy)!important;color:white!important;box-shadow:0 0 22px var(--slate-glow)!important;}

  .glow-red{animation:glow-pulse 3s ease infinite;}

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
    width:4px;height:8px;background:var(--accent);border-radius:99px;
    animation:scroll-mouse 1.6s cubic-bezier(0.4,0,0.2,1) infinite;
  }

  .shimmer-text {
    background: linear-gradient(90deg, var(--red-deep) 0%, var(--red) 30%, #ff6b7a 50%, var(--red) 70%, var(--red-deep) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3.5s linear infinite;
  }

  .hero-line {
    position: absolute;
    top: 0; right: 0;
    width: 1px; height: 100%;
    background: linear-gradient(to bottom, transparent, rgba(43,45,66,0.1), transparent);
    pointer-events: none;
  }

  .ripple-dot::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(239,35,60,0.35);
    animation: ripple 2s ease-out infinite;
  }
  .ripple-dot { position: relative; }

  /* Playfair Display for all headings */
  h1, h2, h3, h4 {
    font-family: 'Playfair Display', serif;
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

const FEATS = [
  { icon:"robot_2",        fill:1, color:"red",   title:"Your Own AI Discord Bot",      desc:"Stop answering the same questions over and over. Your bot handles them 24/7 so you don't have to." },
  { icon:"picture_as_pdf", fill:1, color:"slate",  title:"Upload Any Document",          desc:"Drop in your PDFs, notes, or spreadsheets. The bot reads them instantly and starts answering questions from them." },
  { icon:"language",       fill:1, color:"red",   title:"Import Entire Websites",       desc:"Paste a URL and watch it crawl your whole documentation site or knowledge base in one click." },
  { icon:"question_answer",fill:1, color:"slate",  title:"Answers From Your Content",   desc:"Every reply comes directly from what you've uploaded — not random internet guesses or hallucinations." },
  { icon:"tune",           fill:1, color:"red",   title:"Make It Sound Like You",       desc:"Give your bot a name, a personality, and a tone that matches your community. It's your brand, not ours." },
  { icon:"forum",          fill:1, color:"slate",  title:"Pick Which Channels It Uses",  desc:"The bot only shows up where you want it. Keep it focused, on-topic, and out of your off-topic channels." },
  { icon:"bar_chart",      fill:1, color:"red",   title:"See What's Being Asked",       desc:"A clean dashboard shows you the most common questions so you can fill gaps and improve over time." },
  { icon:"sync",           fill:1, color:"slate",  title:"Always Up to Date",            desc:"Set it and forget it. VaultBot checks your URLs regularly and pulls in any new content automatically." },
  { icon:"image_search",   fill:1, color:"red",   title:"Works on Screenshots Too",     desc:"Upload an image or screenshot and the bot reads the text inside it — no retyping anything by hand." },
  { icon:"translate",      fill:1, color:"slate",  title:"Speaks Your Members' Language","desc":"No matter what language someone asks in, the bot detects it and responds in kind. Every time." },
  { icon:"link",           fill:1, color:"red",   title:"Always Shows Its Sources",     desc:"Every answer links back to the exact document or page it came from. Full transparency, no mystery." },
  { icon:"search",         fill:1, color:"slate",  title:"Falls Back to Web Search",    desc:"If your docs don't cover it, the bot searches the web and clearly marks that the answer came from outside." },
];

const colorMap = {
  red:   { bg:"rgba(239,35,60,0.08)",   border:"rgba(239,35,60,0.25)",   text:"#D90429" },
  slate: { bg:"rgba(141,153,174,0.14)", border:"rgba(141,153,174,0.32)", text:"#5a6480" },
};

const STEPS = [
  { n:"01", color:"red",   icon:"shield_lock",  fill:1, title:"Sign In with Discord",    desc:"One click with your Discord account. No forms, no passwords, no setup headaches." },
  { n:"02", color:"slate", icon:"upload_file",  fill:1, title:"Add Your Content",        desc:"Drag in files, paste URLs, or point it at your documentation site. It handles the rest." },
  { n:"03", color:"red",   icon:"tune",         fill:1, title:"Customise How It Behaves", desc:"Choose which channels it joins, set its personality, and configure how it searches your content." },
  { n:"04", color:"slate", icon:"smart_toy",    fill:1, title:"Watch It Go to Work",     desc:"Your members ask questions. The bot answers instantly from your own content, every single time." },
];

const USE_CASES = [
  { tag:"Education", icon:"school",         fill:1, title:"Universities & Colleges", desc:"Students stop emailing staff about timetables and deadlines. The bot has the answers at 2am when you don't." },
  { tag:"Support",   icon:"support_agent",  fill:1, title:"Product & Customer Support", desc:"Train it on your help docs and let it handle the repetitive questions your team gets tired of answering." },
  { tag:"Gaming",    icon:"sports_esports", fill:1, title:"Gaming Communities",      desc:"Game wikis, patch notes, item stats — players get instant answers without digging through dozens of pages." },
  { tag:"Business",  icon:"business_center",fill:1, title:"Internal Team Servers",   desc:"Onboarding docs, HR policies, SOPs — new hires can ask anything and get an answer in seconds." },
];

const COMP = [
  ["Answers From Your Own Documents",    "yes","no",      "Generic bots guess or pull from the internet. VaultBot only uses what you give it."],
  ["PDF & File Uploads",                 "yes","no",      "Most bots can't read your files at all, let alone answer questions from them."],
  ["Crawl and Import Websites",          "yes","no",      "Other bots don't scan URLs or sync entire documentation sites automatically."],
  ["Keeps Content Automatically Fresh",  "yes","no",      "No other bot monitors your URLs and pulls updates without you lifting a finger."],
  ["Custom Bot Personality",             "yes","partial", "Others offer basic command prefixes. VaultBot lets you write full custom AI personas."],
  ["Usage Analytics Dashboard",         "yes","partial", "No visual view of what questions are being asked or where answers are coming from."],
];

const FAQS = [
  { q:"Do I need any technical skills to set this up?",    a:"None whatsoever. You log in with Discord, upload your files, and the bot is live. Everything is managed through a clean visual dashboard — no code, no configuration files, no technical knowledge needed." },
  { q:"Where does my uploaded content get stored?",        a:"Your documents and data stay on your own infrastructure. We never read, share, or use your content for anything other than powering your bot's answers." },
  { q:"What kinds of files can I upload?",                 a:"PDFs, Word documents, Excel spreadsheets, plain text files, images and screenshots (the bot reads the text inside them), and any public website URL or documentation site." },
  { q:"What happens when the bot doesn't know the answer?",a:"It first searches everything you've uploaded. If it can't find a good answer there, it falls back to a live web search — and clearly tells your members that the answer came from outside your documents." },
  { q:"Can I use it across multiple Discord servers?",     a:"Yes. Each server gets its own completely separate knowledge base and settings. Add it to as many servers as you want — they never interfere with each other." },
  { q:"How much does it cost?",                            a:"There's a free tier so you can try it out without any commitment. Paid plans unlock higher usage limits and priority support when you're ready to scale." },
];

const MQ_ITEMS = [
  "PDF & DOCX Upload","Website Ingestion","Vector Search","Keyword Search",
  "OCR Image Reading","Spreadsheet Support","Website Auto-Crawl","Language Detection","Conversation Memory","Source Citations",
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

function SectionLabel({ text }) {
  return (
    <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px",borderRadius:99,background:"rgba(239,35,60,0.08)",border:"1px solid rgba(239,35,60,0.22)",marginBottom:16 }}>
      <span style={{ width:3,height:16,borderRadius:2,background:"var(--accent)",display:"inline-block" }} />
      <span style={{ fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--accent-deep)",fontFamily:"'DM Sans',sans-serif" }}>{text}</span>
    </div>
  );
}

function H2({ children }) {
  return (
    <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:"clamp(28px,4vw,52px)",lineHeight:1.1,letterSpacing:"-0.01em",color:"var(--navy)",marginBottom:12 }}>{children}</h2>
  );
}

function Tick({ v }) {
  if (v === "yes") return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(239,35,60,0.1)",color:"var(--accent-deep)",fontSize:14,fontWeight:700 }}>✓</span>;
  if (v === "no")  return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(43,45,66,0.05)",color:"#c0c4d0",fontSize:14 }}>✗</span>;
  return                  <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(141,153,174,0.15)",color:"var(--slate)",fontSize:14 }}>~</span>;
}

export default function LandingPage({ user, onLogin, onShowDashboard ,onShowPricing}) {
  const [faq, setFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const pageRef = useReveal();

  const [playgroundMessages, setPlaygroundMessages] = useState([
    { sender:"bot", text:"Hey there 👋 I'm **Vaulty**, your server's AI assistant. Pick one of the questions below to see how I pull answers directly from uploaded documents — and show you exactly where I got them.", citations:[] }
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
    <div ref={pageRef} style={{ background:"var(--bg)",color:"var(--text)",minHeight:"100vh" }}>
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
        <a href="#" style={{ textDecoration:"none",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px rgba(43,45,66,0.25)",border:"1px solid rgba(43,45,66,0.2)" }}>
            <Icon name="shield_lock" size={16} fill={1} style={{ color:"white" }} />
          </div>
          <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:22,color:"var(--navy)",letterSpacing:"0.01em" }}>VaultBot</span>
        </a>
        <div className="hide900" style={{ display:"flex",alignItems:"center",gap:2 }}>
          {[["Features","#features"],["How it Works","#howitworks"],["Compare","#compare"],["FAQ","#faq"]].map(([l,h],i) => (
            <a key={i} href={h} className="nav-link" style={{ padding:"7px 15px",borderRadius:8,fontSize:13,fontWeight:500,letterSpacing:"0.02em",color:"var(--muted)",textDecoration:"none",transition:"all var(--tr)" }}>{l}</a>
          ))}
          <button
            onClick={onShowPricing}
            className="nav-link"
            style={{ padding:"7px 15px", borderRadius:8, fontSize:13, fontWeight:500,
            letterSpacing:"0.02em", color:"var(--muted)", background:"none",
            border:"none", cursor:"pointer", transition:"all var(--tr)" }}
          >
          Pricing
          </button>
          {user ? (
            <button onClick={onShowDashboard} className="btn-sm" style={{ marginLeft:12,display:"flex",alignItems:"center",gap:8,padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,background:"var(--surface1)",color:"var(--navy)",border:"1px solid var(--border2)",cursor:"pointer",transition:"all var(--tr)" }}>
              <Icon name="grid_view" size={15} /> Dashboard
            </button>
          ) : (
            <button onClick={onLogin} className="btn-sm" style={{ marginLeft:12,display:"flex",alignItems:"center",gap:8,padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,background:"var(--surface1)",color:"var(--navy)",border:"1px solid var(--border2)",cursor:"pointer",transition:"all var(--tr)" }}>
              <DiscordIcon /> Login with Discord
            </button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 64px",position:"relative",overflow:"hidden" }}>
        <div className="bloom" style={{ top:-80,left:"25%",width:800,height:700 }} />
        <div className="bloom-slate" style={{ bottom:"10%",right:"-5%",width:500,height:500 }} />
        <div className="hero-line" />

        <div className="hero-inner" style={{ width:"100%",maxWidth:1200,display:"flex",alignItems:"center",gap:72,paddingTop:64,position:"relative",zIndex:1 }}>
          {/* LEFT */}
          <div style={{ flex:1,minWidth:0 }}>
            <div className="a0" style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"6px 16px",borderRadius:99,background:"rgba(239,35,60,0.08)",border:"1px solid rgba(239,35,60,0.25)",fontSize:12,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"var(--accent-deep)",marginBottom:28 }}>
              <span className="ripple-dot" style={{ width:7,height:7,borderRadius:"50%",background:"var(--accent)",display:"inline-block" }} />
              AI Assistant for Discord
            </div>

            <h1 className="a1" style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"clamp(40px,5.5vw,76px)",lineHeight:1.04,letterSpacing:"-0.01em",color:"var(--navy)",marginBottom:22 }}>
              Your Discord Server<br />
              Deserves an{" "}
              <span className="shimmer-text">AI Brain</span>
            </h1>

            <p className="a2" style={{ fontSize:18,lineHeight:1.8,color:"var(--muted)",maxWidth:500,marginBottom:38,fontWeight:300 }}>
              Stop answering the same questions every day. VaultBot learns from your documents, PDFs, and websites — then handles member questions inside Discord, around the clock.
            </p>

            <div className="a3" style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:40 }}>
              <button onClick={user ? onShowDashboard : onLogin} className="btn-primary" style={{ display:"flex",alignItems:"center",gap:10,padding:"14px 28px",borderRadius:10,fontSize:15,fontWeight:600,background:"var(--navy)",color:"white",border:"none",cursor:"pointer",boxShadow:"0 4px 24px rgba(43,45,66,0.2)",transition:"all var(--tr)" }}>
                <DiscordIcon size={18} /> {user ? "Go to Dashboard" : "Add to Your Server"}
                <Icon name="arrow_forward" size={18} />
              </button>
              <button onClick={() => document.getElementById("playground")?.scrollIntoView({ behavior:"smooth" })} className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"14px 22px",borderRadius:10,fontSize:15,fontWeight:500,background:"white",color:"var(--muted)",border:"1px solid var(--border2)",cursor:"pointer",transition:"all var(--tr)" }}>
                See It in Action
              </button>
            </div>

            <div className="a4" style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--muted2)" }}>
              <Icon name="shield_lock" size={13} />
              Free to get started · No credit card · Secure Discord login
            </div>
          </div>

          {/* RIGHT — Discord mockup bento */}
          <div className="a5 hide900" style={{ width:380,flexShrink:0,position:"relative" }}>
            <div className="mascot-bounce" style={{ position:"absolute",top:-90,right:-30,zIndex:100,pointerEvents:"none",display:"flex",flexDirection:"column",alignItems:"center" }}>
              <div style={{ background:"var(--navy)",padding:"7px 13px",borderRadius:"12px 12px 0 12px",color:"white",fontSize:10,fontWeight:700,boxShadow:"0 8px 20px rgba(43,45,66,0.25)",marginBottom:8,whiteSpace:"nowrap",border:"none" }}>
                Hey! Try my live demo below! 🤖
              </div>
              <svg width="85" height="85" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter:"drop-shadow(0 8px 20px rgba(43,45,66,0.2))" }}>
                <rect x="18" y="24" width="64" height="52" rx="20" fill="#EDF2F4" stroke="#2B2D42" strokeWidth="3" />
                <rect x="23" y="29" width="54" height="42" rx="14" fill="white" />
                <g className="mascot-antenna">
                  <line x1="50" y1="24" x2="50" y2="12" stroke="#2B2D42" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="50" cy="9" r="5" fill="#EF233C" />
                </g>
                <g className="mascot-eye">
                  <circle cx="38" cy="48" r="6" fill="#2B2D42" />
                  <circle cx="38" cy="48" r="2.5" fill="white" />
                  <path d="M 57 48 Q 62 44 67 48" stroke="#2B2D42" strokeWidth="3" strokeLinecap="round" fill="none" />
                </g>
                <ellipse cx="32" cy="58" rx="3.5" ry="1.5" fill="#8D99AE" opacity="0.6" />
                <ellipse cx="68" cy="58" rx="3.5" ry="1.5" fill="#8D99AE" opacity="0.6" />
                <path d="M 46 56 Q 50 59 54 56" stroke="#2B2D42" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <rect x="12" y="42" width="6" height="16" rx="3" fill="#8D99AE" />
                <rect x="82" y="42" width="6" height="16" rx="3" fill="#8D99AE" />
              </svg>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gridTemplateRows:"repeat(6,1fr)",gap:14,height:480 }}>
              <div style={{ gridColumn:"1/7",gridRow:"1/5",borderRadius:14,overflow:"hidden",boxShadow:"0 20px 60px rgba(43,45,66,0.14)",border:"1px solid var(--border2)",background:"white" }}>
                <div style={{ background:"var(--navy)",padding:"12px 16px",borderBottom:"1px solid rgba(0,0,0,0.15)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <Icon name="tag" size={18} style={{ color:"rgba(255,255,255,0.5)" }} />
                    <span style={{ fontWeight:700,fontSize:13,color:"white" }}>general-support</span>
                  </div>
                  <div style={{ display:"flex",gap:14,color:"rgba(255,255,255,0.4)" }}>
                    <Icon name="search" size={17} />
                    <Icon name="inbox" size={17} />
                  </div>
                </div>
                <div style={{ padding:16,background:"#f8fafc",height:"calc(100% - 45px)",display:"flex",flexDirection:"column",gap:14 }}>
                  <div style={{ display:"flex",gap:10 }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--slate),var(--navy-mid))",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"white",fontWeight:700 }}>U</div>
                    <div>
                      <div style={{ fontSize:10,color:"var(--muted2)",marginBottom:3 }}>User · just now</div>
                      <div style={{ color:"var(--text)",fontSize:13.5,lineHeight:1.5 }}>What are the office hours for support?</div>
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:10,background:"rgba(239,35,60,0.04)",padding:12,borderRadius:8,border:"1px solid rgba(239,35,60,0.15)" }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:"var(--navy)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Icon name="robot_2" size={18} fill={1} style={{ color:"white" }} />
                    </div>
                    <div>
                      <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:4 }}>
                        <span style={{ fontWeight:700,fontSize:13,color:"var(--accent-deep)" }}>VaultBot</span>
                      </div>
                      <div style={{ color:"var(--text)",fontSize:13,lineHeight:1.6 }}>
                        Based on your docs, support is <strong style={{ color:"var(--navy)" }}>Mon–Fri, 9 AM – 5 PM</strong>.
                        <div style={{ marginTop:6,fontSize:11,color:"var(--accent)",display:"flex",alignItems:"center",gap:5 }}>
                          <Icon name="link" size={11} /> Source: FAQ document
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:10 }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--slate),var(--navy-mid))",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"white",fontWeight:700 }}>A</div>
                    <div style={{ background:"rgba(0,0,0,0.05)",padding:"10px 14px",borderRadius:8,display:"flex",gap:5,alignItems:"center" }}>
                      <span className="td"/><span className="td"/><span className="td"/>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ gridColumn:"1/4",gridRow:"5/7",borderRadius:12,padding:"20px 18px",display:"flex",flexDirection:"column",justifyContent:"center",background:"var(--navy)",border:"none",boxShadow:"0 8px 24px rgba(43,45,66,0.18)" }}>
                <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:32,color:"white",lineHeight:1 }}>1.2ms</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:6,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase" }}>Avg Response Time</div>
              </div>
              <div style={{ gridColumn:"4/7",gridRow:"5/7",borderRadius:12,padding:"20px 18px",display:"flex",flexDirection:"column",justifyContent:"center",background:"var(--accent)",border:"none",boxShadow:"0 8px 24px rgba(239,35,60,0.3)" }}>
                <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:32,color:"white",lineHeight:1 }}>99.9%</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:6,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase" }}>Uptime Guaranteed</div>
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

      {/* PLAYGROUND */}
      <section id="playground" style={{ padding:"96px 64px",background:"var(--surface2)",borderTop:"1px solid var(--border)",position:"relative" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:48 }}>
            <div className="rv"><SectionLabel text="Live Demo" /></div>
            <div className="rv"><H2>See It Answer a Real Question</H2></div>
            <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:560,margin:"0 auto",fontWeight:300 }}>
              Click any question below and watch Vaulty pull the answer straight from an uploaded document — and show you exactly which line it came from.
            </p>
          </div>

          <div style={{ display:"flex",gap:32,flexWrap:"wrap",alignItems:"flex-start" }}>
            <div style={{ flex:"1 1 340px",display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"var(--muted2)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4 }}>Choose a Question</div>
              {PLAYGROUND_PRESETS.map((p,idx) => (
                <button key={idx} onClick={() => handlePlaygroundRun(idx)} style={{ display:"flex",flexDirection:"column",gap:8,padding:"16px 20px",borderRadius:12,border:`1.5px solid ${activePreset===idx?"var(--accent)":"var(--border2)"}`,background:activePreset===idx?"rgba(239,35,60,0.05)":"white",color:"var(--navy)",cursor:"pointer",textAlign:"left",outline:"none",transition:"all var(--tr)",boxShadow:activePreset===idx?"0 4px 16px rgba(239,35,60,0.12)":"0 2px 8px rgba(43,45,66,0.06)" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:11,fontWeight:700,color:"var(--accent-deep)",textTransform:"uppercase",letterSpacing:"0.04em" }}>
                    <Icon name={p.citations[0].type==="pdf"?"picture_as_pdf":p.citations[0].type==="url"?"language":"description"} size={14} />
                    From: {p.citations[0].name}
                  </div>
                  <div style={{ fontSize:14,fontWeight:500,lineHeight:1.45,color:"var(--navy)" }}>"{p.question}"</div>
                </button>
              ))}

              {selectedCitation && (
                <div style={{ marginTop:16,padding:16,borderRadius:12,border:"1px solid rgba(239,35,60,0.25)",background:"rgba(239,35,60,0.04)" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:"var(--accent-deep)",marginBottom:8 }}>
                    <Icon name="verified" size={14} /> Exact Source Chunk Retrieved
                  </div>
                  <div style={{ fontSize:11,color:"var(--muted2)",marginBottom:6 }}>This is the passage the answer was pulled from:</div>
                  <div style={{ fontSize:12.5,color:"var(--text)",fontStyle:"italic",lineHeight:1.6,background:"rgba(43,45,66,0.04)",padding:"8px 12px",borderRadius:6 }}>
                    "{selectedCitation.text}"
                  </div>
                </div>
              )}
            </div>

            <div style={{ flex:"2 2 500px",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 50px rgba(43,45,66,0.14)",border:"1px solid var(--border2)",background:"white" }}>
              <div style={{ background:"var(--navy)",padding:"14px 20px",borderBottom:"1px solid rgba(0,0,0,0.15)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <Icon name="tag" size={20} style={{ color:"rgba(255,255,255,0.45)" }} />
                  <span style={{ fontWeight:700,fontSize:14,color:"white" }}>#vaulty-demo</span>
                </div>
                <div style={{ fontSize:11,fontWeight:700,color:"white",background:"rgba(239,35,60,0.7)",padding:"4px 10px",borderRadius:6,border:"none" }}>
                  LIVE DEMO
                </div>
              </div>

              <div style={{ padding:24,background:"#f8fafc",minHeight:340,display:"flex",flexDirection:"column",gap:20 }}>
                {playgroundMessages.map((msg,i) => (
                  <div key={i} style={{ display:"flex",gap:14,animation:"fadeUp 0.3s ease both" }}>
                    {msg.sender==="user" ? (
                      <>
                        <div style={{ width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,var(--slate),var(--navy))",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"white",fontWeight:700 }}>U</div>
                        <div>
                          <div style={{ fontSize:11,color:"var(--muted2)",marginBottom:4 }}>You · just now</div>
                          <div style={{ color:"var(--navy)",fontSize:14,lineHeight:1.5 }}>{msg.text}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width:38,height:38,borderRadius:"50%",background:"var(--navy)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(43,45,66,0.2)" }}>
                          <Icon name="robot_2" size={20} fill={1} style={{ color:"white" }} />
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                            <span style={{ fontWeight:700,fontSize:14,color:"var(--navy)" }}>Vaulty</span>
                            <span style={{ fontSize:9,fontWeight:800,textTransform:"uppercase",background:"var(--navy)",color:"white",padding:"2px 6px",borderRadius:4,letterSpacing:"0.05em" }}>BOT</span>
                            <span style={{ fontSize:11,color:"var(--muted2)" }}>· now</span>
                          </div>
                          <div style={{ color:"var(--text)",fontSize:13.5,lineHeight:1.65 }}>{msg.text}</div>
                          {msg.citations.length > 0 && (
                            <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginTop:12 }}>
                              {msg.citations.map((c,j) => (
                                <button key={j} onClick={() => setSelectedCitation(c)} style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(239,35,60,0.07)",border:"1px solid rgba(239,35,60,0.22)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,color:"var(--accent-deep)",cursor:"pointer",outline:"none",transition:"all var(--tr)" }}>
                                  <Icon name="link" size={12} />
                                  Source: {c.name}
                                  <span style={{ fontSize:10,opacity:0.6 }}>(Click to see)</span>
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
                    <div style={{ width:38,height:38,borderRadius:"50%",background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Icon name="robot_2" size={20} fill={1} style={{ color:"white" }} />
                    </div>
                    <div style={{ background:"rgba(43,45,66,0.06)",padding:"12px 18px",borderRadius:12,display:"flex",gap:6,alignItems:"center" }}>
                      <span className="td"/><span className="td"/><span className="td"/>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ overflow:"hidden",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",padding:"16px 0",background:"white" }}>
        <div className="mq" style={{ display:"flex",gap:44,alignItems:"center",whiteSpace:"nowrap" }}>
          {[...MQ_ITEMS,...MQ_ITEMS].map((m,i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:10,fontSize:13,fontWeight:500,color:"var(--muted)",flexShrink:0 }}>
              <div style={{ width:28,height:28,borderRadius:7,background:"var(--red-dim)",border:"1px solid rgba(239,35,60,0.18)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent-deep)" }}>
                <Icon name={MQ_ICONS[i%MQ_ICONS.length]} size={14} fill={1} />
              </div>
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ borderBottom:"1px solid var(--border)",background:"var(--navy)" }}>
        <div className="stats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",maxWidth:1100,margin:"0 auto" }}>
          {[
            { val:"9",  suf:"+", label:"Ways to Search Your Content", col:"white" },
            { val:"5",  suf:"+", label:"File Types Accepted",         col:"var(--accent)" },
            { val:"∞",  suf:"",  label:"Servers You Can Add It To",   col:"white" },
            { val:"90", suf:"%", label:"Cheaper Than Hiring Staff",   col:"var(--accent)" },
          ].map((s,i) => (
            <div key={i} style={{ padding:"36px 24px",textAlign:"center",borderRight:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:52,fontWeight:700,lineHeight:1,marginBottom:8 }}>
                <span style={{ color:s.col }}>{s.val}</span>
                <span style={{ color:"rgba(255,255,255,0.7)" }}>{s.suf}</span>
              </div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="howitworks" style={{ padding:"96px 64px",maxWidth:1200,margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:60 }}>
          <div className="rv"><SectionLabel text="Getting Started" /></div>
          <div className="rv"><H2>Live in Less Than 10 Minutes</H2></div>
          <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:520,margin:"0 auto",fontWeight:300 }}>Four simple steps and your server has its own AI assistant. No developers needed.</p>
        </div>
        <div className="steps-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,position:"relative" }}>
          <div style={{ position:"absolute",top:44,left:"12.5%",right:"12.5%",height:1,background:"linear-gradient(90deg,transparent,rgba(43,45,66,0.12),rgba(43,45,66,0.12),transparent)",pointerEvents:"none" }} />
          {STEPS.map((s,i) => {
            const c = colorMap[s.color];
            return (
              <div key={i} className="rv step-wrap" style={{ padding:"0 20px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",position:"relative",zIndex:1,transitionDelay:`${i*0.08}s` }}>
                <div className="step-icon" style={{ width:88,height:88,borderRadius:20,background:"white",border:"1px solid var(--border2)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,position:"relative",transition:"all 0.3s ease",color:c.text,boxShadow:"0 4px 16px rgba(43,45,66,0.08)" }}>
                  <Icon name={s.icon} size={34} fill={s.fill} />
                  <span style={{ position:"absolute",top:-10,right:-10,width:26,height:26,borderRadius:"50%",background:s.color==="red"?"var(--navy)":c.bg,border:`1px solid ${c.border}`,color:s.color==="red"?"white":c.text,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif" }}>{s.n}</span>
                </div>
                {i < 3 && <span style={{ position:"absolute",right:-8,top:30,color:"var(--muted2)",fontSize:20 }}>→</span>}
                <div style={{ fontSize:14,fontWeight:600,color:"var(--navy)",marginBottom:8,fontFamily:"'DM Sans',sans-serif" }}>{s.title}</div>
                <div style={{ fontSize:13.5,color:"var(--muted)",lineHeight:1.65,fontWeight:300 }}>{s.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:"96px 64px",background:"var(--surface2)" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div className="rv"><SectionLabel text="What It Does" /></div>
          <div className="rv"><H2>Everything Included, Nothing Extra to Buy</H2></div>
          <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:580,marginBottom:52,fontWeight:300 }}>Every plan includes the full feature set. No add-ons, no paywalls on core functionality, no nasty surprises.</p>

          <div className="rv feat-card" style={{ borderRadius:16,padding:"32px",marginBottom:20,display:"flex",flexDirection:"column",gap:20,position:"relative",overflow:"hidden",border:"1px solid var(--border2)",background:"white",boxShadow:"0 4px 24px rgba(43,45,66,0.08)" }}>
            <div className="feat-icon" style={{ width:52,height:52,borderRadius:14,background:"rgba(239,35,60,0.08)",border:"1px solid rgba(239,35,60,0.22)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent-deep)",transition:"all 0.3s ease" }}>
              <Icon name="dashboard_customize" size={26} fill={1} />
            </div>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:30,color:"var(--navy)",letterSpacing:"-0.01em" }}>One Dashboard. Total Control.</h3>
            <p style={{ fontSize:16,color:"var(--muted)",lineHeight:1.75,maxWidth:720,fontWeight:300 }}>Everything your bot needs lives in one place. Upload new files, add URLs, choose which channels it listens in, and watch your usage stats update in real time. No terminal. No config files. No calling your developer friend.</p>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              {["Drag & Drop Upload","Auto-Sync Scheduler","Usage Dashboard","Zero Code Required","Per-Channel Control"].map((t,i) => (
                <span key={i} style={{ background:"var(--surface3)",border:"1px solid var(--border)",padding:"5px 12px",borderRadius:6,fontSize:12,fontWeight:500,color:"var(--muted)",letterSpacing:"0.02em" }}>{t}</span>
              ))}
            </div>
            <div style={{ position:"absolute",right:-10,bottom:-10,opacity:0.03,pointerEvents:"none",color:"var(--navy)" }}>
              <Icon name="settings_suggest" size={200} fill={1} />
            </div>
          </div>

          <div className="feats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"var(--border)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden" }}>
            {FEATS.map((f,i) => {
              const c = colorMap[f.color];
              return (
                <div key={i} className="rv feat-card" style={{ background:"white",padding:24,transitionDelay:`${(i%3)*0.04}s` }}>
                  <div className="feat-icon" style={{ width:46,height:46,borderRadius:12,background:c.bg,border:`1px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,transition:"all 0.3s ease",color:c.text }}>
                    <Icon name={f.icon} size={22} fill={f.fill} />
                  </div>
                  <div style={{ fontSize:14,fontWeight:600,color:"var(--navy)",marginBottom:6 }}>{f.title}</div>
                  <div style={{ fontSize:13.5,color:"var(--muted)",lineHeight:1.6,fontWeight:300 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section style={{ padding:"96px 64px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div className="rv"><SectionLabel text="Who It's For" /></div>
          <div className="rv"><H2>Works for Any Kind of Community</H2></div>
          <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:580,marginBottom:52,fontWeight:300 }}>Whether you run a study server, a help desk, a fan community, or a work team — VaultBot fits straight in.</p>
          <div className="use-grid" style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20 }}>
            {USE_CASES.map((u,i) => (
              <div key={i} className="rv use-card" style={{ padding:32,borderRadius:16,transition:"all 0.25s ease",transitionDelay:`${i*0.05}s`,background:"white",border:"1px solid var(--border2)",boxShadow:"0 2px 12px rgba(43,45,66,0.06)" }}>
                <div style={{ width:50,height:50,borderRadius:14,background:"rgba(239,35,60,0.08)",border:"1px solid rgba(239,35,60,0.2)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18,color:"var(--accent-deep)" }}>
                  <Icon name={u.icon} size={24} fill={u.fill} />
                </div>
                <span style={{ display:"inline-block",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",background:"rgba(239,35,60,0.08)",color:"var(--accent-deep)",border:"1px solid rgba(239,35,60,0.2)",marginBottom:12 }}>{u.tag}</span>
                <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:600,color:"var(--navy)",marginBottom:10 }}>{u.title}</div>
                <div style={{ fontSize:14,color:"var(--muted)",lineHeight:1.65,fontWeight:300 }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BULLETS */}
      <section style={{ padding:"80px 64px",background:"var(--surface2)" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(420px,1fr))",gap:56 }}>
          {[
            { label:"The Real Benefits", title:"What you actually get when you add VaultBot", items:[["Stop repeating yourself","— the bot handles the same questions so your team doesn't have to"],["Reclaim your evenings","— it answers questions at midnight so you don't need to"],["Give instant answers","— no more 'I'll check and get back to you' delays"],["Reach everyone","— it auto-detects language and responds in kind, no extra setup"]] },
            { label:"What Members Say",  title:"The difference people notice straight away",       items:[["90% fewer repeated questions","from server members within the first week"],["Round-the-clock coverage","without paying for extra staff or stretching your team thin"],["10× faster replies","to common questions compared to waiting for a human response"],["Members feel heard","because they get a real answer, not a 'check the pinned posts' reply"]] },
          ].map((col,ci) => (
            <div key={ci} className="rv" style={{ transitionDelay:`${ci*0.12}s` }}>
              <SectionLabel text={col.label} />
              <H2>{col.title}</H2>
              <div style={{ display:"flex",flexDirection:"column",gap:14,marginTop:8 }}>
                {col.items.map(([b,r],j) => (
                  <div key={j} style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                    <div style={{ width:22,height:22,borderRadius:"50%",background:"rgba(239,35,60,0.1)",border:"1px solid rgba(239,35,60,0.22)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,color:"var(--accent-deep)" }}>
                      <Icon name="check" size={12} />
                    </div>
                    <span style={{ fontSize:15,color:"var(--muted)",lineHeight:1.6,fontWeight:300 }}>
                      <strong style={{ color:ci===0?"var(--navy)":"var(--accent-deep)",fontWeight:600 }}>{b}</strong>{r}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section id="compare" style={{ padding:"96px 64px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:52 }}>
            <div className="rv"><SectionLabel text="How We Compare" /></div>
            <div className="rv"><H2>Most Bots Can't Do This</H2></div>
            <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:540,margin:"0 auto",fontWeight:300 }}>Other Discord bots give scripted replies. VaultBot actually reads your content and answers from it.</p>
          </div>
          <div className="rv" style={{ borderRadius:16,overflow:"hidden",border:"1px solid var(--border2)",boxShadow:"0 4px 24px rgba(43,45,66,0.08)" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:14 }}>
              <thead>
                <tr style={{ background:"var(--navy)" }}>
                  <th style={{ padding:"16px 24px",fontWeight:600,fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.45)",borderBottom:"1px solid rgba(255,255,255,0.1)",textAlign:"left" }}>Capability</th>
                  {["VaultBot","Other Bots","What's Missing"].map((h,i) => (
                    <th key={i} style={{ padding:"16px 24px",fontWeight:700,fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase",borderBottom:i===0?"2px solid var(--accent)":"1px solid rgba(255,255,255,0.1)",textAlign:i===2?"left":"center",color:i===0?"var(--accent)":"rgba(255,255,255,0.45)",background:i===0?"rgba(239,35,60,0.1)":"transparent" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMP.map((row,i) => (
                  <tr key={i} style={{ borderBottom:"1px solid var(--border)",background:i%2===0?"white":"var(--surface2)" }}>
                    <td style={{ padding:"14px 24px",color:"var(--navy)",fontWeight:500,fontSize:14 }}>{row[0]}</td>
                    <td style={{ padding:"14px 24px",textAlign:"center",background:"rgba(239,35,60,0.03)" }}><Tick v={row[1]} /></td>
                    <td style={{ padding:"14px 24px",textAlign:"center" }}><Tick v={row[2]} /></td>
                    <td style={{ padding:"14px 24px",color:"var(--muted)",fontSize:13,lineHeight:1.5,fontWeight:300 }}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding:"96px 64px",background:"var(--surface2)" }}>
        <div style={{ maxWidth:760,margin:"0 auto",textAlign:"center" }}>
          <div className="rv"><SectionLabel text="Questions" /></div>
          <div className="rv"><H2>Things People Usually Ask First</H2></div>
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:44,textAlign:"left" }}>
            {FAQS.map((f,i) => (
              <div key={i} className="rv" onClick={() => setFaq(faq===i?null:i)} style={{ background:"white",border:`1px solid ${faq===i?"rgba(239,35,60,0.3)":"var(--border2)"}`,borderRadius:13,overflow:"hidden",cursor:"pointer",transition:"border-color var(--tr)",transitionDelay:`${i*0.04}s`,boxShadow:faq===i?"0 4px 16px rgba(239,35,60,0.08)":"0 2px 8px rgba(43,45,66,0.05)" }}>
                <div style={{ padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,fontSize:15,fontWeight:600,color:faq===i?"var(--accent-deep)":"var(--navy)",fontFamily:"'DM Sans',sans-serif" }}>
                  {f.q}
                  <span style={{ width:28,height:28,borderRadius:8,background:faq===i?"rgba(239,35,60,0.08)":"rgba(43,45,66,0.05)",display:"flex",alignItems:"center",justifyContent:"center",color:faq===i?"var(--accent)":"var(--muted2)",flexShrink:0,transition:"transform var(--tr),background var(--tr)",transform:faq===i?"rotate(180deg)":"none" }}>
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

      {/* CTA */}
      <section style={{ padding:"110px 64px",textAlign:"center",position:"relative",overflow:"hidden",background:"var(--navy)" }}>
        <div style={{ position:"absolute",top:-80,left:"25%",width:800,height:700,background:"radial-gradient(circle, rgba(239,35,60,0.12) 0%, transparent 70%)",pointerEvents:"none",zIndex:0 }} />
        <div style={{ position:"absolute",bottom:"10%",right:"-5%",width:500,height:500,background:"radial-gradient(circle, rgba(141,153,174,0.08) 0%, transparent 70%)",pointerEvents:"none",zIndex:0 }} />
        <div style={{ position:"relative",zIndex:1 }}>
          <div style={{ maxWidth:860,margin:"0 auto",borderRadius:28,padding:"80px 60px",display:"inline-block",width:"100%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)" }}>
            <div className="rv"><SectionLabel text="Get Started Free" /></div>
            <h2 className="rv" style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"clamp(30px,5vw,60px)",color:"white",letterSpacing:"-0.01em",lineHeight:1.08,marginBottom:16 }}>Ready to stop answering the same question twice?</h2>
            <p className="rv" style={{ fontSize:18,color:"rgba(255,255,255,0.55)",marginBottom:44,maxWidth:480,margin:"0 auto 40px",fontWeight:300 }}>Add VaultBot to your server in minutes. It's free to start and your members will notice the difference immediately.</p>
            <div className="rv" style={{ display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap" }}>
              <button onClick={onLogin} className="btn-primary glow-red" style={{ display:"flex",alignItems:"center",gap:10,padding:"16px 32px",borderRadius:14,fontSize:16,fontWeight:600,background:"var(--accent)",color:"white",border:"none",cursor:"pointer",boxShadow:"0 0 28px var(--red-glow)",transition:"all var(--tr)" }}>
                <DiscordIcon size={18} /> Add VaultBot to Discord
              </button>
              <a href="#features" className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"16px 26px",borderRadius:14,fontSize:16,fontWeight:500,background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.15)",textDecoration:"none",transition:"all var(--tr)" }}>
                See All Features →
              </a>
            </div>
            <p className="rv" style={{ marginTop:24,fontSize:13,color:"rgba(255,255,255,0.3)" }}>Free tier available. No credit card required to get started.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:"var(--surface3)",borderTop:"1px solid var(--border2)",padding:"56px 64px 40px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:32 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
              <div style={{ width:30,height:30,borderRadius:8,background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(43,45,66,0.2)" }}>
                <Icon name="shield_lock" size={15} fill={1} style={{ color:"white" }} />
              </div>
              <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:22,color:"var(--navy)" }}>VaultBot</span>
            </div>
            <p style={{ fontSize:14,color:"var(--muted)",lineHeight:1.75,maxWidth:340,marginBottom:24,fontWeight:300 }}>VaultBot is an AI assistant for Discord communities. Upload your documents, point it at your website, and let it answer your members' questions around the clock — accurately, instantly, and always with a source.</p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:24 }}>
            <div>
              <h4 style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--navy)",marginBottom:16,letterSpacing:"0.06em",textTransform:"uppercase" }}>Accepts These Formats</h4>
              <ul style={{ display:"flex",flexDirection:"column",gap:10,listStyle:"none",padding:0 }}>
                {["PDF Documents","Websites & URLs","Excel Spreadsheets","Images & Screenshots"].map((l,i) => (
                  <li key={i} style={{ fontSize:13.5,color:"var(--muted)",display:"flex",alignItems:"center",gap:8,fontWeight:300 }}>
                    <span style={{ width:4,height:4,borderRadius:"50%",background:"var(--accent)" }} />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--navy)",marginBottom:16,letterSpacing:"0.06em",textTransform:"uppercase" }}>Links</h4>
              <ul style={{ display:"flex",flexDirection:"column",gap:10,listStyle:"none",padding:0 }}>
                {["Add to Discord","Features","Pricing","Support"].map((l,i) => (
                <li
                key={i}
                onClick={l === "Pricing" ? onShowPricing : undefined}
                style={{ fontSize:13.5, color: l === "Pricing" ? "var(--accent-deep)" : "var(--muted)",
                display:"flex", alignItems:"center", gap:8, fontWeight:300,
                cursor: l === "Pricing" ? "pointer" : "default" }}
                >
                <span style={{ width:4,height:4,borderRadius:"50%",background:"var(--slate)" }} />
                {l}
                </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div style={{ maxWidth:1200,margin:"32px auto 0",paddingTop:24,borderTop:"1px solid var(--border2)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap" }}>
          <span style={{ fontSize:12,color:"var(--muted2)" }}>© 2026 VaultBot · Not affiliated with Discord Inc.</span>
          <span style={{ fontSize:12,color:"var(--muted2)" }}>Your docs. Your bot. Your community.</span>
        </div>
      </footer>
    </div>
  );
}