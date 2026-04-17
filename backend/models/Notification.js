const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  rider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: true },
  type: { 
    type: String, 
    enum: ['WEATHER_PAYOUT', 'POLICY_ACTIVE', 'CLAIM_APPROVED', 'INFO'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  amount: { type: Number }, // For payout notifications
  trigger_type: { type: String }, // e.g., 'HEAT', 'RAIN', 'MANUAL_ADMIN'
  claim_number: { type: String },
  zone: { type: String },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  read_at: { type: Date },
}, { collection: 'notifications', timestamps: true });

// Index for quick queries
NotificationSchema.index({ rider_id: 1, created_at: -1 });
NotificationSchema.index({ rider_id: 1, is_read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
