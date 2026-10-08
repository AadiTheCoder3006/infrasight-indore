const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const issuesRouter = require('./src/routes/issues');
const reportsRouter = require('./src/routes/reports');
const heatmapRouter = require('./src/routes/heatmap');
const statsRouter = require('./src/routes/stats');
const healthRouter = require('./src/routes/health');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for all origins, methods, and headers
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  if (!req.url.startsWith('/assets') && !req.url.includes('.')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Mount API routes directly at root (matches original bundle contract)
app.use('/issues', issuesRouter);
app.use('/reports', reportsRouter);
app.use('/heatmap', heatmapRouter);
app.use('/stats', statsRouter);
app.use('/health', healthRouter);

// Also mount at /api/* for standard REST API consumer conventions
app.use('/api/issues', issuesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/heatmap', heatmapRouter);
app.use('/api/stats', statsRouter);
app.use('/api/health', healthRouter);

// Static assets
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Fallback SPA routing: send index.html for any client navigation
app.use((req, res) => {
  // If request asks for an asset or API, don't return HTML
  if (req.url.startsWith('/api') || req.url.startsWith('/issues') || req.url.startsWith('/reports') || req.url.startsWith('/heatmap') || req.url.startsWith('/stats')) {
    return res.status(404).json({ detail: 'Endpoint not found' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ detail: err.message || 'Internal Server Error' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  InfraSight Indore Full Stack Server Running!`);
  console.log(`  Local URL:   http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`  Issues API:  http://localhost:${PORT}/issues`);
  console.log(`  Heatmap API: http://localhost:${PORT}/heatmap`);
  console.log(`  Stats API:   http://localhost:${PORT}/stats`);
  console.log(`=======================================================`);
});

module.exports = app;
