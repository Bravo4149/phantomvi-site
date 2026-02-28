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
let cart = []; // [{type, variant, qty}]
let addons = {
  labelDesign: false,
  insurance: false,
  barcodeCount: 0
};

let customer = {
  name: '',
  phone: '',
  address: '',
  city: '',
  postal: '',
  notes: ''
};

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

  // Courier
  let courierFee = 0;
  if (totalBottles > 0) {
    // R168 covers the first 2 bottles, then add R9 per additional bottle
    courierFee = 168;
    if (totalBottles > 2) courierFee += (totalBottles - 2) * 9;
  }

  // Add-ons
  const labelDesignFee = addons.labelDesign ? ADDON_LABEL_DESIGN : 0;
  const insuranceBlocks = Math.ceil(totalBottles / 20);
  const insuranceFee = addons.insurance && totalBottles > 0 ? insuranceBlocks * ADDON_INSURANCE_PER_20 : 0;

  // Barcodes: cap at 10 (and never exceed total bottles in cart)
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

  // customer fields
  custName: document.getElementById('custName'),
  custPhone: document.getElementById('custPhone'),
  custAddress: document.getElementById('custAddress'),
  custCity: document.getElementById('custCity'),
  custPostal: document.getElementById('custPostal'),
  custNotes: document.getElementById('custNotes'),
  checkoutHint: document.getElementById('checkoutHint')
};

function getCustomerFromInputs() {
  return {
    name: (els.custName?.value || '').trim(),
    phone: (els.custPhone?.value || '').trim(),
    address: (els.custAddress?.value || '').trim(),
    city: (els.custCity?.value || '').trim(),
    postal: (els.custPostal?.value || '').trim(),
    notes: (els.custNotes?.value || '').trim()
  };
}

function setCustomerInputs(data) {
  if (els.custName) els.custName.value = data.name || '';
  if (els.custPhone) els.custPhone.value = data.phone || '';
  if (els.custAddress) els.custAddress.value = data.address || '';
  if (els.custCity) els.custCity.value = data.city || '';
  if (els.custPostal) els.custPostal.value = data.postal || '';
  if (els.custNotes) els.custNotes.value = data.notes || '';
}

function isCustomerValid(data) {
  return Boolean((data.name || '').trim() && (data.phone || '').trim() && (data.address || '').trim());
}

function saveCustomer(data) {
  customer = { ...customer, ...data };
  saveJSON(STORAGE_KEY_CUSTOMER, customer);
}

function bindCustomerInputs() {
  const inputs = [els.custName, els.custPhone, els.custAddress, els.custCity, els.custPostal, els.custNotes].filter(Boolean);
  if (!inputs.length) return;

  const onChange = () => {
    saveCustomer(getCustomerFromInputs());
    updateButtons();
  };
  inputs.forEach(i => i.addEventListener('input', onChange));
}

function showLoading(show) {
  if (!els.loadingOverlay) return;
  els.loadingOverlay.style.display = show ? 'flex' : 'none';
}

// --- Cart ops ---
function saveCart() {
  saveJSON(STORAGE_KEY_CART, cart);
}

function addToCart(type) {
  let productType, qty;
  if (type === 'Wine') {
    productType = document.getElementById('wineType').value;
    qty = parseInt(document.getElementById('wineQty').value, 10);
  } else if (type === 'Gin') {
    productType = document.getElementById('ginType').value;
    qty = parseInt(document.getElementById('ginQty').value, 10);
  } else if (type === 'Vodka') {
    productType = document.getElementById('vodkaType').value;
    qty = parseInt(document.getElementById('vodkaQty').value, 10);
  }

  if (!productType) {
    alert('Please select a ' + type + ' type.');
    return;
  }
  if (!qty || qty <= 0) {
    alert('Please enter a valid quantity.');
    return;
  }

  showLoading(true);

  setTimeout(() => {
    const idx = cart.findIndex(i => i.type === type && i.variant === productType);
    if (idx >= 0) cart[idx].qty += qty;
    else cart.push({ type, variant: productType, qty });

    saveCart();
    normalizeAddons();
    updateUI();

    // clear
    if (type === 'Wine') {
      document.getElementById('wineQty').value = '';
      document.getElementById('wineType').value = '';
    } else if (type === 'Gin') {
      document.getElementById('ginQty').value = '';
      document.getElementById('ginType').value = '';
    } else if (type === 'Vodka') {
      document.getElementById('vodkaQty').value = '';
      document.getElementById('vodkaType').value = '';
    }

    showLoading(false);
  }, 450);
}

