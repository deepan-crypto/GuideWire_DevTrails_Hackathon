const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  claim_number: { type: String, unique: true, sparse: true },
  policy_ref: { type: String },
  rider_id: { type: mongoose.Schema.Types.Mixed },
  rider_name: { type: String },
  product: { type: String },
  fraud_risk: { type: String },
  date_of_loss: { type: String },
  status: { type: String, default: 'PENDING' },
  trigger_type: { type: String },
  amount: { type: Number },
  zone: { type: String },
  approved_at: { type: String },
}, { timestamps: false });

ClaimSchema.set('toJSON', { virtuals: true });
ClaimSchema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('Claim', ClaimSchema);
