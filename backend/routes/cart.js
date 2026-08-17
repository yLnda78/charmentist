const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth); // every cart route requires login — the cart lives on the account, not the browser

function getCartWithProducts(userId){
  return db.prepare(`
    SELECT c.id, c.product_id, c.size, c.qty,
           p.name, p.price, p.images, p.stock
    FROM cart_items c JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ?
  `).all(userId).map(row => ({
    id: row.id, productId: row.product_id, size: row.size, qty: row.qty,
    name: row.name, price: row.price, image: JSON.parse(row.images || '[]')[0] || null, stock: row.stock
  }));
}

// GET /api/cart
router.get('/', (req, res) => {
  res.json({ items: getCartWithProducts(req.user.id) });
});

// PUT /api/cart/item  { productId, size?, qty }
// Sets the ABSOLUTE quantity for one product+size line (creates the line
// if it doesn't exist yet, deletes it if qty <= 0). Frontend computes the
// new qty itself (existing + delta, or a typed value) and sends the final
// number — this one endpoint covers "add to cart", "change quantity", and
// "remove" without the frontend needing to track the server's internal
// row id for each line.
router.put('/item', (req, res) => {
  const { productId, size } = req.body;
  const qty = parseInt(req.body.qty, 10) || 0;
  const normalizedSize = size || null;

  if(qty <= 0){
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size IS ?')
      .run(req.user.id, productId, normalizedSize);
    return res.json({ items: getCartWithProducts(req.user.id) });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(productId);
  if(!product) return res.status(404).json({ error: 'Product not found.' });

  db.prepare(`
    INSERT INTO cart_items (user_id, product_id, size, qty)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, product_id, size) DO UPDATE SET qty = excluded.qty
  `).run(req.user.id, productId, normalizedSize, qty);

  res.json({ items: getCartWithProducts(req.user.id) });
});

// DELETE /api/cart/item?productId=...&size=...
router.delete('/item', (req, res) => {
  const { productId, size } = req.query;
  db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size IS ?')
    .run(req.user.id, productId, size || null);
  res.json({ items: getCartWithProducts(req.user.id) });
});

module.exports = router;