function setQty(index, newQty) {
  if (index < 0 || index >= cart.length) return;
  const q = Math.max(0, Number(newQty) || 0);
  if (q === 0) cart.splice(index, 1);
  else cart[index].qty = q;
  saveCart();
  normalizeAddons();
  updateUI();
}

// --- Add-ons UI ---
function updateAddonsUI() {
  if (!els.addonsWrap) return;

  const t = getTotals();
  const hasBottles = t.totalBottles > 0;
  els.addonsWrap.style.display = hasBottles ? 'block' : 'none';

  // insurance price label
  els.insurancePrice.textContent = money(t.insuranceBlocks * ADDON_INSURANCE_PER_20);

  // pressed states
  els.addonLabelDesign.setAttribute('aria-pressed', addons.labelDesign ? 'true' : 'false');
  els.addonInsurance.setAttribute('aria-pressed', addons.insurance ? 'true' : 'false');

  // barcode
  els.barcodeCount.textContent = String(t.barcodeCount);
  const enabled = hasBottles && t.maxBarcodes > 0;
  els.barcodeMinus.disabled = !enabled;
  els.barcodePlus.disabled = !enabled;
  els.barcodeHint.textContent = enabled
    ? `Max ${t.maxBarcodes}`
    : 'Add bottles to enable';

  // disable toggles when no bottles
  els.addonLabelDesign.disabled = !hasBottles;
  els.addonInsurance.disabled = !hasBottles;
  els.addonLabelDesign.style.opacity = hasBottles ? '1' : '0.6';
  els.addonInsurance.style.opacity = hasBottles ? '1' : '0.6';
}

function bindAddonEvents() {
  if (els.addonLabelDesign) {
    els.addonLabelDesign.addEventListener('click', () => {
      const t = getTotals();
      if (t.totalBottles === 0) return;
      addons.labelDesign = !addons.labelDesign;
      saveJSON(STORAGE_KEY_ADDONS, addons);
      updateUI();
    });
  }

  if (els.addonInsurance) {
    els.addonInsurance.addEventListener('click', () => {
      const t = getTotals();
      if (t.totalBottles === 0) return;
      addons.insurance = !addons.insurance;
      saveJSON(STORAGE_KEY_ADDONS, addons);
      updateUI();
    });
  }

  if (els.barcodeMinus) {
    els.barcodeMinus.addEventListener('click', () => {
      const t = getTotals();
      if (t.totalBottles === 0) return;
      addons.barcodeCount = Math.max(0, (addons.barcodeCount || 0) - 1);
      normalizeAddons();
      updateUI();
    });
  }

  if (els.barcodePlus) {
    els.barcodePlus.addEventListener('click', () => {
      const t = getTotals();
      if (t.totalBottles === 0) return;
      addons.barcodeCount = Math.min(t.maxBarcodes, (addons.barcodeCount || 0) + 1);
      normalizeAddons();
      updateUI();
    });
  }
}

// --- WhatsApp / Yoco message ---
function buildOrderText(t) {
  const c = getCustomerFromInputs();
  let msg = `Hello, I have placed an order with Phantom VI:%0A%0A`;
  cart.forEach(i => {
    const unit = getUnitPrice(i);
    msg += `${i.qty} x ${i.variant} ${i.type} (R${unit} each) - R${unit * i.qty}%0A`;
  });

  // Add-ons
  const addonsLines = [];
  if (t.labelDesignFee) addonsLines.push(`Bottle Label Design (Front + Back): R${t.labelDesignFee}`);
  if (t.insuranceFee) addonsLines.push(`Bottle Insurance (${t.insuranceBlocks} x R${ADDON_INSURANCE_PER_20}): R${t.insuranceFee}`);
  if (t.barcodeFee) addonsLines.push(`Barcode Registration (${t.barcodeCount} x R${ADDON_BARCODE_EACH}): R${t.barcodeFee}`);

  if (addonsLines.length) {
    msg += `%0AAdd-ons:%0A`;
    addonsLines.forEach(l => (msg += `${encodeURIComponent(l)}%0A`));
  }

  msg += `%0ACourier Fee: R${t.courierFee}%0ATotal: R${t.grandTotal}%0A%0A`;

  msg += `%0ADelivery Details:%0A`;
  msg += `${encodeURIComponent(`Name: ${c.name || '-'}`)}%0A`;
  msg += `${encodeURIComponent(`Phone: ${c.phone || '-'}`)}%0A`;
  msg += `${encodeURIComponent(`Address: ${c.address || '-'}`)}%0A`;
  if (c.city) msg += `${encodeURIComponent(`City: ${c.city}`)}%0A`;
  if (c.postal) msg += `${encodeURIComponent(`Postal Code: ${c.postal}`)}%0A`;
  if (c.notes) msg += `${encodeURIComponent(`Notes: ${c.notes}`)}%0A`;

  msg += `%0AIf you selected label design, please send any inspiration or your logo.`;

  return msg;
}

