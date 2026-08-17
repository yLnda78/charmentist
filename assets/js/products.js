// CHARMENTIST — product & collection data
// This is the single source of truth for every piece shown across the site
// (collection pages, product page, wishlist, and shopping bag).
// Swap the "img" values for your own photography whenever you're ready —
// everything else (wishlist, bag, product page) will keep working as-is.
//
// "gallery" = the row of small thumbnail photos on the product page.
// Right now each product has 5 slots but they all repeat the same "img" —
// that's just a placeholder so the row shows 5 clickable thumbnails.
// To swap in your real photos, just replace each filename in the array,
// e.g. for balance-equilibrium-ring:
//   gallery:['bal6-front.jpeg','bal6-side.jpeg']
// Put the actual photo files in the same folder as the other .jpeg images.
// Clicking a thumbnail on the product page swaps the big photo to it —
// no other code needs to change. Fewer than 5 real photos? Just delete
// the extra entries from that product's array.

const CHARM_COLLECTIONS = {
  frame: {
    slug: 'frame',
    name: 'Frame Language',
    number: '01',
    page: 'collection-geometry.html',
    tagline: 'The language of shape and proportion',
    intro: 'Inspired by architecture, precision, balance, and movement.',
    hero: 'frame.jpeg'
  },
  axis: {
    slug: 'axis',
    name: 'Axis Language',
    number: '02',
    page: 'collection-axis.html',
    tagline: 'Harmony in contrast, beauty in equilibrium',
    intro: 'Bold verticals and quiet tension — jewelry that studies balance the way a column studies weight.',
    hero: 'axis.jpeg'
  },
  balance: {
    slug: 'balance',
    name: 'Balance Language',
    number: '03',
    page: 'collection-balance.html',
    tagline: 'Movement captured in architecture',
    intro: 'Where symmetry meets counterweight — pieces built around a single point of equilibrium.',
    hero: 'balance.jpeg'
  }
};

