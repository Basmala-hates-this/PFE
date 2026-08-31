import { useState, useRef, useEffect } from "react";
import { speak, stopSpeaking } from "./voiceTTS"; // adjust path to match where voiceTTS.js actually lives
import { useVoiceCommandContext } from "./VoiceCommandContext";
import { useLocation } from "react-router-dom";

const REG_SYSTEM_PROMPT = `
You are a friendly registration assistant for Glaukopis, an academic social network for Algerian university students.

Your ONLY job: help users fill out the registration/login form they are currently looking at.

THE FORMS:
1. LOGIN — fields: email or username(user choice of input), password. Has "Forgot password?" link and back to home page that leads to welcome page .
2. INFO () — fields:full name,date of birth, university (select or type custom),role(professor or student), major (select or type custom), professor role require a proof of status(work contart or a degree in a form of a png or pdf-size limit is 2mb-). Mandatory before accessing the platform.it has 2 links,back to home(welcome)page ,and "already have an account"link that leads to login page.
3. REGISTER(after info) — fields:  username, email otp code, password, confirm password.
4.GUEST(in welcome page along side with create account and login button) -users who want to explore the app without registering can select "Continue as Guest",they are prompted to choose up to 5 universities with thier choice,
 and will only see a limited version of the platform(read only). They won't have access to chat rooms or personalized features, but can browse  general info.
 5. request rest password: fields: registed email,they get a link via that email if valid and will lead to the reset password page with new password and confirm password fields.
6. fin : a celebratory page after successful registration, with a set of navigation buttons(go to dashboard,back to home-welcome page-,back to login) buttons and a "celebrate again "button that launches th confetti animation on the page.
HOW TO HELP:
- "what do I put here?" → explain the field clearly
- university/major confusion → select from list, or type a custom one if not listed
- password rules → at least 8 characters,one uppercase, one number, one special character
- username → unique, no spaces, letters/numbers recommended,the speacila characters allowed are : ~ $ & - _
- info page → sets up their academic profile for room access.
-register page sets the information needed for login and profile view
- errors → help diagnose (wrong password, email taken, fields missing, etc.)
INSTRUCTIONS:
you would start at home page with 3 buttons the first is continue as guest that prompts users to choose 5 universities ,second is create account that llads to info page to create thier account, third button is login that leads to login page.
if users ask about any form,explain shortly what the page is and what to do moving on.
if a user asks about a page and you can detect what page they are in,you explain what they need to know and fill in that page....
if they asked where they are,you respond with the name of the page and a short description of it.
PERSONALITY: Short, clear, reassuring. Max 3-4 sentences. You are a helper popup, not an essay.
Respond in the same language the user writes in (Arabic/French/English).
`;


function getPageFromPath(pathname) {
  if (pathname.startsWith("/login")) return "login";
  if (pathname.startsWith("/info")) return "info";
  if (pathname.startsWith("/register")) return "register";
  return "welcome"; // fallback for "/" and anything unmapped
}

async function callAI(messages, currentPage) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      system: `${REG_SYSTEM_PROMPT}\n\nThe user is CURRENTLY on this page: ${currentPage}. Trust this over anything earlier in the conversation.`,
    }),
  });

  if (!response.ok) throw new Error("AI request failed");
  const data = await response.json();
  return data.content?.[0]?.text || "Not sure — try again?";
}

// ── language detection ──────────────────────────────────────────────
function detectLang(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "fr-FR";
  const text = lastUser.content;
  if (/[\u0600-\u06FF]/.test(text)) return "ar-DZ";
  if (/[àâçéèêëîïôùûüœæ]/i.test(text)) return "fr-FR";
  return "en-US";
}

const QUICK = {
  register: ["What goes in username?", "Password rules?", "Why do I need an email?"],
  login: ["I forgot my password", "Wrong password error?", "Which email do I use?"],
  info: ["What is 'university' field?", "I don't see my major", "Can I skip this page?"],
};

const GREETINGS = {
  register: " I can help you fill out this form. Ask if you get stuck!",
  login: " Need help logging in? Ask me anything.",
  info: "Hellooo~~, This sets up your academic profile. Ask me about any field!",
};

