const mongoose = require('mongoose');

const RiderSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String },
  city: { type: String },
  zone: { type: String },
  platform: { type: String },
  age: { type: Number },
  wallet_balance: { type: Number, default: 500 },
  is_policy_active: { type: Boolean, default: false },
  policy_tier: { type: String, default: null },
  registered_at: { type: String },
  referral_code: { type: String },
  referred_by: { type: String },
  worker_id: { type: String },
  verified: { type: Boolean, default: false },
}, { timestamps: false });

// Virtual 'id' that mirrors _id as a number-like string for backward compat
RiderSchema.set('toJSON', { virtuals: true });
RiderSchema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('Rider', RiderSchema);