const CHARM_PRODUCTS = [
  // ===== FRAME LANGUAGE COLLECTION =====
  // Same house quality baseline as Axis/Balance (see note above) applies to every
  // Diamond / Blue Sapphire / Emerald / Yellow Sapphire in this collection.
  // Ruby (Matrix Earrings only) has no confirmed origin/treatment/cert yet —
  // flagged inline below; update once you've picked the actual stone.
  { id:'frame-pillier-necklace',    name:'Pillier Necklace', type:'necklace',    collection:'frame', material:'18K White Gold, Diamond, Blue Sapphire, Emerald',            price:11400, pcsTarget:100, productionTime:'8–14 weeks', img:'fr7.jpeg', gallery:['fr7.jpeg','pillier.jpeg'], gemstones:'Blue Sapphire 0.45ct, round (Ceylon, GRS) • Emerald 0.25ct, square (Zambia, GRS) • Diamond 0.30ct total — 0.15ct round (2) (F, VS1, Excellent, GIA)', dimensions:'Chain length 16–18in, adjustable', weight:'Approx. 9g', desc:'A single vertical line of light, suspended like a column freed from its weight.' },
  { id:'frame-quadre-ring',         name:'Quadré Ring', type:'ring',         collection:'frame', material:'18K Yellow Gold, Diamond, Yellow Sapphire',           price:5100,  pcsTarget:190, productionTime:'6–10 weeks', img:'fr6.jpeg', gallery:['fr6.jpeg','quadre.jpeg'], gemstones:'Yellow Sapphire 0.45ct, square (Ceylon, GRS) • Diamond 0.15ct, princess/square cut (F, VS1, Excellent, GIA)', dimensions:'Band width 3mm · resizable, US 4–9', weight:'Approx. 4.5g (varies by size)', desc:'Four edges, one center — a ring built on the quiet logic of the square.' },
  { id:'frame-lattice-earrings',    name:'Lattice Earrings', type:'earrings',    collection:'frame', material:'18K White Gold, Diamond, Blue Sapphire, Emerald',  price:11600, pcsTarget:100, productionTime:'8–12 weeks', img:'fr5.jpeg', gallery:['fr5.jpeg','latticeearrings.jpeg'], gemstones:'Asymmetric pair — left: Blue Sapphire 0.35ct square, Diamond 0.10ct round, Diamond 0.10ct baguette. Right: Emerald 0.35ct square, Diamond 0.10ct round, Diamond 0.10ct baguette. Totals — Blue Sapphire 0.35ct (Ceylon, GRS) • Emerald 0.35ct (Zambia, GRS) • Diamond 0.40ct total — 0.20ct round (2), 0.20ct baguette (2) (F, VS1, Excellent, GIA)', dimensions:'Approx. 18mm drop', weight:'Approx. 8g (pair)', desc:'Open latticework that catches light from every angle as it moves.' },
  { id:'frame-portal-bangle',       name:'Portal Bangle', type:'bracelet',       collection:'frame', material:'18K Rose Gold, Diamond, Blue Sapphire',             price:7700,  pcsTarget:136, productionTime:'9–14 weeks', img:'fr4.jpeg', gallery:['fr4.jpeg','portal.jpeg'], gemstones:'Blue Sapphire 0.30ct, baguette (Ceylon, GRS) • Diamond 0.25ct, baguette/rectangle cut (F, VS1, Excellent, GIA)', dimensions:'Inner diameter 6cm, fits average wrist', weight:'Approx. 10g', desc:'An open arch worn on the wrist — a threshold rendered in gold.' },
  { id:'frame-grid-bracelet',       name:'Grid Bracelet', type:'bracelet',       collection:'frame', material:'18K White Gold, Diamond, Blue Sapphire, Emerald',            price:15800, pcsTarget:74, productionTime:'10–16 weeks', img:'fr3.jpeg', gallery:['fr3.jpeg','gridbracelet.jpeg'], gemstones:'Blue Sapphire 0.35ct, square (Ceylon, GRS) • Emerald 0.50ct total, square (2) (Zambia, GRS) • Diamond 0.44ct total — 0.20ct round, 0.24ct baguette (3) (F, VS1, Excellent, GIA)', dimensions:'Wrist size 15–19cm, adjustable', weight:'Approx. 14g', desc:'Intersecting lines form a fine structural grid that flexes with the wrist.' },
  { id:'frame-matrix-earrings',     name:'Matrix Earrings', type:'earrings',     collection:'frame', material:'18K Yellow Gold, Diamond, Blue Sapphire, Emerald, Ruby',     price:14300, pcsTarget:84, productionTime:'8–14 weeks', img:'fr2.jpeg', gallery:['fr2.jpeg'], gemstones:'Asymmetric pair — left: Blue Sapphire 0.25ct square, Emerald 0.20ct square, Diamond 0.25ct total baguette & round (3). Right: Emerald 0.25ct square, Ruby 0.25ct square, Diamond 0.10ct triangle, Diamond 0.25ct total baguette & round (3). Totals — Blue Sapphire 0.25ct (Ceylon, GRS) • Emerald 0.45ct (Zambia, GRS) • Ruby 0.25ct (origin/treatment/cert TBC) • Diamond 0.60ct total (F, VS1, Excellent, GIA)', dimensions:'Approx. 18mm drop', weight:'Approx. 9g (pair)', desc:'Sapphire, emerald, and ruby set into a compact architectural grid.' },
  { id:'frame-bastion-ring',        name:'Bastion Ring', type:'ring',        collection:'frame', material:'18K White Gold, Diamond, Blue Sapphire, Emerald', price:10300, pcsTarget:108, productionTime:'6–10 weeks', img:'fr1.jpeg', gallery:['fr1.jpeg','bastionring.jpeg'], gemstones:'Blue Sapphire 0.50ct, square (Ceylon, GRS) • Emerald 0.25ct, square (Zambia, GRS) • Diamond 0.30ct total — 0.15ct round, 0.15ct baguette (F, VS1, Excellent, GIA)', dimensions:'Band width 3mm · resizable, US 4–9', weight:'Approx. 6g (varies by size)', desc:'A fortified silhouette — bold volume softened by a sapphire and emerald counterpoint.' },

  // ===== AXIS LANGUAGE COLLECTION =====
  // Gemstone quality baseline used across this collection unless noted otherwise:
  //   Diamond — Color F, Clarity VS1, Cut/Polish/Symmetry Excellent, Fluorescence None, natural, GIA certified
  //   Blue Sapphire — Sri Lanka (Ceylon), Vivid Royal Blue, Eye Clean, Excellent cut, Heated Only, GRS certified
  //   Emerald — Zambia, Vivid Green, Very Good transparency, Excellent cut, Minor Oil, Eye Clean at normal viewing, GRS certified
  //   Yellow Sapphire — Sri Lanka (Ceylon), Vivid Canary Yellow, Eye Clean, Excellent cut, Heated Only, GRS certified
  { id:'axis-vane-ring',            name:'Vane Ring', type:'ring',           collection:'axis', material:'18K White Gold, Diamond, Blue Sapphire, Emerald',            price:18700, pcsTarget:68, productionTime:'4–7 weeks', img:'ax8.jpeg', gallery:['ax8.jpeg','vane.jpeg'], gemstones:'Emerald 0.25ct, square (Zambia, GRS) • Blue Sapphire 0.20ct, triangle (Ceylon, GRS) • Diamond 0.76ct total — 0.25ct round, 0.20ct round, 0.15ct kite, 0.16ct baguette (2) (F, VS1, Excellent, GIA)', dimensions:'Band width 3mm · resizable, US 4–9', weight:'Approx. 7g (varies by size)', desc:'A slender vertical vane that pivots gently around the finger.' },
  { id:'axis-meridian-ring',        name:'Meridian Ring', type:'ring',       collection:'axis', material:'18K Yellow Gold, Diamond, Yellow Sapphire, Emerald, Blue Sapphire',          price:16300, pcsTarget:76, productionTime:'4–7 weeks', img:'ax7.jpeg', gallery:['ax7.jpeg'], gemstones:'Yellow Sapphire 0.40ct, hexagonal (Ceylon, GRS) • Emerald 0.30ct, square (Zambia, GRS) • Blue Sapphire 0.20ct, triangle (Ceylon, GRS) • Diamond 0.41ct total — 0.25ct round, 0.16ct baguette (2) (F, VS1, Excellent, GIA)', dimensions:'Band width 3mm · resizable, US 4–9', weight:'Approx. 6g (varies by size)', desc:'Named for the line that divides — a ring built around one exact axis.' },
  { id:'axis-prism-earrings',       name:'Prism Earrings', type:'earrings',      collection:'axis', material:'18K White Gold, Diamond, Yellow Sapphire, Emerald, Blue Sapphire',   price:20900, pcsTarget:60, productionTime:'5–8 weeks', img:'ax6.jpeg', gallery:['ax6.jpeg','prism.jpeg'], gemstones:'Asymmetric pair — left: Yellow Sapphire 0.35ct hexagonal, Blue Sapphire 0.15ct triangle, Emerald 0.20ct square, Diamond 0.15ct kite. Right: Emerald 0.45ct square, Diamond 0.15ct round, Blue Sapphire 0.15ct triangle, Diamond baguette 0.05ct ×2. Totals — Yellow Sapphire 0.35ct (Ceylon, GRS) • Emerald 0.65ct (Zambia, GRS) • Blue Sapphire 0.30ct (Ceylon, GRS) • Diamond 0.40ct (F, VS1, Excellent, GIA)', dimensions:'Approx. 18mm drop', weight:'Approx. 4.5g (pair)', desc:'Angled facets that split light the way a prism splits a beam.' },
  { id:'axis-vector-earrings',      name:'Vector Earrings', type:'earrings',     collection:'axis', material:'18K White Gold, Diamond, Emerald, Blue Sapphire', price:28700, pcsTarget:48, productionTime:'5–8 weeks', img:'ax5.jpeg', gallery:['ax5.jpeg'], gemstones:'Emerald 0.60ct total, square (2) (Zambia, GRS) • Blue Sapphire 0.40ct total, triangle (2) (Ceylon, GRS) • Diamond 1.05ct total — 0.30ct round stud (2), 0.75ct kite & baguette accents (5) (F, VS1, Excellent, GIA)', dimensions:'Approx. 18mm drop', weight:'Approx. 5g (pair)', desc:'Diagonal lines with clear direction and quiet momentum.' },
  { id:'axis-helix-bangle',         name:'Helix Bangle', type:'bracelet',        collection:'axis', material:'18K Rose Gold, Diamond, Emerald, Yellow Sapphire, Blue Sapphire',             price:46200, pcsTarget:32, productionTime:'6–10 weeks', img:'ax4.jpeg', gallery:['ax4.jpeg','helixbangle.jpeg'], gemstones:'Emerald 1.00ct, square (Zambia, GRS) • Yellow Sapphire 1.00ct, hexagonal (Ceylon, GRS) • Blue Sapphire 0.30ct, triangle (Ceylon, GRS) • Diamond, 15 stones total — round 0.15ct each, small baguette 0.05ct each (F, VS1, Excellent, GIA)', dimensions:'Inner diameter 6cm, fits average wrist', weight:'Approx. 14g', desc:'A gentle spiral that winds once around the wrist, axis to axis.' },
  { id:'axis-lattice-ring',         name:'Lattice Bracelet', type:'bracelet',        collection:'axis', material:'18K White Gold, Diamond, Yellow Sapphire, Emerald, Blue Sapphire',            price:16600, pcsTarget:70, productionTime:'5–8 weeks', img:'ax3.jpeg', gallery:['ax3.jpeg','latticebracelet.jpeg'], gemstones:'Yellow Sapphire 0.45ct, hexagonal (Ceylon, GRS) • Emerald 0.20ct, square (Zambia, GRS) • Blue Sapphire 0.25ct, triangle (Ceylon, GRS) • Diamond 0.50ct total — 0.15ct kite, 0.35ct accent (7) (F, VS1, Excellent, GIA)', dimensions:'Adjustable, fits average wrist', weight:'Approx. 9g', desc:'A finer, single-band interpretation of the lattice motif.' },
  { id:'axis-monolith-necklace',    name:'Monolith Necklace', type:'necklace',   collection:'axis', material:'18K Yellow Gold, Diamond, Emerald, Blue Sapphire',           price:18800, pcsTarget:68, productionTime:'6–10 weeks', img:'ax2.jpeg', gallery:['ax2.jpeg','monolithnecklace.jpeg'], gemstones:'Emerald 0.70ct, square (Zambia, GRS) • Blue Sapphire 0.30ct, triangle (Ceylon, GRS) • Diamond 0.39ct total — 0.15ct round, 0.24ct baguette (3) (F, VS1, Excellent, GIA)', dimensions:'Chain length 16–18in, adjustable', weight:'Approx. 5.5g', desc:'One solid vertical form, unadorned and absolute.' },
  { id:'axis-apex-necklace',        name:'Apex Necklace', type:'necklace',       collection:'axis', material:'18K White Gold, Diamond, Yellow Sapphire', price:12600, pcsTarget:92, productionTime:'6–10 weeks', img:'ax1.jpeg', gallery:['ax1.jpeg','apexnecklace.jpeg'], gemstones:'Yellow Sapphire 0.80ct, hexagonal (Ceylon, GRS) • Diamond 0.59ct total — 0.20ct kite, 0.15ct round, 0.24ct baguette (3) (F, VS1, Excellent, GIA)', dimensions:'Chain length 16–18in, adjustable', weight:'Approx. 5.2g', desc:'Every line in this piece resolves toward a single high point.' },

  // ===== BALANCE LANGUAGE COLLECTION =====
  { id:'balance-equilibrium-ring',      name:'Equilibrium Ring', type:'ring',      collection:'balance', material:'18K White Gold, Diamond, Emerald, Blue Sapphire',            price:41500,  pcsTarget:36, productionTime:'6–8 weeks', img:'bal6.jpeg', gallery:['bal6.jpeg'], gemstones:'Emerald 2.00ct (Zambia, GRS) • Blue Sapphire 0.25ct (Ceylon, GRS) • Diamond 0.70ct total — 0.50ct center, 0.15ct baguette (3), 0.05ct apex (F, VS1, Excellent, GIA)', dimensions:'Band width 3mm · resizable, US 5–8', weight:'Approx. 6.5g (varies by size)', desc:'Two forms held in exact, weightless equilibrium.' },
  { id:'balance-counterweight-earrings',name:'Counterweight Earrings', type:'earrings',collection:'balance', material:'18K White Gold, Diamond, Emerald, Yellow Sapphire, Blue Sapphire',     price:6700,  pcsTarget:26, productionTime:'7–10 weeks', img:'bal5.jpeg', gallery:['bal5.jpeg','fotobalear2.png'], gemstones:'Emerald 2.30ct total — 2.00ct main + 0.30ct accent (Zambia, GRS) • Yellow Sapphire 3.00ct (Ceylon, GRS) • Blue Sapphire 0.40ct total — 2 stones (Ceylon, GRS) • Diamond 1.60ct total — 0.80ct main (2), 0.64ct baguette (16), 0.16ct apex (2) (F, VS1, Excellent, GIA)', dimensions:'Approx. 18mm drop', weight:'Approx. 14g (pair)', desc:'A larger emerald form is offset by a cascade of diamonds and sapphires — the collection\'s boldest counterweight.' },
  { id:'balance-fulcrum-ring',          name:'Fulcrum Ring', type:'ring',          collection:'balance', material:'18K Rose Gold, Diamond, Yellow Sapphire, Emerald, Blue Sapphire',             price:5300,  pcsTarget:120, productionTime:'5–7 weeks', img:'bal4.jpeg', gallery:['bal4.jpeg','fotobalring.png'], gemstones:'Yellow Sapphire 0.75ct (Ceylon, GRS) • Emerald 0.20ct (Zambia, GRS) • Blue Sapphire 0.15ct (Ceylon, GRS) • Diamond 0.65ct total — 0.35ct center, 0.20ct left side, 0.10ct baguette (F, VS1, Excellent, GIA)', dimensions:'Band width 3mm · resizable, US 4–9', weight:'Approx. 5.5g (varies by size)', desc:'Everything in this ring pivots from one central point.' },
  { id:'balance-symmetry-earrings',     name:'Symmetry Earrings', type:'earrings',     collection:'balance', material:'18K White Gold, Diamond, Emerald, Yellow Sapphire, Blue Sapphire',   price:9100,  pcsTarget:26, productionTime:'7–9 weeks', img:'bal3.jpeg', gallery:['bal3.jpeg','fotobalear1.png'], gemstones:'Emerald 2.75ct total — 2.50ct main + 0.25ct accent (Zambia, GRS) • Yellow Sapphire 2.80ct total — 2.50ct main + 0.30ct accent (Ceylon, GRS) • Blue Sapphire 0.25ct (Ceylon, GRS) • Diamond 0.70ct total — 0.30ct floral (6), 0.40ct baguette (10) (F, VS1, Excellent, GIA)', dimensions:'Approx. 18mm drop', weight:'Approx. 15g (pair)', desc:'Mirrored volumes set with an emerald and sapphire counterpoint on each side.' },
  { id:'balance-libra-necklace',        name:'Libra Necklace', type:'necklace',        collection:'balance', material:'18K White Gold, Diamond, Yellow Sapphire, Emerald, Blue Sapphire',            price:10400, pcsTarget:92, productionTime:'8–11 weeks', img:'bal2.jpeg', gallery:['bal2.jpeg','fotobalnec1.png'], gemstones:'Yellow Sapphire 1.00ct (Ceylon, GRS) • Emerald 0.40ct (Zambia, GRS) • Blue Sapphire 0.20ct (Ceylon, GRS) • Diamond 0.75ct total — 0.50ct arrowhead, 0.15ct baguette (3), 0.10ct apex (F, VS1, Excellent, GIA)', dimensions:'Chain length 16–18in, adjustable', weight:'Approx. 8g', desc:'Named for the scale — two pendant forms balanced on a single chain.' },
  { id:'balance-tensegrity-necklace',   name:'Tensegrity Necklace', type:'necklace',   collection:'balance', material:'18K Yellow Gold, Diamond, Yellow Sapphire, Emerald, Blue Sapphire', price:14200, pcsTarget:92, productionTime:'9–12 weeks', img:'bal1.jpeg', gallery:['bal1.jpeg','fotobalnec2.png'], gemstones:'Yellow Sapphire 1.20ct (Ceylon, GRS) • Emerald 0.25ct (Zambia, GRS) • Blue Sapphire 0.25ct (Ceylon, GRS) • Diamond 0.65ct total — 0.40ct base tip, 0.15ct baguette (3), 0.10ct apex (F, VS1, Excellent, GIA)', dimensions:'Chain length 16–18in, adjustable', weight:'Approx. 9g', desc:'Structural tension and compression, rendered as a single wearable form.' }
];

