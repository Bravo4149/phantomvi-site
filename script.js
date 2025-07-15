// Elements
const cartItemsEl = document.getElementById('cartItems');
const courierFeeEl = document.getElementById('courierFee');
const totalCostEl = document.getElementById('totalCost');
const whatsappBtn = document.getElementById('whatsappBtn');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const loadingOverlay = document.getElementById('loadingOverlay');

// Prices per product category
const prices = { Wine: 75, Gin: 165, Vodka: 165 };

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

// Add product to cart with loading effect
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
  }, 1000);
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
    const itemTotal = prices[item.type] * item.qty;
    total += itemTotal;
    totalQty += item.qty;

    // Create list item with remove button
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.marginBottom = '8px';

    li.innerHTML = `
      <span>${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each) - R${itemTotal}</span>
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

  // Courier fee: R180 for 2 bottles, +R12 for each extra bottle
  let courierFee = 0;
  if (totalQty > 0) {
    courierFee = 180;
    if (totalQty > 2) {
      courierFee += (totalQty - 2) * 12;
    }
  }

  const grandTotal = total + courierFee;
  courierFeeEl.textContent = `R${courierFee}`;
  totalCostEl.textContent = `R${grandTotal}`;

  // Update WhatsApp order link
  let message = `Hello, I have placed an order with Phantom VI:%0A%0A`;
  cart.forEach(item => {
    message += `${item.qty} x ${item.variant} ${item.type} (R${prices[item.type]} each) - R${prices[item.type] * item.qty}%0A`;
  });
  message += `%0ACourier Fee: R${courierFee}%0ATotal: R${grandTotal}%0A%0APlease find my sticker labels and delivery address below.`;

  const phoneNumber = '27814458910'; // update with your WhatsApp number (no +)
  whatsappBtn.href = `https://wa.me/${phoneNumber}?text=${message}`;

  // Attach remove button event listeners
  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      removeFromCart(parseInt(index));
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
