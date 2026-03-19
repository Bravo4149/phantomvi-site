// --- CONFIG ---
const STORAGE_KEY_CART = 'phantomvi_cart_v6';
const STORAGE_KEY_ADDONS = 'phantomvi_addons_v6';
const STORAGE_KEY_ADMIN = 'phantomvi_admin_cfg';
const STORAGE_KEY_CUSTOMER = 'phantomvi_customer_v1';

const PHONE_NUMBER = '27814458910';
const IKHOKHA_URL = 'https://pay.ikhokha.com/phantomvi/mpr/vi';

// --- PRICES ---
const prices = {
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
};

const ADDON_LABEL_DESIGN = 500;
const ADDON_INSURANCE_PER_20 = 120;
const ADDON_BARCODE_EACH = 500;

// --- STATE ---
let cart = [];
let addons = { labelDesign: false, insurance: false, barcodeCount: 0 };
let customer = {};

// --- HELPERS ---
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(n) {
  return `R${Number(n || 0)}`;
}

function getUnitPrice(item) {
  return item.type === 'Wine'
    ? prices.Wine[item.variant]
    : prices[item.type];
}

function getTotals() {
  const totalBottles = cart.reduce((s, i) => s + i.qty, 0);
  const itemsSubtotal = cart.reduce((s, i) => s + getUnitPrice(i) * i.qty, 0);

  let courierFee = totalBottles > 0 ? 168 + Math.max(0, totalBottles - 2) * 9 : 0;

  const labelDesignFee = addons.labelDesign ? ADDON_LABEL_DESIGN : 0;
  const insuranceFee = addons.insurance ? Math.ceil(totalBottles / 20) * ADDON_INSURANCE_PER_20 : 0;
  const barcodeFee = addons.barcodeCount * ADDON_BARCODE_EACH;

  const addonsTotal = labelDesignFee + insuranceFee + barcodeFee;
  const grandTotal = itemsSubtotal + courierFee + addonsTotal;

  return { totalBottles, itemsSubtotal, courierFee, addonsTotal, grandTotal };
}

// --- DOM ---
const els = {
  cartItems: document.getElementById('cartItems'),
  courierFee: document.getElementById('courierFee'),
  itemsSubtotal: document.getElementById('itemsSubtotal'),
  addonsTotal: document.getElementById('addonsTotal'),
  grandTotal: document.getElementById('grandTotal'),

  whatsappBtn: document.getElementById('whatsappBtn'),
  payBtn: document.getElementById('payBtn'),

  emptyCartMessage: document.getElementById('emptyCartMessage'),

  custName: document.getElementById('custName'),
  custPhone: document.getElementById('custPhone'),
  custAddress: document.getElementById('custAddress'),
};

// --- ADD TO CART (FIXED) ---
window.addToCart = function(type) {
  let variant = '';
  let qty = 0;

  if (type === 'Wine') {
    variant = document.getElementById('wineType').value;
    qty = parseInt(document.getElementById('wineQty').value);
  }

  if (type === 'Gin') {
    variant = document.getElementById('ginType').value;
    qty = parseInt(document.getElementById('ginQty').value);
  }

  if (type === 'Vodka') {
    variant = document.getElementById('vodkaType').value;
    qty = parseInt(document.getElementById('vodkaQty').value);
  }

  if (!variant) {
    alert('Select a product type');
    return;
  }

  if (!qty || qty <= 0) {
    alert('Enter quantity');
    return;
  }

  const existing = cart.find(i => i.type === type && i.variant === variant);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ type, variant, qty });
  }

  localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));

  updateUI();

  alert('Added to cart ✅');
};
  if (!variant) return alert('Select product type');
  if (!qty || qty <= 0) return alert('Enter quantity');

  const existing = cart.find(i => i.type === type && i.variant === variant);
  existing ? existing.qty += qty : cart.push({ type, variant, qty });

  saveJSON(STORAGE_KEY_CART, cart);
  updateUI();
}

// --- CART UI ---
function updateCartList() {
  els.cartItems.innerHTML = '';

  if (cart.length === 0) {
    els.emptyCartMessage.style.display = 'block';
    return;
  }

  els.emptyCartMessage.style.display = 'none';

  cart.forEach((item, i) => {
    const li = document.createElement('li');
    li.innerHTML = `${item.qty} x ${item.variant} (${item.type})
    <button onclick="removeItem(${i})">X</button>`;
    els.cartItems.appendChild(li);
  });
}

function removeItem(i) {
  cart.splice(i, 1);
  saveJSON(STORAGE_KEY_CART, cart);
  updateUI();
}

function updateTotalsUI() {
  const t = getTotals();
  els.itemsSubtotal.textContent = money(t.itemsSubtotal);
  els.courierFee.textContent = money(t.courierFee);
  els.addonsTotal.textContent = money(t.addonsTotal);
  els.grandTotal.textContent = money(t.grandTotal);
}

// --- VALIDATION ---
function isCustomerValid() {
  return els.custName.value && els.custPhone.value && els.custAddress.value;
}

// --- BUTTONS ---
function updateButtons() {
  const t = getTotals();
  const canCheckout = t.totalBottles > 0 && isCustomerValid();

  if (els.payBtn) {
    els.payBtn.style.pointerEvents = canCheckout ? 'auto' : 'none';
    els.payBtn.style.opacity = canCheckout ? '1' : '0.5';
    els.payBtn.href = canCheckout ? IKHOKHA_URL : '#';
  }

  if (els.whatsappBtn) {
    els.whatsappBtn.href = canCheckout
      ? `https://wa.me/${PHONE_NUMBER}?text=Order Total: R${t.grandTotal}`
      : '#';
  }
}

// --- UI UPDATE ---
function updateUI() {
  updateCartList();
  updateTotalsUI();
  updateButtons();
}

// --- CHECKOUT LOGGING FIXED ---
function bindCheckoutLogging() {
  if (els.payBtn) {
    els.payBtn.addEventListener('click', (e) => {
      const t = getTotals();
      if (t.totalBottles === 0 || !isCustomerValid()) {
        e.preventDefault();
        alert('Fill in details and add items');
      }
    });
  }
}

// --- INIT ---
(function init() {
  cart = loadJSON(STORAGE_KEY_CART, []);
  bindCheckoutLogging();
  updateUI();
})();
