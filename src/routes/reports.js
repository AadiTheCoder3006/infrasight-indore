const express = require('express');
const router = express.Router();
const db = require('../database');
const { analyzeImage } = require('../ai_vision');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `report_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`);
  }
});
const upload = multer({ storage });

// POST /reports/scan
router.post('/scan', upload.single('image'), (req, res) => {
  try {
    let filename = '';
    let buffer = null;
    if (req.file) {
      filename = req.file.originalname || req.file.filename;
      if (req.file.path && fs.existsSync(req.file.path)) {
        buffer = fs.readFileSync(req.file.path);
      }
    }
    const analysis = analyzeImage(filename, buffer);
    res.json(analysis);
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ detail: 'Error analyzing photo' });
  }
});

// POST /reports
router.post('/', upload.single('image'), (req, res) => {
  try {
    const body = req.body || {};
    let imageUrl = body.image_url;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Fallback image based on category if not provided
    if (!imageUrl) {
      const cat = (body.category || body.type || '').toLowerCase();
      if (cat.includes('light')) imageUrl = '/streetlight.jpg';
      else if (cat.includes('pipe') || cat.includes('water')) imageUrl = '/pipeline.jpg';
      else if (cat.includes('garb') || cat.includes('waste')) imageUrl = '/garbage.jpg';
      else if (cat.includes('foot') || cat.includes('walk')) imageUrl = '/footpath.jpg';
      else if (cat.includes('traffic') || cat.includes('signal')) imageUrl = '/traffic_signal.jpg';
      else imageUrl = '/pothole.jpg';
    }

    // Run AI analysis on the image/category to build detections
    const analysis = analyzeImage(req.file ? req.file.originalname : (body.category || 'pothole'));

    const newReport = db.createReport({
      title: body.title,
      type: body.category || body.type || analysis.detected_class,
      category: body.category || body.type,
      address: body.address || 'AB Road, Indore',
      area: body.area || (body.address ? body.address.split(',')[0].trim() : 'Vijay Nagar'),
      ward: body.ward,
      description: body.description,
      latitude: Number(body.latitude) || 22.7533,
      longitude: Number(body.longitude) || 75.8937,
      citizen_name: body.citizen_name || 'Indore Citizen',
      citizen_phone: body.citizen_phone || '+91 98260 11223',
      image_url: imageUrl,
      priority_score: Math.round((analysis.severity || 0.85) * 100),
      detections: analysis.detections
    });

    res.status(201).json(newReport);
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ detail: 'Failed to create report' });
  }
});

module.exports = router;
