require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { startSchedulers } = require('./services/schedulerService');

// Import routes
const riderRoutes = require('./routes/riderRoutes');
const insuranceRoutes = require('./routes/insuranceRoutes');
const policyRoutes = require('./routes/policyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/rider', riderRoutes);
app.use('/api/v1/insurance', insuranceRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/v1/policy', policyRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/payment', paymentRoutes);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'RiskWire Express Backend is running', port: PORT, db: 'MongoDB' });
});

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message });
});

// ── Start server ──────────────────────────────────────────────────────────
async function start() {
  try {
    await connectDB();
    startSchedulers();
  } catch (err) {
    console.warn('[DB] Could not connect to MongoDB:', err.message);
    console.warn('[DB] Server will start without database. Some endpoints may fail.');
    console.warn('[DB] Set MONGODB_URI in .env (e.g. mongodb+srv://... for Atlas or mongodb://localhost:27017/riskwire for local).');
  }

  app.listen(PORT, () => {
    console.log(`[Server] RiskWire backend running on http://localhost:${PORT}`);
  });
}

start();
