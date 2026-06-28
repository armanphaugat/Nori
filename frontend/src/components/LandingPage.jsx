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
    font-family: 'Plus Jakarta Sans', sans-serif;
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
  @keyframes float { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-8px);} }

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

  h1, h2, h3, h4 {
    font-family: 'Outfit', sans-serif;
  }

  .carousel-dot {
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all 0.3s ease;
  }
  .carousel-dot:hover {
    background: rgba(239,35,60,0.5) !important;
  }

  .show600 { display: none; }

  @media(max-width:1150px){
    .hero-inner {
      flex-direction: column !important;
      text-align: center;
      gap: 32px !important;
      padding-top: 96px !important;
    }
    .hero-inner > div {
      width: 100% !important;
    }
    .a5 {
      justify-content: center !important;
      margin-right: 0 !important;
      flex: 1 1 auto !important;
    }
    .a5 > div {
      width: 100% !important;
      max-width: 600px !important;
      transform: none !important;
    }
    p.a2 {
      margin-left: auto;
      margin-right: auto;
    }
    .a3 {
      justify-content: center;
    }
    .a4 {
      justify-content: center;
    }
    .hero-section {
      padding: 48px 24px !important;
    }
    nav {
      padding: 0 24px !important;
    }
  }

  @media(max-width:900px){
    .hide900{display:none!important;}
    .feats-grid{grid-template-columns:repeat(2,1fr)!important;}
    .steps-grid{grid-template-columns:repeat(2,1fr)!important;}
    .use-grid{grid-template-columns:1fr!important;}
    section {
      padding: 64px 24px !important;
    }
    nav {
      padding: 0 16px !important;
    }
  }
  @media(max-width:600px){
    .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
    .hero-inner{padding-top:80px!important;}
    .hide600{display:none!important;}
    .show600{display:inline!important;}
  }
