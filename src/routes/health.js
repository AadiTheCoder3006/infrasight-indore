const express = require('express');
const router = express.Router();

// GET /health
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'InfraSight',
    city: 'Indore',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
