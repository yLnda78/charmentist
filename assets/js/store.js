// CHARMENTIST — wishlist & shopping bag store
// ---------------------------------------------------------------------
// localStorage stays the fast, synchronous "local mirror" every page
// reads from (so no page has to change how it calls getCart()/
// getWishlist() etc). When the shopper is logged in, every mutation also
// fires a background call to the backend (/api/cart, /api/wishlist) so
// the bag and wishlist follow their ACCOUNT rather than their browser —
// and on page load, the local mirror is refreshed from the server so a
// second device / a cleared browser picks up what's actually saved.
//
// Guests (not logged in) keep working exactly as before, local-only.
// ---------------------------------------------------------------------

const CharmStore = (function(){
  const WISHLIST_KEY = 'charm_wishlist';
  const CART_KEY = 'charm_cart';
  const API_BASE = window.CHARM_API_BASE || 'http://localhost:4000/api';

  function read(key){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function write(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
  }

  function isSynced(){
    return typeof CharmAuth !== 'undefined' && CharmAuth.isLoggedIn();
  }

  // Fire-and-forget call to the backend. Local state (already updated by
  // the caller before this runs) is what the UI reads, so a slow network
  // or a backend that's briefly down never blocks anything on screen —
  // it just means that one change hasn't reached the account yet.
  async function apiCall(path, options){
    if(!isSynced()) return null;
    try{
      const res = await fetch(API_BASE + path, Object.assign({
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + CharmAuth.getToken() }
      }, options));
      return await res.json().catch(() => null);
    }catch(e){
      console.error('Store sync failed:', path, e);
      return null;
    }
  }

  // ---------- Wishlist: array of product ids ----------
  function getWishlist(){ return read(WISHLIST_KEY); }
  function isInWishlist(id){ return getWishlist().includes(id); }
  function toggleWishlist(id){
    let list = getWishlist();
    let added;
    if(list.includes(id)){ list = list.filter(x => x !== id); added = false; }
    else { list.push(id); added = true; }
    write(WISHLIST_KEY, list);
    updateBadges();
    apiCall('/wishlist', { method: 'POST', body: JSON.stringify({ productId: id }) });
    return added;
  }
  function removeFromWishlist(id){
    const wasPresent = isInWishlist(id);
    write(WISHLIST_KEY, getWishlist().filter(x => x !== id));
    updateBadges();
    // Backend endpoint is a toggle, so only call it if the item was
    // actually there — otherwise this would add it back.
    if(wasPresent) apiCall('/wishlist', { method: 'POST', body: JSON.stringify({ productId: id }) });
  }

  // ---------- Cart: array of {id, qty, size} ----------
  // "size" is only meaningful for rings (ring size); every other product
  // keeps it null. Items are matched by id+size so the same ring in two
  // different sizes shows as two separate lines.
  function getCart(){ return read(CART_KEY); }
  function addToCart(id, qty, size){
    qty = qty || 1;
    size = size || null;
    const cart = getCart();
    const existing = cart.find(x => x.id === id && (x.size || null) === size);
    const newQty = existing ? existing.qty + qty : qty;
    if(existing){ existing.qty = newQty; }
    else { cart.push({ id, qty: newQty, size }); }
    write(CART_KEY, cart);
    updateBadges();
    apiCall('/cart/item', { method: 'PUT', body: JSON.stringify({ productId: id, size, qty: newQty }) });
  }
  function removeFromCart(id, size){
    size = size || null;
    write(CART_KEY, getCart().filter(x => !(x.id === id && (x.size || null) === size)));
    updateBadges();
    apiCall('/cart/item?productId=' + encodeURIComponent(id) + (size ? '&size=' + encodeURIComponent(size) : ''), { method: 'DELETE' });
  }
  function setCartQty(id, qty, size){
    size = size || null;
    qty = Math.max(1, qty|0);
    const cart = getCart();
    const item = cart.find(x => x.id === id && (x.size || null) === size);
    if(item){
      item.qty = qty;
      write(CART_KEY, cart);
      updateBadges();
      apiCall('/cart/item', { method: 'PUT', body: JSON.stringify({ productId: id, size, qty }) });
    }
  }
  function cartCount(){
    return getCart().reduce((sum, item) => sum + item.qty, 0);
  }
  function cartSubtotal(){
    return getCart().reduce((sum, item) => {
      const p = (typeof CharmData !== 'undefined') ? CharmData.byId(item.id) : null;
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  }

  // ---------- Account sync ----------
  // Pulls the account's real cart & wishlist from the server and
  // overwrites the local mirror with it — used on every page load while
  // logged in, so switching devices or browsers shows the same bag.
  // Dispatches 'charm:store-synced' afterwards so any page with its own
  // render function (cart.html, wishlist.html, account.html) can re-draw
  // with the fresh data instead of what was already on screen.
  async function pullFromServer(){
    if(!isSynced()) return;
    const [cartRes, wishRes] = await Promise.all([
      apiCall('/cart'),
      apiCall('/wishlist')
    ]);
    if(cartRes && Array.isArray(cartRes.items)){
      write(CART_KEY, cartRes.items.map(i => ({ id: i.productId, qty: i.qty, size: i.size || null })));
    }
    if(wishRes && Array.isArray(wishRes.items)){
      write(WISHLIST_KEY, wishRes.items.map(i => i.id));
    }
    updateBadges();
    refreshButtonStates();
    document.dispatchEvent(new Event('charm:store-synced'));
  }

  // Called once, right after a successful sign-in or account creation
  // (from signin.html) — folds whatever was in the guest's local bag/
  // wishlist into the account, adding to (not replacing) anything
  // already saved there, then refreshes the local mirror from the
  // merged server result.
  async function mergeGuestDataIntoAccount(){
    if(!isSynced()) return;
    const guestCart = getCart();
    const guestWishlist = getWishlist();
    if(guestCart.length === 0 && guestWishlist.length === 0) return;

    const existing = await apiCall('/cart');
    const existingItems = (existing && existing.items) || [];
    for(const item of guestCart){
      const match = existingItems.find(x => x.productId === item.id && (x.size || null) === (item.size || null));
      const mergedQty = (match ? match.qty : 0) + item.qty;
      await apiCall('/cart/item', { method: 'PUT', body: JSON.stringify({ productId: item.id, size: item.size || null, qty: mergedQty }) });
    }
    if(guestWishlist.length > 0){
      await apiCall('/wishlist/merge', { method: 'POST', body: JSON.stringify({ productIds: guestWishlist }) });
    }
    await pullFromServer();
  }

  // ---------- Header badges ----------
  function updateBadges(){
    const bagBadge = document.querySelector('[data-badge="bag"]');
    if(bagBadge) bagBadge.textContent = cartCount();
    const wishBadge = document.querySelector('[data-badge="wishlist"]');
    if(wishBadge) wishBadge.textContent = getWishlist().length;
  }

  // ---------- Wire up any [data-action] buttons found on the page ----------
  // Works on product cards / tiles that carry a `data-product-id` attribute,
  // and on buttons inside them tagged data-action="wishlist" or data-action="add-to-cart".
  function refreshButtonStates(){
    document.querySelectorAll('[data-action="wishlist"]').forEach(btn => {
      const id = btn.closest('[data-product-id]') ? btn.closest('[data-product-id]').dataset.productId : btn.dataset.productId;
      if(!id) return;
      btn.classList.toggle('is-active', isInWishlist(id));
      btn.setAttribute('aria-pressed', isInWishlist(id) ? 'true' : 'false');
    });
  }

  function bindGlobalClicks(){
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="wishlist"], [data-action="add-to-cart"]');
      if(!btn) return;
      e.preventDefault();
      const card = btn.closest('[data-product-id]');
      const id = (card ? card.dataset.productId : null) || btn.dataset.productId;
      if(!id) return;

      if(btn.dataset.action === 'wishlist'){
        const added = toggleWishlist(id);
        btn.classList.toggle('is-active', added);
        btn.setAttribute('aria-pressed', added ? 'true' : 'false');
        flashButton(btn, added ? 'Saved' : 'Removed');
      }
      if(btn.dataset.action === 'add-to-cart'){
        addToCart(id, 1);
        flashButton(btn, 'Added');
        showBagToast(id, 1);
      }
    });
  }

  // ---------- "Added to bag" notification drawer ----------
  // Shown on every collection/product page whenever a piece is added,
  // so the shopper gets instant confirmation instead of just a button flash.
  function showBagToast(id, qty, size){
    if(typeof CharmData === 'undefined') return;
    const p = CharmData.byId(id);
    if(!p) return;

    document.querySelectorAll('.bag-toast-overlay').forEach(n => n.remove());

    const overlay = document.createElement('div');
    overlay.className = 'bag-toast-overlay';
    overlay.innerHTML = `
      <div class="bag-toast">
        <div class="bag-toast-head"><strong>Added to Your Bag</strong><button class="bag-toast-close" aria-label="Close">&times;</button></div>
        <div class="bag-toast-item">
          <img src="${p.img}">
          <div>
            <div class="serif" style="font-size:.95rem;">${p.name}</div>
            <div class="small" style="color:var(--muted); margin-top:2px;">${p.material}</div>
            ${size ? `<div class="small" style="margin-top:2px;">Size: ${size}</div>` : ''}
            <div class="small" style="margin-top:6px;">Qty ${qty} · ${CharmData.formatPrice(p.price * qty)}</div>
          </div>
        </div>
        <div class="bag-toast-note">This piece is made to order — production takes approximately <strong>7–8 weeks</strong> before it ships.</div>
        <div class="bag-toast-actions">
          <a class="btn btn-dark" href="cart.html">View Bag →</a>
          <a class="btn btn-outline" href="checkout.html">Checkout Now</a>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));

    const close = () => {
      overlay.classList.remove('is-visible');
      setTimeout(() => overlay.remove(), 320);
    };
    overlay.querySelector('.bag-toast-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) close(); });
    clearTimeout(overlay._autoClose);
    overlay._autoClose = setTimeout(close, 6000);
  }

  function flashButton(btn, label){
    const original = btn.dataset.originalLabel || btn.textContent;
    btn.dataset.originalLabel = original;
    btn.textContent = label;
    btn.classList.add('is-flashed');
    setTimeout(() => {
      btn.textContent = btn.dataset.originalLabel;
      btn.classList.remove('is-flashed');
    }, 1200);
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateBadges();
    refreshButtonStates();
    bindGlobalClicks();
    pullFromServer(); // no-op if not logged in
  });

  return {
    getWishlist, isInWishlist, toggleWishlist, removeFromWishlist,
    getCart, addToCart, removeFromCart, setCartQty, cartCount, cartSubtotal,
    updateBadges, refreshButtonStates, showBagToast,
    pullFromServer, mergeGuestDataIntoAccount
  };
})();
