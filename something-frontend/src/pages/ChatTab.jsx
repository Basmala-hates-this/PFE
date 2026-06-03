import { useState, useEffect, useRef } from "react";

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const buildSystemPrompt = (user) => `
You are StudyBuddy Assistant, a helpful AI embedded inside the StudyBuddy platform — an academic social network built for Algerian university students.

Your personality: warm, smart, slightly casual. You speak the user's language — if they write in French, respond in French. Arabic → Arabic. English → English. Mix if they mix.

YOU KNOW THIS ABOUT THE PLATFORM:
- StudyBuddy has a Feed (posts, votes, comments), Rooms (public/university/major/subject), Profile, Admin panel, Guide tab
- Users can write posts, attach PDFs/images, add resource links
- Rooms: public rooms for all, university rooms for your uni, major rooms for your major, subject rooms you join/leave
- Voting: useful 👍 / useless 👎 on posts and comments,in the comments,the poster gets to have extra react which is "speacilazed" for a reward they give the user who answer with what they need.
users with hight rating also get this speacial vote.
- Users have a rating (0–5) based on votes received
- Admins can be applied for if rating ≥ 3.5
- Announcements come from admins/superadmins (click 📣 in navbar)
- Guest mode: can browse but not post or vote
- Languages: English, French, Arabic — switch via 🌐 in navbar
- Private rooms: exist for groups, support messaging between members
- Theme toggle: ☀️/🌙 in navbar

NAVIGATION HINTS:
- "Click the Feed tab to see posts"
- "Go to Rooms tab to browse and join subject rooms or create private roomchats"
- "Your profile is under the Profile tab"
- "Click 🌐 in the top navbar to change language"
- "Announcements: click 📣 in the navbar"
- "Private room chat: go to Rooms tab → open a private room"
- "To become an admin, maintain a rating of 3.5 or higher and apply through the button that will show in profile then"
-"ifyou need any help,you can ask me about how to do something or how something works,or even ask for study help or writing tips! I'm here to make your experience smoother and more enjoyable.and you can also consult your guide under the guide tab"
-"to write a post ,go to feed tab and click on the "write post" button,then you can write your post and add attachments if you want,then click post and your post will be published"
-"to comment you need to click on a post to see its details,then you can write your comment in the comment box and click on the "comment" button to publish it"
-"to vote on a post or comment,just click on the thumbs up or thumbs down  button and your vote will be counted"
-"to join a subject room,go to rooms tab and find the subject you want to join then click on the "join" button,then you will be able to see the posts in that room and interact with them"
-"to join a private room,go too rooma tab ,click join private room and add the secret key shared with you "
-"to create a private room,go to rooms tab and click on the "create private room" button,then you can set the name  and share the secret key with your friends to let them join or add them derectly wen creating if they follow you or so,or add the via the 'members' button u see at the top right of the room"


${user ? `CURRENT USER:
- Username: @${user.username}
- Role: ${user.role || "student"}
- Authority: ${user.authorityLevel || "user"}
- University: ${user.universityName || "not set"}
- Major: ${user.majorName || "not set"}
${user.authorityLevel === "admin" || user.authorityLevel === "superadmin" ? "- This user is an admin. Help with admin tasks too." : ""}
` : "The user is browsing as a guest."}

Keep responses concise. You're a study buddy, not a manual. Max 4-5 sentences unless they ask for something detailed.
`;

// ─── CALL OUR BACKEND PROXY (which calls Gemini) ──────────────────────────────
async function callAI(messages, system) {
  const token = localStorage.getItem("token") || localStorage.getItem("guestToken");
  const response = await fetch("http://localhost:5000/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, system }),
  });
  if (!response.ok) throw new Error("AI request failed");
  const data = await response.json();
  return data.content?.[0]?.text || "Sorry, I didn't get that. Try again?";
}