function updateButtons() {
  const t = getTotals();
  const hasBottles = t.totalBottles > 0;
  const c = getCustomerFromInputs();
  const canCheckout = hasBottles && isCustomerValid(c);

  if (els.whatsappBtn) {
    els.whatsappBtn.style.pointerEvents = canCheckout ? 'auto' : 'none';
    els.whatsappBtn.style.opacity = canCheckout ? '1' : '0.5';
    els.whatsappBtn.href = canCheckout ? `https://wa.me/${PHONE_NUMBER}?text=${buildOrderText(t)}` : '#';
  }

  if (els.yocoBtn) {
    els.yocoBtn.style.pointerEvents = canCheckout ? 'auto' : 'none';
    els.yocoBtn.style.opacity = canCheckout ? '1' : '0.5';
    els.yocoBtn.href = canCheckout ? YOCO_URL : '#';
  }

  if (els.checkoutHint) {
    if (!hasBottles) {
      els.checkoutHint.classList.remove('ok');
      els.checkoutHint.textContent = 'Add bottles to your cart to continue.';
    } else if (!isCustomerValid(c)) {
      els.checkoutHint.classList.remove('ok');
      els.checkoutHint.textContent = 'Enter your name, phone and delivery address to enable checkout.';
    } else {
      els.checkoutHint.classList.add('ok');
      els.checkoutHint.textContent = 'Ready ✅ You can now pay on Yoco or send the order on WhatsApp.';
    }
  }
}

// --- Render cart ---
function updateCartList() {
  if (!els.cartItems) return;
  els.cartItems.innerHTML = '';

  const t = getTotals();

  if (cart.length === 0) {
    els.emptyCartMessage.style.display = 'block';
    return;
  }
  els.emptyCartMessage.style.display = 'none';

  cart.forEach((item, index) => {
    const unit = getUnitPrice(item);
    const itemTotal = unit * item.qty;

    const li = document.createElement('li');

    li.innerHTML = `
      <div class="cart-row">
        <div class="cart-left">
          <div class="cart-title">${item.variant} <span style="font-weight:700;">${item.type}</span></div>
          <div class="cart-sub">${money(unit)} each • ${money(itemTotal)} total</div>
        </div>
        <div class="qty" aria-label="Quantity controls">
          <button class="qty-btn" data-action="dec" data-index="${index}" type="button">−</button>
          <span class="qty-count">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-index="${index}" type="button">+</button>
        </div>
        <button class="remove-btn" data-action="remove" data-index="${index}" type="button">Remove</button>
      </div>
    `;

    els.cartItems.appendChild(li);
  });

  // bind row events
  els.cartItems.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-index'));
      const action = btn.getAttribute('data-action');
      if (Number.isNaN(idx) || idx < 0 || idx >= cart.length) return;
      if (action === 'inc') setQty(idx, cart[idx].qty + 1);
      if (action === 'dec') setQty(idx, cart[idx].qty - 1);
      if (action === 'remove') setQty(idx, 0);
    });
  });
}

function updateTotalsUI() {
  const t = getTotals();
  if (els.itemsSubtotal) els.itemsSubtotal.textContent = money(t.itemsSubtotal);
  if (els.addonsTotal) els.addonsTotal.textContent = money(t.addonsTotal);
  if (els.courierFee) els.courierFee.textContent = money(t.courierFee);
  if (els.grandTotal) els.grandTotal.textContent = money(t.grandTotal);
}

