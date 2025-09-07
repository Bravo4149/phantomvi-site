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
    "Shiraz": 75,
    "Sauvignon Blanc": 75,
    "Pinotage": 75,
    "Sweet White": 75,
    "Sweet Red": 75,
    "Chenin Blanc": 75,
    "Chardonnay": 75,
    "Cabernet Sauvignon": 75,
    "Merlot": 75,
    "Coffee Pinotage": 75,
    "Non-Alcoholic Wine": 100
  },
  Gin: 165,
  Vodka: 165
};

// Cart array
let cart = [];

// Load cart from localStorage
window.onload = () => {
  const savedCart = localStorage.getItem('phantomvi_cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartUI();
  }
};

// Add product to cart
function addToCart(type) {
  let productType, qty, sel;
  if (type === 'Wine') {
    sel = document.getElementById('wineType');
    productType = sel.value;
    qty = parseInt(document.getElementById('wineQty').value);
  } else if (type === 'Gin') {
    sel = document.getElementById('ginType');
    productType = sel.value;
    qty = parseInt(document.getElementById('ginQty').value);
  } else if (type === 'Vodka') {
    sel = document.getElementById('vodkaType');
    productType = sel.value;
    qty = parseInt(document.getElementById('vodkaQty').value);
  }

  if (!productType || qty <= 0) {
    alert('Please select a type and enter a valid quantity.');
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
  }, 500);
}

function clearInputs(type) {
  if(type === 'Wine'){
    document.getElementById('wineQty').value = '';
    document.getElementById('wineType').value = '';
  } else if(type === 'Gin'){
    document.getElementById('ginQty').value = '';
    document.getElementById('ginType').value = '';
  } else if(type === 'Vodka'){
    document.getElementById('vodkaQty').value = '';
    document.getElementById('vodkaType').value = '';
  }
}

function showLoading(show) {
  loadingOverlay.style.display = show ? 'flex' : 'none';
}

function updateCartUI() {
  cartItemsEl.innerHTML = '';

  if (cart.length === 0) {
    emptyCartMessage.style.display = 'block';
    whatsappBtn.style.pointerEvents = 'none';
    whatsappBtn.style.opacity = '0.5';
    whatsappBtn.href = '#';
    courierFeeEl.textContent = 'R0';
    totalCostEl.textContent = 'R0';
    return;
  } else {
    emptyCartMessage.style.display = 'none';
    whatsappBtn.style.pointerEvents = 'auto';
    whatsappBtn.style.opacity = '1';
  }

  let total = 0;
  let totalQty = 0;

  cart.forEach((item, index) => {
    let pricePerUnit;
    if(item.type === 'Wine') {
      pricePerUnit = prices.Wine[item.variant];
      if(item.qty >= 50) pricePerUnit = 65; // discount
    } else if(item.type === 'Gin' || item.type === 'Vodka') {
      pricePerUnit = prices[item.type];
      if(item.qty >= 50) pricePerUnit = 140; // discount
    }

    const itemTotal = pricePerUnit * item.qty;
    total += itemTotal;
    totalQty += item.qty;

    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.marginBottom = '8px';

    li.innerHTML = `
      <span>${item.qty} x ${item.variant} ${item.type} (R${pricePerUnit} each) - R${itemTotal}</span>
      <button class="remove-btn" data-index="${index}" style="
        background: #90284d;
        border: none;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        padding: 4px 8px;
        font-size: 14px;
      ">Remove</button>
    `;

    cartItemsEl.appendChild(li);
  });

  let courierFee = totalQty > 0 ? 180 + Math.max(0, totalQty - 2) * 15 : 0;

  totalCostEl.textContent = `R${total + courierFee}`;
  courierFeeEl.textContent = `R${courierFee}`;

  let message = `Hello, I have placed an order with Phantom VI:%0A%0A`;
  cart.forEach(item => {
    const unitPrice = item.type === 'Wine' && item.qty >= 50 ? 65
                      : (item.type === 'Gin' || item.type === 'Vodka') && item.qty >= 50 ? 140
                      : item.type === 'Wine' ? prices.Wine[item.variant]
                      : prices[item.type];
    message += `${item.qty} x ${item.variant} ${item.type} (R${unitPrice} each) - R${unitPrice*item.qty}%0A`;
  });
  message += `%0ACourier Fee: R${courierFee}%0ATotal: R${total + courierFee}%0A%0APlease provide delivery details.`;

  const phoneNumber = '27814458910';
  whatsappBtn.href = `https://wa.me/${phoneNumber}?text=${message}`;

  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      removeFromCart(index);
    });
  });
}

function removeFromCart(index) {
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
  }
}

function saveCart() {
  localStorage.setItem('phantomvi_cart', JSON.stringify(cart));
}
