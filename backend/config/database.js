const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/riskwire';

async function connectDB() {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log('[DB] MongoDB connected — ', mongoose.connection.host);
}

module.exports = { connectDB, mongoose };
