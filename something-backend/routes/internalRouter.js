const express = require('express');
const router = express.Router();
const { generateAllRoomSummaries } = require('../controllers/roomSummaryController'); 

function verifyInternalSecret(req, res, next) {
  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

router.post('/generate-summaries', verifyInternalSecret, generateAllRoomSummaries);

module.exports = router;