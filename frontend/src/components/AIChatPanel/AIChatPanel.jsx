import { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "../../constants/config";

const SUGGESTED_QUESTIONS = [
  "What are the biggest red flags in this company's history?",
  "How has operating cash flow trended vs revenue?",
  "Is the auditor's opinion reliable for this company?",
  "Compare debt growth to industry norms.",
  "What pattern does this match — Satyam, IL&FS, or healthy growth?",
];

export default function AIChatPanel({ report }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `I have full access to **${report?.metadata?.company_name || "this company"}**'s 10-year financial history. Ask me anything — anomalies, trends, auditor patterns, or specific years.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Only scroll if there's actually a conversation happening, not on initial mount
    if (messages.length > 1 || loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendMessage = async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          symbol: report?.metadata?.cin,
          companyName: report?.metadata?.company_name,
          industry: report?.metadata?.industry,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.success ? data.answer : `Error: ${data.error}` },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", text: `Network error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full" style={{ minHeight: "480px" }}>
      {/* Model Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide" style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", color: "#4ade80" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          Kimi K2 · Forensic Context Loaded
        </div>
        <span className="text-[10px] text-slate-600 font-mono">10-year data injected</span>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto pr-1 mb-4 space-y-4" style={{ maxHeight: "320px" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-black" style={{ background: "#0a0a2a", border: "1px solid #1c1c5a", color: "#818cf8" }}>
                AI
              </div>
            )}
            <div
              className={`rounded-xl px-4 py-3 text-sm leading-relaxed max-w-[82%] whitespace-pre-wrap ${
                msg.role === "user"
                  ? "text-slate-200 rounded-br-sm"
                  : "text-slate-300 rounded-bl-sm"
              }`}
              style={{
                background: msg.role === "user" ? "#0f2030" : "#0a0a0a",
                border: msg.role === "user" ? "1px solid #1c3a50" : "1px solid #1c1c1c",
              }}
            >
              {msg.text}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-black" style={{ background: "#0f2030", border: "1px solid #1c3a50", color: "#38bdf8" }}>
                U
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black" style={{ background: "#0a0a2a", border: "1px solid #1c1c5a", color: "#818cf8" }}>
              AI
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl rounded-bl-sm text-sm" style={{ background: "#0a0a0a", border: "1px solid #1c1c1c" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              className="text-[11px] px-3 py-1.5 rounded-full transition-colors"
              style={{ background: "#0a0a0a", border: "1px solid #222", color: "#888" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#ccc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#888"; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
          style={{ background: "#0a0a0a", border: "1px solid #222", color: "#e2e8f0", caretColor: "#06b6d4" }}
          placeholder="Ask about cashflow, debt, auditor patterns…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#222"; }}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-40"
          style={{ background: "#06b6d4", color: "#000" }}
          onMouseEnter={(e) => { if (!loading && input.trim()) e.currentTarget.style.background = "#22d3ee"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#06b6d4"; }}
        >
          Ask
        </button>
      </div>
    </div>
  );
}