function updateUI() {
  updateCartList();
  updateAddonsUI();
  updateTotalsUI();
  updateButtons();
}

// --- Google Sheets logging ---
function getAdminCfg() {
  return loadJSON(STORAGE_KEY_ADMIN, {});
}

function buildOrderPayload(channel) {
  const t = getTotals();
  const c = getCustomerFromInputs();

  const itemsSummary = cart
    .map(i => `${i.qty} x ${i.variant} ${i.type} @ R${getUnitPrice(i)}`)
    .join('\n');

  const addonsSummary = [
    t.labelDesignFee ? `Label Design: R${t.labelDesignFee}` : null,
    t.insuranceFee ? `Insurance: R${t.insuranceFee}` : null,
    t.barcodeFee ? `Barcodes (${t.barcodeCount}): R${t.barcodeFee}` : null
  ].filter(Boolean).join(' | ');

  const orderId = `PV-${Date.now().toString(36).toUpperCase()}`;

  return {
    orderId,
    channel,
    customer: {
      name: c.name || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      postal: c.postal || '',
      notes: c.notes || ''
    },
    totalBottles: t.totalBottles,
    itemsSubtotal: t.itemsSubtotal,
    courierFee: t.courierFee,
    addons: {
      labelDesign: addons.labelDesign,
      insurance: addons.insurance,
      insuranceBlocks: t.insuranceBlocks,
      barcodeCount: t.barcodeCount
    },
    addonsTotal: t.addonsTotal,
    grandTotal: t.grandTotal,
    items: cart,
    itemsSummary,
    addonsSummary
  };
}

async function logOrderToSheets(channel) {
  const cfg = getAdminCfg();
  if (!cfg.endpoint) return { ok: false, skipped: true };

  try {
    const payload = buildOrderPayload(channel);
    const url = new URL(cfg.endpoint);
    if (cfg.token) url.searchParams.set('token', cfg.token);

    await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return { ok: true };
  } catch (err) {
    console.warn('Order logging failed:', err);
    return { ok: false, error: String(err) };
  }
}

function bindCheckoutLogging() {
  if (els.yocoBtn) {
    els.yocoBtn.addEventListener('click', async (e) => {
      const t = getTotals();
      const c = getCustomerFromInputs();
      if (t.totalBottles === 0 || !isCustomerValid(c)) {
        e.preventDefault();
        alert('Please add bottles and fill in your delivery details (name, phone, address) to checkout.');
        return;
      }

      // Log, but never block payment
      logOrderToSheets('Yoco');
      // default behavior continues
    });
  }

  if (els.whatsappBtn) {
    els.whatsappBtn.addEventListener('click', async (e) => {
      const t = getTotals();
      const c = getCustomerFromInputs();
      if (t.totalBottles === 0 || !isCustomerValid(c)) {
        e.preventDefault();
        alert('Please add bottles and fill in your delivery details (name, phone, address) to checkout.');
        return;
      }

      // Log first, then proceed
      e.preventDefault();
      await logOrderToSheets('WhatsApp');
      window.open(els.whatsappBtn.href, '_blank', 'noopener,noreferrer');
    });
  }
}

// --- FAQ accordion + reveal transitions ---
function initFAQ() {
  document.querySelectorAll('.faq').forEach(f => {
    const q = f.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = f.classList.contains('open');
      document.querySelectorAll('.faq.open').forEach(x => x.classList.remove('open'));
      if (!isOpen) f.classList.add('open');
    });
  });
}

function initReveal() {
  const nodes = document.querySelectorAll('.reveal');
  if (!nodes.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) ent.target.classList.add('visible');
    });
  }, { threshold: 0.12 });
  nodes.forEach(n => io.observe(n));
}

// --- Boot ---
(function init() {
  cart = loadJSON(STORAGE_KEY_CART, []);
  addons = loadJSON(STORAGE_KEY_ADDONS, addons);
  customer = loadJSON(STORAGE_KEY_CUSTOMER, customer);
  setCustomerInputs(customer);

  normalizeAddons();
  bindAddonEvents();
  bindCustomerInputs();
  bindCheckoutLogging();
  initFAQ();
  initReveal();

  updateUI();
})();