// ---- site pages (info/editorial content) — used by the real search on
// search.html so queries like "returns" or "shipping" find the right page,
// not just products. Add a new page here any time you add a new .html file
// that a customer might search for; "keywords" are extra search terms that
// don't appear in the title/desc itself.
const CHARM_PAGES = [
  { title:'Returns & Exchanges', url:'returns-exchanges.html', desc:'How to return or exchange a piece.', keywords:['refund','send back','exchange','return policy'] },
  { title:'Shipping & Returns', url:'shipping-delivery.html', desc:'Delivery times, shipping methods, and return basics.', keywords:['delivery','ship','tracking'] },
  { title:'Care & Aftercare', url:'care-aftercare.html', desc:'Cleaning, storage, and resizing your jewelry.', keywords:['cleaning','resize','repair','polish','maintenance'] },
  { title:'Authenticity', url:'authenticity.html', desc:'Certification and authenticity of every piece.', keywords:['certificate','gia','grs','genuine'] },
  { title:'Client Services', url:'client-services.html', desc:'Bespoke requests, appointments, and concierge support.', keywords:['concierge','support','help'] },
  { title:'Request a Custom Piece', url:'appointment.html', desc:'Book an appointment or request a bespoke design.', keywords:['bespoke','custom','appointment','booking'] },
  { title:'Sourcing & Sustainability', url:'sustainability.html', desc:'Where our materials and gemstones come from.', keywords:['ethical','sourcing','sustainable'] },
  { title:'Our Craft', url:'craftsmanship.html', desc:'How each piece is designed and made.', keywords:['craftsmanship', 'making', 'process'] },
  { title:'From Idea to Icon', url:'design-process.html', desc:'The design process behind each collection.', keywords:['design'] },
  { title:'The Art of Materials', url:'materials.html', desc:'Gold, diamonds, and gemstones we use.', keywords:['gold','diamond','gemstone','materials'] },
  { title:'Where Architecture Becomes Jewelry', url:'architecture.html', desc:'The architectural inspiration behind CHARMENTIST.', keywords:['architecture','inspiration'] },
  { title:'About', url:'about.html', desc:'The CHARMENTIST story and philosophy.', keywords:['story','brand','who we are'] },
  { title:'Contact', url:'contact.html', desc:'Get in touch with CHARMENTIST.', keywords:['email','phone','reach us'] },
  { title:'The Journal', url:'journal.html', desc:'Articles on craftsmanship, design, and more.', keywords:['journal','articles','blog'] },
  { title:'Terms & Conditions', url:'terms-conditions.html', desc:'Terms of use and sale.', keywords:['terms','legal'] },
  { title:'Privacy & Legal', url:'privacy-legal.html', desc:'Privacy policy and legal information.', keywords:['privacy','data','legal'] },
  { title:'Press', url:'press.html', desc:'CHARMENTIST in the press.', keywords:['press','media'] },
  { title:'Frame Language Collection', url:'collection-geometry.html', desc:'Rings, necklaces, earrings, and bracelets in the Frame Language collection.', keywords:['frame','geometry'] },
  { title:'Axis Language Collection', url:'collection-axis.html', desc:'Rings, necklaces, earrings, and bracelets in the Axis Language collection.', keywords:['axis'] },
  { title:'Balance Language Collection', url:'collection-balance.html', desc:'Rings, necklaces, earrings, and bracelets in the Balance Language collection.', keywords:['balance'] },
  { title:'Wishlist', url:'wishlist.html', desc:'Pieces you\u2019ve saved.', keywords:['saved','favorites','favourites'] },
  { title:'Shopping Bag', url:'cart.html', desc:'Your shopping bag / cart.', keywords:['bag','cart','checkout'] }
];

