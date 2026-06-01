import { useState, useEffect, useRef } from "react";
import { API } from "../utils/api.js";
import { Icon, OnlineDot, Spinner } from "./Common.jsx";

function DiscordIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

export default function ChatWidget({ guildId, guildName }) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    setMessages([{
      role: "bot",
      text: `Hi! Ask me anything about ${guildName || "the knowledge base"}.`,
    }]);
  }, [guildId, guildName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

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
      {/* ── Chat panel ── */}
      <div style={{
        position: "fixed", bottom: 88, right: 24, width: 380, height: 520,
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: "var(--r-xl)",
        boxShadow: "var(--shadow-lg)",
        zIndex: 200,
        display: "flex", flexDirection: "column", overflow: "hidden",
        transform: open ? "scale(1) translateY(0)" : "scale(0.93) translateY(14px)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "all" : "none",
        transition: "transform .3s cubic-bezier(0.16,1,0.3,1), opacity .2s ease",
        transformOrigin: "bottom right",
      }}>

        {/* Header */}
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--navy)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "var(--r-md)",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="shield_lock" size={17} fill style={{ color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: "#fff",
              fontFamily: "'Playfair Display', serif",
            }}>
              {guildName || "VaultBot"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
              RAG Assistant
            </div>
          </div>
          <OnlineDot />
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "var(--r-sm)", width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(255,255,255,0.6)",
              transition: "all var(--tr)", marginLeft: 4,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          >
            <Icon name="close" size={15} />
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "16px",
          display: "flex", flexDirection: "column", gap: 14,
          background: "var(--surface-2)",
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ animation: "fadeUp .25s ease both" }}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    background: "var(--navy)",
                    borderRadius: "12px 4px 12px 12px",
                    padding: "9px 14px",
                    fontSize: 13.5, color: "#fff",
                    maxWidth: 260, lineHeight: 1.55,
                    boxShadow: "0 2px 10px rgba(43,45,66,0.15)",
                  }}>
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "var(--r-sm)",
                    background: "var(--red-dim)",
                    border: "1px solid var(--red-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <Icon name="shield_lock" size={14} fill style={{ color: "var(--accent-deep)" }} />
                  </div>
                  <div style={{
                    background: msg.error ? "rgba(239,35,60,0.06)" : "var(--surface)",
                    border: `1px solid ${msg.error ? "var(--red-border)" : "var(--border2)"}`,
                    borderRadius: "4px 12px 12px 12px",
                    padding: "10px 14px",
                    fontSize: 13.5,
                    color: msg.error ? "var(--accent-deep)" : "var(--muted)",
                    maxWidth: 280, lineHeight: 1.65,
                    boxShadow: "var(--shadow-sm)",
                  }}>
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "var(--r-sm)",
                background: "var(--red-dim)", border: "1px solid var(--red-border)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name="shield_lock" size={14} fill style={{ color: "var(--accent-deep)" }} />
              </div>
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border2)",
                borderRadius: "4px 12px 12px 12px",
                padding: "12px 16px", display: "flex", gap: 5, alignItems: "center",
                boxShadow: "var(--shadow-sm)",
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: "10px 12px 14px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 8,
            background: "var(--surface-2)",
            border: "1.5px solid var(--border2)",
            borderRadius: "var(--r-md)",
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
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Ask a question…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "var(--text)", fontSize: 13.5, lineHeight: 1.5,
                resize: "none", fontFamily: "'DM Sans', sans-serif",
                minHeight: 22, maxHeight: 80,
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 32, height: 32, borderRadius: "var(--r-sm)",
                border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                background: input.trim() && !loading ? "var(--navy)" : "var(--surface-3)",
                color: input.trim() && !loading ? "#fff" : "var(--muted2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all var(--tr)",
                boxShadow: input.trim() && !loading ? "0 2px 10px rgba(43,45,66,0.2)" : "none",
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
            justifyContent: "center",
          }}>
            <Icon name="shield_lock" size={11} style={{ color: "var(--muted2)" }} />
            Powered by VaultBot · Answers from your docs
          </div>
        </div>
      </div>

      {/* ── FAB toggle ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 210,
          width: 54, height: 54, borderRadius: "50%",
          background: open ? "var(--surface)" : "var(--navy)",
          border: `1.5px solid ${open ? "var(--border2)" : "transparent"}`,
          cursor: "pointer",
          boxShadow: open ? "var(--shadow-sm)" : "0 8px 28px rgba(43,45,66,0.28)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .2s cubic-bezier(0.16,1,0.3,1)",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.boxShadow = "0 8px 32px rgba(43,45,66,0.38)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.boxShadow = "0 8px 28px rgba(43,45,66,0.28)"; }}
      >
        <Icon
          name={open ? "close" : "chat"}
          size={22}
          style={{ color: open ? "var(--muted)" : "#fff", transition: "all .2s" }}
        />
        {!open && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            width: 9, height: 9, borderRadius: "50%",
            background: "var(--accent)",
            border: "2px solid var(--surface)",
            animation: "pulse-dot 2.5s ease infinite",
          }} />
        )}
      </button>
    </>
  );
}