`;

const FEATS = [
  { icon:"robot_2",        fill:1, color:"red",   title:"Your Own AI Discord Bot",      desc:"Stop answering the same questions over and over. Your bot handles them 24/7 so you don't have to." },
  { icon:"picture_as_pdf", fill:1, color:"slate",  title:"Upload Any Document",          desc:"Drop in your PDFs, notes, or spreadsheets. The bot reads them instantly and starts answering questions from them." },
  { icon:"language",       fill:1, color:"red",   title:"Import Entire Websites",       desc:"Paste a URL and watch it crawl your whole documentation site or knowledge base in one click." },
  { icon:"question_answer",fill:1, color:"slate",  title:"Answers From Your Content",   desc:"Every reply comes directly from what you've uploaded, not random internet guesses or hallucinations." },
  { icon:"tune",           fill:1, color:"red",   title:"Make It Sound Like You",       desc:"Give your bot a name, a personality, and a tone that matches your community. It's your brand, not ours." },
  { icon:"forum",          fill:1, color:"slate",  title:"Pick Which Channels It Uses",  desc:"The bot only shows up where you want it. Keep it focused, on-topic, and out of your off-topic channels." },
  { icon:"bar_chart",      fill:1, color:"red",   title:"See What's Being Asked",       desc:"A clean dashboard shows you the most common questions so you can fill gaps and improve over time." },
  { icon:"sync",           fill:1, color:"slate",  title:"Always Up to Date",            desc:"Set it and forget it. Nori checks your URLs regularly and pulls in any new content automatically." },
  { icon:"image_search",   fill:1, color:"red",   title:"Works on Screenshots Too",     desc:"Upload an image or screenshot and the bot reads the text inside it, no retyping anything by hand." },
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


const COMP = [
  ["Answers From Your Own Documents",    "yes","yes",     "Generic bots guess or pull from the internet. Nori only uses what you give it."],
  ["PDF & File Uploads",                 "yes","yes",     "Most bots can't read your files at all, let alone answer questions from them."],
  ["Crawl and Import Websites",          "yes","no",      "Other bots don't scan URLs or sync entire documentation sites automatically."],
  ["Keeps Content Automatically Fresh",  "yes","no",      "No other bot monitors your URLs and pulls updates without you lifting a finger."],
  ["Custom Bot Personality",             "yes","no",      "Others offer basic command prefixes. Nori lets you write full custom AI personas."],
  ["Usage Analytics Dashboard",          "yes","no",      "No visual view of what questions are being asked or where answers are coming from."],
];

const FAQS = [
  { q:"Do I need any technical skills to set this up?",    a:"None whatsoever. You log in with Discord, upload your files, and the bot is live. Everything is managed through a clean visual dashboard, no code, no configuration files, no technical knowledge needed." },
  { q:"Where does my uploaded content get stored?",        a:"Your documents and data stay on your own infrastructure. We never read, share, or use your content for anything other than powering your bot's answers." },
  { q:"What kinds of files can I upload?",                 a:"PDFs, Word documents, Excel spreadsheets, plain text files, images and screenshots (the bot reads the text inside them), and any public website URL or documentation site." },
  { q:"What happens when the bot doesn't know the answer?",a:"It first searches everything you've uploaded. If it can't find a good answer there, it falls back to a live web search, and clearly tells your members that the answer came from outside your documents." },
  { q:"Can I use it across multiple Discord servers?",     a:"Yes. Each server gets its own completely separate knowledge base and settings. Add it to as many servers as you want, they never interfere with each other." },
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

const TOTAL_SLIDES = 6;

function CarouselSlider() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef(null);

  const goTo = (idx) => {
    if (animating) return;
    setCurrent(idx);
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
      timeoutRef.current = setInterval(advance, 5000);
    }
  };

  const advance = () => {
    setAnimating(true);
    setCurrent(prev => (prev + 1) % TOTAL_SLIDES);
    setTimeout(() => setAnimating(false), 650);
  };

  useEffect(() => {
    timeoutRef.current = setInterval(advance, 3500);
    return () => clearInterval(timeoutRef.current);
  }, []);

  return (
    <div style={{
      position:"relative",
      width:"100%",
      borderRadius:16,
      border:"1px solid rgba(255, 255, 255, 0.12)",
      background:"#18191c",
      boxShadow:"0 24px 60px rgba(0, 0, 0, 0.35), 0 0 40px rgba(239, 35, 60, 0.12)",
      overflow:"hidden",
    }}>
      {/* Window Header */}
      <div style={{
        height:"38px",
        background:"#202225",
        borderBottom:"1px solid rgba(0,0,0,0.2)",
        display:"flex",
        alignItems:"center",
        padding:"0 16px",
        position:"relative"
      }}>
        {/* Dots */}
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          <div style={{ width:9,height:9,borderRadius:"50%",background:"#ff5f56" }} />
          <div style={{ width:9,height:9,borderRadius:"50%",background:"#ffbd2e" }} />
          <div style={{ width:9,height:9,borderRadius:"50%",background:"#27c93f" }} />
        </div>
        {/* Mock Address Bar */}
        <div style={{
          position:"absolute",
          left:"50%",
          top:"50%",
          transform:"translate(-50%,-50%)",
          background:"rgba(0,0,0,0.25)",
          border:"1px solid rgba(255,255,255,0.06)",
          padding:"3px 24px",
          borderRadius:6,
          fontSize:11,
          color:"rgba(255,255,255,0.45)",
          display:"flex",
          alignItems:"center",
          gap:6,
          letterSpacing:"0.02em"
        }}>
          <Icon name="lock" size={10} style={{ color:"rgba(255,255,255,0.3)" }} />
          <span>discord.com/channels/nori/demo</span>
        </div>
      </div>

      <div style={{ position:"relative", width:"100%", background:"#2f3136", overflow:"hidden", minHeight:420 }}>
        {/* Slide strip */}
        <div style={{
          display:"flex",
          width:`${TOTAL_SLIDES * 100}%`,
          transform:`translateX(-${(current * 100) / TOTAL_SLIDES}%)`,
          transition:"transform 0.65s cubic-bezier(0.77,0,0.18,1)",
        }}>
          {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
            <div
              key={i}
              style={{
                width:`${100 / TOTAL_SLIDES}%`,
                flexShrink:0,
                position:"relative",
                background:"#0e1118",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                padding:"24px 40px",
              }}
            >
              <div style={{
                position:"relative",
                width:"100%",
                height:"100%",
                borderRadius:10,
                overflow:"hidden",
                border:"1px solid rgba(255, 255, 255, 0.08)",
                boxShadow:"0 16px 40px rgba(0,0,0,0.45)",
                background:"#18191c"
              }}>
                <img
                  src={`/CHAT${i + 1}.png`}
                  alt={`Demo ${i + 1}`}
                  style={{
                    width:"100%",
                    height:"100%",
                    minHeight:380,
                    objectFit:"contain",
                    display:"block",
                  }}
                />
                {/* Glass reflection overlay */}
                <div style={{
                  position:"absolute",
                  inset:0,
                  background:"linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.12) 100%)",
                  pointerEvents:"none"
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Left arrow */}
        <button
          onClick={() => goTo((current - 1 + TOTAL_SLIDES) % TOTAL_SLIDES)}
          style={{
            position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
            width:36, height:36, borderRadius:"50%",
            background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.25)",
            color:"white", cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", zIndex:10, transition:"all 0.2s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.background="rgba(239,35,60,0.7)"}
          onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}
        >
          <Icon name="chevron_left" size={20} style={{ color:"white" }} />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => goTo((current + 1) % TOTAL_SLIDES)}
          style={{
            position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            width:36, height:36, borderRadius:"50%",
            background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.25)",
            color:"white", cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", zIndex:10, transition:"all 0.2s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.background="rgba(239,35,60,0.7)"}
          onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}
        >
          <Icon name="chevron_right" size={20} style={{ color:"white" }} />
        </button>

        {/* Dot indicators */}
        <div style={{
          position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)",
          display:"flex", gap:6, zIndex:10,
        }}>
          {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
            <button
              key={i}
              className="carousel-dot"
              onClick={() => goTo(i)}
              style={{
                width: current === i ? 22 : 7,
                height:7,
                borderRadius:99,
                background: current === i ? "var(--accent)" : "rgba(255,255,255,0.4)",
                border:"none",
              }}
            />
          ))}
        </div>

        {/* Counter badge */}
        <div style={{
          position:"absolute", top:12, right:12,
          fontSize:11, fontWeight:700, color:"white",
          background:"rgba(239,35,60,0.8)",
          padding:"4px 10px", borderRadius:6,
          letterSpacing:"0.05em", zIndex:10,
          backdropFilter:"blur(4px)",
        }}>
          {current + 1} / {TOTAL_SLIDES}
        </div>
      </div>
    </div>
  );
}

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
  return null;
}

function H2({ children }) {
  return (
    <h2 style={{ fontFamily:"'Outfit', sans-serif",fontWeight:600,fontSize:"clamp(28px,4vw,52px)",lineHeight:1.1,letterSpacing:"-0.01em",color:"var(--navy)",marginBottom:12 }}>{children}</h2>
  );
}

function Tick({ v }) {
  if (v === "yes") return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(34,197,94,0.1)",color:"#16a34a",fontSize:14,fontWeight:700 }}>✓</span>;
  if (v === "no")  return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(239,35,60,0.1)",color:"var(--accent)",fontSize:14,fontWeight:700 }}>✗</span>;
  return                  <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"rgba(141,153,174,0.15)",color:"var(--slate)",fontSize:14 }}>~</span>;
}

export default function LandingPage({ user, onLogin, onInvite, onShowDashboard, onShowPricing, onShowPrivacy, onShowTerms }) {
  const [faq, setFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const pageRef = useReveal();

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
        <a href="#" style={{ textDecoration:"none",display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <img
              src="/LOGO.png"
              alt="Nori"
              style={{ width:"100%",height:"100%",objectFit:"contain" }}
            />
          </div>
          <span style={{ fontFamily:"'Outfit', sans-serif",fontWeight:600,fontSize:22,color:"var(--navy)",letterSpacing:"0.01em" }}>Nori</span>
        </a>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          {/* Menu links - hidden below 900px */}
          <div className="hide900" style={{ display:"flex",alignItems:"center",gap:2 }}>
            {[["Features","#features"],["How it Works","#howitworks"]].map(([l,h],i) => (
              <a key={i} href={h} className="nav-link" style={{ padding:"7px 15px",borderRadius:8,fontSize:13,fontWeight:500,letterSpacing:"0.02em",color:"var(--muted)",textDecoration:"none",transition:"all var(--tr)" }}>{l}</a>
            ))}
            <button
              onClick={onShowPricing}
              className="nav-link"
              style={{ padding:"7px 15px",borderRadius:8,fontSize:13,fontWeight:500,letterSpacing:"0.02em",color:"var(--muted)",background:"none",border:"none",cursor:"pointer",transition:"all var(--tr)" }}
            >
              Pricing
            </button>
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
      <section className="hero-section" style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 64px",position:"relative",overflow:"hidden" }}>
        <div className="bloom" style={{ top:-80,left:"25%",width:800,height:700 }} />
        <div className="bloom-slate" style={{ bottom:"10%",right:"-5%",width:500,height:500 }} />
        <div className="hero-line" />

        <div className="hero-inner" style={{ width:"100%",maxWidth:1300,display:"flex",alignItems:"center",gap:48,paddingTop:64,position:"relative",zIndex:1 }}>
          {/* LEFT */}
          <div style={{ flex:1,minWidth:0 }}>

            <h1 className="a1" style={{ fontFamily:"'Outfit', sans-serif",fontWeight:700,fontSize:"clamp(40px,5.5vw,76px)",lineHeight:1.04,letterSpacing:"-0.01em",color:"var(--navy)",marginBottom:22 }}>
              Your Discord Server<br />
              Deserves an{" "}
              <span className="shimmer-text">AI Brain</span>
            </h1>

            <p className="a2" style={{ fontSize:18,lineHeight:1.8,color:"var(--muted)",maxWidth:500,marginBottom:38,fontWeight:300 }}>
              Stop answering the same questions every day. Nori learns from your documents, PDFs, and websites, then handles member questions inside Discord, around the clock.
            </p>

            <div className="a3" style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:24 }}>
              <button onClick={onInvite} className="btn-primary" style={{ display:"flex",alignItems:"center",gap:10,padding:"14px 28px",borderRadius:10,fontSize:15,fontWeight:600,background:"var(--navy)",color:"white",border:"none",cursor:"pointer",boxShadow:"0 4px 24px rgba(43,45,66,0.2)",transition:"all var(--tr)" }}>
                <DiscordIcon size={18} /> Add to Your Server
                <Icon name="arrow_forward" size={18} />
              </button>
              <a href="https://discord.gg/YMsuKFQjUu" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"14px 22px",borderRadius:10,fontSize:15,fontWeight:500,background:"white",color:"var(--muted)",border:"1px solid var(--border2)",textDecoration:"none",transition:"all var(--tr)" }}>
                <DiscordIcon size={18} /> Come to Discord
              </a>
              <button onClick={() => document.getElementById("playground")?.scrollIntoView({ behavior:"smooth" })} className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"14px 22px",borderRadius:10,fontSize:15,fontWeight:500,background:"white",color:"var(--muted)",border:"1px solid var(--border2)",cursor:"pointer",transition:"all var(--tr)" }}>
                See It in Action
              </button>
              <button onClick={onShowPricing} className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"14px 22px",borderRadius:10,fontSize:15,fontWeight:500,background:"white",color:"var(--muted)",border:"1px solid var(--border2)",cursor:"pointer",transition:"all var(--tr)" }}>
                <Icon name="payments" size={18} style={{ color: "var(--accent)" }} /> View Pricing
              </button>
            </div>

            <div className="a4" style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--muted2)",marginTop:16 }}>
              <Icon name="shield_lock" size={13} />
              Free to get started · No credit card · 0.8s Response Time · Secure Discord login
            </div>
          </div>

          {/* RIGHT — static image */}
          <div className="a5 hide900" style={{ flex:"0 0 550px",display:"flex",alignItems:"center",justifyContent:"flex-end",marginRight:"-60px",position:"relative" }}>
            {/* Ambient diffuse back glow */}
            <div style={{
              position:"absolute",
              top:"10%",
              left:"20%",
              width:"70%",
              height:"70%",
              background:"radial-gradient(circle, rgba(239,35,60,0.28) 0%, transparent 70%)",
              filter:"blur(50px)",
              pointerEvents:"none",
              zIndex:0
            }} />

            <div style={{
              width:"800px",
              background:"#18191c",
              borderRadius:16,
              border:"1px solid rgba(255,255,255,0.12)",
              boxShadow:"0 24px 60px rgba(0, 0, 0, 0.35), 0 0 40px rgba(239, 35, 60, 0.12)",
              overflow:"hidden",
              position:"relative",
              zIndex:1,
              transform:"perspective(1000px) rotateY(-4deg) rotateX(2deg) rotateZ(-1deg)",
              transition:"transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
            onMouseEnter={e => e.currentTarget.style.transform="perspective(1000px) rotateY(0deg) rotateX(0deg) rotateZ(0deg) scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform="perspective(1000px) rotateY(-4deg) rotateX(2deg) rotateZ(-1deg)"}
            >
              {/* Window Header */}
              <div style={{
                height:"38px",
                background:"#202225",
                borderBottom:"1px solid rgba(0,0,0,0.2)",
                display:"flex",
                alignItems:"center",
                padding:"0 16px",
                position:"relative"
              }}>
                {/* Dots */}
                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                  <div style={{ width:9,height:9,borderRadius:"50%",background:"#ff5f56" }} />
                  <div style={{ width:9,height:9,borderRadius:"50%",background:"#ffbd2e" }} />
                  <div style={{ width:9,height:9,borderRadius:"50%",background:"#27c93f" }} />
                </div>
                {/* Mock Address Bar */}
                <div style={{
                  position:"absolute",
                  left:"50%",
                  top:"50%",
                  transform:"translate(-50%,-50%)",
                  background:"rgba(0,0,0,0.25)",
                  border:"1px solid rgba(255,255,255,0.06)",
                  padding:"3px 24px",
                  borderRadius:6,
                  fontSize:11,
                  color:"rgba(255,255,255,0.45)",
                  display:"flex",
                  alignItems:"center",
                  gap:6,
                  letterSpacing:"0.02em"
                }}>
                  <Icon name="lock" size={10} style={{ color:"rgba(255,255,255,0.3)" }} />
                  <span>discord.com/channels/nori</span>
                </div>
              </div>
              
              {/* Screenshot container */}
              <div style={{ background:"#2f3136", position:"relative" }}>
                <img
                  src="/CHAT.png"
                  alt="Nori in action"
                  style={{ width:"100%",display:"block",objectFit:"contain" }}
                />
                {/* Glass reflection overlay */}
                <div style={{
                  position:"absolute",
                  inset:0,
                  background:"linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.12) 100%)",
                  pointerEvents:"none"
                }} />
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

      {/* PLAYGROUND — now with carousel */}
      <section id="playground" style={{ padding:"96px 64px",background:"var(--surface2)",borderTop:"1px solid var(--border)",position:"relative" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:48 }}>
            <div className="rv"><SectionLabel text="Feature Tour" /></div>
            <div className="rv"><H2>Take a Tour of the Interface</H2></div>
            <p className="rv" style={{ fontSize:17,color:"var(--muted)",lineHeight:1.8,maxWidth:560,margin:"0 auto",fontWeight:300 }}>
              Explore how Nori integrates into your channels. Flip through the features below to preview how answers, source citations, and documents appear inside Discord.
            </p>
          </div>

          <div style={{ display:"flex",gap:32,flexWrap:"wrap",alignItems:"flex-start" }}>
            {/* LEFT — question selector */}
            <div style={{ flex:"1 1 340px",display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"var(--muted2)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4 }}>What Nori Can Do</div>

               {[
                 { icon:"picture_as_pdf", label:"Reads your PDFs & documents",    sub:"Answers directly from uploaded files" },
                 { icon:"language",       label:"Crawls your websites & docs",    sub:"Auto-syncs new content automatically" },
                 { icon:"translate",      label:"Replies in any language",         sub:"Detects and matches member language" },
                 { icon:"link",           label:"Always cites its sources",        sub:"Every answer links back to the source" },
                 { icon:"image_search",   label:"Reads text from screenshots",    sub:"OCR on images, no retyping needed" },
                 { icon:"search",         label:"Falls back to web search",        sub:"Marks external answers clearly" },
               ].map((item, idx) => {
                 return (
                   <div
                     key={idx}
                     style={{
                       display:"flex",
                       alignItems:"center",
                       gap:12,
                       padding:"14px 18px",
                       borderRadius:12,
                       border:"1px solid var(--border2)",
                       background:"white",
                       boxShadow:"0 2px 8px rgba(43,45,66,0.03)",
                       transition:"all 0.25s ease",
                     }}
                   >
                     <div style={{
                       width:36,
                       height:36,
                       borderRadius:10,
                       background:"rgba(239,35,60,0.08)",
                       border:"1px solid rgba(239,35,60,0.2)",
                       display:"flex",
                       alignItems:"center",
                       justifyContent:"center",
                       flexShrink:0,
                       color:"var(--accent-deep)",
                       transition:"all 0.25s ease",
                     }}>
                       <Icon name={item.icon} size={18} fill={1} />
                     </div>
                     <div>
                       <div style={{ fontSize:13,fontWeight:600,color:"var(--navy)",marginBottom:2 }}>{item.label}</div>
                       <div style={{ fontSize:12,color:"var(--muted2)",fontWeight:300 }}>{item.sub}</div>
                     </div>
                   </div>
                 );
               })}
            </div>

            {/* RIGHT — carousel */}
            <div style={{ flex:"2 2 500px" }}>
              <CarouselSlider />
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
              <div style={{ fontFamily:"'Outfit', sans-serif",fontSize:52,fontWeight:700,lineHeight:1,marginBottom:8 }}>
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
                  <span style={{ position:"absolute",top:-10,right:-10,width:26,height:26,borderRadius:"50%",background:s.color==="red"?"var(--navy)":c.bg,border:`1px solid ${c.border}`,color:s.color==="red"?"white":c.text,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{s.n}</span>
                </div>
                {i < 3 && <span style={{ position:"absolute",right:-8,top:30,color:"var(--muted2)",fontSize:20 }}>→</span>}
                <div style={{ fontSize:14,fontWeight:600,color:"var(--navy)",marginBottom:8,fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{s.title}</div>
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
            <h3 style={{ fontFamily:"'Outfit', sans-serif",fontWeight:600,fontSize:30,color:"var(--navy)",letterSpacing:"-0.01em" }}>One Dashboard. Total Control.</h3>
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


      {/* MERGED BENEFITS & COMPARISON SECTION */}
      <section id="compare" style={{ padding:"96px 64px", background:"var(--surface2)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          
          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <div className="rv"><SectionLabel text="How We Compare" /></div>
            <div className="rv"><H2>What you actually get when you add Nori</H2></div>
            <p className="rv" style={{ fontSize:17, color:"var(--muted)", lineHeight:1.8, maxWidth:600, margin:"0 auto", fontWeight:300 }}>
              Other Discord bots give scripted replies. Nori actually reads your content and answers from it.
            </p>
          </div>

          {/* Benefits Cards Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginBottom: 56
          }}>
            {[
              ["Stop repeating yourself", "The bot handles repeated questions so your team doesn't have to."],
              ["Reclaim your evenings", "It answers questions at midnight so you don't need to."],
              ["Give instant answers", "No more 'I'll check and get back to you' delays."],
              ["Reach everyone", "It auto-detects language and responds in kind, no extra setup."]
            ].map(([title, desc], idx) => (
              <div key={idx} className="rv" style={{
                background: "white",
                padding: 24,
                borderRadius: 16,
                border: "1px solid var(--border2)",
                boxShadow: "var(--shadow-sm)",
                transitionDelay: `${idx * 0.05}s`
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#16a34a", marginBottom: 14
                }}>
                  <Icon name="check" size={16} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, fontWeight: 300 }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="rv" style={{ borderRadius:16, overflow:"hidden", border:"1px solid var(--border2)", boxShadow:"0 4px 24px rgba(43,45,66,0.08)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
              <thead>
                <tr style={{ background:"var(--navy)" }}>
                  <th style={{ padding:"16px 24px", fontWeight:600, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", color:"rgba(255,255,255,0.45)", borderBottom:"1px solid rgba(255,255,255,0.1)", textAlign:"left" }}>Capability</th>
                  {["Nori","Other Bots","What's Missing"].map((h,i) => (
                    <th key={i} style={{ padding:"16px 24px", fontWeight:700, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", borderBottom:i===0?"2px solid var(--accent)":"1px solid rgba(255,255,255,0.1)", textAlign:i===2?"left":"center", color:i===0?"var(--accent)":"rgba(255,255,255,0.45)", background:i===0?"rgba(239,35,60,0.1)":"transparent" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMP.map((row,i) => (
                  <tr key={i} style={{ borderBottom:"1px solid var(--border)", background:i%2===0?"white":"var(--surface2)" }}>
                    <td style={{ padding:"14px 24px", color:"var(--navy)", fontWeight:500, fontSize:14 }}>{row[0]}</td>
                    <td style={{ padding:"14px 24px", textAlign:"center", background:"rgba(239,35,60,0.03)" }}><Tick v={row[1]} /></td>
                    <td style={{ padding:"14px 24px", textAlign:"center" }}><Tick v={row[2]} /></td>
                    <td style={{ padding:"14px 24px", color:"var(--muted)", fontSize:13, lineHeight:1.5, fontWeight:300 }}>{row[3]}</td>
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
                <div style={{ padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,fontSize:15,fontWeight:600,color:faq===i?"var(--accent-deep)":"var(--navy)",fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
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
            <h2 className="rv" style={{ fontFamily:"'Outfit', sans-serif",fontWeight:700,fontSize:"clamp(30px,5vw,60px)",color:"white",letterSpacing:"-0.01em",lineHeight:1.08,marginBottom:16 }}>Ready to stop answering the same question twice?</h2>
            <p className="rv" style={{ fontSize:18,color:"rgba(255,255,255,0.55)",marginBottom:44,maxWidth:480,margin:"0 auto 40px",fontWeight:300 }}>Add Nori to your server in minutes. It's free to start and your members will notice the difference immediately.</p>
            <div className="rv" style={{ display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap" }}>
              <button onClick={onInvite} className="btn-primary glow-red" style={{ display:"flex",alignItems:"center",gap:10,padding:"16px 32px",borderRadius:14,fontSize:16,fontWeight:600,background:"var(--accent)",color:"white",border:"none",cursor:"pointer",boxShadow:"0 0 28px var(--red-glow)",transition:"all var(--tr)" }}>
                <DiscordIcon size={18} /> Add Nori to Discord
              </button>
              <a href="https://discord.gg/YMsuKFQjUu" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"16px 26px",borderRadius:14,fontSize:16,fontWeight:500,background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.15)",textDecoration:"none",transition:"all var(--tr)" }}>
                <DiscordIcon size={18} /> Come to Discord
              </a>
              <button onClick={onShowPricing} className="btn-ghost" style={{ display:"flex",alignItems:"center",gap:8,padding:"16px 26px",borderRadius:14,fontSize:16,fontWeight:500,background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.15)",cursor:"pointer",transition:"all var(--tr)" }}>
                <Icon name="payments" size={18} /> View Pricing Plans
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
      <footer style={{ background:"var(--surface3)", borderTop:"1px solid var(--border2)", padding:"24px 64px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", gap:20, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:30, height:30, display:"flex", alignItems:"center", justifyItems:"center", justifyContent:"center" }}>
                <img
                  src="/LOGO.png"
                  alt="Nori"
                  style={{ width:"100%", height:"100%", objectFit:"contain" }}
                />
              </div>
              <span style={{ fontFamily:"'Outfit', sans-serif", fontWeight:600, fontSize:17, color:"var(--navy)" }}>Nori</span>
            </div>
            <span style={{ height:12, width:1, background:"var(--border2)" }} />
            <span style={{ fontSize:12, color:"var(--muted2)" }}>© 2026 Nori · Not affiliated with Discord Inc.</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
            <ul style={{ display:"flex", gap:16, listStyle:"none", padding:0, margin:0, flexWrap:"wrap", alignItems:"center" }}>
              {[
                { label: "Add to Discord", onClick: onInvite },
                { label: "Features", href: "#features" },
                { label: "Pricing", onClick: onShowPricing },
                { label: "Privacy Policy", onClick: onShowPrivacy },
                { label: "Terms", onClick: onShowTerms },
                { label: "Support", href: "https://discord.gg/YMsuKFQjUu", external: true },
              ].map((item, i) => (
                <li
                  key={i}
                  style={{ fontSize:12.5, color:"var(--muted)", fontWeight:300 }}
                >
                  {item.href ? (
                    <a
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      style={{ color: "var(--muted)", textDecoration: "none", transition: "all var(--tr)", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span
                      onClick={item.onClick}
                      style={{ color: "var(--muted)", cursor: "pointer", transition: "all var(--tr)" }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <span style={{ height:12, width:1, background:"var(--border2)" }} />
            <a href="https://discord.gg/YMsuKFQjUu" target="_blank" rel="noopener noreferrer" style={{ fontSize:12.5, color:"var(--accent-deep)", textDecoration:"none", fontWeight:600, transition:"color var(--tr)" }} onMouseEnter={e => e.currentTarget.style.color = "var(--navy)"} onMouseLeave={e => e.currentTarget.style.color = "var(--accent-deep)"}>Support Server</a>
          </div>
        </div>
      </footer>
    </div>
  );
}