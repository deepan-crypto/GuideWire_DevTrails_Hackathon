const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema({
  policy_number: { type: String, unique: true, sparse: true },
  rider_id: { type: mongoose.Schema.Types.Mixed },
  rider_name: { type: String },
  plan: { type: String },
  zone: { type: String },
  premium: { type: String },
  risk_score: { type: Number },
  status: { type: String, default: 'ACTIVE' },
  start_date: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  birthdate: { type: String },
  customer_since: { type: String },
  account_tier: { type: String },
  delinquency_status: { type: String, default: 'CURRENT' },
}, { timestamps: false });

PolicySchema.set('toJSON', { virtuals: true });
PolicySchema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('Policy', PolicySchema);
