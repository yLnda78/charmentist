// CHARMENTIST — shared site behavior

const NAV_LINKS = [
  { label:"Collection", href:"index.html", mega:{
      key:"collection",
      columns:[
        { title:"Categories", links:[
            ["Rings","category.html?type=ring"],
            ["Necklaces","category.html?type=necklace"],
            ["Earrings","category.html?type=earrings"],
            ["Bracelets","category.html?type=bracelet"]
          ], viewAll:["Explore All Jewelry","index.html#collections"] },
        { title:"Collections", links:[
            ["Frame Language","collection-geometry.html"],
            ["Axis Language","collection-axis.html"],
            ["Balance Language","collection-balance.html"]
          ], viewAll:["Explore All Collections","index.html#collections"] },
      ]
  }},
  { label:"About", href:"about.html" },
  { label:"Craftsmanship", href:"craftsmanship.html" },
  { label:"Shipping & Returns", href:"shipping-delivery.html" },
  { label:"Contact", href:"contact.html" }
];

const UTILITY_LINKS = [];

const ICONS = {
  search: `<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7.2"/><line x1="20" y1="20" x2="15.6" y2="15.6"/></svg>`,
  heart: `<svg viewBox="0 0 24 24"><path d="M12 20.2s-8-4.9-8-11.1A4.9 4.9 0 0 1 12 6.4 4.9 4.9 0 0 1 20 9.1c0 6.2-8 11.1-8 11.1Z"/></svg>`,
  bag: `<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12.5H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`,
  account: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.8 4.3-5.8 7.5-5.8s6.1 2 7.5 5.8"/></svg>`,
  menu: `<svg viewBox="0 0 24 24"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>`
};

function renderHeader(){
  const el = document.getElementById('site-header');
  if(!el) return;
  const light = el.dataset.variant === 'light';
  const current = document.body.dataset.page || '';
  el.className = 'site-header' + (light ? ' on-light' : '');

  const caret = `<svg class="nav-caret" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4"/></svg>`;

  const navLinks = NAV_LINKS.map(item=>{
    const active = item.href === current ? ' active' : '';
    if(item.mega){
      return `<div class="nav-item" data-mega-trigger="${item.mega.key}">
        <a class="${active.trim()}" href="${item.href}">${item.label}${caret}</a>
      </div>`;
    }
    return `<div class="nav-item"><a class="${active.trim()}" href="${item.href}">${item.label}</a></div>`;
  }).join('');

  const megaPanels = NAV_LINKS.filter(i=>i.mega).map(item=>{
    const cols = item.mega.columns.map(col=>{
      const links = col.links.map(([label,href])=>`<a href="${href}">${label}</a>`).join('');
      const viewAll = col.viewAll ? `<a class="mega-viewall" href="${col.viewAll[1]}">${col.viewAll[0]} →</a>` : '';
      return `<div class="mega-col"><span class="mega-col-title">${col.title}</span>${links}${viewAll}</div>`;
    }).join('');
    return `<div class="mega-menu" data-mega-panel="${item.mega.key}"><div class="mega-wrap">${cols}</div></div>`;
  }).join('');

  const utilityLinks = UTILITY_LINKS.map(([label,href])=>`<a href="${href}">${label}</a>`).join('');

  el.innerHTML = `
    <nav class="main-nav">${navLinks}</nav>
    <span class="menu-toggle" aria-label="Menu">${ICONS.menu}</span>
    <a class="logo" href="index.html">CHARMENTIST</a>
    <div class="header-right">
      <nav class="header-utility">${utilityLinks}</nav>
      <div class="header-icons">
        <a href="search.html" aria-label="Search">${ICONS.search}</a>
        <a href="wishlist.html" aria-label="Wishlist">${ICONS.heart}<span class="cart-count"><span data-badge="wishlist">0</span></span></a>
        <a href="cart.html" aria-label="Bag">${ICONS.bag}<span class="cart-count"><span data-badge="bag">0</span></span></a>
        <a href="${(typeof CharmAuth !== 'undefined' && CharmAuth.isLoggedIn()) ? 'account.html' : 'signin.html'}" aria-label="Account">${ICONS.account}</a>
      </div>
    </div>
    ${megaPanels}
  `;
  if(typeof CharmStore !== 'undefined') CharmStore.updateBadges();
  initMegaMenu();
}

