const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const authMiddleware = require("../middleware/authMiddleware"); 

const pool = require("../db");


// ─── Gemini ───────────────────────────────────────────────────────────────────
function toGeminiHistory(messages) {
  const history = messages.slice(0, -1);
  const firstUserIdx = history.findIndex((m) => m.role === "user");
  if (firstUserIdx === -1) return [];
  return history.slice(firstUserIdx).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

async function tryGemini(messages, system) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: system || "You are a helpful assistant.",
  });
  const chat = model.startChat({ history: toGeminiHistory(messages) });
  const result = await chat.sendMessage(messages[messages.length - 1].content);
  return result.response.text();
}

// ─── Groq ─────────────────────────────────────────────────────────────────────
// async function tryGroq(messages, system) {
//   const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
//   const completion = await groq.chat.completions.create({
//     model: "llama-3.3-70b-versatile",
//     max_tokens: 1000,
//     messages: [
//       { role: "system", content: system || "You are a helpful assistant." },
//       ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
//     ],
//   });
//   return completion.choices[0]?.message?.content || "No response.";
// }
//the old modal going to be deprecated, so we are using the new one below
async function tryGroq(messages, system) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b", // was: "llama-3.3-70b-versatile"
    max_tokens: 1000,
    messages: [
      { role: "system", content: system || "You are a helpful assistant." },
      ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    ],
  });
  return completion.choices[0]?.message?.content || "No response.";
}

// ─── Mistral ──────────────────────────────────────────────────────────────────
async function tryMistral(messages, system) {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      max_tokens: 1000,
      messages: [
        { role: "system", content: system || "You are a helpful assistant." },
        ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
      ],
    }),
  });
  if (!response.ok) throw new Error(`Mistral ${response.status}`);
  const data = await response.json();
  return data.choices[0]?.message?.content || "No response.";
}

// ─── POST /api/ai/chat — tries each provider in order ────────────────────────
router.post("/chat", async (req, res) => {
  const { messages, system, conversationId } = req.body;
   console.log("conversationId received:", conversationId);
  console.log("messages count:", messages?.length);
  if (!messages || messages.length === 0)
    return res.status(400).json({ error: "No messages provided" });

  // save user message
  if (conversationId) {
    const userMsg = messages[messages.length - 1];
    try {
      await pool.query(
        `INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
        [conversationId, userMsg.role, userMsg.content]
      );
    } catch (err) {
      console.error("Failed to save user message:", err);
    }
  }

  const providers = [
    { name: "Gemini",  fn: tryGemini,  key: process.env.GEMINI_API_KEY  },
    { name: "Groq",    fn: tryGroq,    key: process.env.GROQ_API_KEY    },
    { name: "Mistral", fn: tryMistral, key: process.env.MISTRAL_API_KEY },
  ];

  let text;
  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      text = await provider.fn(messages, system);
      console.log(`Responded via ${provider.name}`);
      break;
    } catch (err) {
      console.warn(`${provider.name} failed: ${err.message} — trying next...`);
    }
  }

  if (!text) {
    return res.status(503).json({
      content: [{ text: "I'm having trouble connecting right now. Try again in a few seconds!" }],
    });
  }

  // save assistant reply
  if (conversationId) {
    try {
      await pool.query(
        `INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
        [conversationId, "assistant", text]
      );
      // update conversation timestamp
      await pool.query(
        `UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1`,
        [conversationId]
      );
    } catch (err) {
      console.error("Failed to save assistant message:", err);
    }
  }

  return res.json({ content: [{ text }] });
});

// ─── POST /api/ai/transcribe ──────────────────────────────────────────────────
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file provided" });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Groq needs a File object — reconstruct from buffer
    const file = new File([req.file.buffer], "audio.webm", { type: req.file.mimetype });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      response_format: "json",
    });

    console.log("Transcribed:", transcription.text);
    return res.json({ text: transcription.text });
  } catch (err) {
    console.error("Transcription failed:", err.message);
    return res.status(500).json({ error: "Transcription failed" });
  }
});


// ─── GET /api/ai/conversations ─────────────────────────────────────────────
router.get("/conversations", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT id, title, created_at, updated_at 
       FROM ai_conversations 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ─── POST /api/ai/conversations ────────────────────────────────────────────
router.post("/conversations", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { title } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO ai_conversations (user_id, title) 
       VALUES ($1, $2) RETURNING *`,
      [userId, title || "New Chat"]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// ─── GET /api/ai/conversations/:id ─────────────────────────────────────────
router.get("/conversations/:id", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const convo = await pool.query(
      `SELECT * FROM ai_conversations WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (convo.rows.length === 0) return res.status(404).json({ error: "Not found" });

    const messages = await pool.query(
      `SELECT role, content, created_at 
       FROM ai_messages 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );
    res.json(messages.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ─── DELETE /api/ai/conversations/:id ──────────────────────────────────────
router.delete("/conversations/:id", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    await pool.query(
      `DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

module.exports = router;