// --- Config ---
const STORAGE_KEY_CART = 'phantomvi_cart_v6';
const STORAGE_KEY_ADDONS = 'phantomvi_addons_v6';
const STORAGE_KEY_ADMIN = 'phantomvi_admin_cfg';
const STORAGE_KEY_CUSTOMER = 'phantomvi_customer_v1';

// WhatsApp + iKhokha
const PHONE_NUMBER = '27814458910';
const IKHOKHA_URL = 'https://pay.ikhokha.com/phantomvi/mpr/vi';

// Prices
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

// Add-ons
const ADDON_LABEL_DESIGN = 500;
const ADDON_INSURANCE_PER_20 = 120;
const ADDON_BARCODE_EACH = 500;

// --- State ---
let cart = [];
let addons = { labelDesign: false, insurance: false, barcodeCount: 0 };
let customer = { name: '', phone: '', address: '', city: '', postal: '', notes: '' };

// --- Helpers ---
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(n) { return `R${Number(n || 0)}`; }

function getUnitPrice(item) {
  if (item.type === 'Wine') return prices.Wine[item.variant] || 0;
  return prices[item.type] || 0;
}

function getTotals() {
  const totalBottles = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const itemsSubtotal = cart.reduce((s, i) => s + getUnitPrice(i) * i.qty, 0);

  let courierFee = totalBottles > 0 ? 168 + Math.max(0, totalBottles - 2) * 9 : 0;

  const labelDesignFee = addons.labelDesign ? ADDON_LABEL_DESIGN : 0;
  const insuranceBlocks = Math.ceil(totalBottles / 20);
  const insuranceFee = addons.insurance ? insuranceBlocks * ADDON_INSURANCE_PER_20 : 0;

  const maxBarcodes = Math.min(10, totalBottles);
  const barcodeCount = Math.min(addons.barcodeCount, maxBarcodes);
  const barcodeFee = barcodeCount * ADDON_BARCODE_EACH;

  const addonsTotal = labelDesignFee + insuranceFee + barcodeFee;
  const grandTotal = itemsSubtotal + courierFee + addonsTotal;

  return { totalBottles, itemsSubtotal, courierFee, addonsTotal, grandTotal, labelDesignFee, insuranceFee, barcodeFee, barcodeCount, insuranceBlocks };
}

// --- DOM ---
const els = {
  cartItems: document.getElementById('cartItems'),
  itemsSubtotal: document.getElementById('itemsSubtotal'),
  addonsTotal: document.getElementById('addonsTotal'),
  courierFee: document.getElementById('courierFee'),
  grandTotal: document.getElementById('grandTotal'),
  whatsappBtn: document.getElementById('whatsappBtn'),
  payBtn: document.getElementById('payBtn'),
  emptyCartMessage: document.getElementById('emptyCartMessage'),
  checkoutHint: document.getElementById('checkoutHint')
};

// --- Cart ---
function addToCart(type) {
  let variant = document.getElementById(type.toLowerCase() + 'Type').value;
  let qty = parseInt(document.getElementById(type.toLowerCase() + 'Qty').value);

  if (!variant || !qty) return alert('Select product and quantity');

  const existing = cart.find(i => i.type === type && i.variant === variant);
  existing ? existing.qty += qty : cart.push({ type, variant, qty });

  saveJSON(STORAGE_KEY_CART, cart);
  updateUI();
}

// --- UI ---
function updateUI() {
  const t = getTotals();

  els.cartItems.innerHTML = cart.length
    ? cart.map(i => `<li>${i.qty} x ${i.variant} (${i.type})</li>`).join('')
    : 'Your cart is empty.';

  els.itemsSubtotal.textContent = money(t.itemsSubtotal);
  els.addonsTotal.textContent = money(t.addonsTotal);
  els.courierFee.textContent = money(t.courierFee);
  els.grandTotal.textContent = money(t.grandTotal);

  updateButtons(t);
}

// --- Buttons ---
function isCustomerValid() {
  const name = document.getElementById('custName')?.value;
  const phone = document.getElementById('custPhone')?.value;
  const address = document.getElementById('custAddress')?.value;
  return name && phone && address;
}

function updateButtons(t) {
  const canCheckout = t.totalBottles > 0 && isCustomerValid();

  if (els.payBtn) {
    els.payBtn.style.opacity = canCheckout ? '1' : '0.5';
    els.payBtn.style.pointerEvents = canCheckout ? 'auto' : 'none';
    els.payBtn.href = canCheckout ? IKHOKHA_URL : '#';
  }

  if (els.whatsappBtn) {
    const msg = buildMessage(t);
    els.whatsappBtn.href = canCheckout ? `https://wa.me/${PHONE_NUMBER}?text=${msg}` : '#';
  }

  if (els.checkoutHint) {
    els.checkoutHint.textContent = canCheckout
      ? 'Ready ✅ Secure your order below.'
      : 'Fill in delivery details to continue.';
  }
}

// --- WhatsApp ---
function buildMessage(t) {
  let msg = `New Phantom VI Order:%0A%0A`;

  cart.forEach(i => {
    msg += `${i.qty} x ${i.variant} ${i.type}%0A`;
  });

  msg += `%0ATotal: R${t.grandTotal}%0A`;
  msg += `%0APlease confirm payment & delivery.`;

  return msg;
}

// --- Init ---
(function init() {
  cart = loadJSON(STORAGE_KEY_CART, []);
  updateUI();
})();
