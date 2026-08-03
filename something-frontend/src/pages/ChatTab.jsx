import { useState, useEffect, useRef } from "react";
import api from "../api/axios.js";
import "../styles/chat.css"

import StudyMaterialModal from "../components/StudyMaterialModal.jsx";

import StudyPlanModal from "../components/StudyPlanModal.jsx";
import StudyPlanCard from "../components/StudyPlanCard.jsx";

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const buildSystemPrompt = (user) => `
You are Glaukopis Assistant, a helpful AI embedded inside the Glaukopis platform — an academic social network built for Algerian university students.

Your personality: warm, smart, slightly casual. You speak the user's language — if they write in French, respond in French. Arabic → Arabic. English → English. Mix if they mix.

YOU KNOW THIS ABOUT THE PLATFORM:
- Glaukopis has a Feed (posts, votes, comments), Rooms (public/university/major/subject), Profile, Admin panel, Guide tab
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
-"to see posts from a specific room only, you can filter them via the room filter at the top of the feed, you can choose to see posts from all rooms, or just your university, or just your major, or just a specific subject room you joined"  
-"if you want to search something or someone ,type your query in the search bar at the top of the feed ,the results would be either in the imidiat dropdown,or 
you cal click "see more restulets" to see them in a dedicated search page"
-"you can edit your information or password via the edit button on the profile tab"
-"you can log out of your account or delet your account entirly via the dedicated buttons on the profile tab"
-"all your action history is saved in a clickble cards in the profile"
-"you can access you saved resources via the dedicated button in the profile tab"
-"admin duties are assigned be assigend only by superadmin, you can always appeal a decision by contacting them via email you can find at the buttom of the guid in the guid tab"


${user ? `CURRENT USER:
- Username: ${user.username}
- Role: ${user.role || "student"}
- Authority: ${user.authorityLevel || "user"}
- University: ${user.universityName || "not set"}
- Major: ${user.majorName || "not set"}
${user.authorityLevel === "admin" || user.authorityLevel === "superadmin" ? "- This user is an admin. Help with admin tasks too." : ""}
` : "The user is browsing as a guest."}

Keep responses concise. You're a Glaukopis, not a manual. Max 4-5 sentences unless they ask for something detailed.
`;

const SUGGESTIONS = [
  "How do I create a post?",
  "How do I join a subject room?",
  "What is the rating system?",
  "How do I become an admin?",
];

const MAX_FILE_MB = 15;

// ─── Cloudinary upload ──────────────────────────────────────────────────────
async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json(); 
  return data.secure_url;
}


async function callAI(messages, system, conversationId, attachment) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
    method: "POST",
    credentials: "include", // sends the httpOnly cookie
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, system, conversationId, attachment }),
  });
  if (!response.ok) throw new Error("AI request failed");
  const data = await response.json();
  return data.content?.[0]?.text || "Sorry, I didn't get that. Try again?";
}

// ─── ASSISTANT CHAT ────────────────────────────────────────────────────────────

export default function ChatTab() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const mediaRecorderRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `Hey ${user?.username}! 👋 I'm your Glaukopis assistant. Ask me anything — how the platform works, study help, writing tips, or just chat!`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);

  // ── attachment state ──
  const [pendingFile, setPendingFile] = useState(null);       // raw File object
  const [pendingPreview, setPendingPreview] = useState(null); // local object URL, images only
  const [uploading, setUploading] = useState(false);



const [studyMenuFor, setStudyMenuFor] = useState(null);   // index of message showing the menu
const [generatingType, setGeneratingType] = useState(null);
const [activeMaterial, setActiveMaterial] = useState(null);
const [savedMaterials, setSavedMaterials] = useState([]);
const [sidebarTab, setSidebarTab] = useState("chats"); // "chats" | "materials"
const [studyPlanModalOpen, setStudyPlanModalOpen] = useState(false); 

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { return () => { window.speechSynthesis?.cancel(); }; }, []);
  useEffect(() => {
    return () => { if (pendingPreview) URL.revokeObjectURL(pendingPreview); };
  }, [pendingPreview]);

  useEffect(() => { fetchSavedMaterials(); }, []);

const fetchSavedMaterials = async () => {
  try {
    const res = await api.get("/ai/study-materials");
    setSavedMaterials(res.data);
  } catch (err) { console.error("Failed to fetch study materials:", err); }
};

