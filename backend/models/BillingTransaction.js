const mongoose = require('mongoose');

const BillingTransactionSchema = new mongoose.Schema({
  txn_id: { type: String, unique: true, sparse: true },
  type: { type: String },
  rider_name: { type: String },
  amount: { type: Number },
  date: { type: String },
  description: { type: String },
  policy_ref: { type: String },
}, { timestamps: false });

BillingTransactionSchema.set('toJSON', { virtuals: true });
BillingTransactionSchema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('BillingTransaction', BillingTransactionSchema);
