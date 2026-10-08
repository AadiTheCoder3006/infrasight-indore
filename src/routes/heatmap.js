const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /heatmap
router.get('/', (req, res) => {
  const { type } = req.query;
  const points = db.getHeatmapData(type || '');
  res.json(points);
});

module.exports = router;
