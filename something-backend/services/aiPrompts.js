function buildRoomSummaryPrompt(roomName, highlights) {
  const { topPosts, topContributors, unanswered, difficultyCounts } = highlights;

const topPostsText = topPosts.length
    ? topPosts.map((p, i) => `${i + 1}. "${p.title}" (${p.useful_count} useful votes, ${p.comment_count} comments)`).join('\n')
    : 'No standout posts this week.';

  const contributorsText = topContributors.length
    ? topContributors.map((c, i) => `${i + 1}. ${c.username} (${c.posts} posts, ${c.comments} comments, ${c.endorsements} endorsements)`).join('\n')
    : 'No standout contributors this week.';

  const unansweredText = unanswered.length
? unanswered.map((p, i) => `${i + 1}. "${p.title}" (${p.useful_count} useful votes, still unanswered)`).join('\n')
    : 'Everything got answered this week — nice.';

  const difficultyText = difficultyCounts.length
    ? difficultyCounts.map(d => `${d.difficulty}: ${d.count}`).join(', ')
    : 'No difficulty data available.';

  return `You are writing a short, friendly weekly digest for the "${roomName}" study room on Glaukopis, an academic platform for university students.

Data for this week:

Top posts:
${topPostsText}

Top contributors:
${contributorsText}

Still unanswered (needs help):
${unansweredText}

Difficulty breakdown of posts this week:
${difficultyText}

Write a warm, concise digest (250-350 words) in this structure:
1. A brief, natural opening line about the room's activity this week (no generic "Hello everyone!" — get straight to substance)
2. Highlight the top posts naturally in prose, not just a repeated list
3. Shout out the top contributors
4. Gently point people toward the unanswered posts, framed as an invitation to help, not a complaint
5. Optionally mention the difficulty mix if it's interesting (e.g. lots of advanced posts this week),provide the difficulty breakdown in prose, not just a repeated list and provide the count if available

Do not use excessive emojis. Do not sound like a corporate newsletter. Write like a knowledgeable peer summarizing the week for the room. Do not fabricate any information not given above.`;
}


function buildStudyPlanPrompt({ subject, daysUntilDeadline, resourceContext }) {
  return `Generate a day-by-day study plan for "${subject}" over ${daysUntilDeadline} days.
${resourceContext ? `Base it on these provided resources:\n${resourceContext}` : 'No specific resources provided — use general best-practice topic coverage.'}

Return ONLY a JSON array, no prose, no markdown fences, in this exact shape:
[{"day_index": 1, "title": "short task title", "description": "1-2 sentence detail"}]

Rules:
- One entry per day_index from 1 to ${daysUntilDeadline}.
- Earlier days: foundational/broad topics. Later days: review, practice, weak-point reinforcement.
- Keep titles under 60 characters.`;
}

module.exports = { buildRoomSummaryPrompt, buildStudyPlanPrompt };
