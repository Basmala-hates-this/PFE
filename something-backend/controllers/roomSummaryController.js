//took me a while to get back to work....just a few days but i think it was a while since i lost sense of time....fuck it,lets fuck the app as usual
//those 2 should be in a seperate controller.....hey are in a correct controller but app keep on crashing?????
//who knew recovering from burnout can be this hard?ps...i didnt recover ,i am forcing my self to finish this thing

const { runTask } = require('../routes/ai.js');
const { buildRoomSummaryPrompt } = require('../services/aiPrompts');
const pool = require("../db");


const roomRepo = require('../repositories/room.repo.js'); 

async function getAllActiveRooms() {
  return await roomRepo.getAllRooms();
}
async function generateRoomSummary(room, weekStart, weekEnd) {
  const roomId = room.id;
  const roomName = room.name;
  // Pull raw data
  const topPosts = (await pool.query(`
   SELECT 
  p.id, 
  p.title,
  COALESCE(pvc.vote_count, 0) AS vote_count,
  COALESCE(cc.comment_count, 0) AS comment_count
FROM posts p
LEFT JOIN post_vote_count pvc ON pvc.post_id = p.id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS comment_count
  FROM comments
  
  GROUP BY post_id
) cc ON cc.post_id = p.id
WHERE p.room_id = $1 AND p.created_at BETWEEN $2 AND $3
ORDER BY (COALESCE(pvc.vote_count, 0) + COALESCE(cc.comment_count, 0)) DESC
LIMIT 4;
  `, [roomId, weekStart, weekEnd])).rows;

  const topContributors = (await pool.query(`
    SELECT user_id, SUM(score) AS total_score,
  SUM(CASE WHEN type='post' THEN 1 ELSE 0 END) AS posts,
  SUM(CASE WHEN type='comment' THEN 1 ELSE 0 END) AS comments,
  SUM(CASE WHEN type='endorsement' THEN 1 ELSE 0 END) AS endorsements
FROM (
  SELECT author_id AS user_id, 'post' AS type, 2 AS score
  FROM posts
  WHERE room_id = $1 AND created_at BETWEEN $2 AND $3

  UNION ALL

  SELECT c.user_id, 'comment' AS type, 1 AS score
  FROM comments c
  JOIN posts p ON p.id = c.post_id
  WHERE p.room_id = $1 AND c.created_at BETWEEN $2 AND $3

  UNION ALL

  SELECT endoresee_id AS user_id, 'endorsement' AS type, 1 AS score
  FROM peer_endorsement
  WHERE room_id = $1 AND created_at BETWEEN $2 AND $3
) combined
GROUP BY user_id
ORDER BY total_score DESC
LIMIT 3;
  `, [roomId, weekStart, weekEnd])).rows;

  const unanswered = (await pool.query(`
  SELECT 
  p.id, 
  p.title,
  COALESCE(pvc.vote_count, 0) AS vote_count
FROM posts p
LEFT JOIN post_vote_count pvc ON pvc.post_id = p.id
WHERE p.room_id = $1 
  AND p.is_answered = FALSE
  AND p.created_at BETWEEN $2 AND $3
ORDER BY COALESCE(pvc.vote_count, 0) DESC
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

  //const roomName = await getRoomName(roomId);

  const digestText = await runTask(
    'chat',
    [{ role: 'user', content: buildRoomSummaryPrompt(roomName, highlights) }],
    'You write concise, warm weekly digests for a study room, based only on the data given.'
  );

  // Create the post
  // const post = await createPost({
  //   author_id: OFFICIAL_ACCOUNT_ID,
  //   room_id: roomId,
  //   title: `Weekly Digest — ${roomName}, Week of ${weekStart}`,
  //   content: digestText,
  //   tag: 'weekly digest by ai',
  //   is_system_generated: true
  // });

  const newPost = await postRepo.createPost({
  title: `Weekly Digest — ${roomName}, Week of ${weekStart}`,
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

  await pool.query(`
    INSERT INTO room_summaries (room_id, week_start, week_end, post_id, highlights)
    VALUES ($1, $2, $3, $4, $5)
  `, [roomId, weekStart, weekEnd, newPost.id, highlights]);

  return newPost;
}

async function generateAllRoomSummaries(req, res) {
  const rooms = await getAllActiveRooms();
  const { weekStart, weekEnd } = getLastWeekRange();

  const results = await Promise.allSettled(
    rooms.map(room => generateRoomSummary(room, weekStart, weekEnd))
  );


 

  res.json({
    generated: results.filter(r => r.status === 'fulfilled' && r.value).length,
    total: rooms.length
  });
}



module.exports = {
     generateRoomSummary, 
     generateAllRoomSummaries 
    };