// ---- helpers ----
const CharmData = {
  all(){ return CHARM_PRODUCTS; },
  byId(id){ return CHARM_PRODUCTS.find(p => p.id === id) || null; },
  byCollection(slug){ return CHARM_PRODUCTS.filter(p => p.collection === slug); },
  byType(type){ return CHARM_PRODUCTS.filter(p => p.type === type); },
  collection(slug){ return CHARM_COLLECTIONS[slug] || null; },
  pages(){ return CHARM_PAGES; },
  // Real, working search across products, collections, and info pages.
  // Matches against name/title, description, material, type, and keywords.
  // Returns { products, collections, pages } each sorted best-match-first.
  search(query){
    const q = (query || '').trim().toLowerCase();
    if(!q) return { products:[], collections:[], pages:[] };
    const terms = q.split(/\s+/).filter(Boolean);
    const hits = (haystack) => {
      const text = haystack.toLowerCase();
      return terms.every(t => text.includes(t));
    };
    const products = CHARM_PRODUCTS.filter(p => hits([p.name, p.type, p.material, p.desc, p.collection].join(' ')));
    const collections = Object.values(CHARM_COLLECTIONS).filter(c => hits([c.name, c.tagline, c.intro].join(' ')));
    const pages = CHARM_PAGES.filter(pg => hits([pg.title, pg.desc, (pg.keywords||[]).join(' ')].join(' ')));
    return { products, collections, pages };
  },
  related(id, count){
    const p = CharmData.byId(id);
    if(!p) return CHARM_PRODUCTS.slice(0, count || 4);
    const pool = CHARM_PRODUCTS.filter(x => x.collection === p.collection && x.id !== id);
    return pool.slice(0, count || 4);
  },
  formatPrice(n){
    return '$' + Number(n).toLocaleString('en-US');
  },
  // Small meta line shown under a product's price on tile cards (collection
  // grids, search, wishlist, related pieces) — BEFORE a shopper clicks into
  // the product page. Shows both the production estimate and the pcs target.
  tileMeta(p){
    if(!p) return '';
    const bits = [];
    if(p.productionTime) bits.push('Est. production ' + p.productionTime);
    if(p.pcsTarget) bits.push(p.pcsTarget + ' pcs');
    return bits.join(' · ');
  },
  // Production-estimate-only line for the product detail page (AFTER a
  // shopper clicks into the piece) — pcs target is intentionally omitted there.
  productionMeta(p){
    return (p && p.productionTime) ? p.productionTime : '—';
  },
  // Rings only: reads the "US 4–9" style range already in each ring's
  // `dimensions` text and expands it into half-size steps for the size
  // selector on the product page. Falls back to a standard US 4–9 run if a
  // product has no parseable range (e.g. a future ring without that text).
  ringSizes(product){
    if(!product || product.type !== 'ring') return [];
    const match = (product.dimensions || '').match(/US\s*(\d+(?:\.\d+)?)\s*[\u2013-]\s*(\d+(?:\.\d+)?)/);
    const lo = match ? parseFloat(match[1]) : 4;
    const hi = match ? parseFloat(match[2]) : 9;
    const sizes = [];
    for(let s = lo; s <= hi + 0.001; s += 0.5){
      sizes.push(Number.isInteger(s) ? String(s) : s.toFixed(1));
    }
    return sizes;
  }
};

