// --- CONFIG ---
const STORAGE_KEY_CART = 'phantomvi_cart_v6';

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
  try {
    cart = JSON.parse(localStorage.getItem(STORAGE_KEY_CART)) || [];
  } catch {
    cart = [];
  }
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

  const itemsSubtotal = cart.reduce(
    (s, i) => s + getUnitPrice(i) * i.qty,
    0
  );

  const courierFee =
    totalBottles > 0 ? 169 + Math.max(0, totalBottles - 2) * 9 : 0;

  const grandTotal = itemsSubtotal + courierFee;

  return { totalBottles, itemsSubtotal, courierFee, grandTotal };
}

// --- ADD TO CART ---
window.addToCart = function (type) {
  let variant = '';
  let qty = 0;

  if (type === 'Wine') {
    variant = document.getElementById('wineType').value;
    qty = parseInt(document.getElementById('wineQty').value) || 0;
  }

  if (type === 'Gin') {
    variant = document.getElementById('ginType').value;
    qty = parseInt(document.getElementById('ginQty').value) || 0;
  }

  if (type === 'Vodka') {
    variant = document.getElementById('vodkaType').value;
    qty = parseInt(document.getElementById('vodkaQty').value) || 0;
  }

  if (!variant) {
    alert('Select a product type');
    return;
  }

  if (qty <= 0) {
    alert('Enter quantity');
    return;
  }

  const existing = cart.find(
    (i) => i.type === type && i.variant === variant
  );

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ type, variant, qty });
  }

  saveCart();
  updateUI();

  alert('Added to cart ✅');
};

// --- REMOVE ITEM ---
window.removeItem = function (index) {
  cart.splice(index, 1);
  saveCart();
  updateUI();
};

// --- CART UI ---
function updateCartList() {
  const cartItems = document.getElementById('cartItems');
  const emptyMsg = document.getElementById('emptyCartMessage');

  if (!cartItems) return;

  cartItems.innerHTML = '';

  if (cart.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';

  cart.forEach((item, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.qty} x ${item.variant} (${item.type})
      <button onclick="removeItem(${i})">X</button>
    `;
    cartItems.appendChild(li);
  });
}

// --- TOTALS ---
function updateTotalsUI() {
  const t = getTotals();

  const itemsSubtotal = document.getElementById('itemsSubtotal');
  const courierFee = document.getElementById('courierFee');
  const addonsTotal = document.getElementById('addonsTotal');
  const grandTotal = document.getElementById('grandTotal');

  if (itemsSubtotal) itemsSubtotal.textContent = money(t.itemsSubtotal);
  if (courierFee) courierFee.textContent = money(t.courierFee);
  if (addonsTotal) addonsTotal.textContent = 'R0';
  if (grandTotal) grandTotal.textContent = money(t.grandTotal);

  // Optional display
  const finalAmount = document.getElementById('finalAmount');
  if (finalAmount) finalAmount.textContent = money(t.grandTotal);
}

// --- VALIDATION ---
function isCustomerValid() {
  const name = document.getElementById('custName');
  const phone = document.getElementById('custPhone');
  const address = document.getElementById('custAddress');

  return name?.value && phone?.value && address?.value;
}

// --- BUTTON STATE ---
function updateButtons() {
  const t = getTotals();
  const payBtn = document.getElementById('payBtn');
  const whatsappBtn = document.getElementById('whatsappBtn');

  const canCheckout = t.totalBottles > 0 && isCustomerValid();

  if (payBtn) {
    payBtn.disabled = !canCheckout;
    payBtn.style.opacity = canCheckout ? '1' : '0.5';
    payBtn.style.cursor = canCheckout ? 'pointer' : 'not-allowed';
  }

  if (whatsappBtn) {
    whatsappBtn.href = canCheckout
      ? `https://wa.me/${PHONE_NUMBER}?text=Order Total: R${t.grandTotal}`
      : '#';
  }
}

// --- MAIN UI ---
function updateUI() {
  updateCartList();
  updateTotalsUI();
  updateButtons();
}

// --- INIT ---
function init() {
  loadCart();
  updateUI();
}

// --- SMART CHECKOUT ---
function setupCheckout() {
  const payBtn = document.getElementById('payBtn');
  if (!payBtn) return;

  payBtn.addEventListener('click', () => {
    const t = getTotals();

    if (t.totalBottles === 0) {
      alert('Add items to cart first');
      return;
    }

    if (!isCustomerValid()) {
      alert('Fill in delivery details');
      return;
    }

    const orderId = "PV" + Date.now();
    const name = document.getElementById('custName').value;

    let orderText = `🛒 PHANTOM VI ORDER\n\nOrder ID: ${orderId}\nName: ${name}\n\n`;

    cart.forEach(item => {
      orderText += `${item.qty} x ${item.variant} (${item.type})\n`;
    });

    orderText += `\nTotal: R${t.grandTotal}`;

    const whatsappURL = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(orderText)}`;

    // Open WhatsApp
    window.open(whatsappURL, '_blank');

    // Open payment after delay
    setTimeout(() => {
      window.open(IKHOKHA_URL, '_blank');
    }, 800);
  });
}

// --- RUN AFTER DOM LOAD ---
window.addEventListener('DOMContentLoaded', () => {
  init();
  setupCheckout();
});


// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.parentElement;
    parent.classList.toggle('open');
  });
});
