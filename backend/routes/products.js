const express = require('express');
const db = require('../db');

const router = express.Router();

function parseProduct(row){
  return { ...row, images: JSON.parse(row.images || '[]'), is_active: !!row.is_active };
}

// GET /api/products?collection=axis&type=ring&q=ring
router.get('/', (req, res) => {
  const { collection, type, q } = req.query;
  let sql = 'SELECT * FROM products WHERE is_active = 1';
  const params = [];
  if(collection){ sql += ' AND collection = ?'; params.push(collection); }
  if(type){ sql += ' AND type = ?'; params.push(type); }
  if(q){ sql += ' AND name LIKE ?'; params.push(`%${q}%`); }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ products: rows.map(parseProduct) });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(req.params.id);
  if(!row) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product: parseProduct(row) });
});

module.exports = router;
