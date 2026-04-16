const mongoose = require('mongoose');

const PayoutLogSchema = new mongoose.Schema({
  rider_id: { type: mongoose.Schema.Types.Mixed },
  amount: { type: Number },
  timestamp: { type: Date, default: Date.now },
  trigger_type: { type: String },
  zone: { type: String },
  claim_number: { type: String },
}, { timestamps: false });

PayoutLogSchema.set('toJSON', { virtuals: true });
PayoutLogSchema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('PayoutLog', PayoutLogSchema);