const generateStudyMaterial = async (msg, type) => {
  setStudyMenuFor(null);
  setGeneratingType(type);
  try {
    const res = await api.post("/ai/study-material", {
      conversationId: activeConvoId,
      attachment: { url: msg.attachment_url, type: msg.attachment_type },
      type,
    });
    setActiveMaterial(res.data);
    fetchSavedMaterials();
  } catch (err) {
    console.error("Study material generation failed:", err);
    alert("Couldn't generate that right now — try again in a bit.");
  } finally {
    setGeneratingType(null);
  }
};

  const fetchConversations = async () => {
    try {
      const res = await api.get("/ai/conversations");
      setConversations(res.data);
    } catch (err) { console.error("Failed to fetch conversations:", err); }
  };

  const startNewChat = () => {
    setActiveConvoId(null);
    setMessages([{
      role: "assistant",
      content: `Hey ${user?.username}! 👋 I'm your Glaukopis assistant. Ask me anything!`,
    }]);
    setInput("");
    clearAttachment();
  };

  const loadConversation = async (id) => {
    try {
      const res = await api.get(`/ai/conversations/${id}`);
    const loaded = res.data.map(m => ({
  role: m.role,
  content: m.content,
  attachment_url: m.attachment_url,
  attachment_type: m.attachment_type,
  message_type: m.message_type,
  reference_id: m.reference_id,
}));
      setMessages(loaded.length > 0 ? loaded : [{
        role: "assistant",
        content: `Hey ${user?.username}! 👋 I'm your Glaukopis assistant. Ask me anything!`,
      }]);
      setActiveConvoId(id);
    } catch (err) { console.error("Failed to load conversation:", err); }
  };

  const handleCreateStudyPlan = async ({ subject, deadline, files }) => {
  let convoId = activeConvoId;
  if (!convoId) {
    const res = await api.post("/ai/conversations", { title: subject.slice(0, 60) });
    convoId = res.data.id;
    setActiveConvoId(convoId);
  }

  let resources = [];
  if (files.length > 0) {
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    const uploadRes = await api.post("/ai/study-plan/resources", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    resources = uploadRes.data.resources;
  }

  const res = await api.post("/ai/study-plan", { subject, deadline, resources, conversationId: convoId });

  setMessages(prev => [...prev, {
    role: "assistant",
    content: `Generated a study plan for ${subject}.`,
    message_type: "study_plan",
    reference_id: res.data.plan.id,
  }]);
  fetchConversations();
};

  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/conversations/${id}`);
      if (activeConvoId === id) startNewChat();
      fetchConversations();
    } catch (err) { console.error("Failed to delete:", err); }
  };

  // ── attachment handlers ──
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      alert("Only images or PDFs are supported right now.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`File too big — keep it under ${MAX_FILE_MB}MB.`);
      return;
    }

    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(file);
    setPendingPreview(isImage ? URL.createObjectURL(file) : null);
  };

  const clearAttachment = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  };

 
 const sendMessage = async (text) => {
  const content = (text || input).trim();
  if ((!content && !pendingFile) || loading || uploading) return;
  setInput("");

  const displayContent = content || (pendingFile?.type.startsWith("image/") ? "📷 Image attached" : "📄 Document attached");
  const newMessages = [...messages, { role: "user", content: displayContent }];
  const userMsgIndex = newMessages.length - 1; // track which message this is
  setMessages(newMessages);
  setLoading(true);

  let attachment = null;
  const fileToSend = pendingFile;
  clearAttachment();

  try {
    if (fileToSend) {
      setUploading(true);
      const url = await uploadToCloudinary(fileToSend);
      attachment = { url, type: fileToSend.type.startsWith("image/") ? "image" : "pdf" };
      setUploading(false);

      // patch the message we already rendered so the trigger button shows immediately
      setMessages(prev => prev.map((m, i) =>
        i === userMsgIndex ? { ...m, attachment_url: attachment.url, attachment_type: attachment.type } : m
      ));
    }

    let convoId = activeConvoId;
    if (!convoId) {
      const res = await api.post("/ai/conversations", { title: (content || "New attachment").slice(0, 60) });
      convoId = res.data.id;
      setActiveConvoId(convoId);
      fetchConversations();
    }

    const reply = await callAI(
      newMessages.map(m => ({ role: m.role, content: m.content })),
      buildSystemPrompt(user),
      convoId,
      attachment
    );
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    fetchConversations();
  } catch (err) {
    console.error(err);
    setUploading(false);
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "Oops, something went wrong. Check your connection and try again.",
    }]);
  } finally {
    setLoading(false);
  }
};

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
      utter.voice = voices.find(v => v.name === PREFERRED[langPrefix]) || voices.find(v => v.lang === fullLang) || null;
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
    } catch { alert("Mic access denied."); return; }
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
  credentials: "include",
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
    <div className="chat-root">

      {/* ── SIDEBAR ── */}
      <div className={`chat-sidebar ${sidebarOpen ? "chat-sidebar-open" : "chat-sidebar-closed"}`}>
        {sidebarOpen ? (
          <>
            <button onClick={startNewChat} className="chat-new-btn">+ New Chat</button>
            <div className="chat-convo-list">
              {conversations.length === 0 ? (
                <small className="chat-empty-convos">No conversations yet</small>
              ) : (
                conversations.map(c => (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(c.id)}
                    className={`chat-convo-item ${activeConvoId === c.id ? "chat-convo-item-active" : ""}`}
                  >
                    <span className="chat-convo-title">{c.title || "Untitled"}</span>
                    <button onClick={(e) => deleteConversation(e, c.id)} className="chat-convo-delete" title="Delete">
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="chat-convo-list">
            {savedMaterials.length === 0 ? (
              <small className="chat-empty-convos">No study materials yet</small>
            ) : (
              savedMaterials.map(m => (
                <div key={m.id} className="chat-convo-item" onClick={() => setActiveMaterial(m)}>
                  <span className="chat-convo-title">
                    {m.type === "summary" ? "📝" : m.type === "flashcards" ? "🗂️" : "❓"} {m.type} — {new Date(m.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── CHAT AREA ── */}
      <div className="chat-area">

        <div className="chat-header">
          <button onClick={() => setSidebarOpen(p => !p)} className="chat-toggle-btn">
            {sidebarOpen ? "◀" : "▶"}
          </button>
          <span className="chat-header-title">🤖 Glaukopis Assistant</span>
          <span className="chat-header-sub">Ask anything.....about the app please....</span>
        </div>

        <div className="chat-message-list">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble-wrap ${msg.role === "user" ? "chat-bubble-wrap-right" : "chat-bubble-wrap-left"}`}>
              {msg.role === "assistant" && <span className="chat-bot-avatar">🤖</span>}
