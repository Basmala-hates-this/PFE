const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const router = express.Router();

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
async function tryGroq(messages, system) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
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
  const { messages, system } = req.body;
  if (!messages || messages.length === 0)
    return res.status(400).json({ error: "No messages provided" });

  const providers = [
    { name: "Gemini",  fn: tryGemini,  key: process.env.GEMINI_API_KEY  },
    { name: "Groq",    fn: tryGroq,    key: process.env.GROQ_API_KEY    },
    { name: "Mistral", fn: tryMistral, key: process.env.MISTRAL_API_KEY },
  ];

  for (const provider of providers) {
    if (!provider.key) continue; // skip if key not set
    try {
      const text = await provider.fn(messages, system);
      console.log(` Responded via ${provider.name}`);
      return res.json({ content: [{ text }] });
    } catch (err) {
      console.warn(` ${provider.name} failed: ${err.message} — trying next...`);
    }
  }

  // all providers failed
  console.error("All AI providers failed");
  return res.status(503).json({
    content: [{ text: "I'm having trouble connecting right now. Try again in a few seconds!" }],
  });
});

module.exports = router;