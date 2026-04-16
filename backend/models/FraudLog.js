const mongoose = require('mongoose');

const FraudLogSchema = new mongoose.Schema({
  claim_id: { type: String },
  rider_id: { type: mongoose.Schema.Types.Mixed },
  rider_name: { type: String },
  fraud_flag: { type: Boolean, default: false },
  confidence_score: { type: Number },
  fraud_score: { type: Number },
  ml_prediction: { type: String },
  fraud_reasons: { type: String },
  zone: { type: String },
  gps_lat: { type: Number },
  gps_lon: { type: Number },
  network_rtt_ms: { type: Number },
  timestamp: { type: String },
  verdict: { type: String },
}, { timestamps: false });

FraudLogSchema.set('toJSON', { virtuals: true });
FraudLogSchema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('FraudLog', FraudLogSchema);