<div className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}>
                  {msg.message_type === "study_plan" && msg.reference_id ? (
    <StudyPlanCard planId={msg.reference_id} />
  ) : (
    <p className="chat-bubble-text">{msg.content}</p>
  )}
                {msg.role === "assistant" && (
                  <button
                    onClick={() => speakText(msg.content, i)}
                    className={`chat-speak-btn ${speakingIndex === i ? "chat-speak-btn-active" : ""}`}
                    title={speakingIndex === i ? "Stop" : "Read aloud"}
                  >
                    {speakingIndex === i ? "⏹" : "🔊"}
                  </button>
                )}
                {msg.role === "user" && msg.attachment_url && (
  <div className="chat-study-trigger">
    <button onClick={() => setStudyMenuFor(studyMenuFor === i ? null : i)} className="chat-study-btn">
      📚 Study Material ▾
    </button>
    {studyMenuFor === i && (
      <div className="chat-study-menu">
        <button onClick={() => generateStudyMaterial(msg, "summary")}>Summary</button>
        <button onClick={() => generateStudyMaterial(msg, "flashcards")}>Flashcards</button>
        <button onClick={() => generateStudyMaterial(msg, "quiz")}>Quiz</button>
      </div>
    )}
    {generatingType && studyMenuFor === null && <span className="chat-study-loading">Generating {generatingType}...</span>}
  </div>
)}
              </div>
            </div>
          ))}
          

          {loading && (
            <div className="chat-bubble-wrap chat-bubble-wrap-left">
              <span className="chat-bot-avatar">🤖</span>
              <div className="chat-bubble chat-bubble-ai">
                <p className="chat-bubble-text chat-thinking">
                  {uploading ? "uploading file..." : "thinking..."}
                </p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map(q => (
              <button key={q} className="chat-sugg-btn" onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>
        )}

        {pendingFile && (
          <div className="chat-attachment-preview">
            {pendingPreview ? (
              <img src={pendingPreview} alt="attachment preview" className="chat-attachment-thumb" />
            ) : (
              <span className="chat-attachment-icon">📄</span>
            )}
            <span className="chat-attachment-name">{pendingFile.name}</span>
            <button onClick={clearAttachment} className="chat-attachment-remove" title="Remove">✕</button>
          </div>
        )}

        <div className="chat-input-row">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach image or PDF"
            className="chat-icon-btn"
            disabled={loading || uploading}
          >
            📎
          </button>
          <button
            onClick={toggleVoice}
            title={listening ? "Stop" : "Voice input"}
            className={`chat-icon-btn ${listening ? "chat-icon-btn-listening" : ""}`}
          >
            {listening ? "⏹" : "🎤"}
          </button>
          <button
  onClick={() => setStudyPlanModalOpen(true)}
  title="Create a study plan"
  className="chat-icon-btn"
  disabled={loading || uploading}
>
  📅
</button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
            className="chat-input"
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={(!input.trim() && !pendingFile) || loading || uploading}
            className={`chat-icon-btn ${(input.trim() || pendingFile) && !loading && !uploading ? "chat-icon-btn-active" : "chat-icon-btn-disabled"}`}
          >
            ➤
          </button>
        </div>
      </div>
      <StudyMaterialModal material={activeMaterial} onClose={() => setActiveMaterial(null)} />
        {studyPlanModalOpen && (
  <StudyPlanModal onClose={() => setStudyPlanModalOpen(false)} onSubmit={handleCreateStudyPlan} />
)}
    </div>
  );
}