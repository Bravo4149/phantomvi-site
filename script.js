const STORAGE_KEY_CART = 'cart_v1';
const PHONE_NUMBER = '27814458910';
const IKHOKHA_URL = 'https://pay.ikhokha.com/phantomvi/mpr/vi';

const prices = {
  Wine: { "Sweet Rosé": 75, "Shiraz": 85 },
  Gin: 165,
  Vodka: 165
};

let cart = [];

// --- STORAGE ---
function saveCart() {
  localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
}

function loadCart() {
  cart = JSON.parse(localStorage.getItem(STORAGE_KEY_CART)) || [];
}

// --- HELPERS ---
function money(n) {
  return `R${n}`;
}

function getTotals() {
  let total = 0;
  let count = 0;

  cart.forEach(i => {
    let price = i.type === 'Wine' ? prices.Wine[i.variant] : prices[i.type];
    total += price * i.qty;
    count += i.qty;
  });

  let courier = count > 0 ? 169 + Math.max(0, count - 2) * 9 : 0;

  return {
    totalBottles: count,
    itemsSubtotal: total,
    courierFee: courier,
    grandTotal: total + courier
  };
}

// --- ADD TO CART ---
window.addToCart = function(type) {
  let variant, qty;

  if (type === 'Wine') {
    variant = wineType.value;
    qty = parseInt(wineQty.value) || 0;
  }

  if (type === 'Gin') {
    variant = ginType.value;
    qty = parseInt(ginQty.value) || 0;
  }

  if (type === 'Vodka') {
    variant = vodkaType.value;
    qty = parseInt(vodkaQty.value) || 0;
  }

  if (!variant) return alert('Select product');
  if (qty <= 0) return alert('Enter quantity');

  const existing = cart.find(i => i.type === type && i.variant === variant);

  if (existing) existing.qty += qty;
  else cart.push({ type, variant, qty });

  saveCart();
  updateUI();
};

// --- REMOVE ---
window.removeItem = function(i) {
  cart.splice(i, 1);
  saveCart();
  updateUI();
};

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
      list.innerHTML += `
        <li>
          ${item.qty} x ${item.variant}
          <button onclick="removeItem(${i})">X</button>
        </li>
      `;
    });
  }

  const t = getTotals();

  itemsSubtotal.textContent = money(t.itemsSubtotal);
  courierFee.textContent = money(t.courierFee);
  grandTotal.textContent = money(t.grandTotal);

  updateButtonState();
}

// --- VALIDATION ---
function isValid() {
  return custName.value && custPhone.value && custAddress.value && cart.length > 0;
}

// --- BUTTON STATE ---
function updateButtonState() {
  const btn = document.getElementById('payBtn');

  if (isValid()) {
    btn.disabled = false;
    btn.style.opacity = 1;
  } else {
    btn.disabled = true;
    btn.style.opacity = 0.5;
  }
}

// --- CHECKOUT ---
function setupCheckout() {
  document.getElementById('payBtn').addEventListener('click', () => {
    if (!isValid()) return alert('Complete order');

    const t = getTotals();
    const orderId = "PV" + Date.now();

    let text = `Order ${orderId}\n\n`;

    cart.forEach(i => {
      text += `${i.qty} x ${i.variant}\n`;
    });

    text += `\nTotal: R${t.grandTotal}`;

    window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');

    setTimeout(() => {
      window.open(IKHOKHA_URL, '_blank');
    }, 800);
  });
}

// --- INIT ---
window.onload = () => {
  loadCart();
  updateUI();
  setupCheckout();

  custName.oninput = updateUI;
  custPhone.oninput = updateUI;
  custAddress.oninput = updateUI;
};