function initMegaMenu(){
  const header = document.getElementById('site-header');
  if(!header) return;
  const triggers = header.querySelectorAll('.nav-item[data-mega-trigger]');
  let closeTimer = null;

  function openPanel(key){
    clearTimeout(closeTimer);
    triggers.forEach(t=>t.classList.toggle('mega-open', t.dataset.megaTrigger === key));
    header.querySelectorAll('.mega-menu').forEach(p=>{
      p.classList.toggle('mega-visible', p.dataset.megaPanel === key);
    });
  }
  function scheduleClose(){
    clearTimeout(closeTimer);
    closeTimer = setTimeout(()=>{
      triggers.forEach(t=>t.classList.remove('mega-open'));
      header.querySelectorAll('.mega-menu').forEach(p=>p.classList.remove('mega-visible'));
    }, 140);
  }

  triggers.forEach(trigger=>{
    const key = trigger.dataset.megaTrigger;
    const panel = header.querySelector(`.mega-menu[data-mega-panel="${key}"]`);
    trigger.addEventListener('mouseenter', ()=>openPanel(key));
    trigger.addEventListener('mouseleave', scheduleClose);
    if(panel){
      panel.addEventListener('mouseenter', ()=>openPanel(key));
      panel.addEventListener('mouseleave', scheduleClose);
      // any real link inside the panel navigates normally; just close the panel first
      panel.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>scheduleClose()));
    }
    // touch devices: first tap opens the panel, second tap on the label navigates
    trigger.querySelector('a').addEventListener('click', (e)=>{
      if(window.matchMedia('(hover: none)').matches && !trigger.classList.contains('mega-open')){
        e.preventDefault();
        openPanel(key);
      }
    });
  });

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') scheduleClose();
  });
  document.addEventListener('click', (e)=>{
    if(!header.contains(e.target)) scheduleClose();
  });
}

function initHeaderScroll(){
  const el = document.getElementById('site-header');
  if(!el) return;
  const onScroll = ()=>{
    el.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});
}

