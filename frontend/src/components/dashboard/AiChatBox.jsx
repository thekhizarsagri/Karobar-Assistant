import { useEffect, useRef, useState } from "react";

/**
 * AI chat panel (UI preview — no backend yet).
 * Answers are generated on-device from the live dashboard context so the
 * panel already feels real. Swap `mockReply` for an API call later.
 */
function fmtMoney(sym, value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return `${sym}0.00`;
  return `${sym}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mockReply(text, ctx) {
  const q = String(text || "").toLowerCase().trim();
  const has = (...words) => words.some((w) => q.includes(w));
  const list = (arr) => (arr.length ? arr.slice(0, 3).join(", ") : "none right now");

  if (!q) return "Ask me anything about your stock, sales, profit or expenses.";
  if (has("hello", "hi", "hey", "salam", "aoa")) {
    return `Hello! ${ctx.businessName ? `Here's the pulse of ${ctx.businessName}: ` : ""}you hold ${ctx.totalStock} units across ${ctx.productCount} products with a net profit of ${fmtMoney(ctx.currency, ctx.netProfit)}. What should we dig into?`;
  }
  if (has("stock", "inventory", "unit")) {
    if (ctx.outOfStock.length) {
      return `You hold ${ctx.totalStock} units in total. Out of stock: ${list(ctx.outOfStock)}. Running low: ${list(ctx.lowStock)}. Want me to flag what to restock first?`;
    }
    return `You hold ${ctx.totalStock} units across ${ctx.productCount} products. Running low: ${list(ctx.lowStock)}. Stock health looks ${ctx.lowStock.length ? "okay — keep an eye on the low ones" : "great"}.`;
  }
  if (has("gross")) return `Gross profit stands at ${fmtMoney(ctx.currency, ctx.grossProfit)} on ${ctx.unitsSold} units sold. Open Sales Analytics for the month-by-month breakup.`;
  if (has("net", "profit", "earn")) {
    const tone = Number(ctx.netProfit) >= 0 ? "in profit" : "in loss";
    return `Net profit is ${fmtMoney(ctx.currency, ctx.netProfit)} — you're ${tone} after ${fmtMoney(ctx.currency, ctx.monthlyExpenses)} of monthly expenses.`;
  }
  if (has("expense", "cost", "spend", "khar")) {
    return `Monthly expenses total ${fmtMoney(ctx.currency, ctx.monthlyExpenses)}. The Monthly Expenses page shows every recurring cost and its auto-deduction schedule.`;
  }
  if (has("sale", "sell", "revenue", "best", "top")) {
    return `You've sold ${ctx.unitsSold} units in total. The Sales Overview chart and Analytics page break it down by month and product.`;
  }
  if (has("alert", "warn", "attention", "restock")) {
    if (!ctx.outOfStock.length && !ctx.lowStock.length) return "No urgent alerts — everything is stocked and healthy. Nice work.";
    return `Heads up: out of stock — ${list(ctx.outOfStock)}; running low — ${list(ctx.lowStock)}. Restocking these first protects your best sellers.`;
  }
  if (has("report", "forecast", "predict", "future")) {
    return "Demand Forecasting projects next month's needs per product, and Business Reports grades your KPI health, break-even and replenishment. Both live in the sidebar.";
  }
  if (has("help", "what can you", "who are you", "?")) {
    return "I'm your business copilot. Try: stock status, profit summary, expense total, sales recap, or any alerts.";
  }
  if (has("thank", "shukriya")) return "Anytime! I'll be right here when you need a second brain for the business.";
  return `Got it — "${String(text).slice(0, 80)}". Full AI reasoning connects later; for now try asking about stock, profit, expenses, sales or alerts.`;
}

const SUGGESTIONS = ["Stock status", "Profit summary", "Any alerts?", "Expense total"];

function AiChatBox({ context }) {
  const ctx = context || {};
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "bot",
      text: `Hi${ctx.ownerName ? `, ${ctx.ownerName}` : ""}! I'm your AI copilot — ask me about stock, profit, expenses or sales.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const send = (raw) => {
    const text = String(raw ?? input).trim();
    if (!text || typing) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "user", text }]);
    setInput("");
    setTyping(true);
    timerRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, from: "bot", text: mockReply(text, ctx) }]);
      setTyping(false);
    }, 900);
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
            Online — answers from live data
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
        {SUGGESTIONS.map((s) => (
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
