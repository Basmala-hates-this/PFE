const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const authMiddleware = require("../middleware/authMiddleware"); 

const pool = require("../db");



const { PDFParse } = require("pdf-parse");


const { buildRoomSummaryPrompt } = require('../services/aiPrompts');


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── helpers to build message arrays ──────────────────────────────────────
function buildTextMessages(messages, system) {
  return [
    { role: "system", content: system || "You are a helpful assistant." },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];
}

function buildVisionMessages(messages, system, imageUrl) {
  const base = buildTextMessages(messages.slice(0, -1), system);
  const lastUserMsg = messages[messages.length - 1];
  return [
    ...base,
    {
      role: "user",
      content: [
        { type: "text", text: lastUserMsg.content },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    },
  ];
}



async function extractPdfText(url) {
  const pdfRes = await fetch(url);
  const buffer = Buffer.from(await pdfRes.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
// ─── Groq ──────────────────────────────────────────────────────────────────
async function groqChat(messages, system) {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    max_tokens: 1000,
    messages: buildTextMessages(messages, system),
  });
  return completion.choices[0]?.message?.content || "No response.";
}

async function groqVision(messages, system, imageUrl) {
  const completion = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 1000,
    messages: buildVisionMessages(messages, system, imageUrl),
  });
  return completion.choices[0]?.message?.content || "No response.";
}

async function groqJSON(messages, system) {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    max_tokens: 1500,
    response_format: { type: "json_object" },
    messages: buildTextMessages(messages, system),
  });
  return completion.choices[0]?.message?.content || "{}";
}

// ─── Mistral ───────────────────────────────────────────────────────────────
async function mistralChat(messages, system) {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      max_tokens: 1000,
      messages: buildTextMessages(messages, system),
    }),
  });
  if (!response.ok) throw new Error(`Mistral ${response.status}`);
  const data = await response.json();
  return data.choices[0]?.message?.content || "No response.";
}

// ─── OpenRouter ────────────────────────────────────────────────────────────
async function openRouterCall({ messages, system, imageUrl, json }) {
  const body = {
    model: imageUrl
      ? "meta-llama/llama-4-scout"       // vision-capable on OR
      : "meta-llama/llama-3.3-70b-instruct:free",
    max_tokens: json ? 1500 : 1000,
    messages: imageUrl
      ? buildVisionMessages(messages, system, imageUrl)
      : buildTextMessages(messages, system),
  };
  if (json) body.response_format = { type: "json_object" };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
  const data = await response.json();
  return data.choices[0]?.message?.content || "No response.";
}

const openRouterChat = (messages, system) => openRouterCall({ messages, system });
const openRouterVision = (messages, system, imageUrl) => openRouterCall({ messages, system, imageUrl });
const openRouterJSON = (messages, system) => openRouterCall({ messages, system, json: true });

// ─── task-based router ─────────────────────────────────────────────────────
const routingTable = {
  chat:   [{ name: "Groq", fn: groqChat },   { name: "Mistral", fn: mistralChat }, { name: "OpenRouter", fn: openRouterChat }],
  vision: [{ name: "Groq", fn: groqVision }, { name: "OpenRouter", fn: openRouterVision }],
  json:   [{ name: "Groq", fn: groqJSON },   { name: "OpenRouter", fn: openRouterJSON }],
};

// ─── difficulty classification ──────────────────────────────────────────────
async function classifyDifficulty(title, content) {
  const prompt = `Classify the difficulty level of this student question as one of exactly these three values: "beginner", "intermediate", or "advanced". Respond as JSON: {"difficulty": string}.\n\nTitle: ${title || ""}\nContent: ${content}`;

  const raw = await runTask(
    "json",
    [{ role: "user", content: prompt }],
    "You classify academic question difficulty. Output only valid JSON, no prose."
  );

  const parsed = JSON.parse(raw);
  const valid = ["beginner", "intermediate", "advanced"];
  return valid.includes(parsed.difficulty) ? parsed.difficulty : null;
}


