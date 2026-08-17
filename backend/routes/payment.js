// Midtrans sends a POST here every time a payment's status changes
// (paid, expired, failed, refunded...). Register this URL in your
// Midtrans dashboard under Settings -> Configuration -> Payment
// Notification URL, e.g. https://your-domain.com/api/payment/notification
const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { sendMail } = require('../utils/mail');

const router = express.Router();

// Midtrans's own signature check (SHA512 of order_id + status_code +
// gross_amount + server_key) — confirms the notification really came
// from Midtrans and wasn't forged by someone hitting this URL directly.
function isValidSignature(body){
  const { order_id, status_code, gross_amount, signature_key } = body;
  const expected = crypto.createHash('sha512')
    .update(order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY)
    .digest('hex');
  return expected === signature_key;
}

router.post('/notification', async (req, res) => {
  const body = req.body;
  if(!isValidSignature(body)){
    return res.status(403).json({ error: 'Invalid signature.' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE midtrans_order_id = ?').get(body.order_id);
  if(!order) return res.status(404).json({ error: 'Order not found.' });

  let paymentStatus = order.payment_status;
  let orderStatus = order.status;

  // See Midtrans docs for the full transaction_status list; these are the
  // common ones a jewelry store checkout will actually hit.
  switch(body.transaction_status){
    case 'capture':
    case 'settlement':
      paymentStatus = 'paid'; orderStatus = 'paid'; break;
    case 'pending':
      paymentStatus = 'unpaid'; orderStatus = 'pending'; break;
    case 'deny':
    case 'failure':
      paymentStatus = 'failed'; orderStatus = 'cancelled'; break;
    case 'expire':
      paymentStatus = 'expired'; orderStatus = 'cancelled'; break;
    case 'cancel':
      paymentStatus = 'failed'; orderStatus = 'cancelled'; break;
    case 'refund':
    case 'partial_refund':
      paymentStatus = 'refunded'; orderStatus = 'cancelled'; break;
  }

  db.prepare("UPDATE orders SET payment_status = ?, status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(paymentStatus, orderStatus, order.id);

  if(paymentStatus === 'paid' && order.payment_status !== 'paid'){
    sendMail({
      to: order.customer_email,
      subject: `Payment confirmed — ${order.order_number}`,
      html: `<p>Hi ${order.customer_name}, your payment for order <strong>${order.order_number}</strong> has been confirmed. We'll start preparing your order.</p>`
    }).catch(err => console.error('Payment confirmation email failed:', err.message));
  }

  res.json({ ok: true });
});

module.exports = router;
