import { useState, useRef, useEffect } from "react";

// ─── SYSTEM PROMPT for registration helper ─────────────────────────────────────
const REG_SYSTEM_PROMPT = `
You are a friendly registration assistant for StudyBuddy, an academic social network for Algerian university students.

Your ONLY job: help users fill out the registration/login form they're currently looking at.

YOU KNOW THESE FORMS EXIST:
1. LOGIN page — fields: email, password. Also has "Forgot password?" link.
2. REGISTER page — fields: full name, username, email, password, confirm password.
3. INFO page (after register) — fields: university (select or type custom), major (select or type custom), year of study, profile picture (optional). This page is mandatory before accessing the platform.

HOW TO HELP:
- If they ask "what do I put here?" → explain the current field clearly
- If they're confused about university/major → tell them to select from the list or type a custom one if theirs isn't there
- If they ask about password rules → say: at least 6 characters
- If they ask about username → say: unique, no spaces, letters/numbers only recommended
- If they ask about the info page → explain it sets up their academic profile for room access
- If they hit an error → help them diagnose it (wrong password, email taken, etc.)

PERSONALITY: Short, clear, reassuring. Max 2-3 sentences per reply. You're a helper popup, not an essay writer.

Respond in the same language the user writes in (Arabic/French/English).
`;

export default function FloatingHelper({ currentPage = "register" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: getGreeting(currentPage),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  // stop pulsing after 5s
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function getGreeting(page) {
    if (page === "login") return "Hey! 👋 Need help logging in? Ask me anything.";
    if (page === "info") return "Almost there! 🎉 This page sets up your academic profile. I can help with any field — just ask!";
    return "Hey! 👋 I can help you fill out this form. Just ask if you get stuck on anything!";
  }

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: REG_SYSTEM_PROMPT,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "Not sure about that — try again?";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops! Connection issue. Try again in a sec." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input not supported. Try Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    recognitionRef.current = r;
    r.lang = "fr-FR";
    r.interimResults = false;
    r.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
    setListening(true);
  };

  const quickQuestions = {
    register: ["What goes in username?", "Password rules?", "What's my email for?"],
    login: ["I forgot my password", "Wrong password error?", "What email do I use?"],
    info: ["What is 'university'?", "I don't see my major", "Can I skip this?"],
  };

  return (
    <div style={floatStyles.wrapper}>
      {/* chat window */}
      {open && (
        <div style={floatStyles.window}>
          {/* header */}
          <div style={floatStyles.header}>
            <span>🤖 Registration Helper</span>
            <button onClick={() => setOpen(false)} style={floatStyles.closeBtn}>✕</button>
          </div>

          {/* messages */}
          <div style={floatStyles.messages}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...floatStyles.bubble,
                  ...(m.role === "user" ? floatStyles.userBubble : floatStyles.aiBubble),
                }}
              >
                <p style={floatStyles.bubbleText}>{m.content}</p>
              </div>
            ))}
            {loading && (
              <div style={{ ...floatStyles.bubble, ...floatStyles.aiBubble }}>
                <p style={{ ...floatStyles.bubbleText, opacity: 0.5 }}>typing...</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* quick suggestions */}
          {messages.length <= 2 && (
            <div style={floatStyles.quickRow}>
              {(quickQuestions[currentPage] || quickQuestions.register).map((q) => (
                <button key={q} style={floatStyles.quickBtn} onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* input */}
          <div style={floatStyles.inputRow}>
            <button
              onClick={toggleVoice}
              style={{ ...floatStyles.iconBtn, background: listening ? "#e74c3c" : "rgba(100,118,175,0.3)" }}
              title="Voice input"
            >
              {listening ? "⏹" : "🎤"}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything..."
              style={floatStyles.input}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{ ...floatStyles.iconBtn, background: input.trim() ? "#6476af" : "rgba(255,255,255,0.1)", opacity: !input.trim() ? 0.5 : 1 }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* floating button */}
      <button
        onClick={() => { setOpen((o) => !o); setPulse(false); }}
        style={{
          ...floatStyles.fab,
          animation: pulse && !open ? "pulse 1.5s infinite" : "none",
        }}
        title="Need help? Ask the assistant"
      >
        {open ? "✕" : "🤖"}
      </button>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(100,118,175,0.7); }
          70% { box-shadow: 0 0 0 12px rgba(100,118,175,0); }
          100% { box-shadow: 0 0 0 0 rgba(100,118,175,0); }
        }
      `}</style>
    </div>
  );
}

const floatStyles = {
  wrapper: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "12px",
    fontFamily: "inherit",
  },
  fab: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #6476af, #4a5a8a)",
    color: "white",
    fontSize: "22px",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(100,118,175,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s",
  },
  window: {
    width: "320px",
    maxHeight: "420px",
    background: "#1a2236",
    borderRadius: "16px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "12px 16px",
    background: "rgba(100,118,175,0.2)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    fontWeight: "600",
    color: "white",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: 1,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  bubble: {
    maxWidth: "85%",
    padding: "8px 12px",
    borderRadius: "12px",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "#6476af",
    borderBottomRightRadius: "3px",
  },
  aiBubble: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderBottomLeftRadius: "3px",
  },
  bubbleText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "1.5",
    color: "white",
    whiteSpace: "pre-wrap",
  },
  quickRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    padding: "8px 12px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  quickBtn: {
    padding: "4px 10px",
    borderRadius: "12px",
    border: "1px solid rgba(100,118,175,0.4)",
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    fontSize: "11px",
    cursor: "pointer",
  },
  inputRow: {
    display: "flex",
    gap: "6px",
    padding: "10px 12px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
  },
  iconBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
  },
};