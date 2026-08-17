const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../utils/mail');

const router = express.Router();

function signToken(user){
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
}
function publicUser(user){
  return { id: user.id, email: user.email, name: user.name, createdAt: user.created_at };
}

// GET /api/auth/exists?email=...
// Used by the two-step sign-in form (enter email -> then either "enter
// your password" or "create a password") to know which step to show.
// Trade-off: this does let someone check whether an email is registered
// (same as most "forgot your password?" flows). Rate-limited along with
// the rest of /api/auth to slow down bulk enumeration.
router.get('/exists', (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();
  if(!email) return res.status(400).json({ error: 'email is required.' });
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  res.json({ exists: !!user });
});

// POST /api/auth/register  { email, password, name? }
router.post('/register',
  body('email').isEmail().withMessage('Enter a valid email.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const email = req.body.email.trim().toLowerCase();
    const name = (req.body.name || '').trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if(existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const hash = bcrypt.hashSync(req.body.password, 10);
    const info = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(email, hash, name);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  }
);

// POST /api/auth/login  { email, password }
router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ error: 'Enter a valid email and password.' });

    const email = req.body.email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    // Same error for "no account" and "wrong password" — don't reveal
    // which one it was, so an attacker can't use this to enumerate emails.
    if(!user || !bcrypt.compareSync(req.body.password, user.password_hash)){
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  }
);

// GET /api/auth/me — current logged-in user, from the token
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if(!user) return res.status(404).json({ error: 'Account not found.' });
  res.json({ user: publicUser(user) });
});

// PATCH /api/auth/me  { name }
router.patch('/me', requireAuth, body('name').trim().notEmpty(), (req, res) => {
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(req.body.name, req.user.id);
  res.json({ ok: true });
});

// POST /api/auth/change-password  { oldPassword, newPassword }
router.post('/change-password', requireAuth,
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if(!bcrypt.compareSync(req.body.oldPassword || '', user.password_hash)){
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const hash = bcrypt.hashSync(req.body.newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
    res.json({ ok: true });
  }
);

// POST /api/auth/forgot-password  { email }
// Always responds the same way whether or not the email exists, so this
// endpoint can't be used to check which emails are registered.
router.post('/forgot-password', body('email').isEmail(), async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if(user){
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    db.prepare('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
      .run(user.id, tokenHash, expiresAt);

    const resetUrl = `${process.env.FRONTEND_URL || ''}/reset-password.html?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await sendMail({
      to: email,
      subject: 'Reset your CHARMENTIST password',
      html: `<p>Click the link below to set a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    });
  }
  res.json({ ok: true, message: 'If an account exists for that email, a reset link has been sent.' });
});

// POST /api/auth/reset-password  { email, token, newPassword }
router.post('/reset-password',
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const email = (req.body.email || '').trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if(!user) return res.status(400).json({ error: 'Invalid or expired reset link.' });

    const tokenHash = crypto.createHash('sha256').update(req.body.token || '').digest('hex');
    const reset = db.prepare(`
      SELECT * FROM password_resets
      WHERE user_id = ? AND token_hash = ? AND used = 0 AND expires_at > datetime('now')
      ORDER BY id DESC LIMIT 1
    `).get(user.id, tokenHash);
    if(!reset) return res.status(400).json({ error: 'Invalid or expired reset link.' });

    const hash = bcrypt.hashSync(req.body.newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);
    res.json({ ok: true });
  }
);

module.exports = router;
