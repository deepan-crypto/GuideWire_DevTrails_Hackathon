const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// ── Mock Razorpay Key (test mode) ─────────────────────────────────
const RAZORPAY_KEY_ID = 'rzp_test_RiskWire2026';
const RAZORPAY_KEY_SECRET = 'mock_secret_key_riskwire';

// In-memory order store (mock)
const orders = new Map();

// POST /api/v1/payment/create-order
// Creates a mock Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', riderId, tier, receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Generate mock Razorpay order ID
    const orderId = 'order_' + crypto.randomBytes(10).toString('hex');
    const amountInPaise = Math.round(amount * 100); // Razorpay uses paise

    const order = {
      id: orderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      created_at: Date.now(),
      riderId,
      tier,
    };

    orders.set(orderId, order);

    console.log(`[Payment] Mock Razorpay order created: ${orderId} for ₹${amount}`);

    res.json({
      id: order.id,
      entity: order.entity,
      amount: order.amount,
      amount_paid: order.amount_paid,
      amount_due: order.amount_due,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      key_id: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/payment/verify
// Verifies mock Razorpay payment signature
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // In a real integration, you'd verify the signature using HMAC-SHA256:
    // expected = HMAC-SHA256(order_id + "|" + payment_id, key_secret)
    // For mock, we generate and always match
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    // Mock: always treat as valid
    const isValid = true;

    if (!isValid) {
      return res.status(400).json({
        verified: false,
        error: 'Payment verification failed — signature mismatch',
      });
    }

    // Update order status
    const order = orders.get(razorpay_order_id);
    if (order) {
      order.status = 'paid';
      order.amount_paid = order.amount;
      order.amount_due = 0;
    }

    console.log(`[Payment] Mock Razorpay payment verified: ${razorpay_payment_id}`);

    res.json({
      verified: true,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: expectedSignature,
      status: 'captured',
      method: 'mock_razorpay',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/payment/order/:orderId
// Get order status
router.get('/order/:orderId', async (req, res) => {
  try {
    const order = orders.get(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
