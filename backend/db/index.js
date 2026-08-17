// SQLite connection + schema.
// Uses better-sqlite3 and stores everything in a single data.sqlite file.

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'data.sqlite');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');


/* ============================================================
   BASE SCHEMA
============================================================ */

db.exec(`

CREATE TABLE IF NOT EXISTS users (

  id
    INTEGER PRIMARY KEY AUTOINCREMENT,

  email
    TEXT NOT NULL UNIQUE,

  password_hash
    TEXT NOT NULL,

  name
    TEXT DEFAULT '',

  created_at
    TEXT NOT NULL
    DEFAULT (datetime('now'))

);


CREATE TABLE IF NOT EXISTS products (

  id
    TEXT PRIMARY KEY,

  name
    TEXT NOT NULL,

  collection
    TEXT,

  type
    TEXT,

  price
    INTEGER NOT NULL,

  description
    TEXT,

  material
    TEXT,

  gemstones
    TEXT,

  dimensions
    TEXT,

  weight
    TEXT,

  images
    TEXT,

  stock
    INTEGER NOT NULL DEFAULT 0,

  is_active
    INTEGER NOT NULL DEFAULT 1,

  created_at
    TEXT NOT NULL
    DEFAULT (datetime('now')),

  updated_at
    TEXT NOT NULL
    DEFAULT (datetime('now'))

);


CREATE TABLE IF NOT EXISTS cart_items (

  id
    INTEGER PRIMARY KEY AUTOINCREMENT,

  user_id
    INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  product_id
    TEXT NOT NULL
    REFERENCES products(id)
    ON DELETE CASCADE,

  size
    TEXT,

  qty
    INTEGER NOT NULL DEFAULT 1,

  UNIQUE(user_id, product_id, size)

);


CREATE TABLE IF NOT EXISTS wishlist_items (

  id
    INTEGER PRIMARY KEY AUTOINCREMENT,

  user_id
    INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  product_id
    TEXT NOT NULL
    REFERENCES products(id)
    ON DELETE CASCADE,

  UNIQUE(user_id, product_id)

);


CREATE TABLE IF NOT EXISTS orders (

  id
    INTEGER PRIMARY KEY AUTOINCREMENT,

  order_number
    TEXT NOT NULL UNIQUE,

  user_id
    INTEGER
    REFERENCES users(id)
    ON DELETE SET NULL,

  customer_name
    TEXT NOT NULL,

  customer_email
    TEXT NOT NULL,

  customer_phone
    TEXT,

  country
    TEXT,

  currency
    TEXT NOT NULL DEFAULT 'IDR',

  shipping_address
    TEXT NOT NULL,

  payment_method
    TEXT,

  payment_method_label
    TEXT,

  delivery_method
    TEXT,

  delivery_method_label
    TEXT,

  items_json
    TEXT NOT NULL,

  subtotal
    INTEGER NOT NULL,

  shipping_fee
    INTEGER NOT NULL DEFAULT 0,

  total
    INTEGER NOT NULL,

  status
    TEXT NOT NULL DEFAULT 'pending',

  payment_status
    TEXT NOT NULL DEFAULT 'unpaid',

  midtrans_order_id
    TEXT,

  midtrans_token
    TEXT,

  created_at
    TEXT NOT NULL
    DEFAULT (datetime('now')),

  updated_at
    TEXT NOT NULL
    DEFAULT (datetime('now'))

);


CREATE TABLE IF NOT EXISTS password_resets (

  id
    INTEGER PRIMARY KEY AUTOINCREMENT,

  user_id
    INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  token_hash
    TEXT NOT NULL,

  expires_at
    TEXT NOT NULL,

  used
    INTEGER NOT NULL DEFAULT 0

);

`);


/* ============================================================
   PRODUCTS MIGRATION
============================================================ */

const productColumns = [

  'material TEXT',
  'gemstones TEXT',
  'dimensions TEXT',
  'weight TEXT'

];


for (const col of productColumns) {

  try {

    db.exec(
      `ALTER TABLE products ADD COLUMN ${col}`
    );

  } catch (e) {

    // Column already exists.

  }

}


/* ============================================================
   ORDERS MIGRATION
   ------------------------------------------------------------
   IMPORTANT:
   data.sqlite already exists, so CREATE TABLE IF NOT EXISTS
   will NOT add new columns to the existing table.

   These migrations add the new checkout fields safely.
============================================================ */

const orderColumns = [

  "country TEXT",

  "currency TEXT NOT NULL DEFAULT 'IDR'",

  "payment_method TEXT",

  "payment_method_label TEXT",

  "delivery_method TEXT",

  "delivery_method_label TEXT"

];


for (const col of orderColumns) {

  try {

    db.exec(
      `ALTER TABLE orders ADD COLUMN ${col}`
    );

  } catch (e) {

    // Column already exists.

  }

}


/* ============================================================
   EXPORT
============================================================ */

module.exports = db;