async function runTask(taskType, messages, system, imageUrl) {
  for (const provider of routingTable[taskType]) {
    try {
      const result = await provider.fn(messages, system, imageUrl);
      console.log(`[${taskType}] responded via ${provider.name}`);
      return result;
    } catch (err) {
      console.warn(`[${taskType}] ${provider.name} failed: ${err.message} — trying next...`);
    }
  }
  throw new Error(`All providers failed for task: ${taskType}`);
}


// ─── cross-specialty INTO major suggestion ──────────────────────────────────
async function suggestIntoMajors(title, content, candidateMajors) {
  // candidateMajors: [{id, name}, ...] — already excludes the poster's own FROM major
  if (!candidateMajors || candidateMajors.length === 0) return [];

  const majorsList = candidateMajors.map(m => `${m.id}: ${m.name}`).join("\n");

  const prompt = `A student is posting the following question in a cross-specialty room, hoping to reach students from a different major who can help answer it.

Title: ${title || ""}
Content: ${content}

Here is the list of available majors (id: name):
${majorsList}

Pick the 4 majors most likely to be relevant to this question, ordered from most to least relevant. Respond as JSON: {"majorIds": string[]} where each string is one of the ids listed above. Only include ids from the list. Return at most 4.`;

  const raw = await runTask(
    "json",
    [{ role: "user", content: prompt }],
    "You match academic questions to the most relevant fields of study. Output only valid JSON, no prose."
  );

  const parsed = JSON.parse(raw);
  const validIds = new Set(candidateMajors.map(m => m.id));
  const suggested = Array.isArray(parsed.majorIds)
    ? parsed.majorIds.filter(id => validIds.has(id)).slice(0, 4)
    : [];

  return suggested;
}

