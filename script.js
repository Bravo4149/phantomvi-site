// Elements
const cartItemsEl = document.getElementById('cartItems');
const courierFeeEl = document.getElementById('courierFee');
const totalCostEl = document.getElementById('totalCost');
const whatsappBtn = document.getElementById('whatsappBtn');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const loadingOverlay = document.getElementById('loadingOverlay');

// Prices per product category
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
    "Coffee Pinotage": 85,
    "Non-Alcoholic Wine": 110
  },
  Gin: 165,
  Vodka: 165
};

// Cart array
let cart = [];

// Load cart from localStorage on page load
window.addEventListener('load', () => {
  const savedCart = localStorage.getItem('phantomvi_cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart) || [];
    } catch (e) {
      cart = [];
    }
  }
  updateCartUI();
});

// Helpers
function showLoading(show) {
  if (!loadingOverlay) return;
  loadingOverlay.style.display = show ? 'flex' : 'none';
}

function unitPrice(item) {
  return item.type === 'Wine' ? prices.Wine[item.variant] : prices[item.type];
}

function calcCourierFee(totalQty) {
  if (totalQty <= 0) return 0;
  let fee = 180;
  if (totalQty > 2) fee += (totalQty - 2) * 19;
  return fee;
}

function clearInputs(type) {
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
}

function saveCart() {
  localStorage.setItem('phantomvi_cart', JSON.stringify(cart));
}

function buildWhatsappMessage(courierFee, grandTotal) {
  let msg = `Hello, I have placed an order with Phantom VI:\n\n`;

  cart.forEach(item => {
    const p = unitPrice(item);
    msg += `${item.qty} x ${item.variant} ${item.type} (R${p} each) - R${p * item.qty}\n`;
  });

  msg += `\nCourier Fee: R${courierFee}\nTotal: R${grandTotal}\n\nPlease find my sticker labels and delivery address below.`;
  return encodeURIComponent(msg);
}

// Add product to cart with loading effect
function addToCart(type) {
  let productType = '';
  let qty = 0;

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
    alert(`Please select a ${type} type.`);
    return;
  }
  if (!qty || qty <= 0) {
    alert('Please enter a valid quantity.');
    return;
  }

  showLoading(true);

  setTimeout(() => {
    const existingIndex = cart.findIndex(
      item => item.type === type && item.variant === productType
    );

    if (existingIndex >= 0) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({ type, variant: productType, qty });
    }

    saveCart();
    updateCartUI();
    clearInputs(type);
    showLoading(false);
  }, 600);
}

function removeFromCart(index) {
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
  }
}

function updateCartUI() {
  if (!cartItemsEl) return;

  cartItemsEl.innerHTML = '';

  if (!cart || cart.length === 0) {
    if (emptyCartMessage) emptyCartMessage.style.display = 'block';
    if (whatsappBtn) {
      whatsappBtn.style.pointerEvents = 'none';
      whatsappBtn.style.opacity = '0.5';
      whatsappBtn.href = '#';
    }
    if (courierFeeEl) courierFeeEl.textContent = 'R0';
    if (totalCostEl) totalCostEl.textContent = 'R0';
    return;
  }

  if (emptyCartMessage) emptyCartMessage.style.display = 'none';
  if (whatsappBtn) {
    whatsappBtn.style.pointerEvents = 'auto';
    whatsappBtn.style.opacity = '1';
  }

  let total = 0;
  let totalQty = 0;

  cart.forEach((item, index) => {
    const p = unitPrice(item);
    const itemTotal = p * item.qty;
    total += itemTotal;
    totalQty += item.qty;

    const li = document.createElement('li');
    li.className = 'cart-item';

    li.innerHTML = `
      <span class="cart-item-text">${item.qty} x ${item.variant} ${item.type} (R${p} each) - R${itemTotal}</span>
      <button type="button" class="remove-btn" data-index="${index}">Remove</button>
    `;

    cartItemsEl.appendChild(li);
  });

  const courierFee = calcCourierFee(totalQty);
  const grandTotal = total + courierFee;

  if (courierFeeEl) courierFeeEl.textContent = `R${courierFee}`;
  if (totalCostEl) totalCostEl.textContent = `R${grandTotal}`;

  // WhatsApp button
  const phoneNumber = '27814458910';
  const message = buildWhatsappMessage(courierFee, grandTotal);
  if (whatsappBtn) whatsappBtn.href = `https://wa.me/${phoneNumber}?text=${message}`;

  // Remove buttons
  cartItemsEl.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      removeFromCart(index);
    });
  });
}
