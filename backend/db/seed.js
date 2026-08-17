// One-time (or repeatable) import: reads the SAME product data your
// frontend already uses (data/products-source.js — a copy of
// assets/js/products.js from the site) and loads it into the database.
//
// Run it with:  npm run seed
//
// Safe to re-run: it upserts by product id, so editing
// data/products-source.js and re-running updates existing rows instead
// of duplicating them. Once the database is the source of truth, you'll
// manage products through the admin API instead of this file — see
// routes/admin.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const db = require('./index');

const sourcePath = path.join(__dirname, '..', 'data', 'products-source.js');
const code = fs.readFileSync(sourcePath, 'utf8');

// products.js is a plain browser script (const CHARM_PRODUCTS = [...]),
// not a Node module, so it's evaluated in a throwaway sandbox to pull
// the two top-level consts out of it — nothing here is served to users.
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code + '\nthis.__out = { CHARM_PRODUCTS, CHARM_COLLECTIONS };', sandbox);
const { CHARM_PRODUCTS } = sandbox.__out;

if(!Array.isArray(CHARM_PRODUCTS) || CHARM_PRODUCTS.length === 0){
  console.error('No products found in data/products-source.js — nothing to seed.');
  process.exit(1);
}

const upsert = db.prepare(`
  INSERT INTO products (id, name, collection, type, price, description, material, gemstones, dimensions, weight, images, stock, is_active)
  VALUES (@id, @name, @collection, @type, @price, @description, @material, @gemstones, @dimensions, @weight, @images, @stock, 1)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, collection=excluded.collection, type=excluded.type,
    price=excluded.price, description=excluded.description, material=excluded.material,
    gemstones=excluded.gemstones, dimensions=excluded.dimensions, weight=excluded.weight,
    images=excluded.images, updated_at=datetime('now')
`);

const insertMany = db.transaction((products) => {
  for(const p of products){
    upsert.run({
      id: p.id,
      name: p.name,
      collection: p.collection || null,
      type: p.type || null,
      // products.js prices look like whole-number USD/placeholder units;
      // adjust this mapping once you decide your real currency/pricing.
      price: p.price,
      description: p.desc || '',
      material: p.material || '',
      gemstones: p.gemstones || '',
      dimensions: p.dimensions || '',
      weight: p.weight || '',
      images: JSON.stringify(p.gallery && p.gallery.length ? p.gallery : [p.img]),
      // products.js has no stock field yet — default everything to 10 so
      // the store is orderable immediately; adjust real counts via the
      // admin dashboard once you know them.
      stock: 10
    });
  }
});

insertMany(CHARM_PRODUCTS);
console.log(`Seeded/updated ${CHARM_PRODUCTS.length} products into ${path.join(__dirname, 'data.sqlite')}`);