// ─── ASSISTANT CHAT ────────────────────────────────────────────────────────────
export default function ChatTab() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const mediaRecorderRef = useRef(null);
const [speakingIndex, setSpeakingIndex] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: user
        ? `Hey @${user.username}! 👋 I'm your StudyBuddy assistant. Ask me anything — how the platform works, study help, writing tips, or just chat!`
        : `Hey! 👋 I'm the StudyBuddy assistant. You're browsing as a guest — I can still help you understand the platform. What do you need?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);



  useEffect(() => {
  return () => { window.speechSynthesis?.cancel(); };
}, []);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const reply = await callAI(
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        buildSystemPrompt(user)
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops, something went wrong. Check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // const toggleVoice = () => {
  //   if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
  //     alert("Voice input not supported in this browser. Try Chrome.");
  //     return;
  //   }
  //   if (listening) {
  //     recognitionRef.current?.stop();
  //     setListening(false);
  //     return;
  //   }
  //   const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  //   const recognition = new SR();
  //   recognitionRef.current = recognition;
  //   recognition.lang = "fr-FR";
  //   recognition.interimResults = false;
  //   recognition.onresult = (e) => {
  //     setInput(e.results[0][0].transcript);
  //     setListening(false);
  //   };
  //   recognition.onerror = () => setListening(false);
  //   recognition.onend = () => setListening(false);
  //   recognition.start();
  //   setListening(true);
  // };

  const SUGGESTIONS = [
    "How do I create a post?",
    "How do I join a subject room?",
    "What is the rating system?",
    "How do I become an admin?",
  ];


  
function detectFromText(t) {
  if (/[\u0600-\u06FF]/.test(t)) return "ar";
  if (/[àâçéèêëîïôùûüœæ]/i.test(t)) return "fr";
  return "en";
}

const speakText = (text, index) => {
  if (!window.speechSynthesis) return;
  if (speakingIndex === index) {
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    return;
  }
  window.speechSynthesis.cancel();
  const PREFERRED = { fr: "Microsoft Julie", en: "Microsoft Zira", ar: "Microsoft Julie" };
  const speak = (voices) => {
    const utter = new SpeechSynthesisUtterance(text);
    const langPrefix = detectFromText(text);
    const fullLang = langPrefix === "fr" ? "fr-FR" : langPrefix === "ar" ? "ar-DZ" : "en-US";
    utter.voice = voices.find(v => v.name === PREFERRED[langPrefix])
      || voices.find(v => v.lang === fullLang)
      || null;
    utter.lang = fullLang;
    utter.rate = 0.95;
    utter.onstart = () => setSpeakingIndex(index);
    utter.onend = () => setSpeakingIndex(null);
    utter.onerror = () => setSpeakingIndex(null);
    window.speechSynthesis.speak(utter);
  };
  const voices = window.speechSynthesis.getVoices();
  voices.length > 0 ? speak(voices) : (window.speechSynthesis.onvoiceschanged = () => speak(window.speechSynthesis.getVoices()));
};

const toggleVoice = async () => {
  if (listening) { mediaRecorderRef.current?.stop(); return; }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    alert("Mic access denied.");
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
      const token = localStorage.getItem("token") || localStorage.getItem("guestToken");
      const res = await fetch("http://localhost:5000/api/ai/transcribe", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (data.text) setInput(data.text);
    } catch { alert("Transcription failed."); }
    finally { setLoading(false); }
  };
  recorder.start();
  setListening(true);
};

  return (
    <div style={s.root}>
      {/* header */}
      <div style={s.header}>
        <span style={s.headerTitle}>🤖 StudyBuddy Assistant</span>
        <span style={s.headerSub}> Ask anything.....about the app please....</span>
      </div>

      {/* messages */}
      <div style={s.messageList}>
        {messages.map((msg, i) => (
          <div key={i} style={{ ...s.bubbleWrap, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && <span style={s.botAvatar}>🤖</span>}
            {/* <div style={{ ...s.bubble, ...(msg.role === "user" ? s.userBubble : s.aiBubble) }}>
              <p style={s.bubbleText}>{msg.content}</p>
            </div> */}
            <div style={{ ...s.bubble, ...(msg.role === "user" ? s.userBubble : s.aiBubble) }}>
  <p style={s.bubbleText}>{msg.content}</p>
  {msg.role === "assistant" && (
    <button
      onClick={() => speakText(msg.content, i)}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: "12px", color: speakingIndex === i ? "#e74c3c" : "rgba(255,255,255,0.3)",
        padding: "4px 0 0 0", transition: "color 0.2s",
      }}
      title={speakingIndex === i ? "Stop" : "Read aloud"}
    >
      {speakingIndex === i ? "⏹" : "🔊"}
    </button>
  )}
</div>
            {/* {msg.role === "assistant" && (
  <button
    onClick={() => speakText(msg.content, i)}
    style={{
      background: "none", border: "none", cursor: "pointer",
      fontSize: "12px", color: speakingIndex === i ? "#e74c3c" : "rgba(255,255,255,0.3)",
      padding: "4px 0 0 0", transition: "color 0.2s",
    }}
    title={speakingIndex === i ? "Stop" : "Read aloud"}
  >
    {speakingIndex === i ? "⏹" : "🔊"}
  </button>
)} */}
          </div>
          
        ))}

        {loading && (
          <div style={{ ...s.bubbleWrap, justifyContent: "flex-start" }}>
            <span style={s.botAvatar}>🤖</span>
            <div style={{ ...s.bubble, ...s.aiBubble }}>
              <p style={{ ...s.bubbleText, opacity: 0.5 }}>thinking...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* quick suggestions — only shown at start */}
      {messages.length === 1 && (
        <div style={s.suggestions}>
          {SUGGESTIONS.map((q) => (
            <button key={q} style={s.suggBtn} onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* input row */}
      <div style={s.inputRow}>
        <button
          onClick={toggleVoice}
          title={listening ? "Stop" : "Voice input"}
          style={{ ...s.iconBtn, background: listening ? "#e74c3c" : "rgba(255,255,255,0.08)" }}
        >
          {listening ? "⏹" : "🎤"}
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
          style={s.input}
          rows={1}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            ...s.iconBtn,
            background: input.trim() && !loading ? "#6476af" : "rgba(255,255,255,0.08)",
            opacity: !input.trim() || loading ? 0.5 : 1,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────
const s = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 60px)",
    maxWidth: "780px",
    margin: "0 auto",
    width: "100%",
    padding: "0 16px",
    boxSizing: "border-box",
  },
  header: {
    padding: "16px 0 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  headerTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "white",
  },
  headerSub: {
    fontSize: "11px",
    opacity: 0.4,
    color: "white",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 0",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  bubbleWrap: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
  },
  botAvatar: {
    fontSize: "20px",
    flexShrink: 0,
    marginBottom: "2px",
  },
  bubble: {
    maxWidth: "72%",
    padding: "11px 15px",
    borderRadius: "16px",
    lineHeight: "1.6",
  },
  userBubble: {
    background: "#6476af",
    borderBottomRightRadius: "4px",
  },
  aiBubble: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderBottomLeftRadius: "4px",
  },
  bubbleText: {
    margin: 0,
    fontSize: "14px",
    color: "white",
    whiteSpace: "pre-wrap",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    paddingBottom: "12px",
  },
  suggBtn: {
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1px solid rgba(100,118,175,0.5)",
    background: "transparent",
    color: "rgba(255,255,255,0.7)",
    fontSize: "12px",
    cursor: "pointer",
  },
  inputRow: {
    display: "flex",
    gap: "8px",
    padding: "12px 0",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontSize: "14px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  iconBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    flexShrink: 0,
    color: "white",
  },
};