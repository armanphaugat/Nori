import { useState, useEffect, useRef } from "react";
import { API } from "../utils/api.js";
import { Icon, OnlineDot, Spinner } from "./Common.jsx";

// ── Glowing Bot Avatar ──
function BotAvatar({ size = 32, showStatus = true }) {
  return (
    <div style={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: "50%",
      border: "1.5px solid var(--accent)",
      background: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      boxShadow: "0 2px 8px rgba(30,58,138, 0.15)",
    }}>
      <img
        src="/LOGO.png"
        alt="Nori Logo"
        style={{
          width: '76%',
          height: '76%',
          objectFit: 'contain',
          transform: "translateY(-1px)"
        }}
      />
      {showStatus && (
        <span style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: Math.max(8, size * 0.28),
          height: Math.max(8, size * 0.28),
          borderRadius: "50%",
          background: "#22c55e",
          border: "2px solid #fff",
          boxShadow: "0 0 8px rgba(34,197,94,0.6)",
          animation: "pulse-dot 2.5s infinite"
        }} />
      )}
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

  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const dragStart = useRef({
    mouseX: 0,
    mouseY: 0,
    rightOffset: 0,
    bottomOffset: 0,
    width: 0,
    height: 0,
    isFab: false,
    startX: 0,
    startY: 0,
    hasMoved: false,
  });

  const handleMouseDownHeader = (e) => {
    if (e.target.closest("button")) return;
    e.preventDefault();
    const currentRight = position.x !== null ? position.x : 24;
    const currentBottom = position.y !== null ? position.y : 24;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      rightOffset: currentRight,
      bottomOffset: currentBottom,
      width: 400,
      height: 652,
      isFab: false,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  const handleTouchStartHeader = (e) => {
    if (e.target.closest("button")) return;
    const touch = e.touches[0];
    const currentRight = position.x !== null ? position.x : 24;
    const currentBottom = position.y !== null ? position.y : 24;
    dragStart.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      rightOffset: currentRight,
      bottomOffset: currentBottom,
      width: 400,
      height: 652,
      isFab: false,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  const handleMouseDownFab = (e) => {
    const currentRight = position.x !== null ? position.x : 24;
    const currentBottom = position.y !== null ? position.y : 24;
    const rect = e.currentTarget.getBoundingClientRect();
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      rightOffset: currentRight,
      bottomOffset: currentBottom,
      width: open ? 400 : rect.width,
      height: open ? 652 : rect.height,
      isFab: true,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  const handleTouchStartFab = (e) => {
    const touch = e.touches[0];
    const currentRight = position.x !== null ? position.x : 24;
    const currentBottom = position.y !== null ? position.y : 24;
    const rect = e.currentTarget.getBoundingClientRect();
    dragStart.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      rightOffset: currentRight,
      bottomOffset: currentBottom,
      width: open ? 400 : rect.width,
      height: open ? 652 : rect.height,
      isFab: true,
      startX: touch.clientX,
      startY: touch.clientY,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStart.current.mouseX;
      const deltaY = e.clientY - dragStart.current.mouseY;
      
      let newRight = dragStart.current.rightOffset - deltaX;
      let newBottom = dragStart.current.bottomOffset - deltaY;

      const { width, height } = dragStart.current;

      newRight = Math.max(0, Math.min(newRight, window.innerWidth - width));
      newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - height));

      if (dragStart.current.isFab) {
        const dist = Math.sqrt(
          Math.pow(e.clientX - dragStart.current.startX, 2) +
          Math.pow(e.clientY - dragStart.current.startY, 2)
        );
        if (dist > 5) {
          dragStart.current.hasMoved = true;
        }
      }

      setPosition({ x: newRight, y: newBottom });
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.current.mouseX;
      const deltaY = touch.clientY - dragStart.current.mouseY;

      let newRight = dragStart.current.rightOffset - deltaX;
      let newBottom = dragStart.current.bottomOffset - deltaY;

      const { width, height } = dragStart.current;

      newRight = Math.max(0, Math.min(newRight, window.innerWidth - width));
      newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - height));

      if (dragStart.current.isFab) {
        const dist = Math.sqrt(
          Math.pow(touch.clientX - dragStart.current.startX, 2) +
          Math.pow(touch.clientY - dragStart.current.startY, 2)
        );
        if (dist > 5) {
          dragStart.current.hasMoved = true;
        }
      }

      setPosition({ x: newRight, y: newBottom });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setTimeout(() => {
        if (dragStart.current) {
          dragStart.current.hasMoved = false;
        }
      }, 50);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const handleResize = () => {
      if (position.x !== null && position.y !== null) {
        const width = open ? 400 : 145;
        const height = open ? 652 : 54;
        const newRight = Math.max(0, Math.min(position.x, window.innerWidth - width));
        const newBottom = Math.max(0, Math.min(position.y, window.innerHeight - height));
        if (newRight !== position.x || newBottom !== position.y) {
          setPosition({ x: newRight, y: newBottom });
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position, open]);

  const handleFabClick = (e) => {
    if (dragStart.current.hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setOpen(o => !o);
  };

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
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
      70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }
    @keyframes typing-bubble {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    .typing-indicator-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--muted);
      display: inline-block;
      animation: typing-bubble 1.2s infinite ease-in-out;
    }
    .typing-indicator-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator-dot:nth-child(3) { animation-delay: 0.4s; }
    
    .fancy-fab {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
      box-shadow: 0 8px 28px rgba(30,58,138, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .fancy-fab:hover {
      transform: scale(1.05) translateY(-2.5px);
      box-shadow: 0 12px 36px rgba(30,58,138, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 20px rgba(30,58,138, 0.15);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .fancy-fab:active {
      transform: scale(0.97) translateY(0);
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

      {/* ── Fixed Position Draggable Wrapper Container ── */}
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          bottom: position.y !== null ? position.y : 24,
          right: position.x !== null ? position.x : 24,
          zIndex: 200,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        {/* Chat panel */}
        <div 
          style={{
            position: "absolute",
            bottom: 72,
            right: 0,
            width: 400, height: 580,
            background: "var(--surface)",
            border: "1px solid rgba(43, 45, 66, 0.08)",
            borderRadius: 24,
            boxShadow: "0 16px 48px rgba(43,45,66,0.15), 0 2px 8px rgba(43,45,66,0.05)",
            zIndex: 200,
            display: "flex", flexDirection: "column", overflow: "hidden",
            transform: open ? "scale(1) translateY(0)" : "scale(0.92) translateY(18px)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "all" : "none",
            transition: "transform .35s cubic-bezier(0.16,1,0.3,1), opacity .25s ease",
            transformOrigin: "bottom right",
          }}
        >

          {/* Header */}
          <div 
            onMouseDown={handleMouseDownHeader}
            onTouchStart={handleTouchStartHeader}
            style={{
              padding: "18px 22px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex", alignItems: "center", gap: 14,
              background: "linear-gradient(135deg, var(--accent-deep) 0%, #0f172a 100%)",
              flexShrink: 0,
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
            }}
          >
            <BotAvatar size={38} showStatus={true} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 15, fontWeight: 700, color: "#fff",
                fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.01em",
                display: "flex", alignItems: "center", gap: 6
              }}>
                Nori
                <span style={{
                  fontSize: 9, textTransform: "uppercase", letterSpacing: "1px",
                  background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff", padding: "2px 6px", borderRadius: 4, fontWeight: 700
                }}>Bot</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 400, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
                Typically replies instantly
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.7)",
                transition: "all var(--tr)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "22px 20px",
            display: "flex", flexDirection: "column", gap: 18,
            background: "linear-gradient(to bottom, #f8fafd 0%, #f4f6fa 100%)",
          }}>
            

            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "message-bubble-user" : "message-bubble-bot"}>
                {msg.role === "user" ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div style={{
                      background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%)",
                      borderRadius: "18px 18px 4px 18px",
                      padding: "11px 18px",
                      fontSize: 13.5, color: "#fff",
                      maxWidth: 290, lineHeight: 1.55,
                      boxShadow: "0 4px 15px rgba(30,58,138,0.15)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 500,
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: 10, color: "var(--muted2)", marginRight: 6 }}>
                      {msg.time}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <BotAvatar size={32} showStatus={false} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                      <div style={{
                        background: msg.error ? "rgba(239,35,60,0.04)" : "#ffffff",
                        border: msg.error ? "1px solid rgba(239,35,60,0.2)" : "1px solid rgba(43,45,66,0.08)",
                        borderRadius: "4px 18px 18px 18px",
                        padding: "12px 18px",
                        fontSize: 13.5,
                        color: msg.error ? "var(--danger-deep)" : "var(--navy)",
                        maxWidth: 290, lineHeight: 1.6,
                        boxShadow: "0 3px 12px rgba(43,45,66,0.03)",
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
                          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(43,45,66,0.15)" }} />
                          
                          {/* Like Button */}
                          <button
                            onClick={() => handleReact(i, "like")}
                            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", color: reactions[i] === "like" ? "var(--accent)" : "rgba(141,153,174,0.6)", transition: "all 0.2s" }}
                            onMouseEnter={e => { if (reactions[i] !== "like") e.currentTarget.style.color = "var(--accent)"; }}
                            onMouseLeave={e => { if (reactions[i] !== "like") e.currentTarget.style.color = "rgba(141,153,174,0.6)"; }}
                          >
                            <Icon name="thumb_up" size={12} fill={reactions[i] === "like"} />
                          </button>
                          
                          {/* Dislike Button */}
                          <button
                            onClick={() => handleReact(i, "dislike")}
                            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", color: reactions[i] === "dislike" ? "var(--accent)" : "rgba(141,153,174,0.6)", transition: "all 0.2s" }}
                            onMouseEnter={e => { if (reactions[i] !== "dislike") e.currentTarget.style.color = "var(--accent)"; }}
                            onMouseLeave={e => { if (reactions[i] !== "dislike") e.currentTarget.style.color = "rgba(141,153,174,0.6)"; }}
                          >
                            <Icon name="thumb_down" size={12} fill={reactions[i] === "dislike"} />
                          </button>
                          
                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopy(i, msg.text)}
                            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "rgba(141,153,174,0.6)", fontSize: 10.5, fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--navy)"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(141,153,174,0.6)"}
                          >
                            <Icon name={copiedIndex === i ? "done" : "content_copy"} size={11} />
                            {copiedIndex === i ? <span style={{ color: "#16a34a", fontWeight: 600 }}>Copied</span> : <span>Copy</span>}
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
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "1.2px", paddingLeft: 4 }}>
                  Suggested Topics
                </div>
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSuggestionClick(s.q)}
                    style={{
                      padding: "12px 16px", background: "#ffffff",
                      border: "1px solid rgba(43,45,66,0.08)", borderRadius: 14,
                      fontSize: 13, color: "var(--navy)", fontWeight: 600,
                      cursor: "pointer", transition: "all .25s ease",
                      display: "flex", alignItems: "center", gap: 12,
                      boxShadow: "0 2px 8px rgba(43,45,66,0.02)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-1.5px)";
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(30,58,138,0.08)";
                      e.currentTarget.style.color = "var(--accent-deep)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.borderColor = "rgba(43,45,66,0.08)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(43,45,66,0.02)";
                      e.currentTarget.style.color = "var(--navy)";
                    }}
                  >
                    <Icon name="chat_bubble_outline" size={14} style={{ color: "var(--accent)" }} />
                    <span style={{ flex: 1 }}>{s.q}</span>
                    <Icon name="arrow_forward" size={13} style={{ opacity: 0.6 }} />
                  </div>
                ))}
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <BotAvatar size={32} showStatus={false} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{
                    background: "#ffffff", border: "1px solid rgba(43,45,66,0.08)",
                    borderRadius: "4px 18px 18px 18px",
                    padding: "12px 18px", display: "flex", gap: 4, alignItems: "center",
                    boxShadow: "0 3px 12px rgba(43,45,66,0.03)",
                  }}>
                    <span className="typing-indicator-dot" />
                    <span className="typing-indicator-dot" />
                    <span className="typing-indicator-dot" />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--muted2)", fontStyle: "italic", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>
                    searching documentation...
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{
            padding: "14px 20px 18px",
            borderTop: "1px solid rgba(43,45,66,0.08)",
            background: "#ffffff",
            flexShrink: 0,
          }}>
            <div style={{
              display: "flex", alignItems: "flex-end", gap: 10,
              background: "var(--surface-2)",
              border: "1.5px solid rgba(43,45,66,0.08)",
              borderRadius: 16,
              padding: "10px 10px 10px 16px",
              transition: "all var(--tr)",
            }}
              onFocusCapture={e => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 4px var(--accent-dim)";
                e.currentTarget.style.background = "#ffffff";
              }}
              onBlurCapture={e => {
                e.currentTarget.style.borderColor = "rgba(43,45,66,0.08)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "var(--surface-2)";
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
                placeholder="Ask Nori a question…"
                rows={1}
                disabled={loading}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "var(--text)", fontSize: 13.5, lineHeight: 1.5,
                  resize: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  minHeight: 22, maxHeight: 80,
                  padding: 0
                }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{
                  width: 34, height: 34, borderRadius: 12,
                  border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                  background: input.trim() && !loading ? "linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%)" : "var(--surface-3)",
                  color: input.trim() && !loading ? "#fff" : "rgba(141,153,174,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all var(--tr)",
                  boxShadow: input.trim() && !loading ? "0 4px 12px rgba(30,58,138,0.2)" : "none",
                }}
                onMouseEnter={e => {
                  if (input.trim() && !loading) {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "none";
                }}
              >
                {loading
                  ? <Spinner size={14} color="#fff" />
                  : <Icon name="send" size={16} />
                }
              </button>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              marginTop: 10, fontSize: 11, color: "var(--muted2)",
              justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
            }}>
              <Icon name="verified" size={12} style={{ color: "var(--accent)" }} />
              Answers synced from server documentation
            </div>
          </div>
        </div>

        {/* ── FAB toggle ── */}
        <button
          onMouseDown={handleMouseDownFab}
          onTouchStart={handleTouchStartFab}
          onClick={handleFabClick}
          className="fancy-fab"
          style={{
            position: "relative",
            zIndex: 210,
            pointerEvents: "all",
            padding: open ? "0" : "10px 20px 10px 14px",
            width: open ? 54 : "auto", height: 54,
            borderRadius: open ? "50%" : 99,
            cursor: isDragging ? "grabbing" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            border: "none",
            // Dynamic background overrides when open
            background: open ? "linear-gradient(135deg, var(--accent-deep) 0%, #0f172a 100%)" : undefined,
            boxShadow: open ? "0 8px 24px rgba(43,45,66,0.18)" : undefined,
          }}
        >
          {open ? (
            <Icon name="close" size={22} style={{ color: "#fff", transition: "all .2s" }} />
          ) : (
            <>
              <BotAvatar size={28} showStatus={false} />
              <span style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#fff", letterSpacing: "-0.01em" }}>
                Ask Nori
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );
}