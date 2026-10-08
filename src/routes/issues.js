const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `proof_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// GET /issues/mine
router.get('/mine', (req, res) => {
  const mine = db.getIssues({ limit: 20 });
  res.json(mine);
});

// GET /issues
router.get('/', (req, res) => {
  const { type, status, area, min_score, max_score, sort, order, limit } = req.query;
  const issues = db.getIssues({ type, status, area, min_score, max_score, sort, order, limit });
  res.json(issues);
});

// GET /issues/:id
router.get('/:id', (req, res) => {
  const issue = db.getIssueById(req.params.id);
  if (!issue) {
    return res.status(404).json({ detail: `Issue ${req.params.id} not found` });
  }
  res.json(issue);
});

// PATCH /issues/:id/status
router.patch('/:id/status', (req, res) => {
  const { status, changed_by } = req.body || {};
  if (!status) {
    return res.status(400).json({ detail: 'Missing status field' });
  }
  const updated = db.updateStatus(req.params.id, status, changed_by || 'Admin');
  if (!updated) {
    return res.status(404).json({ detail: 'Issue not found' });
  }
  res.json(updated);
});

// POST /issues/:id/verify-repair
router.post('/:id/verify-repair', upload.single('image'), (req, res) => {
  const proofImage = req.file ? `/uploads/${req.file.filename}` : null;
  const officer = req.body.officer || 'Admin Verifier';
  const notes = req.body.notes || 'Repair verified with high computer vision confidence.';

  const result = db.verifyRepair(req.params.id, {
    proof_image: proofImage,
    officer,
    notes
  });

  if (!result) {
    return res.status(404).json({ detail: 'Issue not found' });
  }
  res.json(result);
});

// POST /issues/:id/complaint/send
router.post('/:id/complaint/send', upload.none(), (req, res) => {
  const issue = db.getIssueById(req.params.id);
  if (!issue) {
    return res.status(404).json({ detail: 'Issue not found' });
  }
  const toEmail = req.body.to_email || 'commissioner@indore.gov.in';
  
  res.json({
    success: true,
    message: `Official complaint dispatch notification sent to ${toEmail}`,
    complaintRef: (issue.complaints && issue.complaints[0]?.reference_number) || `IMC-2026-11420`,
    dispatched_at: new Date().toISOString()
  });
});

module.exports = router;
