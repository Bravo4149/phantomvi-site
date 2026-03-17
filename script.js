// ===============================
// PHANTOM VI — CLEAN CORE (v7)
// iKhokha Integrated Version
// ===============================

// --- CONFIG ---
const CONFIG = {
  STORAGE: {
    CART: 'phantomvi_cart_v7',
    ADDONS: 'phantomvi_addons_v7',
    CUSTOMER: 'phantomvi_customer_v7',
    ADMIN: 'phantomvi_admin_v7'
  },
  PAYMENT: {
    IKHOKHA_URL: 'https://pay.ikhokha.com/phantomvi/mpr/vi',
    WHATSAPP_NUMBER: '27814458910'
  },
  PRICES: {
    Wine: {
      "Sweet Rosé": 75,
      "Shiraz": 85,
      "Sauvignon Blanc": 75,
      "Pinotage": 85,
      "Sweet White": 75,
      "Sweet Red": 75,
      "Chenin Blanc": 75,
      "Chardonnay": 75,
      "Cabernet Sauvignon": 85,
      "Merlot": 75,
      "Coffee Pinotage": 75,
      "Non-Alcoholic Wine": 100
    },
    Gin: 165,
    Vodka: 165
  },
  ADDONS: {
    LABEL: 500,
    INSURANCE_PER_20: 120,
    BARCODE: 500
  }
};

// --- STATE ---
let state = {
  cart: [],
  addons: { label: false, insurance: false, barcodes: 0 },
  customer: {}
};

// --- UTILS ---
const $ = id => document.getElementById(id);

const store = {
  get: (k, d) => {
    try { return JSON.parse(localStorage.getItem(k)) || d; }
    catch { return d; }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

const money = n => `R${n || 0}`;

// --- INIT ---
function init() {
  state.cart = store.get(CONFIG.STORAGE.CART, []);
  state.addons = store.get(CONFIG.STORAGE.ADDONS, state.addons);
  state.customer = store.get(CONFIG.STORAGE.CUSTOMER, {});

  bindEvents();
  render();
}

// --- CORE LOGIC ---
function unitPrice(item) {
  return item.type === 'Wine'
    ? CONFIG.PRICES.Wine[item.variant] || 0
    : CONFIG.PRICES[item.type] || 0;
}

function totals() {
  const bottles = state.cart.reduce((s, i) => s + i.qty, 0);
  const items = state.cart.reduce((s, i) => s + unitPrice(i) * i.qty, 0);

  let courier = bottles ? 168 + Math.max(0, bottles - 2) * 9 : 0;

  const insuranceBlocks = Math.ceil(bottles / 20);
  const insurance = state.addons.insurance ? insuranceBlocks * CONFIG.ADDONS.INSURANCE_PER_20 : 0;
  const label = state.addons.label ? CONFIG.ADDONS.LABEL : 0;

  const maxBarcodes = Math.min(10, bottles);
  const barcodes = Math.min(state.addons.barcodes, maxBarcodes);
  const barcodeFee = barcodes * CONFIG.ADDONS.BARCODE;

  return {
    bottles,
    items,
    courier,
    insurance,
    label,
    barcodes,
    barcodeFee,
    addons: insurance + label + barcodeFee,
    total: items + courier + insurance + label + barcodeFee
  };
}

// --- CART ---
function addItem(type, variant, qty) {
  if (!variant || qty <= 0) return alert('Invalid selection');

  const existing = state.cart.find(i => i.type === type && i.variant === variant);
  existing ? existing.qty += qty : state.cart.push({ type, variant, qty });

  persist();
  render();
}

function updateQty(i, delta) {
  state.cart[i].qty += delta;
  if (state.cart[i].qty <= 0) state.cart.splice(i, 1);
  persist();
  render();
}

// --- CUSTOMER ---
function updateCustomer() {
  state.customer = {
    name: $('custName')?.value || '',
    phone: $('custPhone')?.value || '',
    address: $('custAddress')?.value || '',
    city: $('custCity')?.value || '',
    postal: $('custPostal')?.value || ''
  };
  persist();
}

function isValidCustomer() {
  const c = state.customer;
  return c.name && c.phone && c.address;
}

// --- CHECKOUT ---
function buildWhatsApp() {
  const t = totals();
  const c = state.customer;

  let msg = `Hello, Phantom VI order:%0A%0A`;

  state.cart.forEach(i => {
    msg += `${i.qty} x ${i.variant} (${i.type}) - R${unitPrice(i) * i.qty}%0A`;
  });

  msg += `%0ATotal: R${t.total}%0A%0A`;
  msg += `Name: ${c.name}%0APhone: ${c.phone}%0AAddress: ${c.address}`;

  return `https://wa.me/${CONFIG.PAYMENT.WHATSAPP_NUMBER}?text=${msg}`;
}

function checkout() {
  const t = totals();

  if (!t.bottles) return alert('Add items first');
  if (!isValidCustomer()) return alert('Fill customer details');

  // Save order locally for tracking
  const order = {
    id: 'PV-' + Date.now().toString(36),
    cart: state.cart,
    totals: t,
    customer: state.customer
  };

  localStorage.setItem('lastOrder', JSON.stringify(order));

  logOrder(order);

  // Redirect to iKhokha
  window.location.href = CONFIG.PAYMENT.IKHOKHA_URL;
}

// --- LOGGING ---
async function logOrder(order) {
  const cfg = store.get(CONFIG.STORAGE.ADMIN, {});
  if (!cfg.endpoint) return;

  try {
    await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  } catch (e) {
    console.warn('Logging failed');
  }
}

// --- UI ---
function render() {
  const t = totals();

  const cartEl = $('cartItems');
  if (cartEl) {
    cartEl.innerHTML = state.cart.map((i, idx) => `
      <li>
        ${i.variant} (${i.type}) - ${money(unitPrice(i))}
        <button onclick="updateQty(${idx}, -1)">-</button>
        ${i.qty}
        <button onclick="updateQty(${idx}, 1)">+</button>
      </li>
    `).join('');
  }

  if ($('grandTotal')) $('grandTotal').textContent = money(t.total);

  updateButtons();
}

function updateButtons() {
  const canCheckout = totals().bottles > 0 && isValidCustomer();

  const payBtn = $('ikhokhaBtn');
  const waBtn = $('whatsappBtn');

  if (payBtn) {
    payBtn.style.opacity = canCheckout ? 1 : 0.5;
    payBtn.onclick = canCheckout ? checkout : null;
  }

  if (waBtn) {
    waBtn.href = canCheckout ? buildWhatsApp() : '#';
  }
}

// --- EVENTS ---
function bindEvents() {
  ['custName','custPhone','custAddress','custCity','custPostal']
    .forEach(id => $(id)?.addEventListener('input', updateCustomer));
}

// --- START ---
init();