function renderFooter(){
  const el = document.getElementById('site-footer');
  if(!el) return;
  el.innerHTML = `
    <div class="wrap">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="logo">CHARMENTIST</span>
          <p>Please call or email for any information or to place a bespoke inquiry.</p>
          <p style="margin-top:10px;"><a href="mailto:charmentistworld@gmail.com" style="color:rgba(255,255,255,.75);">charmentistworld@gmail.com</a></p>
          <div class="footer-social">
            <a href="https://instagram.com/theworldofcharmentist" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg></a><a href="https://pinterest.com/theworldofcharmentist" target="_blank" rel="noopener" aria-label="Pinterest"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9.5 19c.6-2.4 1.2-4.9 1.9-7.6.4-1.6 1.4-2.5 2.9-2.5 1.6 0 2.6 1 2.6 2.5 0 2.2-1.1 4.6-3.1 4.6-.9 0-1.6-.5-1.9-1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a href="https://tiktok.com/@theworldofcharmentist" target="_blank" rel="noopener" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 4v9.6a3.4 3.4 0 1 1-3-3.37" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 4c.4 2.2 2 3.7 4.2 4" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a href="https://wa.me/6282379983844" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6.5 17.5 4.5 20l2.6-.7A8 8 0 1 0 4.5 13.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.7 9.3c.3 2.6 2.4 4.7 5 5 .8.1 1.4-.6 1.1-1.3l-.4-.9c-.1-.3-.5-.5-.8-.4l-.9.3c-.7-.4-1.7-1.4-2.1-2.1l.3-.9c.1-.3-.1-.7-.4-.8l-.9-.4c-.7-.3-1.4.3-1.3 1.1Z" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a href="mailto:charmentistworld@gmail.com" aria-label="Email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 6.5 8 6.5 8-6.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
          </div>
        </div>
        <div class="footer-cols">
          <div class="footer-col">
            <h5>Collections</h5>
            <a href="collection-geometry.html">All Collections</a>
            <a href="category.html?type=ring">Rings</a><a href="category.html?type=necklace">Necklaces</a><a href="category.html?type=earrings">Earrings</a><a href="category.html?type=bracelet">Bracelets</a>
          </div>
          <div class="footer-col">
            <h5>Client Services</h5>
            <a href="client-services.html">Client Services</a>
            <a href="shipping-delivery.html">Shipping &amp; Returns</a>
            <a href="authenticity.html">Authentications</a>
            <a href="care-aftercare.html">Product Care &amp; Repairs</a>
            <a href="sustainability.html">Sourcing &amp; Sustainability</a>
          </div>
          <div class="footer-col">
            <h5>Contact</h5>
            <a href="contact.html">Contact Us</a>
            <a href="craftsmanship.html">Our Craft</a>
            <a href="about.html">About</a>
          </div>
          <div class="footer-col footer-signup">
            <h5>Sign Up</h5>
            <p>Be the first to hear about new collections and private invitations.</p>
            <div class="newsletter">
              <input type="email" placeholder="Enter your email address">
              <button>Subscribe</button>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-trust">
        <a href="authenticity.html">Authenticity</a>
        <a href="shipping-delivery.html">Shipping &amp; Delivery</a>
        <a href="returns-exchanges.html">Returns &amp; Exchanges</a>
        <a href="care-aftercare.html">Care &amp; Aftercare</a>
        <a href="terms-conditions.html">Terms &amp; Conditions</a>
        <a href="privacy-legal.html">Privacy</a>
        <a href="contact.html">Contact</a>
      </div>
      <div class="footer-bottom">
        <span>&copy; CHARMENTIST 2024</span>
        <div style="display:flex;gap:22px;">
          <a href="privacy-legal.html">Privacy Policy</a>
          <a href="terms-conditions.html">Terms &amp; Conditions</a>
        </div>
      </div>
    </div>
  `;
}

// Newsletter forms are visual-only for now — no email service is connected
// yet. This gives real inline validation + confirmation so the button never
// feels broken, without pretending an address has actually been saved.
function initNewsletterForms(){
  document.querySelectorAll('.newsletter').forEach(form=>{
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button');
    if(!input || !button || form.dataset.wired) return;
    form.dataset.wired = 'true';
    const submit = ()=>{
      const value = input.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if(!valid){
        input.style.borderColor = '#b33';
        input.placeholder = 'Please enter a valid email';
        input.value = '';
        return;
      }
      input.style.borderColor = '';
      const original = button.textContent;
      button.textContent = 'Subscribed ✓';
      button.disabled = true;
      input.disabled = true;
      setTimeout(()=>{
        button.textContent = original;
        button.disabled = false;
        input.disabled = false;
        input.value = '';
        input.placeholder = input.dataset.placeholder || input.placeholder;
      }, 2600);
    };
    button.addEventListener('click', (e)=>{ e.preventDefault(); submit(); });
    input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); submit(); } });
  });
}

