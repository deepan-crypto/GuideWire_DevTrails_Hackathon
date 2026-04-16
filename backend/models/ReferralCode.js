const mongoose = require('mongoose');

const ReferralCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true, sparse: true },
  owner_rider_id: { type: mongoose.Schema.Types.Mixed },
  owner_name: { type: String },
  times_used: { type: Number, default: 0 },
  reward_earned: { type: Number, default: 0 },
  created_at: { type: String },
}, { timestamps: false });

ReferralCodeSchema.set('toJSON', { virtuals: true });
ReferralCodeSchema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('ReferralCode', ReferralCodeSchema);
