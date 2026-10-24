// server.js – Primary API & Static Application Server
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/students', require('./routes/students'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/mess', require('./routes/mess'));
app.use('/api/queries', require('./routes/queries'));

// Status / Health check endpoint
app.get('/api/status', (req, res) => {
  if (pool.getEngineStatus) {
    return res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      ...pool.getEngineStatus()
    });
  }
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    isFallback: false,
    engineName: 'MySQL 8.0'
  });
});

// Serve frontend static files
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Explicit portal routes
app.get(['/app', '/portal'], (req, res) => {
  res.sendFile(path.join(frontendDir, 'portal.html'));
});

// Fallback to index.html for landing page
app.get('*', (req, res) => {
  if (req.path.startsWith('/app') || req.path.startsWith('/portal')) {
    return res.sendFile(path.join(frontendDir, 'portal.html'));
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`HOSTEL & MESS MANAGEMENT SYSTEM (RDBMS LAB - MUJ)`);
  console.log(`Server active on: http://localhost:${PORT}`);
  console.log(`Frontend UI served at: http://localhost:${PORT}`);
  console.log(`API endpoints mounted under: http://localhost:${PORT}/api/`);
  console.log(`=======================================================`);
});
