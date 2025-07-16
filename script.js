// Elements
const cartItemsEl = document.getElementById('cartItems');
const courierFeeEl = document.getElementById('courierFee');
const totalCostEl = document.getElementById('totalCost');
const whatsappBtn = document.getElementById('whatsappBtn');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const loadingOverlay = document.getElementById('loadingOverlay');

// Prices per product category
const prices = {
  Wine: 75,
  Gin: 165,
  Vodka: 165
};

// Cart array
let cart = [];

// Load cart from localStorage on page load
window.onload = () => {
  const savedCart = localStorage.getItem('phantomvi_cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartUI();
  }
};

// Add product to cart with loading spinner
function addToCart(type) {
  let productType = '';
  let qty = 0;

  if (type === 'Wine') {
    productType = document.getElementById('wineType').value;
    qty = parseInt(document.getElementById('wineQty').value);
  } else if (type === 'Gin') {
    productType = document.getElementById('ginType').value;
    qty = parseInt(document.getElementById('ginQty').value);
  } else if (type === 'Vodka') {
    productType = document.getElementById('vodkaType').value;
    qty = parseInt(document.getElementById('vodkaQty').value);
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
    const existingItem = cart.find(item => item.type === type && item.variant === productType);
    if (existingItem) {
      existingItem.qty += qty;
    } else {
      cart.push({ type, variant: productType, qty });
    }

    saveCart();
    updateCartUI();
    clearInputs(type);
    showLoading(false);
  }, 800);
}

// Clear inputs
function clearInputs(type) {
  if (type === 'Wine') {
    document.getElementById('wineType').value = '';
    document.getElementById('wineQty').value = '';
  } else if (type === 'Gin') {
    document.getElementById('ginType').value = '';
    document.getElementById('ginQty').value = '';
  } else if (type === 'Vodka') {
    document.getElementById('vodkaType').value = '';
    document.getElementById('vodkaQty').value = '';
  }
}

// Show/hide loading overlay
function showLoading(show) {
  loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Update cart display
function updateCartUI() {
  cartItemsEl.innerHTML = '';

  if (cart.length === 0) {
    emptyCartMessage.style.display = 'block';
    courierFeeEl.textContent = 'R0';
    totalCostEl.textContent = 'R0';
    whatsappBtn.href = '#';
    whatsappBtn.style.opacity = '0.5';
    whatsappBtn.style.pointerEvents = 'none';
    return;
  } else {
    emptyCartMessage.style.display = 'none';
    whatsappBtn.style.opacity = '1';
    whatsappBtn.style.pointerEvents = 'auto';
  }

  let total = 0;
  let totalQty = 0;

  cart.forEach((item, index) => {
    const itemTotal = prices[item.type] * item.qty;
    total += itemTotal;
    totalQty += item.qty;

    const li = document.createElement('li');
    li.innerHTML = `
      <span>${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each) - R${itemTotal}</span>
      <button class="remove-btn" data-index="${index}">-</button>
    `;
    cartItemsEl.appendChild(li);
  });

  // Calculate courier fee
  let courierFee = 0;
  if (totalQty > 0) {
    courierFee = 180;
    if (totalQty > 2) {
      courierFee += (totalQty - 2) * 16;
    }
  }

  const grandTotal = total + courierFee;
  courierFeeEl.textContent = `R${courierFee}`;
  totalCostEl.textContent = `R${grandTotal}`;

  // Build WhatsApp message
  let message = `Hello, I have placed an order with Phantom VI:%0A%0A`;
  cart.forEach(item => {
    message += `${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each) - R${prices[item.type] * item.qty}%0A`;
  });
  message += `%0ACourier Fee: R${courierFee}%0ATotal: R${grandTotal}%0A%0APlease find my sticker labels and delivery address below.`;

  const phone = '27814458910';
  whatsappBtn.href = `https://wa.me/${phone}?text=${message}`;

  // Attach remove events
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      removeFromCart(index);
    });
  });
}

// Remove from cart
function removeFromCart(index) {
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
  }
}

// Save cart
function saveCart() {
  localStorage.setItem('phantomvi_cart', JSON.stringify(cart));
}
