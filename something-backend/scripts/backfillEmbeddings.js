require("dotenv").config();
const pool = require("../db");
const { getEmbedding, toVectorLiteral } = require("../utils/embeddings");

async function run() {
  const { rows } = await pool.query(`SELECT id, title, content FROM posts WHERE embedding IS NULL`);
  console.log(`Backfilling ${rows.length} posts...`);
  for (const post of rows) {
    try {
      const embedding = await getEmbedding(`${post.title}\n${post.content}`);
      await pool.query(`UPDATE posts SET embedding = $1::vector WHERE id = $2`, [toVectorLiteral(embedding), post.id]);
      console.log(`✓ ${post.id}`);
      await new Promise(r => setTimeout(r, 200)); // gentle pacing, avoid rate limits
    } catch (err) {
      console.error(`✗ ${post.id}: ${err.message}`);
    }
  }
  console.log("Done.");
  process.exit(0);
}
run();