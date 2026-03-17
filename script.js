/* 
PHANTOM VI — Front-end cart + add-ons + Google Sheets logging

To connect Google Sheets logging:
- Create an Apps Script Web App (code provided in README in the zip)
- Paste the Web App URL into admin.html and Save
*/

// --- Config ---
const STORAGE_KEY_CART = 'phantomvi_cart_v6';
const STORAGE_KEY_ADDONS = 'phantomvi_addons_v6';
const STORAGE_KEY_ADMIN = 'phantomvi_admin_cfg';
const STORAGE_KEY_CUSTOMER = 'phantomvi_customer_v1';

// WhatsApp + Yoco
const PHONE_NUMBER = '27814458910';
const YOCO_URL = 'https://pay.yoco.com/XVICrafters';

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

// Add-on prices
const ADDON_LABEL_DESIGN = 500;
const ADDON_INSURANCE_PER_20 = 120;
const ADDON_BARCODE_EACH = 500;

// --- State ---
let cart = [];
let addons = { labelDesign: false, insurance: false, barcodeCount: 0 };
let customer = { name: '', phone: '', address: '', city: '', postal: '', notes: '' };

// --- Helpers ---
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(n) {
  return `R${Number(n || 0)}`;
}

function getUnitPrice(item) {
  if (item.type === 'Wine') return prices.Wine[item.variant] || 0;
  return prices[item.type] || 0;
}

function getTotals() {
  const totalBottles = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const itemsSubtotal = cart.reduce((s, i) => s + getUnitPrice(i) * i.qty, 0);

  let courierFee = 0;
  if (totalBottles > 0) {
    courierFee = 168;
    if (totalBottles > 2) courierFee += (totalBottles - 2) * 9;
  }

  const labelDesignFee = addons.labelDesign ? ADDON_LABEL_DESIGN : 0;
  const insuranceBlocks = Math.ceil(totalBottles / 20);
  const insuranceFee = addons.insurance && totalBottles > 0
    ? insuranceBlocks * ADDON_INSURANCE_PER_20
    : 0;

  const maxBarcodes = Math.min(10, Math.max(totalBottles, 0));
  const barcodeCount = Math.min(addons.barcodeCount || 0, maxBarcodes);
  const barcodeFee = barcodeCount * ADDON_BARCODE_EACH;

  const addonsTotal = labelDesignFee + insuranceFee + barcodeFee;
  const grandTotal = itemsSubtotal + courierFee + addonsTotal;

  return {
    totalBottles,
    itemsSubtotal,
    courierFee,
    labelDesignFee,
    insuranceFee,
    insuranceBlocks,
    barcodeCount,
    maxBarcodes,
    barcodeFee,
    addonsTotal,
    grandTotal
  };
}

function normalizeAddons() {
  const t = getTotals();
  if (addons.barcodeCount > t.maxBarcodes) addons.barcodeCount = t.maxBarcodes;
  if (t.totalBottles === 0) {
    addons.insurance = false;
    addons.labelDesign = false;
    addons.barcodeCount = 0;
  }
  saveJSON(STORAGE_KEY_ADDONS, addons);
}

// --- DOM ---
const els = {
  cartItems: document.getElementById('cartItems'),
  courierFee: document.getElementById('courierFee'),
  itemsSubtotal: document.getElementById('itemsSubtotal'),
  addonsTotal: document.getElementById('addonsTotal'),
  grandTotal: document.getElementById('grandTotal'),
  whatsappBtn: document.getElementById('whatsappBtn'),
  yocoBtn: document.getElementById('yocoBtn'),
  emptyCartMessage: document.getElementById('emptyCartMessage'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  addonsWrap: document.getElementById('addons'),
  addonLabelDesign: document.getElementById('addonLabelDesign'),
  addonInsurance: document.getElementById('addonInsurance'),
  insurancePrice: document.getElementById('insurancePrice'),
  barcodeMinus: document.getElementById('barcodeMinus'),
  barcodePlus: document.getElementById('barcodePlus'),
  barcodeCount: document.getElementById('barcodeCount'),
  barcodeHint: document.getElementById('barcodeHint'),

  custName: document.getElementById('custName'),
  custPhone: document.getElementById('custPhone'),
  custAddress: document.getElementById('custAddress'),
  custCity: document.getElementById('custCity'),
  custPostal: document.getElementById('custPostal'),
  custNotes: document.getElementById('custNotes'),
  checkoutHint: document.getElementById('checkoutHint')
};

// --- WhatsApp Message ---
function buildOrderText(t) {
  const c = getCustomerFromInputs();
  let msg = `Hello, I have placed an order with Phantom VI:\n\n`;

  cart.forEach(i => {
    const unit = getUnitPrice(i);
    msg += `${i.qty} x ${i.variant} ${i.type} (R${unit} each) - R${unit * i.qty}\n`;
  });

  msg += `\nCourier Fee: R${t.courierFee}\nTotal: R${t.grandTotal}\n\n`;

  msg += `Delivery Details:\n`;
  msg += `Name: ${c.name || '-'}\n`;
  msg += `Phone: ${c.phone || '-'}\n`;
  msg += `Address: ${c.address || '-'}\n`;

  return encodeURIComponent(msg);
}

// --- UI ---
function updateUI() {
  const t = getTotals();
  if (els.itemsSubtotal) els.itemsSubtotal.textContent = money(t.itemsSubtotal);
  if (els.courierFee) els.courierFee.textContent = money(t.courierFee);
  if (els.grandTotal) els.grandTotal.textContent = money(t.grandTotal);
}

// --- Init ---
(function init() {
  cart = loadJSON(STORAGE_KEY_CART, []);
  addons = loadJSON(STORAGE_KEY_ADDONS, addons);
  customer = loadJSON(STORAGE_KEY_CUSTOMER, customer);

  normalizeAddons();
  updateUI();
})();
