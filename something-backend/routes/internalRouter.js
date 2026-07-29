const express = require('express');
const router = express.Router();
const { generateAllRoomSummaries } = require('../controllers/roomSummaryController');

// Simple secret-check middleware, scoped to this router only
function verifyInternalSecret(req, res, next) {
  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// Moved from server.js — no secret needed, stays public for uptime pings
router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// New, protected — only your cron job should hit this
router.post('/generate-summaries', verifyInternalSecret, generateAllRoomSummaries);

module.exports = router;