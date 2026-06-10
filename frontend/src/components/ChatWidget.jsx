import { useState, useEffect, useRef } from "react";
import { API } from "../utils/api.js";
import { Icon, OnlineDot, Spinner } from "./Common.jsx";

// ── Glowing Bot Avatar ──
function BotAvatar({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/LOGO.png" alt="VaultBot Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

export default function ChatWidget({ guildId, guildName }) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState({}); // { [messageIndex]: 'like' | 'dislike' }
  const [copiedIndex, setCopiedIndex] = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const suggestions = [
    { label: "Channel Management", q: "How do I configure channels?" },
    { label: "Knowledge Base", q: "How do I upload new documents?" },
    { label: "URL Crawler", q: "How do I crawl and ingest website content?" }
  ];

  useEffect(() => {
    setMessages([{
      role: "bot",
      text: `Hi! Ask me anything about ${guildName || "the knowledge base"}.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, [guildId, guildName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const sendQuery = async (queryText) => {
    if (!queryText || loading) return;
    setMessages(m => [...m, { 
      role: "user", 
      text: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setLoading(true);
    try {
      const d = await API.query(queryText, guildId);
      setMessages(m => [...m, { 
        role: "bot", 
        text: d.answer || d.response || JSON.stringify(d),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (e) {
      setMessages(m => [...m, { role: "bot", text: "Error: " + e.message, error: true }]);
    }
    setLoading(false);
  };

  const handleSend = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    sendQuery(q);
  };

  const handleSuggestionClick = (q) => {
    sendQuery(q);
  };

  const handleReact = (idx, type) => {
    setReactions(prev => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type
    }));
  };

  const handleCopy = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const WIDGET_CSS = `
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(16px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes pulse-dot {
      0% { box-shadow: 0 0 0 0 rgba(82, 183, 136, 0.7); }
      70% { box-shadow: 0 0 0 6px rgba(82, 183, 136, 0); }
      100% { box-shadow: 0 0 0 0 rgba(82, 183, 136, 0); }
    }
    @keyframes typing-bubble {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    .typing-indicator-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--muted);
      display: inline-block;
      animation: typing-bubble 1.2s infinite ease-in-out;
    }
    .typing-indicator-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator-dot:nth-child(3) { animation-delay: 0.4s; }
    
    .fancy-fab {
      background: linear-gradient(135deg, var(--navy) 0%, #1e2229 100%);
      box-shadow: 0 8px 24px rgba(43,45,66,0.18), inset 0 1px 0 rgba(255,255,255,0.12);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .fancy-fab:hover {
      transform: scale(1.04) translateY(-2px);
      box-shadow: 0 12px 32px rgba(43,45,66,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
    }
    .fancy-fab:active {
      transform: scale(0.98) translateY(0);
    }
    .message-bubble-bot {
      animation: slideInUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .message-bubble-user {
      animation: slideInUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WIDGET_CSS }} />

      {/* ── Chat panel ── */}
      <div style={{
        position: "fixed", bottom: 88, right: 24, width: 390, height: 550,
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: 24,
        boxShadow: "0 16px 48px rgba(43,45,66,0.15), 0 2px 8px rgba(43,45,66,0.05)",
        zIndex: 200,
        display: "flex", flexDirection: "column", overflow: "hidden",
        transform: open ? "scale(1) translateY(0)" : "scale(0.92) translateY(18px)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "all" : "none",
        transition: "transform .35s cubic-bezier(0.16,1,0.3,1), opacity .25s ease",
        transformOrigin: "bottom right",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 12,
          background: "linear-gradient(135deg, var(--navy) 0%, #1e2229 100%)",
          flexShrink: 0,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}>
          <BotAvatar size={36} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 14.5, fontWeight: 700, color: "#fff",
              fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.01em",
            }}>
              {guildName || "VaultBot"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 400, marginTop: 1 }}>
              Typically replies instantly
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8, width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(255,255,255,0.7)",
              transition: "all var(--tr)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            <Icon name="close" size={15} />
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "20px 18px",
          display: "flex", flexDirection: "column", gap: 18,
          background: "linear-gradient(to bottom, var(--surface-2) 0%, var(--bg) 100%)",
        }}>
          
          {/* Welcome Dashboard Block */}
          {messages.length <= 1 && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border2)",
              borderRadius: 16, padding: "20px 18px", display: "flex", flexDirection: "column",
              gap: 12, boxShadow: "var(--shadow-sm)", marginBottom: 4,
              animation: "slideInUp .35s ease both"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <BotAvatar size={40} />
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--navy)", margin: 0 }}>VaultBot Assistant</h3>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>AI Concierge</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0, fontWeight: 400 }}>
                Hello! I am trained on your server documents and configurations. Ask me anything to get instant help.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "message-bubble-user" : "message-bubble-bot"}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{
                    background: "linear-gradient(135deg, var(--navy) 0%, #1a1c23 100%)",
                    borderRadius: "16px 16px 4px 16px",
                    padding: "10px 16px",
                    fontSize: 13.5, color: "#fff",
                    maxWidth: 270, lineHeight: 1.55,
                    boxShadow: "0 4px 14px rgba(43,45,66,0.12)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: 10, color: "var(--muted2)", marginRight: 4 }}>
                    {msg.time}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <BotAvatar size={30} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                    <div style={{
                      background: msg.error ? "rgba(239,35,60,0.06)" : "var(--surface)",
                      border: `1px solid ${msg.error ? "var(--red-border)" : "var(--border2)"}`,
                      borderRadius: "4px 16px 16px 16px",
                      padding: "11px 16px",
                      fontSize: 13.5,
                      color: msg.error ? "var(--accent-deep)" : "var(--navy)",
                      maxWidth: 280, lineHeight: 1.6,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      {msg.text}
                    </div>
                    {/* Reactions & Helper Utilities */}
                    {!msg.error && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 4 }}>
                        <span style={{ fontSize: 10.5, color: "var(--muted2)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {msg.time || "Just now"}
                        </span>
                        <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--border2)" }} />
                        
                        {/* Like Button */}
                        <button
                          onClick={() => handleReact(i, "like")}
                          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", color: reactions[i] === "like" ? "var(--accent)" : "var(--muted2)", transition: "color 0.2s" }}
                        >
                          <Icon name="thumb_up" size={11} fill={reactions[i] === "like"} />
                        </button>
                        
                        {/* Dislike Button */}
                        <button
                          onClick={() => handleReact(i, "dislike")}
                          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", color: reactions[i] === "dislike" ? "var(--accent)" : "var(--muted2)", transition: "color 0.2s" }}
                        >
                          <Icon name="thumb_down" size={11} fill={reactions[i] === "dislike"} />
                        </button>
                        
                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopy(i, msg.text)}
                          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: "var(--muted2)", fontSize: 10, fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          <Icon name={copiedIndex === i ? "done" : "content_copy"} size={11} />
                          {copiedIndex === i && <span style={{ color: "#16a34a" }}>Copied</span>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Suggested Prompts Block */}
          {messages.length <= 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.8px", paddingLeft: 4 }}>
                Suggested Topics
              </div>
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSuggestionClick(s.q)}
                  style={{
                    padding: "10px 14px", background: "var(--surface)",
                    border: "1px solid var(--border2)", borderRadius: 12,
                    fontSize: 12.5, color: "var(--navy)", fontWeight: 500,
                    cursor: "pointer", transition: "all .2s ease",
                    display: "flex", alignItems: "center", gap: 10,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,35,60,0.08)";
                    e.currentTarget.style.color = "var(--accent-deep)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "var(--border2)";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)";
                    e.currentTarget.style.color = "var(--navy)";
                  }}
                >
                  <Icon name="chat_bubble_outline" size={13} style={{ color: "var(--accent)" }} />
                  <span style={{ flex: 1 }}>{s.q}</span>
                  <Icon name="arrow_forward" size={12} style={{ opacity: 0.5 }} />
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <BotAvatar size={30} />
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{
                  background: "var(--surface)", border: "1px solid var(--border2)",
                  borderRadius: "4px 16px 16px 16px",
                  padding: "12px 16px", display: "flex", gap: 4, alignItems: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}>
                  <span className="typing-indicator-dot" />
                  <span className="typing-indicator-dot" />
                  <span className="typing-indicator-dot" />
                </div>
                <span style={{ fontSize: 11, color: "var(--muted2)", fontStyle: "italic", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  searching documentation...
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: "12px 16px 16px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 8,
            background: "var(--surface-2)",
            border: "1.5px solid var(--border2)",
            borderRadius: 14,
            padding: "8px 8px 8px 14px",
            transition: "border-color var(--tr), box-shadow var(--tr)",
          }}
            onFocusCapture={e => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--red-dim)";
            }}
            onBlurCapture={e => {
              e.currentTarget.style.borderColor = "var(--border2)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 80) + "px";
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Ask VaultBot a question…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "var(--text)", fontSize: 13.5, lineHeight: 1.5,
                resize: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
                minHeight: 22, maxHeight: 80,
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                width: 32, height: 32, borderRadius: 10,
                border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                background: input.trim() && !loading ? "var(--navy)" : "var(--surface-3)",
                color: input.trim() && !loading ? "#fff" : "var(--muted2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all var(--tr)",
                boxShadow: input.trim() && !loading ? "0 2px 8px rgba(43,45,66,0.2)" : "none",
              }}
            >
              {loading
                ? <Spinner size={13} color="#fff" />
                : <Icon name="send" size={15} />
              }
            </button>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            marginTop: 8, fontSize: 11, color: "var(--muted2)",
            justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            <Icon name="verified" size={11} style={{ color: "var(--accent)" }} />
            Answers synced from server documentation
          </div>
        </div>
      </div>

      {/* ── FAB toggle ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fancy-fab"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 210,
          padding: open ? "0" : "10px 20px 10px 14px",
          width: open ? 54 : "auto", height: 54,
          borderRadius: open ? "50%" : 99,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          border: "none",
        }}
      >
        {open ? (
          <Icon name="close" size={22} style={{ color: "#fff", transition: "all .2s" }} />
        ) : (
          <>
            <BotAvatar size={28} />
            <span style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#fff", letterSpacing: "-0.01em" }}>
              Ask VaultBot
            </span>
          </>
        )}
      </button>
    </>
  );
}