export default function FloatingHelper() {
  const [open, setOpen] = useState(false);
 
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false); // push-to-talk dictation state (unchanged)
  const [speakingIndex, setSpeakingIndex] = useState(null); // which bubble is speaking
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const location = useLocation();
const currentPage = getPageFromPath(location.pathname);
 const [messages, setMessages] = useState([
    { role: "assistant", content: GREETINGS[currentPage] || GREETINGS.register },
  ]);
  // --- hands-free continuous listening (shared with voice nav) ---------
  const {
    toggleListening: toggleHandsFree,
    isListening: isHandsFree,
    isTranscribing: handsFreeTranscribing,
    isProcessing: handsFreeProcessing,
    micError: handsFreeMicError,
    notifyTTSStart,
    notifyTTSEnd,
    registerUnmatchedHandler,
  } = useVoiceCommandContext();

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // stop speech when widget closes
  useEffect(() => {
    if (!open) {
      stopSpeaking();
      notifyTTSEnd(); // release the mic gate too, in case we were mid-utterance
      setSpeakingIndex(null);
    }
  }, [open, notifyTTSEnd]);

  // ── TTS (backend-based now, not window.speechSynthesis) ──────────────
  // speakMessage still supports the per-bubble click-to-stop toggle from
  // before, but plays via /ai/speak and gates the shared continuous mic
  // (notifyTTSStart/notifyTTSEnd) so hands-free listening doesn't try to
  // transcribe FloatingHelper's own voice.
  const speakMessage = (text, index) => {
    if (speakingIndex === index) {
      stopSpeaking();
      notifyTTSEnd();
      setSpeakingIndex(null);
      return;
    }

    speak(text, {
      onStart: () => {
        notifyTTSStart();
        setSpeakingIndex(index);
      },
      onEnd: () => {
        notifyTTSEnd();
        setSpeakingIndex(null);
      },
    });
  };

  // ── STT: push-to-talk dictation into the text input (unchanged) ──────
  const toggleVoice = async () => {
    if (listening) {
      mediaRecorderRef.current?.stop();
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("Mic access denied. Please allow microphone.");
      return;
    }

    const chunks = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setListening(false);

      const blob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/transcribe`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.text) setInput(data.text);
      } catch {
        alert("Transcription failed. Try again.");
      } finally {
        setLoading(false);
      }
    };

    recorder.start();
    setListening(true);
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    stopSpeaking();
    notifyTTSEnd();
    setSpeakingIndex(null);

    const newMessages = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const reply = await callAI(newMessages.map((m) => ({ role: m.role, content: m.content })));
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      return reply;
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops! Connection issue. Try again." }]);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Voice-triggered variant: same as sendMessage, but auto-speaks the reply
  // aloud afterward — the user spoke instead of typed, so a silent text-only
  // reply defeats the point of hands-free mode. Typed messages stay opt-in
  // (click the speaker icon), matching existing behavior.
  const sendVoiceMessage = async (text) => {
    const reply = await sendMessage(text);
    if (reply) {
      // the new message's index is messages.length AFTER the user+assistant
      // pair was appended — since sendMessage already updated state twice,
      // just speak the reply text directly without needing the exact index
      // for the toggle-to-stop UI (voice-triggered replies auto-play once).
      speak(reply, { onStart: notifyTTSStart, onEnd: notifyTTSEnd });
    }
  };

  // register as the unmatched-speech handler for as long as this
  // FloatingHelper instance is mounted — scoped per-page, same idea as
  // command registration
  useEffect(() => {
    const unregister = registerUnmatchedHandler(sendVoiceMessage);
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerUnmatchedHandler]);

  const quick = QUICK[currentPage] || QUICK.register;

  return (
    <div style={f.wrapper}>
      {open && (
        <div style={f.window}>
          <div style={f.header}>
            <span>🤖 Registration Helper</span>
            <button onClick={() => setOpen(false)} style={f.closeBtn}>✕</button>
          </div>

          <div style={f.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...f.bubble, ...(m.role === "user" ? f.userBubble : f.aiBubble) }}>
                <p style={f.bubbleText}>{m.content}</p>
                {/* TTS button — only on assistant messages */}
                {m.role === "assistant" && (
                  <button
                    onClick={() => speakMessage(m.content, i)}
                    style={{
                      ...f.ttsBtn,
                      color: speakingIndex === i ? "#e74c3c" : "rgba(255,255,255,0.4)",
                    }}
                    title={speakingIndex === i ? "Stop" : "Read aloud"}
                  >
                    {speakingIndex === i ? "⏹" : "🔊"}
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ ...f.bubble, ...f.aiBubble }}>
                <p style={{ ...f.bubbleText, opacity: 0.5 }}>typing...</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 2 && (
            <div style={f.quickRow}>
              {quick.map((q) => (
                <button key={q} style={f.quickBtn} onClick={() => sendMessage(q)}>{q}</button>
              ))}
            </div>
          )}

          {/* hands-free status strip — only shows while active/relevant */}
          {(isHandsFree || handsFreeTranscribing || handsFreeProcessing || handsFreeMicError) && (
            <div style={f.handsFreeStatus}>
              {handsFreeMicError
                ? `Mic error: ${handsFreeMicError}`
                : handsFreeProcessing
                ? "Thinking..."
                : handsFreeTranscribing
                ? "Transcribing..."
                : "Listening (hands-free)..."}
            </div>
          )}

          <div style={f.inputRow}>
            <button
              onClick={toggleVoice}
              title="Push-to-talk: dictate into the text box"
              style={{ ...f.iconBtn, background: listening ? "#e74c3c" : "rgba(100,118,175,0.3)" }}
            >
              {listening ? "⏹" : "🎤"}
            </button>
            <button
              onClick={toggleHandsFree}
              title="Hands-free: continuous voice commands + questions"
              style={{ ...f.iconBtn, background: isHandsFree ? "#2ecc71" : "rgba(100,118,175,0.15)" }}
            >
              {isHandsFree ? "🟢" : "🎧"}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything..."
              style={f.input}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{ ...f.iconBtn, background: input.trim() ? "#6476af" : "rgba(255,255,255,0.1)", opacity: !input.trim() ? 0.5 : 1 }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => { setOpen((o) => !o); setPulse(false); }}
        style={{ ...f.fab, animation: pulse && !open ? "sbPulse 1.5s infinite" : "none" }}
        title="Need help?"
      >
        {open ? "✕" : "🤖"}
      </button>

      <style>{`
        @keyframes sbPulse {
          0%   { box-shadow: 0 0 0 0 rgba(100,118,175,0.7); }
          70%  { box-shadow: 0 0 0 12px rgba(100,118,175,0); }
          100% { box-shadow: 0 0 0 0 rgba(100,118,175,0); }
        }
      `}</style>
    </div>
  );
}

const f = {
  wrapper: {
    position: "fixed", bottom: "24px", right: "24px",
    zIndex: 9999, display: "flex", flexDirection: "column",
    alignItems: "flex-end", gap: "12px", fontFamily: "inherit",
  },
  fab: {
    width: "52px", height: "52px", borderRadius: "50%", border: "none",
    background: "linear-gradient(135deg, #6476af, #4a5a8a)",
    color: "white", fontSize: "22px", cursor: "pointer",
    boxShadow: "0 4px 20px rgba(100,118,175,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.2s",
  },
  window: {
    width: "320px", maxHeight: "430px",
    background: "#1a2236", borderRadius: "16px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  header: {
    padding: "12px 16px",
    background: "rgba(100,118,175,0.2)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: "13px", fontWeight: "600", color: "white",
  },
  closeBtn: {
    background: "none", border: "none",
    color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "16px",
  },
  messages: {
    flex: 1, overflowY: "auto", padding: "12px",
    display: "flex", flexDirection: "column", gap: "8px",
  },
  bubble: { maxWidth: "85%", padding: "8px 12px", borderRadius: "12px" },
  userBubble: { alignSelf: "flex-end", background: "#6476af", borderBottomRightRadius: "3px" },
  aiBubble: {
    alignSelf: "flex-start", background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.08)", borderBottomLeftRadius: "3px",
  },
  bubbleText: { margin: 0, fontSize: "13px", lineHeight: "1.5", color: "white", whiteSpace: "pre-wrap" },
  ttsBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "12px", padding: "2px 0 0 0", display: "block",
    transition: "color 0.2s",
  },
  quickRow: {
    display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px 12px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  quickBtn: {
    padding: "4px 10px", borderRadius: "12px",
    border: "1px solid rgba(100,118,175,0.4)", background: "transparent",
    color: "rgba(255,255,255,0.6)", fontSize: "11px", cursor: "pointer",
  },
  handsFreeStatus: {
    padding: "6px 12px", fontSize: "11px", color: "rgba(255,255,255,0.6)",
    borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center",
  },
  inputRow: {
    display: "flex", gap: "6px", padding: "10px 12px",
    borderTop: "1px solid rgba(255,255,255,0.08)", alignItems: "center",
  },
  input: {
    flex: 1, padding: "8px 12px", borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)", color: "white",
    fontSize: "13px", outline: "none", fontFamily: "inherit",
  },
  iconBtn: {
    width: "36px", height: "36px", borderRadius: "10px", border: "none",
    cursor: "pointer", fontSize: "14px", display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
    transition: "all 0.2s", color: "white",
  },
}