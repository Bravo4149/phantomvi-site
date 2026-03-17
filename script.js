// --- CONFIG ---
const CONFIG = {
  PAYMENT: {
    IKHOKHA_URL: 'https://pay.ikhokha.com/phantomvi/mpr/vi',
    WHATSAPP_NUMBER: '27814458910'
  },
  PRICES: {
    Wine: {
      "Sweet Rosé": 75,
      "Shiraz": 85,
      "Merlot": 75,
      "Non-Alcoholic Wine": 100
    },
    Gin: 165,
    Vodka: 165
  }
};

// --- STATE ---
let state = {
  cart: [],
  customer: {}
};

// --- HELPERS ---
const $ = id => document.getElementById(id);
const money = n => `R${n}`;

// --- ADD TO CART FIX ---
function addToCart(type) {
  let variant, qty;

  if (type === 'Wine') {
    variant = $('wineType').value;
    qty = parseInt($('wineQty').value);
  }

  if (type === 'Gin') {
    variant = $('ginType').value;
    qty = parseInt($('ginQty').value);
  }

  if (type === 'Vodka') {
    variant = $('vodkaType').value;
    qty = parseInt($('vodkaQty').value);
  }

  if (!variant || !qty || qty <= 0) {
    alert('Select product and quantity');
    return;
  }

  const existing = state.cart.find(i => i.type === type && i.variant === variant);

  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({ type, variant, qty });
  }

  render();
}

// --- TOTALS ---
function totals() {
  let items = 0;
  let bottles = 0;

  state.cart.forEach(i => {
    const price = i.type === 'Wine'
      ? CONFIG.PRICES.Wine[i.variant]
      : CONFIG.PRICES[i.type];

    items += price * i.qty;
    bottles += i.qty;
  });

  let courier = bottles ? 168 + Math.max(0, bottles - 2) * 9 : 0;

  return {
    items,
    courier,
    addons: 0,
    total: items + courier
  };
}

// --- RENDER ---
function render() {
  const t = totals();

  // CART
  $('cartItems').innerHTML = state.cart.map((i, idx) => `
    <li>
      ${i.variant} (${i.type}) - ${money(i.qty)}
      <button onclick="updateQty(${idx}, -1)">-</button>
      ${i.qty}
      <button onclick="updateQty(${idx}, 1)">+</button>
    </li>
  `).join('');

  // EMPTY MESSAGE
  $('emptyCartMessage').style.display =
    state.cart.length === 0 ? 'block' : 'none';

  // TOTALS
  $('itemsSubtotal').textContent = money(t.items);
  $('courierFee').textContent = money(t.courier);
  $('addonsTotal').textContent = money(t.addons);
  $('grandTotal').textContent = money(t.total);

  updateButtons();
}

// --- UPDATE QTY ---
function updateQty(i, change) {
  state.cart[i].qty += change;

  if (state.cart[i].qty <= 0) {
    state.cart.splice(i, 1);
  }

  render();
}

// --- CUSTOMER ---
function getCustomer() {
  return {
    name: $('custName').value,
    phone: $('custPhone').value,
    address: $('custAddress').value
  };
}

// --- BUTTONS ---
function updateButtons() {
  const t = totals();
  const c = getCustomer();

  const valid = t.total > 0 && c.name && c.phone && c.address;

  $('ikhokhaBtn').onclick = valid
    ? () => window.location.href = CONFIG.PAYMENT.IKHOKHA_URL
    : null;

  $('whatsappBtn').href = valid
    ? `https://wa.me/${CONFIG.PAYMENT.WHATSAPP_NUMBER}?text=Order Total: R${t.total}`
    : '#';
}

// INIT
render();