// ---- backend sync ----
// CHARM_PRODUCTS above is the bundled catalog — it renders instantly with
// no loading flicker, and is also what keeps working if the backend is
// ever unreachable. On top of that, this pulls the live catalog from the
// database (see /backend) so admin changes — price, stock, new pieces —
// show up without editing this file. Mutates CHARM_PRODUCTS IN PLACE
// (same array reference) so every CharmData method above keeps working
// unchanged, then fires 'charm:products-synced' for any page that has
// already rendered and needs to redraw with the fresh data.
async function refreshProductsFromAPI(){
  const API_BASE = window.CHARM_API_BASE || 'http://localhost:4000/api';
  try{
    const res = await fetch(API_BASE + '/products');
    const data = await res.json();
    if(!res.ok || !Array.isArray(data.products) || data.products.length === 0) return;

    const mapped = data.products.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      collection: p.collection,
      material: p.material || '',
      // NOTE: prices in the database are plain integers with no currency
      // attached — formatPrice() above still renders them with a '$'
      // prefix. Decide on IDR vs USD before going live (see backend/README.md,
      // Midtrans only settles in IDR) and update formatPrice() to match.
      price: p.price,
      img: (p.images && p.images[0]) || '',
      gallery: (p.images && p.images.length) ? p.images : [(p.images && p.images[0]) || ''],
      gemstones: p.gemstones || '',
      dimensions: p.dimensions || '',
      weight: p.weight || '',
      desc: p.description || '',
      stock: p.stock
    }));
    CHARM_PRODUCTS.length = 0;
    CHARM_PRODUCTS.push(...mapped);
    document.dispatchEvent(new Event('charm:products-synced'));
  }catch(e){
    console.error('Could not reach product API — showing the bundled catalog instead.', e);
  }
}
CharmData.refreshFromAPI = refreshProductsFromAPI;
document.addEventListener('DOMContentLoaded', refreshProductsFromAPI);