// ─── POST /api/ai/chat — tries each provider in order ────────────────────────
router.post("/chat", async (req, res) => {
  const { messages, system, conversationId, attachment } = req.body;
  // attachment: { url, type: 'image' | 'pdf' } — optional

  if (!messages || messages.length === 0)
    return res.status(400).json({ error: "No messages provided" });

  if (conversationId) {
    const userMsg = messages[messages.length - 1];
    try {
      await pool.query(
        `INSERT INTO ai_messages (conversation_id, role, content, attachment_url, attachment_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [conversationId, userMsg.role, userMsg.content, attachment?.url || null, attachment?.type || null]
      );
    } catch (err) {
      console.error("Failed to save user message:", err);
    }
  }

  let text;
  let taskMessages = messages;
  let taskType = "chat";
  let imageUrl = null;

  try {
    if (attachment?.type === "image") {
      taskType = "vision";
      imageUrl = attachment.url;

} else if (attachment?.type === "pdf") {
  const extractedText = (await extractPdfText(attachment.url)).slice(0, 12000);
  taskMessages = [
    ...messages.slice(0, -1),
    { role: "user", content: `${messages[messages.length - 1].content}\n\n--- Uploaded document content ---\n${extractedText}` },
  ];
}
    text = await runTask(taskType, taskMessages, system, imageUrl);
  } catch (err) {
    console.error("AI task failed completely:", err.message);
    return res.status(503).json({
      content: [{ text: "I'm having trouble connecting right now. Try again in a few seconds!" }],
    });
  }

  if (conversationId) {
    try {
      await pool.query(
        `INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
        [conversationId, "assistant", text]
      );
      await pool.query(`UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);
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



// ─── TTS helpers (used by /speak) ──────────────────────────────────────────
// Groq Orpheus for en/ar, proxied Google Translate TTS for fr (unofficial,
// free, no key — fine for short confirmations; swap for a real provider
// later if French TTS needs to scale beyond that).
// NOTE: Groq's Arabic Orpheus model requires accepting Canopy Labs' model
// terms once in the Groq console, or requests will fail.

const MAX_TTS_CHARS = 200; // Groq Orpheus (esp. Arabic) has short input limits

async function speakEnglish(text) {
  const response = await groq.audio.speech.create({
    model: "canopylabs/orpheus-v1-english",
    voice: "autumn", // or: diana, hannah, austin, daniel, troy
    input: text,
    response_format: "wav",
  });
  return { buffer: Buffer.from(await response.arrayBuffer()), contentType: "audio/wav" };
}

async function speakArabic(text) {
  const response = await groq.audio.speech.create({
    model: "canopylabs/orpheus-arabic-saudi",
    voice: "noura", // or: fahad, sultan, lulwa, aisha
    input: text,
    response_format: "wav",
  });
  return { buffer: Buffer.from(await response.arrayBuffer()), contentType: "audio/wav" };
}

async function speakFrench(text) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=fr&client=tw-ob`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Google TTS proxy ${response.status}`);
  return { buffer: Buffer.from(await response.arrayBuffer()), contentType: "audio/mpeg" };
}

// ─── POST /api/ai/speak ─────────────────────────────────────────────────────
router.post("/speak", async (req, res) => {
  const { text, lang } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "text is required" });

  const truncated = text.slice(0, MAX_TTS_CHARS);

  try {
    let result;
    if (lang === "ar") {
      result = await speakArabic(truncated);
    } else if (lang === "fr") {
      result = await speakFrench(truncated);
    } else {
      result = await speakEnglish(truncated);
    }

    res.set("Content-Type", result.contentType);
    return res.send(result.buffer);
  } catch (err) {
    console.error("TTS generation failed:", err.message);
    return res.status(500).json({ error: "TTS generation failed" });
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
  `SELECT id, role, content, created_at, attachment_url, attachment_type, message_type, reference_id
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
router.post("/study-material", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { conversationId, sourceText, attachment, type } = req.body;

  const validTypes = ["summary", "flashcards", "quiz"];
  if (!validTypes.includes(type)) return res.status(400).json({ error: "Invalid material type" });
  if (!sourceText && !attachment) return res.status(400).json({ error: "No source provided" });

  try {
    let text = sourceText;
    if (!text && attachment?.type === "pdf") {
      text = await extractPdfText(attachment.url);
    }
    if (!text) return res.status(400).json({ error: "Couldn't extract content from that source" });
    text = text.slice(0, 12000);

    const prompts = {
      summary: `Summarize the following study material into key points as JSON: {"title": string, "points": string[]}.\n\n${text}`,
      flashcards: `Generate 8-12 flashcards from the following study material as JSON: {"cards": [{"front": string, "back": string}]}.\n\n${text}`,
      quiz: `Generate a 5-question multiple choice quiz from the following study material as JSON: {"questions": [{"question": string, "options": string[], "correctIndex": number}]}.\n\n${text}`,
    };

    const raw = await runTask("json", [{ role: "user", content: prompts[type] }], "You output only valid JSON, no prose.");
    const content = JSON.parse(raw);

    const result = await pool.query(
      `INSERT INTO study_materials (user_id, conversation_id, type, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, conversationId || null, type, content]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Study material generation failed:", err.message);
    res.status(503).json({ error: "Couldn't generate study material, try again in a bit" });
  }
});

// ─── GET /api/ai/study-materials ───────────────────────────────────────────
router.get("/study-materials", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, conversation_id, type, content, created_at
       FROM study_materials WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch study materials" });
  }
});

// ─── GET /api/ai/study-materials/:id ────────────────────────────────────────
router.get("/study-materials/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM study_materials WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch study material" });
  }
});



module.exports = router;
module.exports.classifyDifficulty = classifyDifficulty;
module.exports.suggestIntoMajors = suggestIntoMajors;
module.exports.runTask = runTask;
module.exports.extractPdfText = extractPdfText;
