// Admin endpoints — managing products and viewing orders from a small
// internal dashboard (see /admin.html). Protected by requireAdmin below: a
// simple shared-secret header, good enough while it's just you running the
// shop. If you bring on staff, swap this for a proper `role` column on
// users + normal login.
const express = require('express');
const midtransClient = require('midtrans-client');
const db = require('../db');
const { sendMail } = require('../utils/mail');

const router = express.Router();

const core = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

function requireAdmin(req, res, next){
  const key = req.headers['x-admin-key'];
  if(!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY){
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}
router.use(requireAdmin);

// GET /api/admin/products — list everything, including deactivated items
// (the public /api/products only returns active ones).
router.get('/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json({ products: rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]'), is_active: !!r.is_active })) });
});

// POST /api/admin/products — create a new product
router.post('/products', (req, res) => {
  const p = req.body;
  if(!p.id || !p.name || !p.price){
    return res.status(400).json({ error: 'id, name, and price are required.' });
  }
  db.prepare(`
    INSERT INTO products (id, name, collection, type, price, description, material, gemstones, dimensions, weight, images, stock, is_active)
    VALUES (@id, @name, @collection, @type, @price, @description, @material, @gemstones, @dimensions, @weight, @images, @stock, @is_active)
  `).run({
    id: p.id, name: p.name, collection: p.collection || null, type: p.type || null,
    price: p.price, description: p.description || '',
    material: p.material || '', gemstones: p.gemstones || '', dimensions: p.dimensions || '', weight: p.weight || '',
    images: JSON.stringify(p.images || []),
    stock: p.stock ?? 0, is_active: p.is_active === false ? 0 : 1
  });
  res.status(201).json({ ok: true });
});

// PATCH /api/admin/products/:id — update price, stock, description, active state, etc.
router.patch('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if(!existing) return res.status(404).json({ error: 'Product not found.' });

  const fields = ['name', 'collection', 'type', 'price', 'description', 'material', 'gemstones', 'dimensions', 'weight', 'stock', 'is_active'];
  const updates = [];
  const params = {};
  for(const f of fields){
    if(req.body[f] !== undefined){ updates.push(`${f} = @${f}`); params[f] = req.body[f]; }
  }
  if(req.body.images !== undefined){ updates.push('images = @images'); params.images = JSON.stringify(req.body.images); }
  if(updates.length === 0) return res.status(400).json({ error: 'Nothing to update.' });

  params.id = req.params.id;
  db.prepare(`UPDATE products SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run(params);
  res.json({ ok: true });
});

// DELETE /api/admin/products/:id — soft-delete (hides from storefront, keeps order history intact)
router.delete('/products/:id', (req, res) => {
  const info = db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  if(info.changes === 0) return res.status(404).json({ error: 'Product not found.' });
  res.json({ ok: true });
});

// GET /api/admin/orders?status=pending
router.get('/orders', (req, res) => {
  let sql = 'SELECT * FROM orders';
  const params = [];
  if(req.query.status){ sql += ' WHERE status = ?'; params.push(req.query.status); }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ orders: rows.map(o => ({ ...o, items: JSON.parse(o.items_json) })) });
});

// PATCH /api/admin/orders/:id  { status }  — e.g. mark as shipped
router.patch('/orders/:id', (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'];
  if(!allowed.includes(status)) return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  const info = db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  if(info.changes === 0) return res.status(404).json({ error: 'Order not found.' });
  res.json({ ok: true });
});

// POST /api/admin/orders/:id/cancel-refund
// Cancels an unpaid Midtrans transaction, or refunds a paid one, then
// marks the order accordingly. Midtrans only allows a straight "cancel"
// before settlement and "refund" after — this picks the right call based
// on the order's current payment_status so you don't have to know which.
router.post('/orders/:id/cancel-refund', async (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if(!order) return res.status(404).json({ error: 'Order not found.' });
  if(!order.midtrans_order_id){
    return res.status(400).json({ error: 'This order has no associated payment transaction.' });
  }

  try{
    if(order.payment_status === 'paid'){
      await core.transaction.refund(order.midtrans_order_id, {
        reason: req.body.reason || 'Refunded by store admin'
      });
      db.prepare("UPDATE orders SET payment_status = 'refunded', status = 'cancelled', updated_at = datetime('now') WHERE id = ?")
        .run(order.id);
    }else{
      await core.transaction.cancel(order.midtrans_order_id);
      db.prepare("UPDATE orders SET payment_status = 'failed', status = 'cancelled', updated_at = datetime('now') WHERE id = ?")
        .run(order.id);
    }
    // Orders decrement stock at creation time (see routes/orders.js) — put
    // it back now that the sale isn't going through.
    const items = JSON.parse(order.items_json);
    const restock = db.transaction((items) => {
      for(const i of items) db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(i.qty, i.id);
    });
    restock(items);

    sendMail({
      to: order.customer_email,
      subject: `Order ${order.order_number} cancelled`,
      html: `<p>Hi ${order.customer_name}, your order <strong>${order.order_number}</strong> has been cancelled${order.payment_status === 'refunded' ? ' and refunded' : ''}. Contact us if you have any questions.</p>`
    }).catch(err => console.error('Cancellation email failed:', err.message));

    res.json({ ok: true });
  }catch(err){
    console.error('Midtrans cancel/refund failed:', err.message);
    res.status(502).json({ error: 'Midtrans could not process this — it may already be settled/cancelled. Check the Midtrans dashboard directly.' });
  }
});

module.exports = router;