// Light preloader: avoids a flash of unstyled/half-built layout while
// header/footer render and web fonts settle in. Stays on screen for at
// least MIN_VISIBLE_MS so it reads as an intentional loading moment
// instead of a flash, then fires 'charm:preloader-done' so anything that
// should never overlap it (the welcome sign-in popup) can wait its turn.
function initPreloader(){
  const MIN_VISIBLE_MS = 2000;
  const startedAt = Date.now();
  const pre = document.createElement('div');
  pre.className = 'site-preloader';
  pre.innerHTML = '<span class="site-preloader-mark">CHARMENTIST</span>';
  document.body.prepend(pre);
  const remove = ()=>{
    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt));
    setTimeout(()=>{
      pre.classList.add('is-done');
      setTimeout(()=>{
        pre.remove();
        document.dispatchEvent(new Event('charm:preloader-done'));
      }, 500);
    }, remaining);
  };
  if(document.readyState === 'complete') requestAnimationFrame(()=>setTimeout(remove, 150));
  else window.addEventListener('load', ()=>setTimeout(remove, 150));
}

// First-visit "10% off" popup — image + email capture, closable, and it
// won't nag: once dismissed or subscribed it stays quiet for 7 days
// (localStorage), and it only ever shows once per browser tab session.
function initPromoPopup(){
  const SNOOZE_KEY = 'charm_promo_snooze_until';
  const page = document.body.dataset.page || '';
  // Don't interrupt checkout or the cart itself.
  if(page === 'checkout.html' || page === 'cart.html') return;
  if(sessionStorage.getItem('charm_promo_shown')) return;
  try{
    const until = parseInt(localStorage.getItem(SNOOZE_KEY) || '0', 10);
    if(until && Date.now() < until) return;
  }catch(e){}

  sessionStorage.setItem('charm_promo_shown', '1');

  const snooze = () => {
    try{ localStorage.setItem(SNOOZE_KEY, String(Date.now() + 7*24*60*60*1000)); }catch(e){}
  };

  setTimeout(() => {
    const overlay = document.createElement('div');
    overlay.className = 'promo-overlay';
    overlay.innerHTML = `
      <div class="promo-modal" role="dialog" aria-label="Get 10% off your first order">
        <button class="promo-close" aria-label="Close">&times;</button>
        <div class="promo-img"><img src="thecollections.jpeg" alt=""></div>
        <div class="promo-body">
          <h3>GET 10% OFF YOUR FIRST ORDER</h3>
          <p class="promo-sub">And be the first to hear about our new collections and private invitations.</p>
          <input type="email" class="promo-email" placeholder="Enter your email">
          <label class="promo-check"><input type="checkbox" id="promo-privacy-check"> I declare to have read the <a href="privacy-legal.html" target="_blank">Privacy Policy</a></label>
          <button class="btn btn-dark promo-submit" style="width:100%; justify-content:center;">GET 10% OFF</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));

    const close = () => {
      overlay.classList.remove('is-visible');
      snooze();
      setTimeout(() => overlay.remove(), 300);
    };
    overlay.querySelector('.promo-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e){
      if(e.key === 'Escape'){ close(); document.removeEventListener('keydown', esc); }
    });

    const emailInput = overlay.querySelector('.promo-email');
    const checkbox = overlay.querySelector('#promo-privacy-check');
    const submitBtn = overlay.querySelector('.promo-submit');
    submitBtn.addEventListener('click', () => {
      const value = emailInput.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if(!valid){
        emailInput.style.borderColor = '#b33';
        emailInput.placeholder = 'Please enter a valid email';
        emailInput.value = '';
        return;
      }
      if(!checkbox.checked){
        checkbox.closest('.promo-check').style.color = '#b33';
        return;
      }
      submitBtn.textContent = 'Thank you! Code: WELCOME10';
      submitBtn.disabled = true;
      emailInput.disabled = true;
      snooze();
      setTimeout(close, 2200);
    });
  }, 1200);
}

// First-visit "sign in or create an account" prompt. Shows once per
// browser session, only for logged-out visitors, and skips pages where it
// would just be in the way (checkout, cart, and the sign-in page itself).
// Calls `onDone` once the popup is closed (or immediately if it never
// needed to show), so callers can chain the promo popup after it instead
// of both overlays fighting for the screen at once. Waits for the
// preloader to fully disappear first, so it never shows up while the
// loading screen is still covering the page.
function initWelcomeAuthPopup(onDone){
  const done = typeof onDone === 'function' ? onDone : function(){};
  const page = document.body.dataset.page || '';
  const skipPages = ['signin.html', 'account.html', 'checkout.html', 'cart.html'];

  if(skipPages.includes(page) || sessionStorage.getItem('charm_welcome_shown') ||
     (typeof CharmAuth !== 'undefined' && CharmAuth.isLoggedIn())){
    done();
    return;
  }
  sessionStorage.setItem('charm_welcome_shown', '1');

  const show = () => {
    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    overlay.innerHTML = `
      <div class="welcome-modal" role="dialog" aria-label="Sign in or create an account">
        <button class="welcome-close" aria-label="Close">&times;</button>
        <div class="welcome-logo">CHARMENTIST</div>
        <h3>Sign In or Create an Account</h3>
        <p class="welcome-sub">Save your wishlist, check out faster, and track your orders — sign in or create a free account.</p>
        <a class="btn btn-dark" href="signin.html" style="width:100%; justify-content:center;">Sign In / Create Account</a>
        <button type="button" class="welcome-continue">Continue Browsing</button>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));

    const close = () => {
      overlay.classList.remove('is-visible');
      setTimeout(() => { overlay.remove(); done(); }, 300);
    };
    overlay.querySelector('.welcome-close').addEventListener('click', close);
    overlay.querySelector('.welcome-continue').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e){
      if(e.key === 'Escape'){ close(); document.removeEventListener('keydown', esc); }
    });
  };

  // Wait for the preloader to be gone. If it's already gone (or this page
  // never runs one) fall back to a short delay so the popup still appears.
  let shown = false;
  const runOnce = () => { if(shown) return; shown = true; show(); };
  document.addEventListener('charm:preloader-done', runOnce, { once:true });
  setTimeout(runOnce, 3200);
}

