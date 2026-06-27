import { useEffect } from "react";
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { min-height: 100%; }
  body {
    font-family: 'DM Sans', sans-serif;
    background: #f5f0eb;
    color: #0f0f0f;
    -webkit-font-smoothing: antialiased;
  }

  :root {
    --bg: #f5f0eb;
    --bg-s: #ede8e1;
    --bg-e: #e4ddd4;
    --bg-o: #d9d0c5;
    --border: rgba(15,15,15,0.10);
    --border-a: rgba(15,15,15,0.22);
    --border-focus: rgba(196,30,30,0.50);
    --text: #0f0f0f;
    --text-s: rgba(15,15,15,0.62);
    --text-m: rgba(15,15,15,0.38);
    --accent: #c41e1e;
    --accent-l: rgba(196,30,30,0.08);
    --accent-g: rgba(196,30,30,0.18);
    --accent-h: #a01515;
    --success: #1a7a4a;
    --success-bg: rgba(26,122,74,0.08);
    --danger: #c41e1e;
    --danger-bg: rgba(196,30,30,0.08);
    --warning: #b35c00;
    --warning-bg: rgba(179,92,0,0.08);
    --discord: #5865f2;
    --r-xs: 4px; --r-sm: 8px; --r-md: 12px; --r-lg: 18px; --r-xl: 24px; --r-full: 999px;
    --tr: 0.18s cubic-bezier(0.4,0,0.2,1);
  }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes spin     { to { transform:rotate(360deg) } }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .au  { animation: fadeUp .5s cubic-bezier(0.16,1,0.3,1) both; }
  .ai  { animation: fadeIn .3s ease both; }
  .d1{animation-delay:.06s} .d2{animation-delay:.12s} .d3{animation-delay:.18s}
  .d4{animation-delay:.24s} .d5{animation-delay:.30s} .d6{animation-delay:.36s}

  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(15,15,15,0.15); border-radius:99px; }

  .field {
    width:100%; background:var(--bg); border:1.5px solid var(--border);
    color:var(--text); border-radius:var(--r-sm); padding:10px 14px;
    font-size:13.5px; font-family:'DM Sans',sans-serif; outline:none;
    transition:border-color var(--tr), box-shadow var(--tr);
  }
  .field::placeholder { color:var(--text-m); }
  .field:focus { border-color:var(--border-focus); box-shadow:0 0 0 3px var(--accent-g); }
  .field-mono { font-family:'DM Mono',monospace!important; font-size:12px!important; }

  input[type=range] {
    -webkit-appearance:none; width:100%; height:4px;
    background:var(--bg-o); border-radius:99px; outline:none; cursor:pointer;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance:none; width:16px; height:16px;
    background:var(--accent); border-radius:50%; cursor:pointer;
    box-shadow:0 0 8px var(--accent-g); border:2px solid #fff; transition:transform .1s;
  }
  input[type=range]::-webkit-slider-thumb:hover { transform:scale(1.2); }

  .data-table { width:100%; border-collapse:collapse; font-size:13px; }
  .data-table th {
    padding:9px 14px; text-align:left; color:var(--text-m); font-weight:700;
    font-size:10.5px; letter-spacing:.06em; text-transform:uppercase;
    border-bottom:1px solid var(--border);
  }
  .data-table td {
    padding:11px 14px; border-bottom:1px solid rgba(15,15,15,0.05);
    color:var(--text-s); vertical-align:middle;
  }
  .data-table tr:hover td { background:var(--bg-e); color:var(--text); }
  .data-table.no-lines th, .data-table.no-lines td { border-bottom: none !important; }


  .drop-zone {
    border:1.5px dashed var(--border); border-radius:var(--r-md);
    padding:28px 20px; display:flex; flex-direction:column; align-items:center;
    gap:8px; cursor:pointer; transition:all var(--tr); text-align:center;
  }
  .drop-zone:hover { border-color:var(--accent); background:var(--accent-l); }

  .nav-link {
    padding:7px 14px; border-radius:var(--r-sm); font-size:13px; font-weight:500;
    color:var(--text-s); cursor:pointer; border:none; background:none;
    font-family:'DM Sans',sans-serif; transition:all var(--tr);
  }
  .nav-link:hover { color:var(--text); background:var(--bg-e); }

  .dash-tab {
    display:flex; align-items:center; gap:7px; padding:14px 16px;
    font-size:13px; font-weight:500; color:var(--text-s); cursor:pointer;
    border:none; background:none; font-family:'DM Sans',sans-serif;
    border-bottom:2px solid transparent; white-space:nowrap; transition:all var(--tr);
  }
  .dash-tab:hover { color:var(--text); }
  .dash-tab.active { color:var(--accent); border-bottom-color:var(--accent); }

  .feature-card {
    background:var(--bg); border:1px solid var(--border); border-radius:var(--r-md);
    padding:22px; transition:all var(--tr);
  }
  .feature-card:hover { border-color:var(--border-a); transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.07); }

  .card-hover { transition:all var(--tr); }
  .card-hover:hover { border-color:var(--border-a); transform:translateY(-1px); }

  @keyframes typing { 0%,100%{opacity:1} 50%{opacity:0.2} }
  .typing-dot {
    width:5px; height:5px; border-radius:50%;
    background:rgba(196,30,30,0.4); display:inline-block;
    animation:typing 1.2s ease infinite;
  }
`;

function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}
export default GlobalStyles;