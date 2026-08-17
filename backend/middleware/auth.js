const jwt = require('jsonwebtoken');

// Requires a valid "Authorization: Bearer <token>" header. Attaches the
// decoded { id, email } to req.user. Use this on any route that needs a
// logged-in user (cart, wishlist, orders, account settings).
function requireAuth(req, res, next){
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if(!token) return res.status(401).json({ error: 'Not signed in.' });
  try{
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  }catch(e){
    return res.status(401).json({ error: 'Session expired, please sign in again.' });
  }
}

// Like requireAuth but doesn't fail if there's no token — just leaves
// req.user undefined. Useful for routes that behave slightly differently
// for logged-in vs anonymous visitors without requiring login.
function optionalAuth(req, res, next){
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if(token){
    try{ req.user = jwt.verify(token, process.env.JWT_SECRET); }catch(e){ /* ignore invalid token */ }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