// Adds a show/hide (eye) toggle to every password field on the page, and
// wires it up to switch the input between type="password" and type="text".
// Works site-wide (signin.html, account.html's change-password form, etc.)
// without needing each page's markup edited individually.
function initPasswordToggles(){
  const EYE_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 4.22-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

  document.querySelectorAll('input[type="password"]').forEach(input => {
    if(input.closest('.pw-wrap')) return; // already wrapped

    const wrap = document.createElement('div');
    wrap.className = 'pw-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    // Set directly on the element so it wins over any inline padding the
    // input already had, without needing !important everywhere.
    input.style.paddingRight = '44px';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pw-toggle';
    btn.setAttribute('aria-label', 'Show password');
    btn.innerHTML = EYE_OPEN;
    wrap.appendChild(btn);

    btn.addEventListener('click', () => {
      const showing = input.type === 'password';
      input.type = showing ? 'text' : 'password';
      btn.innerHTML = showing ? EYE_OFF : EYE_OPEN;
      btn.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
    });
  });
}

function initTileImageSwap(){
  // On collection/category grids: hover a product tile and its photo crossfades
  // to the piece's 2nd gallery photo (set per-product in products.js -> gallery[1]).
  // Tiles with only 1 gallery photo are left alone.
  if(typeof CharmData === 'undefined') return;
  document.querySelectorAll('.tile[data-product-id]').forEach(tile=>{
    const product = CharmData.byId(tile.dataset.productId);
    if(!product || !product.gallery || product.gallery.length < 2) return;
    const wrap = tile.querySelector('.tile-img');
    if(!wrap || wrap.querySelector('.tile-img-alt')) return;
    const alt = document.createElement('img');
    alt.className = 'tile-img-alt';
    alt.src = product.gallery[1];
    alt.alt = '';
    wrap.appendChild(alt);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initPreloader();
  renderHeader();
  renderFooter();
  initHeaderScroll();
  initTileImageSwap();
  initNewsletterForms();
  initPasswordToggles();
  initWelcomeAuthPopup(initPromoPopup);
});