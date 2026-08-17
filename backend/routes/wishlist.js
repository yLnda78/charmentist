const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function getWishlist(userId){
  return db.prepare(`
    SELECT p.id, p.name, p.price, p.images
    FROM wishlist_items w JOIN products p ON p.id = w.product_id
    WHERE w.user_id = ?
  `).all(userId).map(row => ({ ...row, image: JSON.parse(row.images || '[]')[0] || null, images: undefined }));
}

// GET /api/wishlist
router.get('/', (req, res) => res.json({ items: getWishlist(req.user.id) }));

// POST /api/wishlist  { productId }  — toggles on/off, like the current localStorage version
router.post('/', (req, res) => {
  const { productId } = req.body;
  const existing = db.prepare('SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);
  if(existing){
    db.prepare('DELETE FROM wishlist_items WHERE id = ?').run(existing.id);
  }else{
    const product = db.prepare('SELECT id FROM products WHERE id = ? AND is_active = 1').get(productId);
    if(!product) return res.status(404).json({ error: 'Product not found.' });
    db.prepare('INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)').run(req.user.id, productId);
  }
  res.json({ items: getWishlist(req.user.id) });
});

// POST /api/wishlist/merge  { productIds: [...] }
// Idempotent add-many — used once, right after a guest with local
// wishlist items logs in or creates an account, to fold those items into
// the account's wishlist without accidentally toggling off ones that are
// already saved there (unlike the toggle endpoint above).
router.post('/merge', (req, res) => {
  const ids = Array.isArray(req.body.productIds) ? req.body.productIds : [];
  const insert = db.prepare('INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)');
  const insertMany = db.transaction((ids) => {
    for(const id of ids){
      const product = db.prepare('SELECT id FROM products WHERE id = ? AND is_active = 1').get(id);
      if(product) insert.run(req.user.id, id);
    }
  });
  insertMany(ids);
  res.json({ items: getWishlist(req.user.id) });
});

module.exports = router;
