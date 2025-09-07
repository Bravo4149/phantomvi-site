// CART SYSTEM
const cartItemsEl = document.getElementById('cartItems');
const courierFeeEl = document.getElementById('courierFee');
const totalCostEl = document.getElementById('totalCost');
const whatsappBtn = document.getElementById('whatsappBtn');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const loadingOverlay = document.getElementById('loadingOverlay');

// Base prices
const prices = {
  Wine: {
    "Sweet Rosé": 75, "Shiraz": 85, "Sauvignon Blanc": 75, "Pinotage": 85,
    "Sweet White": 75, "Sweet Red": 75, "Chenin Blanc": 75, "Chardonnay": 75,
    "Cabernet Sauvignon": 85, "Merlot": 75, "Coffee Pinotage": 75, "Non-Alcoholic Wine": 100
  },
  Gin: 165,
  Vodka: 165
};

let cart = [];

// Load cart
window.onload = () => {
  const savedCart = localStorage.getItem('phantomvi_cart');
  if (savedCart) { cart = JSON.parse(savedCart); updateCartUI(); }
};

// Add to cart
function addToCart(type) {
  let sel, qty, productType;
  if (type === 'Wine') {
    sel = document.getElementById('wineType'); productType = sel.value; qty = parseInt(document.getElementById('wineQty').value);
  } else if (type === 'Gin') {
    sel = document.getElementById('ginType'); productType = sel.value; qty = parseInt(document.getElementById('ginQty').value);
  } else if (type === 'Vodka') {
    sel = document.getElementById('vodkaType'); productType = sel.value; qty = parseInt(document.getElementById('vodkaQty').value);
  }
  if (!productType || !qty || qty <= 0) { alert('Please select a type and quantity.'); return; }

  showLoading(true);
  setTimeout(() => {
    const existingIndex = cart.findIndex(item => item.type === type && item.variant === productType);
    if (existingIndex >= 0) { cart[existingIndex].qty += qty; }
    else { cart.push({ type, variant: productType, qty }); }
    saveCart(); updateCartUI(); showLoading(false);
  }, 500);
}

// Update UI
function updateCartUI() {
  cartItemsEl.innerHTML = '';
  if (cart.length === 0) {
    emptyCartMessage.style.display = 'block';
    whatsappBtn.style.opacity = '0.5'; whatsappBtn.href = '#';
    courierFeeEl.textContent = 'R0'; totalCostEl.textContent = 'R0'; return;
  }
  emptyCartMessage.style.display = 'none'; whatsappBtn.style.opacity = '1';

  let total = 0, totalQty = 0;
  cart.forEach((item, index) => {
    let pricePerUnit;
    if (item.type === 'Wine') {
      pricePerUnit = prices.Wine[item.variant];
      if (item.qty > 50) pricePerUnit = 65;
    } else if (item.type === 'Gin' || item.type === 'Vodka') {
      pricePerUnit = prices[item.type];
      if (item.qty > 50) pricePerUnit = 140;
    }
    const itemTotal = pricePerUnit * item.qty;
    total += itemTotal; totalQty += item.qty;

    const li = document.createElement('li');
    li.innerHTML = `${item.qty} x ${item.variant} ${item.type} (R${pricePerUnit}) - R${itemTotal}
      <button class="remove-btn" data-index="${index}">Remove</button>`;
    cartItemsEl.appendChild(li);
  });

  let courierFee = 180 + (totalQty > 2 ? (totalQty - 2) * 15 : 0);
  const grandTotal = total + courierFee;
  courierFeeEl.textContent = `R${courierFee}`;
  totalCostEl.textContent = `R${grandTotal}`;

  let message = `Hello, I have placed an order with Phantom VI:%0A%0A`;
  cart.forEach(item => {
    let unitPrice;
    if (item.type === 'Wine') { unitPrice = item.qty > 50 ? 65 : prices.Wine[item.variant]; }
    else { unitPrice = item.qty > 50 ? 140 : prices[item.type]; }
    message += `${item.qty} x ${item.variant} ${item.type} (R${unitPrice} each) - R${unitPrice * item.qty}%0A`;
  });
  message += `%0ACourier Fee: R${courierFee}%0ATotal: R${grandTotal}%0A%0APlease find my sticker labels and delivery address below.`;
  whatsappBtn.href = `https://wa.me/27814458910?text=${message}`;

  document.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', e => removeFromCart(parseInt(e.target.dataset.index))));
}

function removeFromCart(index) { cart.splice(index, 1); saveCart(); updateCartUI(); }
function saveCart() { localStorage.setItem('phantomvi_cart', JSON.stringify
