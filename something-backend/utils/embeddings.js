async function getEmbedding(text) {
  const response = await fetch("https://api.mistral.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({ model: "mistral-embed", input: [text] }),
  });
  if (!response.ok) throw new Error(`Mistral embeddings ${response.status}`);
  const data = await response.json();
  return data.data[0].embedding; // array of 1024 floats
}

function toVectorLiteral(embedding) {
  return `[${embedding.join(",")}]`;
}

module.exports = { getEmbedding, toVectorLiteral };