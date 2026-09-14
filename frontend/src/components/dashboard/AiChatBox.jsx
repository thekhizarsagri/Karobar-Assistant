import { useEffect, useRef, useState } from "react";
import { postChat } from "./api";

/**
 * AI chat panel — fully live via POST /api/chat.
 * The backend holds the conversation (slot-filling tasks, confirmations)
 * keyed by a per-browser session id; this component only renders.
 */
const SESSION_KEY = "karobar-chat-session";
const DEFAULT_SUGGESTIONS = ["Stock status", "Add stock", "Record a sale", "Any alerts?"];

function getSessionId() {
  try {
    let id = window.localStorage?.getItem(SESSION_KEY);
    if (!id) {
      id = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage?.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "default";
  }
}

function AiChatBox({ context, onNavigate, onRefresh }) {
  const ctx = context || {};
  const [sessionId] = useState(getSessionId);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "bot",
      text: `Hi${ctx.ownerName ? `, ${ctx.ownerName}` : ""}! I'm your AI copilot — ask me anything, or tell me to do things like "add stock" or "record a sale".`,
    },
  ]);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);
  const waitingRef = useRef(false);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const send = async (raw) => {
    const text = String(raw ?? input).trim();
    if (!text || waitingRef.current) return;
    waitingRef.current = true;
    setTyping(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "user", text }]);
    setInput("");
    try {
      const data = await postChat(sessionId, text);
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, from: "bot", text: data.reply || "…" }]);
      if (Array.isArray(data.suggestions) && data.suggestions.length) {
        setSuggestions(data.suggestions.slice(0, 6));
      }
      if (data.navigate) onNavigate?.(data.navigate);
      if (data.refresh) {
        onRefresh?.();
        window.dispatchEvent(new CustomEvent("alerts:updated"));
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: `b-${Date.now()}`,
        from: "bot",
        text: "I lost connection to the server for a moment — your data is safe. Try again.",
      }]);
    } finally {
      waitingRef.current = false;
      setTyping(false);
    }
  };

  return (
    <section className="ai-chat-card" aria-label="AI assistant chat">
      <div className="ai-chat-glow" aria-hidden="true" />
      <header className="ai-chat-head">
        <span className="ai-chat-orb" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.7 5.1 5.1 1.7-5.1 1.7L12 16.6l-1.7-5.1-5.1-1.7 5.1-1.7L12 3z" />
            <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
          </svg>
        </span>
        <span className="ai-chat-titles">
          <strong className="ai-chat-title">AI Assistant</strong>
          <span className="ai-chat-status">
            <span className="ai-chat-dot" aria-hidden="true" />
            Online — ask anything, order tasks
          </span>
        </span>
      </header>

      <div className="ai-chat-list" ref={listRef} role="log" aria-live="polite">
        {messages.map((m) =>
          m.from === "bot" ? (
            <div key={m.id} className="ai-chat-row ai-chat-row--bot">
              <span className="ai-chat-mini-orb" aria-hidden="true">AI</span>
              <p className="ai-chat-bubble ai-chat-bubble--bot">{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="ai-chat-row ai-chat-row--user">
              <p className="ai-chat-bubble ai-chat-bubble--user">{m.text}</p>
            </div>
          )
        )}
        {typing && (
          <div className="ai-chat-row ai-chat-row--bot">
            <span className="ai-chat-mini-orb" aria-hidden="true">AI</span>
            <p className="ai-chat-bubble ai-chat-bubble--bot ai-chat-typing" aria-label="AI is typing">
              <span /><span /><span />
            </p>
          </div>
        )}
      </div>

      <div className="ai-chat-chips">
        {suggestions.map((s) => (
          <button key={s} type="button" className="ai-chat-chip" onClick={() => send(s)} disabled={typing}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="ai-chat-inputbar"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="ai-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your business…"
          aria-label="Ask the AI assistant"
          maxLength={300}
        />
        <button type="submit" className="ai-chat-send" disabled={!input.trim() || typing} aria-label="Send message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </section>
  );
}

export default AiChatBox;
