//took me a while to get back to work....just a few days but i think it was a while since i lost sense of time....fuck it,lets fuck the app as usual
//those 2 should be in a seperate controller.....hey are in a correct controller but app keep on crashing?????
//who knew recovering from burnout can be this hard?ps...i didnt recover ,i am forcing my self to finish this thing

const { runTask } = require('../routes/ai.js');
const { buildRoomSummaryPrompt } = require('../services/aiPrompts');
const pool = require("../db");


const roomRepo = require('../repositories/room.repo.js'); 
const postRepo = require('../repositories/post.repo.js');
const OFFICIAL_ACCOUNT_ID = process.env.OFFICIAL_ACCOUNT_ID;

function formatDate(date) {
  return date.toISOString().split('T')[0]; // "2026-07-27"
}

async function generateRoomSummary(room, weekStart, weekEnd) {
  const roomId = room.id;
  const roomName = room.name;

   const existing = await pool.query(
    `SELECT id FROM room_summaries WHERE room_id = $1 AND week_start = $2`,
    [roomId, weekStart]
  );
  if (existing.rows.length > 0) {
    console.log(`Room ${roomId} already has a summary for week ${formatDate(weekStart)} — skipping`);
    return null;
  }
  // Pull raw data
  const topPosts = (await pool.query(`
  SELECT 
  p.id, 
  p.title,
  COALESCE(pvc.useful, 0) AS useful_count,
  COALESCE(cc.comment_count, 0) AS comment_count
FROM posts p
LEFT JOIN post_vote_counts pvc ON pvc.post_id = p.id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS comment_count
  FROM comments
  GROUP BY post_id
) cc ON cc.post_id = p.id
WHERE p.room_id = $1 AND p.created_at BETWEEN $2 AND $3
ORDER BY (COALESCE(pvc.useful, 0) + COALESCE(cc.comment_count, 0)) DESC
LIMIT 4;
  `, [roomId, weekStart, weekEnd])).rows;

  const topContributors = (await pool.query(`
   SELECT u.username, combined.user_id, SUM(score) AS total_score,
  SUM(CASE WHEN type='post' THEN 1 ELSE 0 END) AS posts,
  SUM(CASE WHEN type='comment' THEN 1 ELSE 0 END) AS comments,
  SUM(CASE WHEN type='endorsement' THEN 1 ELSE 0 END) AS endorsements
FROM (
  SELECT user_id, 'post' AS type, 2 AS score
  FROM posts
  WHERE room_id = $1 AND created_at BETWEEN $2 AND $3

  UNION ALL

  SELECT c.user_id, 'comment' AS type, 1 AS score
  FROM comments c
  JOIN posts p ON p.id = c.post_id
  WHERE p.room_id = $1 AND c.created_at BETWEEN $2 AND $3

  UNION ALL

  SELECT endorsee_id AS user_id, 'endorsement' AS type, 1 AS score
  FROM peer_endorsements
  WHERE room_id = $1 AND created_at BETWEEN $2 AND $3
) combined
JOIN users u ON u.id = combined.user_id
GROUP BY combined.user_id, u.username
ORDER BY total_score DESC
LIMIT 3;
  `, [roomId, weekStart, weekEnd])).rows;

  const unanswered = (await pool.query(`
  SELECT 
  p.id, 
  p.title,
  COALESCE(pvc.useful, 0) AS useful_count
FROM posts p
LEFT JOIN post_vote_counts pvc ON pvc.post_id = p.id
WHERE p.room_id = $1 
  AND p.is_answered = FALSE
  AND p.created_at BETWEEN $2 AND $3
ORDER BY COALESCE(pvc.useful, 0) DESC
LIMIT 3;
  `, [roomId, weekStart, weekEnd])).rows;



  const difficultyCounts = (await pool.query(`
    SELECT difficulty, COUNT(*) 
    FROM posts
    WHERE room_id = $1 AND created_at BETWEEN $2 AND $3
    GROUP BY difficulty
  `, [roomId, weekStart, weekEnd])).rows;

  // Skip generation if room had zero activity that week
  if (topPosts.length === 0) return null;

const highlights = { topPosts, topContributors, unanswered, difficultyCounts };

  
const digestText = await runTask(
    'chat',
    [{ role: 'user', content: buildRoomSummaryPrompt(roomName, highlights) }],
    'You write concise, warm weekly digests for a study room, based only on the data given.'
  );

  const newPost = await postRepo.createPost({
    title: `Weekly Digest — ${roomName}, Week of ${formatDate(weekStart)}`,
    content: digestText,
    roomId,
    authorId: OFFICIAL_ACCOUNT_ID,
    authorUsername: 'Glaukopis',
    authorRole: 'student',
    isQuestion: false,
    isStudyPartner: false,
    tag: 'weekly digest by ai',
    isSystemGenerated: true,
  });

  try {
    await pool.query(`
      INSERT INTO room_summaries (room_id, week_start, week_end, post_id, highlights)
      VALUES ($1, $2, $3, $4, $5)
    `, [roomId, weekStart, weekEnd, newPost.id, highlights]);
  } catch (err) {
    if (err.code === '23505') {
      console.log(`Room ${roomId} already has a summary for week ${formatDate(weekStart)} — skipping`);
      return null;
    }
    throw err;
  }

  
  // await pool.query(`
  //   INSERT INTO room_summaries (room_id, week_start, week_end, post_id, highlights)
  //   VALUES ($1, $2, $3, $4, $5)
  // `, [roomId, weekStart, weekEnd, newPost.id, highlights]);

  return newPost;
}

async function generateAllRoomSummaries(req, res) {
  const rooms = await getAllActiveRooms();
  const { weekStart, weekEnd } = getLastWeekRange();

  const results = await Promise.allSettled(
    rooms.map(room => generateRoomSummary(room, weekStart, weekEnd))
  );

  // TEMP — log any rejections so we can see what's actually failing
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Room ${rooms[i].id} (${rooms[i].name}) failed:`, r.reason);
    }
  });

  res.json({
    generated: results.filter(r => r.status === 'fulfilled' && r.value).length,
    total: rooms.length
  });
}


async function getAllActiveRooms() {
  const result = await pool.query(`
    SELECT r.*
    FROM rooms r
    JOIN room_members rm ON rm.room_id = r.id
    WHERE r.type != 'private'
    GROUP BY r.id
    HAVING COUNT(rm.user_id) > 0
  `);
  return result.rows;
}


function getLastWeekRange() {
  const now = new Date();
//we set the weeek start with monday ....i hate mondays....the digest will be on sundays,i dont like sundays either
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Sunday(0) -> 6, Monday(1) -> 0, etc.

  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - daysSinceMonday);

  // weekEnd is "right now" — the week isn't fully over yet when this runs,
  // so we just capture everything up through the moment the job fires....i need to set the cron job for this
  const weekEnd = new Date(now);

  return { weekStart, weekEnd };
}

module.exports = {
     generateRoomSummary, 
     generateAllRoomSummaries ,
     getAllActiveRooms,
     getLastWeekRange,
    };