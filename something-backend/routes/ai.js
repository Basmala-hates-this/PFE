const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const router = express.Router();

// ─── Gemini history formatter ─────────────────────────────────────────────────
function toGeminiHistory(messages) {
  const history = messages.slice(0, -1);
  const firstUserIdx = history.findIndex((m) => m.role === "user");
  if (firstUserIdx === -1) return [];
  return history.slice(firstUserIdx).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

// ─── Try Gemini ───────────────────────────────────────────────────────────────
async function tryGemini(messages, system) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: system || "You are a helpful assistant.",
  });
  const history = toGeminiHistory(messages);
  const lastMessage = messages[messages.length - 1].content;
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage);
  return result.response.text();
}

// ─── Try Groq (fallback) ──────────────────────────────────────────────────────
async function tryGroq(messages, system) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const groqMessages = [
    { role: "system", content: system || "You are a helpful assistant." },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // free, fast, smart
    messages: groqMessages,
    max_tokens: 1000,
  });
  return completion.choices[0]?.message?.content || "No response.";
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  const { messages, system } = req.body;
  if (!messages || messages.length === 0)
    return res.status(400).json({ error: "No messages provided" });

  // try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await tryGemini(messages, system);
      console.log("✅ Responded via Gemini");
      return res.json({ content: [{ text }] });
    } catch (err) {
      const is429 = err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("Too Many");
      console.warn(`⚠️ Gemini failed (${is429 ? "quota" : "error"}), trying Groq...`);
    }
  }

  // fallback to Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const text = await tryGroq(messages, system);
      console.log("✅ Responded via Groq (fallback)");
      return res.json({ content: [{ text }] });
    } catch (err) {
      console.error("❌ Groq also failed:", err.message);
    }
  }

  // both failed
  return res.status(503).json({
    error: "AI service temporarily unavailable. Try again in a moment.",
    content: [{ text: "I'm having trouble connecting right now. Try again in a few seconds!" }],
  });
});

module.exports = router;