// ── server.js ──

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load .env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ── Serve frontend (the nagriksetu root folder, one level up) ──
app.use(express.static(path.join(__dirname, '..')));

// ── API Routes ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/comments/:complaintId', require('./routes/comments'));

// ── Fallback: serve index for any non-API route ──
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'index1.html'));
});

// ── Start server ──
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});