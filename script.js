// --- CONFIG ---
const STORAGE_KEY_CART = 'phantomvi_cart_v6';
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

// --- STATE ---
let cart = [];

// --- HELPERS ---
function saveCart() {
  localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
}

function loadCart() {
  cart = JSON.parse(localStorage.getItem(STORAGE_KEY_CART)) || [];
}

function money(n) {
  return `R${n}`;
}

function getUnitPrice(item) {
  return item.type === 'Wine'
    ? prices.Wine[item.variant]
    : prices[item.type];
}

// --- ADD TO CART (FIXED) ---
function addToCart(type) {
  let variant, qty;

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

  if (!variant) return alert("Select a type first");
  if (!qty || qty <= 0) return alert("Enter quantity");

  const existing = cart.find(i => i.type === type && i.variant === variant);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ type, variant, qty });
  }

  saveCart();
  updateUI();
}

// --- TOTALS ---
function getTotals() {
  let itemsSubtotal = 0;
  let totalBottles = 0;

  cart.forEach(i => {
    itemsSubtotal += getUnitPrice(i) * i.qty;
    totalBottles += i.qty;
  });

  let courier = totalBottles > 0 ? 168 + Math.max(0, totalBottles - 2) * 9 : 0;

  return {
    itemsSubtotal,
    courier,
    total: itemsSubtotal + courier,
    totalBottles
  };
}

// --- UI ---
function updateUI() {
  const list = document.getElementById('cartItems');
  const empty = document.getElementById('emptyCartMessage');

  list.innerHTML = '';

  if (cart.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';

    cart.forEach((item, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${item.qty} x ${item.variant} (${item.type})
        <button onclick="removeItem(${i})">X</button>
      `;
      list.appendChild(li);
    });
  }

  const t = getTotals();

  document.getElementById('itemsSubtotal').textContent = money(t.itemsSubtotal);
  document.getElementById('courierFee').textContent = money(t.courier);
  document.getElementById('grandTotal').textContent = money(t.total);

  updateButtons(t);
}

// --- REMOVE ---
function removeItem(i) {
  cart.splice(i, 1);
  saveCart();
  updateUI();
}

// --- CUSTOMER VALIDATION ---
function validCustomer() {
  const name = document.getElementById('custName').value;
  const phone = document.getElementById('custPhone').value;
  const address = document.getElementById('custAddress').value;

  return name && phone && address;
}

// --- BUTTONS ---
function updateButtons(t) {
  const payBtn = document.getElementById('payBtn');
  const waBtn = document.getElementById('whatsappBtn');

  const can = t.totalBottles > 0 && validCustomer();

  payBtn.style.pointerEvents = can ? 'auto' : 'none';
  payBtn.style.opacity = can ? '1' : '0.5';
  payBtn.href = can ? IKHOKHA_URL : '#';

  waBtn.href = can ? buildWhatsApp(t) : '#';
}

// --- WHATSAPP ---
function buildWhatsApp(t) {
  let msg = "Phantom VI Order:%0A%0A";

  cart.forEach(i => {
    msg += `${i.qty} x ${i.variant} ${i.type}%0A`;
  });

  msg += `%0ATotal: R${t.total}`;

  return `https://wa.me/${PHONE_NUMBER}?text=${msg}`;
}

// --- INIT ---
(function () {
  loadCart();
  updateUI();
})();
