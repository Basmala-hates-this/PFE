
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const pool = require("../db");
const toCamel  = require("../utils/toCamel");
const { runTask } = require('./ai'); 
const { buildStudyPlanPrompt } = require('../services/aiPrompts');

const { extractPdfText } = require('./ai');
const { uploadToCloudinary } = require('../config/cloudinary'); 


async function generateStudyPlan({ subject, daysUntilDeadline, resourceContext }) {
  const prompt = buildStudyPlanPrompt({ subject, daysUntilDeadline, resourceContext });
  const raw = await runTask('json', [{ role: 'user', content: prompt }], 'You output only valid JSON, no prose.');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(t => t.day_index && t.title)) {
    throw new Error('Malformed AI response for study plan');
  }
  return parsed;
}


router.post('/study-plan/resources', protect, upload.array('files', 5), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files provided' });
  try {
    const results = await Promise.all(req.files.map(async (file) => {
      const cloudinaryResult = await uploadToCloudinary(file); 
      const text = await extractPdfText(cloudinaryResult.secure_url);
      return { url: cloudinaryResult.secure_url, filename: file.originalname, text };
    }));
    res.json({ resources: results });
  } catch (err) {
    console.error('Resource upload error:', err.message);
    res.status(500).json({ error: 'Failed to process resources' });
  }
});

router.post('/study-plan', protect , async (req, res) => {
  const { subject, deadline, resources = [], conversationId } = req.body;
  const userId = req.user.id;

  if (!subject || !deadline || !conversationId) {
    return res.status(400).json({ error: 'Subject, deadline, and conversationId are required' });
  }

  const daysUntilDeadline = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysUntilDeadline < 1) {
    return res.status(400).json({ error: 'Deadline must be in the future' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resourceContext = resources
      .map(r => `--- ${r.filename} ---\n${r.text.slice(0, 3000)}`)
      .join('\n\n');

    const planJson = await generateStudyPlan({ subject, daysUntilDeadline, resourceContext });

    const planResult = await client.query(
      `INSERT INTO study_plans (user_id, subject, deadline, resources) VALUES ($1,$2,$3,$4) RETURNING *`,
      [userId, subject, deadline, JSON.stringify(resources.map(({ url, filename }) => ({ url, filename })))]
    );
    const plan = planResult.rows[0];

    for (const [i, task] of planJson.entries()) {
      await client.query(
        `INSERT INTO study_plan_tasks (plan_id, day_index, title, description, sort_order) VALUES ($1,$2,$3,$4,$5)`,
        [plan.id, task.day_index, task.title, task.description, i]
      );
    }

    // host message — content is a plain-text fallback for anywhere message_type isn't rendered specially yet
    const messageResult = await client.query(
      `INSERT INTO ai_messages (conversation_id, role, content, message_type, reference_id)
       VALUES ($1, 'assistant', $2, 'study_plan', $3) RETURNING id`,
      [conversationId, `Generated a ${daysUntilDeadline}-day study plan for ${subject}.`, plan.id]
    );

    await client.query(
      `UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]
    );

    await client.query('COMMIT');

    const tasks = (await client.query(
      `SELECT * FROM study_plan_tasks WHERE plan_id = $1 ORDER BY sort_order`, [plan.id]
    )).rows;

    res.status(201).json({ plan, tasks: tasks.map(toCamel), messageId: messageResult.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Study plan generation error:', err);
    res.status(503).json({ error: "Couldn't generate study plan, try again in a bit" });
  } finally {
    client.release();
  }
});


router.patch('/study-plan/tasks/:taskId', protect, async (req, res) => {
    const { taskId } = req.params;
  // if (!isUUID(taskId)) return res.status(400).json({ error: 'Invalid task ID' });
  
  const { completed } = req.body;

  try {
    const result = await pool.query(
      `UPDATE study_plan_tasks 
       SET completed = $1, completed_at = $2 
       WHERE id = $3 
       AND plan_id IN (SELECT id FROM study_plans WHERE user_id = $4)
       RETURNING *`,
      [completed, completed ? new Date() : null, taskId, req.user.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(toCamel(result.rows[0]));
  } catch (err) {
    console.error('Task toggle error:', err);

    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.get('/study-plan/:id', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const planResult = await pool.query(
      `SELECT * FROM study_plans WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (planResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const tasksResult = await pool.query(
      `SELECT * FROM study_plan_tasks WHERE plan_id = $1 ORDER BY sort_order`,
      [id]
    );

    res.json({
      plan: toCamel(planResult.rows[0]),
      tasks: tasksResult.rows.map(toCamel),
    });
  } catch (err) {
    console.error('Fetch study plan error:', err.message);
    res.status(500).json({ error: 'Failed to fetch study plan' });
  }
});

// PATCH /api/ai/study-plan/:id/abandon
router.patch('/study-plan/:id/abandon', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE study_plans SET status = 'abandoned', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(toCamel(result.rows[0]));
  } catch (err) {
    console.error('Abandon study plan error:', err.message);
    res.status(500).json({ error: 'Failed to abandon study plan' });
  }
});

// DELETE /api/ai/study-plan/:id
router.delete('/study-plan/:id', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM study_plans WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete study plan error:', err.message);
    res.status(500).json({ error: 'Failed to delete study plan' });
  }
});

module.exports = router;