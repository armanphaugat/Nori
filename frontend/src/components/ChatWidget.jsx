import { useState, useEffect, useRef } from "react";
import { API } from "../utils/api.js";
import { Icon, OnlineDot, Spinner } from "./Common.jsx";

export default function ChatWidget({ guildId, guildName }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Initialize messages when guildName changes or when mounted
  useEffect(() => {
    setMessages([{ role: "bot", text: `Hi! Ask me anything about ${guildName || "the knowledge base"}.` }]);
  }, [guildId, guildName]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const d = await API.query(q, guildId);
      setMessages(m => [...m, { role: "bot", text: d.answer || d.response || JSON.stringify(d) }]);
    } catch (e) {
      setMessages(m => [...m, { role: "bot", text: "Error: " + e.message, error: true }]);
    }
    setLoading(false);
  };

  return (
    <>
      <div style={{ position:"fixed",bottom:88,right:24,width:380,height:520,background:"var(--surface-lowest)",border:"1px solid rgba(199,196,215,0.4)",borderRadius:"var(--r-xl)",boxShadow:"var(--shadow-md)",zIndex:200,display:"flex",flexDirection:"column",overflow:"hidden",transform:open?"scale(1) translateY(0)":"scale(0.92) translateY(16px)",opacity:open?1:0,pointerEvents:open?"all":"none",transition:"transform .3s cubic-bezier(0.16,1,0.3,1), opacity .2s ease",transformOrigin:"bottom right" }}>
        <div style={{ padding:"14px 16px",borderBottom:"1px solid rgba(199,196,215,0.2)",display:"flex",alignItems:"center",gap:10,background:"var(--surface-low)",flexShrink:0 }}>
          <div style={{ width:32,height:32,borderRadius:"var(--r-md)",background:"var(--primary)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Icon name="hub" fill size={16} style={{ color:"#fff" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13.5,fontWeight:600 }}>{guildName || "VaultBot"}</div>
            <div style={{ fontSize:11,color:"var(--on-surface-variant)" }}>RAG Assistant</div>
          </div>
          <OnlineDot/>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12 }}>
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <div style={{ display:"flex",justifyContent:"flex-end" }}>
                  <div style={{ background:"var(--primary)",borderRadius:"12px 4px 12px 12px",padding:"9px 14px",fontSize:13.5,color:"#fff",maxWidth:260,lineHeight:1.5 }}>{msg.text}</div>
                </div>
              ) : (
                <div style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
                  <div style={{ width:26,height:26,borderRadius:6,background:"var(--primary-fixed)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <Icon name="hub" size={14} style={{ color:"var(--primary)" }}/>
                  </div>
                  <div style={{ background:msg.error?"var(--error-container)":"var(--surface-container)",border:`1px solid ${msg.error?"rgba(186,26,26,0.2)":"rgba(199,196,215,0.3)"}`,borderRadius:"4px 12px 12px 12px",padding:"10px 14px",fontSize:13.5,color:msg.error?"var(--error)":"var(--on-surface-variant)",maxWidth:280,lineHeight:1.6 }}>{msg.text}</div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
              <div style={{ width:26,height:26,borderRadius:6,background:"var(--primary-fixed)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <Icon name="hub" size={14} style={{ color:"var(--primary)" }}/>
              </div>
              <div style={{ background:"var(--surface-container)",border:"1px solid rgba(199,196,215,0.3)",borderRadius:"4px 12px 12px 12px",padding:"12px 14px",display:"flex",gap:4 }}>
                {[0,1,2].map(i => <span key={i} className="typing-dot" style={{ animationDelay:`${i*0.2}s` }}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        <div style={{ padding:"10px 12px 14px",borderTop:"1px solid rgba(199,196,215,0.2)",background:"var(--surface-low)",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"flex-end",gap:8,background:"var(--surface-lowest)",border:"1.5px solid var(--outline-variant)",borderRadius:"var(--r-md)",padding:"8px 8px 8px 14px" }}>
            <textarea ref={inputRef} value={input}
              onChange={e => { setInput(e.target.value); const el=e.target; el.style.height="auto"; el.style.height=Math.min(el.scrollHeight,80)+"px"; }}
              onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
              placeholder="Ask a question…" rows={1} disabled={loading}
              style={{ flex:1,background:"transparent",border:"none",outline:"none",color:"var(--on-surface)",fontSize:14,lineHeight:1.5,resize:"none",fontFamily:"'Inter',sans-serif",minHeight:22,maxHeight:80 }}/>
            <button onClick={send} disabled={loading||!input.trim()} style={{ width:32,height:32,borderRadius:"var(--r-sm)",border:"none",cursor:"pointer",background:input.trim()&&!loading?"var(--primary)":"var(--surface-container)",color:input.trim()&&!loading?"#fff":"var(--on-surface-variant)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all var(--tr)" }}>
              {loading ? <Spinner size={14} color="#fff"/> : <Icon name="send" size={16}/>}
            </button>
          </div>
        </div>
      </div>
      <button onClick={() => setOpen(o => !o)} style={{ position:"fixed",bottom:24,right:24,zIndex:210,width:54,height:54,borderRadius:"50%",background:open?"var(--surface-lowest)":"var(--primary)",border:`1.5px solid ${open?"rgba(199,196,215,0.4)":"transparent"}`,cursor:"pointer",boxShadow:open?"var(--shadow-sm)":"0 8px 28px rgba(70,72,212,0.35)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s" }}>
        <Icon name={open?"close":"chat"} size={22} style={{ color:open?"var(--on-surface)":"#fff" }}/>
      </button>
    </>
  );
}
